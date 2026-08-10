/**
 * Query keys tập trung — tránh lệch chuỗi khi invalidate / prefetch (TanStack Query).
 */
/** Default sort for employee list page API. */
export const EMPLOYEES_LIST_QUERY_PARAMS = {
  orderBy: 'ho_ten',
  ascending: true,
} as const;

export type EmployeesListQueryKeyParams = {
  limit: number;
  offset: number;
  orderBy: string;
  ascending: boolean;
  search?: string;
  trang_thai?: string[];
  phong_ban_id?: string[];
  chuc_vu_id?: string[];
  gioi_tinh?: string[];
  columnSearch?: Record<string, string>;
};

export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    countPrefix: ['employees', 'count'] as const,
    count: (params: Omit<EmployeesListQueryKeyParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> = {}) =>
      ['employees', 'count', params] as const,
    /** Prefix để invalidate mọi query `['employees', 'page', params]` — không dùng factory function làm queryKey. */
    pagePrefix: ['employees', 'page'] as const,
    page: (params: EmployeesListQueryKeyParams) => ['employees', 'page', params] as const,
    filterCountsPrefix: ['employees', 'filter-counts'] as const,
    filterCounts: (
      params: Omit<EmployeesListQueryKeyParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> = {},
    ) => ['employees', 'filter-counts', params] as const,
    statsAggregatesPrefix: ['employees', 'stats-aggregates'] as const,
    statsAggregates: (params: Record<string, unknown> = {}) =>
      ['employees', 'stats-aggregates', params] as const,
    /** Prefix: invalidate mọi query `['employee', id]` */
    anyDetail: ['employee'] as const,
    detail: (id: string) => ['employee', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  departments: {
    all: ['departments'] as const,
    count: ['departments', 'count'] as const,
    pagePrefix: ['departments', 'page'] as const,
    page: (params: {
      limit: number;
      offset: number;
      orderBy: string;
      ascending: boolean;
    }) => ['departments', 'page', params] as const,
  },
  positions: {
    all: ['positions'] as const,
    /** Chức vụ đang hoạt động — picker/form gán NV, giảm egress vs `all`. */
    active: ['positions', 'active'] as const,
    count: ['positions', 'count'] as const,
    pagePrefix: ['positions', 'page'] as const,
    page: (params: {
      limit: number;
      offset: number;
      orderBy: string;
      ascending: boolean;
    }) => ['positions', 'page', params] as const,
  },
  roles: {
    /** Prefix: invalidate mọi query roles (matrix + theo module). */
    all: ['roles'] as const,
    matrixPositions: ['roles', 'matrix-positions'] as const,
    forModule: (moduleId: string) => ['roles', 'for-module', moduleId] as const,
  },
  permissionGrants: {
    /** Prefix: invalidate mọi query `['permission-grants', positionId]`. */
    all: ['permission-grants'] as const,
    byPosition: (positionId: string) => ['permission-grants', positionId] as const,
  },
  branches: {
    all: ['branches'] as const,
  },
  company: {
    info: ['company', 'info'] as const,
    branding: ['company', 'branding'] as const,
  },
  jobLevels: {
    all: ['job-levels'] as const,
  },
  customerGroups: {
    all: ['customer-groups'] as const,
    count: ['customer-groups', 'count'] as const,
    pagePrefix: ['customer-groups', 'page'] as const,
  },
  customerStatuses: {
    all: ['customer-statuses'] as const,
    count: ['customer-statuses', 'count'] as const,
    pagePrefix: ['customer-statuses', 'page'] as const,
  },
  customers: {
    all: ['customers'] as const,
    count: ['customers', 'count'] as const,
    pagePrefix: ['customers', 'page'] as const,
    nextMa: ['customers', 'next-ma'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    count: ['contacts', 'count'] as const,
    pagePrefix: ['contacts', 'page'] as const,
    byCustomer: (customerId: string) => ['contacts', 'by-customer', customerId] as const,
  },
  printMarkets: {
    all: ['print-markets'] as const,
    count: ['print-markets', 'count'] as const,
    pagePrefix: ['print-markets', 'page'] as const,
    nextMa: ['print-markets', 'next-ma'] as const,
  },
  documentTypes: {
    all: ['document-types'] as const,
    count: ['document-types', 'count'] as const,
    pagePrefix: ['document-types', 'page'] as const,
  },
  adminForms: {
    all: ['admin-forms'] as const,
    count: ['admin-forms', 'count'] as const,
    pagePrefix: ['admin-forms', 'page'] as const,
    statsAggregatesPrefix: ['admin-forms', 'stats-aggregates'] as const,
    statsAggregates: (params: Record<string, unknown> = {}) =>
      ['admin-forms', 'stats-aggregates', params] as const,
  },
  documents: {
    all: ['documents'] as const,
    count: ['documents', 'count'] as const,
    pagePrefix: ['documents', 'page'] as const,
    statsAggregatesPrefix: ['documents', 'stats-aggregates'] as const,
    statsAggregates: (params: Record<string, unknown>) =>
      ['documents', 'stats-aggregates', params] as const,
  },
  contracts: {
    all: ['contracts'] as const,
    count: ['contracts', 'count'] as const,
    pagePrefix: ['contracts', 'page'] as const,
    detail: (id: string) => ['contract', id] as const,
  },
  taiLieu: {
    all: ['tai-lieu'] as const,
    countPrefix: ['tai-lieu', 'count'] as const,
    count: (params: Record<string, unknown> = {}) => ['tai-lieu', 'count', params] as const,
    pagePrefix: ['tai-lieu', 'page'] as const,
    page: (params: Record<string, unknown>) => ['tai-lieu', 'page', params] as const,
    filterCountsPrefix: ['tai-lieu', 'filter-counts'] as const,
    filterCounts: (params: Record<string, unknown> = {}) => ['tai-lieu', 'filter-counts', params] as const,
    statsAggregatesPrefix: ['tai-lieu', 'stats-aggregates'] as const,
    statsAggregates: (params: Record<string, unknown> = {}) => ['tai-lieu', 'stats-aggregates', params] as const,
    anyDetail: ['tai-lieu-detail'] as const,
    detail: (id: string) => ['tai-lieu-detail', id] as const,
    distinctDanhMuc: ['tai-lieu', 'distinct-danh-muc'] as const,
    distinctTo: ['tai-lieu', 'distinct-to'] as const,
    distinctTenHoSo: ['tai-lieu', 'distinct-ten-ho-so'] as const,
  },
  congViec: {
    all: ['cong-viec'] as const,
    countPrefix: ['cong-viec', 'count'] as const,
    count: (params: Record<string, unknown> = {}) => ['cong-viec', 'count', params] as const,
    pagePrefix: ['cong-viec', 'page'] as const,
    page: (params: Record<string, unknown>) => ['cong-viec', 'page', params] as const,
    filterCountsPrefix: ['cong-viec', 'filter-counts'] as const,
    filterCounts: (params: Record<string, unknown> = {}) => ['cong-viec', 'filter-counts', params] as const,
    statsAggregatesPrefix: ['cong-viec', 'stats-aggregates'] as const,
    statsAggregates: (params: Record<string, unknown> = {}) => ['cong-viec', 'stats-aggregates', params] as const,
    anyDetail: ['cong-viec-detail'] as const,
    detail: (id: string) => ['cong-viec-detail', id] as const,
    distinctTieuDe: ['cong-viec', 'distinct-tieu-de'] as const,
    distinctTo: ['cong-viec', 'distinct-to'] as const,
  },
  announcements: {
    all: ['announcements'] as const,
    count: ['announcements', 'count'] as const,
    pagePrefix: ['announcements', 'page'] as const,
    detail: (id: string) => ['announcement', id] as const,
  },
} as const;

/** Tham số list phòng ban — đồng bộ `getDepartmentsPage`. */
export const DEPARTMENTS_LIST_QUERY_PARAMS = {
  limit: 500,
  offset: 0,
  orderBy: 'duong_dan',
  ascending: true,
} as const;

/** Tham số list chức vụ — đồng bộ `getPositionsPage`. */
export const POSITIONS_LIST_QUERY_PARAMS = {
  limit: 500,
  offset: 0,
  orderBy: 'thu_tu',
  ascending: true,
} as const;
