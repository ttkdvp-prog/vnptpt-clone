import { ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/views';
import { txt } from '@/lib/text';

export function NhanVienDetailDecisions() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
          {txt('page.placeholder.badgeComingSoon')}
        </span>
      </div>
      <EmptyState
        title={txt('employee.detail.decisionsComingSoon')}
        description={txt('employee.detail.decisionsComingSoonHint')}
        icon={<ScrollText className="h-10 w-10 text-muted-foreground" />}
      />
    </div>
  );
}
