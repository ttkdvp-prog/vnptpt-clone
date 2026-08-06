/**
 * Generic table repository over one Google Sheet tab. Row 1 = header (column names).
 * Every row is read/written as a `Record<string,string>` — per-entity repositories
 * do numeric/date/array coercion themselves (mirrors old Prisma row → mapper split).
 */
import { getSheetsClient } from '@/lib/sheets/client';
import { SHEETS_SPREADSHEET_ID } from '@/lib/sheets/config';
import { getCached, invalidateCache, setCached } from '@/lib/sheets/sheet-cache';

export type SheetRow = Record<string, string>;

interface SheetTable {
  headers: string[];
  /** Data rows, in the same order as the sheet (row 2 = rows[0]). */
  rows: SheetRow[];
}

function cacheKey(tab: string): string {
  return `sheet:${tab}`;
}

async function fetchTable(tab: string): Promise<SheetTable> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_SPREADSHEET_ID,
    range: tab,
  });
  const values = res.data.values ?? [];
  const headers = (values[0] ?? []).map((h) => String(h));
  const rows = values.slice(1).map((raw) => {
    const row: SheetRow = {};
    headers.forEach((h, i) => {
      row[h] = raw[i] == null ? '' : String(raw[i]);
    });
    return row;
  });
  return { headers, rows };
}

/** All rows of a tab, TTL-cached. */
export async function readTable(tab: string): Promise<SheetTable> {
  const cached = getCached<SheetTable>(cacheKey(tab));
  if (cached) return cached;
  const table = await fetchTable(tab);
  setCached(cacheKey(tab), table);
  return table;
}

export function invalidateTable(tab: string): void {
  invalidateCache(cacheKey(tab));
}

function rowToValues(headers: string[], row: SheetRow): string[] {
  return headers.map((h) => row[h] ?? '');
}

/** Next numeric id for a tab — max existing `id` + 1 (starts at 1). */
export async function nextId(tab: string): Promise<number> {
  const { rows } = await readTable(tab);
  let max = 0;
  for (const row of rows) {
    const n = Number(row.id);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/** Append a new row. `row` must include every header key used by the tab. */
export async function insertRow(tab: string, row: SheetRow): Promise<void> {
  const { headers } = await readTable(tab);
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_SPREADSHEET_ID,
    range: tab,
    valueInputOption: 'RAW',
    requestBody: { values: [rowToValues(headers, row)] },
  });
  invalidateTable(tab);
}

/** Patch a row identified by `id` — only keys present in `patch` are overwritten. */
export async function updateRowById(
  tab: string,
  id: string | number,
  patch: SheetRow,
): Promise<boolean> {
  const { headers, rows } = await readTable(tab);
  const index = rows.findIndex((r) => r.id === String(id));
  if (index === -1) return false;
  const merged: SheetRow = { ...rows[index], ...patch };
  const sheets = getSheetsClient();
  const sheetRowNumber = index + 2; // +1 header, +1 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_SPREADSHEET_ID,
    range: `${tab}!A${sheetRowNumber}:${columnLetter(headers.length)}${sheetRowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowToValues(headers, merged)] },
  });
  invalidateTable(tab);
  return true;
}

/** Delete a row identified by `id`. Requires the tab's sheetId (numeric, not name) for batchUpdate. */
export async function deleteRowById(tab: string, id: string | number): Promise<boolean> {
  const { rows } = await readTable(tab);
  const index = rows.findIndex((r) => r.id === String(id));
  if (index === -1) return false;
  const sheets = getSheetsClient();
  const sheetId = await getSheetIdByTitle(tab);
  const sheetRowIndex = index + 1; // 0-indexed data row (skip header)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEETS_SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: sheetRowIndex,
              endIndex: sheetRowIndex + 1,
            },
          },
        },
      ],
    },
  });
  invalidateTable(tab);
  return true;
}

const sheetIdCache = new Map<string, number>();

async function getSheetIdByTitle(tab: string): Promise<number> {
  const cached = sheetIdCache.get(tab);
  if (cached != null) return cached;
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEETS_SPREADSHEET_ID });
  for (const sheet of meta.data.sheets ?? []) {
    const title = sheet.properties?.title;
    const id = sheet.properties?.sheetId;
    if (title != null && id != null) sheetIdCache.set(title, id);
  }
  const found = sheetIdCache.get(tab);
  if (found == null) throw new Error(`Không tìm thấy sheet tab "${tab}"`);
  return found;
}

function columnLetter(count: number): string {
  let n = count;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
