import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Building2,
  Camera,
  FileText,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  Type,
  User,
} from 'lucide-react';

export const CONG_TY_FIELD_ICONS = {
  appLogo: Camera,
  appName: Type,
  appDescription: FileText,
  companyName: Building2,
  taxId: Hash,
  phone: Phone,
  email: Mail,
  website: Globe,
  address: MapPin,
  representative: User,
  representativeTitle: Briefcase,
  signingPlace: MapPin,
} as const satisfies Record<string, LucideIcon>;
