export const TV_SLIDE_IDS = ['nhan-su', 'san-xuat', 'chat-luong', 'an-toan'] as const;

export type TvSlideId = (typeof TV_SLIDE_IDS)[number];

export const TV_SLIDE_INTERVAL_MS = 18_000;

export const TV_SLIDE_TITLE_KEYS: Record<TvSlideId, string> = {
  'nhan-su': 'overview.slides.nhanSu',
  'san-xuat': 'overview.slides.sanXuat',
  'chat-luong': 'overview.slides.chatLuong',
  'an-toan': 'overview.slides.anToan',
};

/** Phiếu nghỉ phép (đã duyệt, overlap hôm nay). */
export const LEAVE_MA_PHIEU = ['XN', 'NL', 'NB'] as const;

/** Phiếu công tác. */
export const TRIP_MA_PHIEU = ['CT'] as const;

export const PRESENCE_MA_PHIEU = [...LEAVE_MA_PHIEU, ...TRIP_MA_PHIEU] as const;
