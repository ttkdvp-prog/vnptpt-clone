import { isApi } from '@/lib/data/config';
import { apiGetCompany, apiGetCompanyBranding, apiUpsertCompany } from '@/lib/api/he-thong';
import { useUIStore } from '@/store/useStore';
import type { CompanyFormValues } from '../core/types';
import {
  COMPANY_ROW_ID,
  mapFormToVarCongTyRow,
  mapRowToCompanyInfo,
  type CompanyInfo,
  type VarCongTyRow,
} from '../core/cong-ty-map';

export interface CompanyBranding {
  appName: string;
  appDescription: string;
  appLogo: string | null;
}

function getMockCompanyInfo(): CompanyInfo {
  return useUIStore.getState().companyInfo;
}

function brandingFromCompanyInfo(info: CompanyInfo): CompanyBranding {
  return {
    appName: info.appName,
    appDescription: info.appDescription,
    appLogo: info.appLogo,
  };
}

export async function getCompany(): Promise<CompanyInfo> {
  if (isApi()) {
    const row = await apiGetCompany();
    return mapRowToCompanyInfo(row as VarCongTyRow);
  }
  return getMockCompanyInfo();
}

/** Shell branding — any authenticated user (no module xem). */
export async function getCompanyBranding(): Promise<CompanyBranding> {
  if (isApi()) {
    return apiGetCompanyBranding();
  }
  return brandingFromCompanyInfo(getMockCompanyInfo());
}

export async function upsertCompany(values: CompanyFormValues): Promise<CompanyInfo> {
  const payload = mapFormToVarCongTyRow(values);

  if (isApi()) {
    const row = await apiUpsertCompany(payload);
    const saved = mapRowToCompanyInfo(row as VarCongTyRow);
    useUIStore.getState().setCompanyInfo(saved);
    return saved;
  }

  const info = mapRowToCompanyInfo({
    ...payload,
    id: COMPANY_ROW_ID,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  });
  useUIStore.getState().setCompanyInfo(info);
  return info;
}
