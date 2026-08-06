/**
 * Cấu hình module phân quyền — chỉ các trang Hệ thống còn trong app.
 */

export interface PermissionModuleItem {
  id: string;
  nameKey: string;
}

export interface PermissionModuleGroup {
  groupTitleKey: string;
  modules: PermissionModuleItem[];
}

export interface PermissionFunction {
  id: string;
  nameKey: string;
  color: string;
  groups: PermissionModuleGroup[];
}

export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete', 'admin', 'all'] as const;
export type PermissionActionType = (typeof PERMISSION_ACTIONS)[number];

/** Nhóm Hệ thống + Kinh doanh — khớp dashboard và route thực tế */
export const PERMISSION_FUNCTIONS: PermissionFunction[] = [
  {
    id: 'he-thong',
    nameKey: 'nav.system',
    color: 'slate',
    groups: [
      {
        groupTitleKey: 'permission.matrix.systemGroup',
        modules: [
          { id: 'he-thong/nhan-vien', nameKey: 'permission.module.employeeList' },
          { id: 'he-thong/phong-ban', nameKey: 'permission.module.departmentChart' },
          { id: 'he-thong/chuc-vu', nameKey: 'permission.module.positionRole' },
          { id: 'he-thong/thong-tin-cong-ty', nameKey: 'permission.module.companyInfo' },
          { id: 'he-thong/phan-quyen', nameKey: 'permission.module.permission' },
        ],
      },
    ],
  },
  {
    id: 'kinh-doanh',
    nameKey: 'nav.business',
    color: 'emerald',
    groups: [
      {
        groupTitleKey: 'page.businessDashboard.customerGroup',
        modules: [
          {
            id: 'kinh-doanh/khach-hang',
            nameKey: 'permission.module.customers',
          },
          {
            id: 'kinh-doanh/nguoi-lien-he',
            nameKey: 'permission.module.contacts',
          },
          {
            id: 'kinh-doanh/thiet-lap-khach-hang',
            nameKey: 'permission.module.customerSettings',
          },
        ],
      },
    ],
  },
  {
    id: 'san-xuat',
    nameKey: 'nav.production',
    color: 'cyan',
    groups: [
      {
        groupTitleKey: 'page.productionDashboard.productionInfoGroup',
        modules: [
          {
            id: 'san-xuat/danh-sach-market-in',
            nameKey: 'permission.module.printMarkets',
          },
        ],
      },
    ],
  },
  {
    id: 'hanh-chinh',
    nameKey: 'nav.adminOps',
    color: 'amber',
    groups: [
      {
        groupTitleKey: 'page.adminOpsDashboard.payrollGroup',
        modules: [
          {
            id: 'hanh-chinh/phieu-hanh-chinh',
            nameKey: 'permission.module.adminForms',
          },
          {
            id: 'hanh-chinh/thiet-lap-cong-luong',
            nameKey: 'permission.module.payrollSettings',
          },
        ],
      },
      {
        groupTitleKey: 'page.adminOpsDashboard.documentGroup',
        modules: [
          {
            id: 'hanh-chinh/danh-sach-tai-lieu',
            nameKey: 'permission.module.documentList',
          },
          {
            id: 'hanh-chinh/thiet-lap-tai-lieu',
            nameKey: 'permission.module.documentSettings',
          },
        ],
      },
      {
        groupTitleKey: 'page.adminOpsDashboard.contractDecisionGroup',
        modules: [
          {
            id: 'hanh-chinh/hop-dong',
            nameKey: 'permission.module.contract',
          },
        ],
      },
      {
        groupTitleKey: 'page.adminOpsDashboard.otherGroup',
        modules: [
          {
            id: 'hanh-chinh/thong-bao',
            nameKey: 'permission.module.announcement',
          },
        ],
      },
    ],
  },
];

export function getAllPermissionModules(): { id: string; nameKey: string }[] {
  const list: { id: string; nameKey: string }[] = [];
  PERMISSION_FUNCTIONS.forEach((fn) => {
    fn.groups.forEach((gr) => {
      gr.modules.forEach((m) => list.push({ id: m.id, nameKey: m.nameKey }));
    });
  });
  return list;
}

/** Thứ tự module trong sidebar matrix — dùng prefetch module kề cạnh. */
export const PERMISSION_MODULE_IDS: readonly string[] = getAllPermissionModules().map((m) => m.id);
