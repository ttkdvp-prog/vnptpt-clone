import { google, type sheets_v4 } from 'googleapis';
import { SHEETS_PRIVATE_KEY, SHEETS_SERVICE_ACCOUNT_EMAIL } from '@/lib/sheets/config';

let cachedClient: sheets_v4.Sheets | null = null;

/** Singleton Sheets API client — Service Account auth, read/write scope. */
export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  if (!SHEETS_SERVICE_ACCOUNT_EMAIL || !SHEETS_PRIVATE_KEY) {
    throw new Error(
      'Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY — không thể kết nối Google Sheets.',
    );
  }
  const auth = new google.auth.JWT({
    email: SHEETS_SERVICE_ACCOUNT_EMAIL,
    key: SHEETS_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}
