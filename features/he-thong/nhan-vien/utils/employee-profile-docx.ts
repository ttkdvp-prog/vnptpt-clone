/**
 * Xuất hồ sơ nhân sự ra `.docx` THẬT (OOXML) — sinh ở server.
 *
 * Bản cũ ship HTML với đuôi `.doc`: Word không hỗ trợ flexbox nên 4 ô chữ ký xếp dọc
 * (thừa ~200mm trắng), và Word luôn cảnh báo "định dạng và phần mở rộng không khớp".
 * OOXML thật hết cả hai vấn đề, đồng thời có số trang thật ở footer.
 *
 * Dùng chung `ProfileDocModel` với preview / PDF nên nội dung không thể lệch nhau.
 */
import {
  PRINT_HAIRLINE_HEX,
  PRINT_INK_HEX,
  PRINT_INK_MUTED_HEX,
  PRINT_LABEL_BG_HEX,
  PRINT_MARGIN_MM,
  PRINT_PHOTO_H_MM,
  PRINT_PHOTO_W_MM,
  PRINT_PRIMARY_DARK_HEX,
  PRINT_PRIMARY_SOFT_HEX,
  PRINT_SIGN_SPACE_MM,
} from '@/lib/print-document/constants';
import { pairProfileRows, type ProfileDocModel, type ProfileDocRow } from '../core/profile-document-model';

/** mm → twip (1mm = 56.7 twip) */
const mm = (value: number): number => Math.round(value * 56.7);
/** mm → EMU cho ImageRun (1mm = 36000 EMU), quy về pixel 96dpi mà docx dùng */
const mmToPx = (value: number): number => Math.round((value / 25.4) * 96);

const hex = (color: string): string => color.replace('#', '');

const FONT = 'Times New Roman';
const BODY_HALF_PT = 20; // 10pt
const SMALL_HALF_PT = 18; // 9pt
const TINY_HALF_PT = 16; // 8pt
const FOOTER_HALF_PT = 14; // 7pt

export interface ProfileDocxImages {
  /** Ảnh chân dung dạng buffer (đã đọc ở server), `null` nếu không có */
  photo?: Buffer | null;
  photoType?: 'jpg' | 'png' | 'gif' | 'bmp';
  logo?: Buffer | null;
  logoType?: 'jpg' | 'png' | 'gif' | 'bmp';
}

