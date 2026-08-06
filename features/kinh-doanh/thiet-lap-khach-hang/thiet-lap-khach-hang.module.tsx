'use client';

import { useCallback, useMemo } from 'react';
import { Tag, UsersRound } from 'lucide-react';
import TabGroup from '@/components/ui/TabGroup';
import { txt } from '@/lib/text';
import { useSearchParams } from '@/lib/navigation';
import NhomKhachHangPage from './nhom-khach-hang/nhom-khach-hang.module';
import TrangThaiKhachHangPage from './trang-thai-khach-hang/trang-thai-khach-hang.module';

const VALID_TABS = ['nhom', 'trang-thai'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value != null && (VALID_TABS as readonly string[]).includes(value);
}

const ThietLapKhachHangPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab: SettingsTab = isSettingsTab(tabFromUrl) ? tabFromUrl : 'nhom';

  const handleTabChange = useCallback(
    (id: string) => {
      if (!isSettingsTab(id)) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', id);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const tabs = useMemo(
    () => [
      {
        id: 'nhom',
        label: txt('customerSettings.tabGroup'),
        icon: UsersRound,
      },
      {
        id: 'trang-thai',
        label: txt('customerSettings.tabStatus'),
        icon: Tag,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-2 min-h-0 flex-1 h-page">
      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        className="shrink-0"
      />
      <div className="min-h-0 flex-1 flex flex-col">
        {activeTab === 'nhom' ? <NhomKhachHangPage /> : <TrangThaiKhachHangPage />}
      </div>
    </div>
  );
};

export default ThietLapKhachHangPage;
