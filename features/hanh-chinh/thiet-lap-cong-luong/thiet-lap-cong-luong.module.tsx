'use client';

import { Wallet } from 'lucide-react';
import ModulePlaceholder from '@/components/placeholder/ModulePlaceholder';
import { txt } from '@/lib/text';

const ThietLapCongLuongPage: React.FC = () => {
  return (
    <ModulePlaceholder
      submenuPath="/hanh-chinh"
      submenuTitle={txt('page.adminOpsDashboard.title')}
      moduleTitle={txt('payrollSettings.title')}
      icon={Wallet}
    />
  );
};

export default ThietLapCongLuongPage;