export async function buildEmployeeProfileDocx(
  model: ProfileDocModel,
  images: ProfileDocxImages = {},
): Promise<Buffer> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
  } = await import('docx');

  const hairline = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: hex(PRINT_HAIRLINE_HEX),
  } as const;
  const allHairline = {
    top: hairline,
    bottom: hairline,
    left: hairline,
    right: hairline,
  };
  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  } as const;
  const allNone = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  const text = (
    value: string,
    opts: { bold?: boolean; size?: number; color?: string; caps?: boolean } = {},
  ) =>
    new TextRun({
      text: opts.caps ? value.toUpperCase() : value,
      bold: opts.bold,
      size: opts.size ?? BODY_HALF_PT,
      color: hex(opts.color ?? PRINT_INK_HEX),
      font: FONT,
    });

  /* ---------- Letterhead: logo | thông tin công ty | ảnh 3x4 ---------- */
  const letterheadCells: InstanceType<typeof TableCell>[] = [];

  if (images.logo) {
    letterheadCells.push(
      new TableCell({
        width: { size: mm(18), type: WidthType.DXA },
        borders: allNone,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: images.logo,
                type: images.logoType ?? 'png',
                transformation: { width: 56, height: 56 },
              }),
            ],
          }),
        ],
      }),
    );
  }

  letterheadCells.push(
    new TableCell({
      borders: allNone,
      verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({
          spacing: { after: 20 },
          children: [text(model.company.companyName, { bold: true, size: 28, caps: true })],
        }),
        ...(model.company.address
          ? [
              new Paragraph({
                children: [
                  text(model.company.address, { size: SMALL_HALF_PT, color: PRINT_INK_MUTED_HEX }),
                ],
              }),
            ]
          : []),
        ...([model.company.email, model.company.phone].filter(Boolean).length
          ? [
              new Paragraph({
                children: [
                  text([model.company.email, model.company.phone].filter(Boolean).join(' · '), {
                    size: SMALL_HALF_PT,
                    color: PRINT_INK_MUTED_HEX,
                  }),
                ],
              }),
            ]
          : []),
      ],
    }),
  );

  letterheadCells.push(
    new TableCell({
      width: { size: mm(PRINT_PHOTO_W_MM + 2), type: WidthType.DXA },
      borders: images.photo ? allHairline : allNone,
      verticalAlign: VerticalAlign.CENTER,
      children: images.photo
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: images.photo,
                  type: images.photoType ?? 'jpg',
                  transformation: {
                    width: mmToPx(PRINT_PHOTO_W_MM),
                    height: mmToPx(PRINT_PHOTO_H_MM),
                  },
                }),
              ],
            }),
          ]
        : [new Paragraph({ children: [] })],
    }),
  );

  const letterhead = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNone,
    rows: [new TableRow({ children: letterheadCells })],
  });

  /* ---------- Section: thanh tiêu đề + lưới 2 cột ---------- */
  const fieldCells = (row: ProfileDocRow, span: number) => [
    new TableCell({
      width: { size: 19, type: WidthType.PERCENTAGE },
      borders: allHairline,
      shading: { fill: hex(PRINT_LABEL_BG_HEX) },
      children: [
        new Paragraph({
          children: [text(row.label, { bold: true, color: PRINT_INK_MUTED_HEX })],
        }),
      ],
    }),
    new TableCell({
      width: { size: span > 1 ? 81 : 31, type: WidthType.PERCENTAGE },
      columnSpan: span,
      borders: allHairline,
      children: [new Paragraph({ children: [text(row.value)] })],
    }),
  ];

  const sectionBlocks = model.sections.flatMap((section) => [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allNone,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                ...allNone,
                left: { style: BorderStyle.SINGLE, size: 18, color: hex(PRINT_PRIMARY_DARK_HEX) },
              },
              shading: { fill: hex(PRINT_PRIMARY_SOFT_HEX) },
              children: [
                new Paragraph({
                  children: [
                    text(section.title, {
                      bold: true,
                      size: SMALL_HALF_PT,
                      color: PRINT_PRIMARY_DARK_HEX,
                      caps: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: pairProfileRows(section.rows).map(
        (pair) =>
          new TableRow({
            children:
              pair.length === 2
                ? [...fieldCells(pair[0], 1), ...fieldCells(pair[1], 1)]
                : fieldCells(pair[0], 3),
          }),
      ),
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ]);

  /* ---------- Chữ ký: 4 cột NGANG (đây là chỗ bản .doc cũ bị vỡ) ---------- */
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNone,
    rows: [
      new TableRow({
        children: model.signature.map(
          (role) =>
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: allNone,
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [text(role.title, { bold: true, size: SMALL_HALF_PT, caps: true })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: mm(PRINT_SIGN_SPACE_MM) },
                  children: [
                    text(role.hint, { size: TINY_HALF_PT, color: PRINT_INK_MUTED_HEX }),
                  ],
                }),
              ],
            }),
        ),
      }),
    ],
  });

  /**
   * Header lặp thật ở trang 2 trở đi ("HỒ SƠ NHÂN SỰ · Tên · Mã NV"), TRỐNG ở trang 1 —
   * `titlePage: true` bên dưới cho Word phân biệt header `first` (trang 1, đã có letterhead
   * đầy đủ trong nội dung) khỏi `default` (trang 2+). Khác PDF: Word hỗ trợ việc này natively
   * nên không cần đánh đổi hiển thị header ở trang 1 như bên PDF (Puppeteer không tách được).
   */
  const runningHeaderText = `${model.heading.title} · ${model.heading.name} · ${model.heading.codeLabel} ${model.heading.code}`;
  const runningHeader = new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(PRINT_HAIRLINE_HEX) } },
        children: [text(runningHeaderText, { size: TINY_HALF_PT, color: PRINT_INK_MUTED_HEX })],
      }),
    ],
  });
  const emptyHeader = new Header({ children: [new Paragraph({ children: [] })] });

  const doc = new Document({
    creator: model.company.companyName,
    title: `${model.heading.title} - ${model.heading.name}`,
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: {
              top: mm(PRINT_MARGIN_MM.top),
              right: mm(PRINT_MARGIN_MM.right),
              bottom: mm(PRINT_MARGIN_MM.bottom),
              left: mm(PRINT_MARGIN_MM.left),
            },
          },
        },
        headers: {
          default: runningHeader,
          first: emptyHeader,
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: ['Trang ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES],
                    size: FOOTER_HALF_PT,
                    color: hex(PRINT_INK_MUTED_HEX),
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          letterhead,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 },
            border: { top: { style: BorderStyle.SINGLE, size: 12, color: hex(PRINT_INK_HEX) } },
            children: [text(model.heading.title, { bold: true, size: 32, caps: true })],
          }),
          new Paragraph({
            children: [
              text(model.heading.name, { bold: true, size: 28 }),
              text(`    ${model.heading.codeLabel} ${model.heading.code}`, {
                color: PRINT_INK_MUTED_HEX,
              }),
            ],
          }),
          ...(model.heading.role
            ? [
                new Paragraph({
                  spacing: { after: 120 },
                  children: [text(model.heading.role, { color: PRINT_INK_MUTED_HEX })],
                }),
              ]
            : []),
          ...sectionBlocks,
          signatureTable,
          new Paragraph({
            spacing: { before: 200 },
            children: [
              text(`${model.printedAtLabel} ${model.printedAt}`, {
                size: FOOTER_HALF_PT,
                color: PRINT_INK_MUTED_HEX,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
