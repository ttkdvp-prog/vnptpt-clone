import {
  Briefcase,
  GraduationCap,
  IdCard,
  Landmark,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailSystemSection from '@/components/shared/DetailSystemSection';
import DetailToolbar, { type DetailToolbarAction } from '@/components/shared/DetailToolbar';
import EnumBadge from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { formatDate } from '@/lib/utils';
import {
  EDUCATION_BADGE_CONFIG,
  GENDER_BADGE_CONFIG,
  MARITAL_BADGE_CONFIG,
  STATUS_BADGE_CONFIG,
} from '../core/constants';
import { EMPLOYEE_FIELD_ICONS } from '../core/employee-field-icons';
import type { Employee } from '../core/types';
import { formatEmployeeCapBacLabel } from '../utils/build-employee-position-options';

interface Props {
  data: Employee;
  toolbarActions: DetailToolbarAction[];
}

export function NhanVienDetailInfo({ data, toolbarActions }: Props) {
  return (
    <div className="space-y-5">
      <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

      <DetailSection title={txt('employee.detail.personalInfo')} icon={<User size={ICON_SIZE.compact} />}>
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.fullName')}
            value={data.ho_ten}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ho_ten)}
          />
          <DetailField
            label={txt('employee.detail.gender')}
            value={<EnumBadge value={data.gioi_tinh} config={GENDER_BADGE_CONFIG} />}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.gioi_tinh)}
          />
          <DetailField
            label={txt('employee.detail.birthDate')}
            value={data.ngay_sinh ? formatDate(data.ngay_sinh) : '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_sinh)}
          />
          <DetailField
            label={txt('employee.detail.maritalStatus')}
            value={
              data.tinh_trang_hon_nhan ? (
                <EnumBadge value={data.tinh_trang_hon_nhan} config={MARITAL_BADGE_CONFIG} />
              ) : (
                '—'
              )
            }
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.tinh_trang_hon_nhan)}
          />
          <DetailField
            label={txt('employee.detail.nationality')}
            value={data.quoc_tich || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.quoc_tich)}
          />
          <DetailField
            label={txt('employee.detail.ethnicity')}
            value={data.dan_toc || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dan_toc)}
          />
          <DetailField
            label={txt('employee.detail.religion')}
            value={data.ton_giao || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ton_giao)}
          />
          <DetailField
            label={txt('employee.detail.hometown')}
            value={data.que_quan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.que_quan)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title={txt('employee.detail.workInfo')} icon={<Briefcase size={ICON_SIZE.compact} />}>
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.position')}
            value={data.ten_chuc_vu}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chuc_vu_id)}
          />
          <DetailField
            label={txt('employee.detail.department')}
            value={data.ten_phong_ban}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.phong_ban_id)}
          />
          <DetailField
            label={txt('employee.detail.division')}
            value={data.ten_bo_phan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_bo_phan)}
          />
          <DetailField
            label={txt('employee.detail.level')}
            value={formatEmployeeCapBacLabel(data.cap_bac) || undefined}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.cap_bac)}
          />
          <DetailField
            label={txt('employee.status')}
            value={<EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} />}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trang_thai)}
          />
          <DetailField
            label={txt('employee.detail.hireDate')}
            value={data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_vao_lam)}
          />
          <DetailField
            label={txt('employee.detail.officialDate')}
            value={data.ngay_chinh_thuc ? formatDate(data.ngay_chinh_thuc) : '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_chinh_thuc)}
          />
          <DetailField
            label={txt('employee.detail.resignationDate')}
            value={data.ngay_nghi_viec ? formatDate(data.ngay_nghi_viec) : '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_nghi_viec)}
          />
          <DetailField
            label={txt('employee.detail.resignationReason')}
            value={data.ly_do_nghi || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ly_do_nghi)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title={txt('employee.detail.identityInfo')} icon={<IdCard size={ICON_SIZE.compact} />}>
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.idCard')}
            value={data.so_cccd || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_cccd)}
          />
          <DetailField
            label={txt('employee.detail.idIssueDate')}
            value={data.ngay_cap_cccd ? formatDate(data.ngay_cap_cccd) : '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_cap_cccd)}
          />
          <DetailField
            label={txt('employee.detail.idIssuePlace')}
            value={data.noi_cap_cccd || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.noi_cap_cccd)}
          />
          <DetailField
            label={txt('employee.detail.permanentAddress')}
            value={data.dia_chi_thuong_tru || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dia_chi_thuong_tru)}
          />
          <DetailField
            label={txt('employee.detail.currentAddress')}
            value={data.dia_chi_hien_tai || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dia_chi_hien_tai)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title={txt('employee.detail.contactInfo')} icon={<Phone size={ICON_SIZE.compact} />}>
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.workEmail')}
            value={data.email || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.email)}
          />
          <DetailField
            label={txt('employee.detail.personalEmail')}
            value={data.email_ca_nhan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.email_ca_nhan)}
          />
          <DetailField
            label={txt('employee.detail.phone')}
            value={data.so_dien_thoai || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_dien_thoai)}
          />
          <DetailField
            label={txt('employee.detail.emergencyContact')}
            value={data.nguoi_lien_he_khan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.nguoi_lien_he_khan)}
          />
          <DetailField
            label={txt('employee.detail.emergencyPhone')}
            value={data.sdt_khan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.sdt_khan)}
          />
          <DetailField
            label={txt('employee.detail.relationship')}
            value={data.moi_quan_he || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.moi_quan_he)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection
        title={txt('employee.detail.educationInfo')}
        icon={<GraduationCap size={ICON_SIZE.compact} />}
      >
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.educationLevel')}
            value={
              data.trinh_do ? (
                <EnumBadge value={data.trinh_do} config={EDUCATION_BADGE_CONFIG} />
              ) : (
                '—'
              )
            }
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trinh_do)}
          />
          <DetailField
            label={txt('employee.detail.major')}
            value={data.chuyen_nganh || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chuyen_nganh)}
          />
          <DetailField
            label={txt('employee.detail.school')}
            value={data.truong || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.truong)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection
        title={txt('employee.detail.financialInfo')}
        icon={<Landmark size={ICON_SIZE.compact} />}
      >
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.bankAccount')}
            value={data.so_tai_khoan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_tai_khoan)}
          />
          <DetailField
            label={txt('employee.detail.bankAccountHolder')}
            value={data.ten_chu_tai_khoan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_chu_tai_khoan)}
          />
          <DetailField
            label={txt('employee.detail.bankName')}
            value={data.ngan_hang || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngan_hang)}
          />
          <DetailField
            label={txt('employee.detail.bankBranch')}
            value={data.chi_nhanh || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chi_nhanh)}
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection
        title={txt('employee.detail.insuranceInfo')}
        icon={<Shield size={ICON_SIZE.compact} />}
      >
        <DetailFieldGrid>
          <DetailField
            label={txt('employee.detail.socialInsurance')}
            value={data.so_so_bhxh || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_so_bhxh)}
          />
          <DetailField
            label={txt('employee.detail.healthInsurance')}
            value={data.so_bhyt || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_bhyt)}
          />
          <DetailField
            label={txt('employee.detail.taxId')}
            value={data.ma_so_thue_ca_nhan || '—'}
            icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ma_so_thue_ca_nhan)}
          />
        </DetailFieldGrid>
      </DetailSection>

      {data.ten_dang_nhap ? (
        <DetailSection
          title={txt('employee.detail.authAccount')}
          icon={<ShieldCheck size={ICON_SIZE.compact} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('employee.detail.loginName')}
              value={data.ten_dang_nhap ?? undefined}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
            />
            <DetailField
              label={txt('employee.detail.accountActive')}
              value={
                data.tai_khoan_dang_hoat_dong === false
                  ? txt('employee.detail.accountInactive')
                  : txt('employee.statusActive')
              }
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.tai_khoan_dang_hoat_dong)}
            />
          </DetailFieldGrid>
        </DetailSection>
      ) : null}

      <DetailSystemSection
        title={txt('employee.detail.systemInfo')}
        createdAt={data.tg_tao}
        updatedAt={data.tg_cap_nhat}
        createdBy={data.ten_nguoi_tao ?? undefined}
        labels={{
          createdAt: txt('employee.detail.createdDate'),
          updated: txt('employee.detail.lastUpdated'),
          createdBy: txt('employee.detail.createdBy'),
        }}
      />
    </div>
  );
}
