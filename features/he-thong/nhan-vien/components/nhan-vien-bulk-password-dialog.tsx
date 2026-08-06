import React, { useCallback, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { txt } from '@/lib/text';
import AppDialog from '@/components/shared/AppDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useBulkResetEmployeePasswords } from '../hooks/use-nhan-vien';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { Employee } from '../core/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Nhân viên đang chọn (hydrate từ trang đã tải — xem ghi chú về selection nhiều trang). */
  selectedEmployees: Employee[];
  /** Toàn bộ id đang chọn — nguồn sự thật khi selection trải nhiều trang. */
  selectedIds: string[];
  onSuccess: () => void;
}

const MIN_PASSWORD_LENGTH = 6;

/**
 * Đặt lại mật khẩu cho nhiều nhân viên bằng **một mật khẩu tạm dùng chung**.
 *
 * Đây là thỏa hiệp có ý thức: sinh mật khẩu riêng cho từng người thì không có cách
 * nào hiển thị / phát lại an toàn trong UI này. Bù lại, mật khẩu dùng chung luôn
 * kèm cờ buộc đổi ở lần đăng nhập kế tiếp, nên nó không tồn tại lâu.
 */
const NhanVienBulkPasswordDialog: React.FC<Props> = ({
  open,
  onClose,
  selectedEmployees,
  selectedIds,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');

  const handleClose = useCallback(() => {
    setPassword('');
    onClose();
  }, [onClose]);

  const mutation = useBulkResetEmployeePasswords(() => {
    onSuccess();
    handleClose();
  });

  const error =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? txt('employee.bulkPassword.minLength', { count: MIN_PASSWORD_LENGTH })
      : undefined;

  // Chỉ nhân viên có tài khoản đăng nhập mới đặt lại được mật khẩu. Tính trên các
  // dòng đã tải; server vẫn là chốt cuối và trả về danh sách bị bỏ qua.
  const withoutLogin = selectedEmployees.filter((emp) => !emp.ten_dang_nhap);

  const handleSubmit = () => {
    if (password.length < MIN_PASSWORD_LENGTH) return;
    useConfirmStore.getState().confirm({
      title: txt('employee.bulkPassword.confirmTitle'),
      message: txt('employee.bulkPassword.confirmMessage', { count: selectedIds.length }),
      variant: 'warning',
      onConfirm: () => mutation.mutate({ ids: selectedIds, password }),
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title={txt('employee.bulkPassword.title')}
      subtitle={txt('employee.bulkPassword.subtitle', { count: selectedIds.length })}
      icon={KeyRound}
      size="COMPACT"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={mutation.isPending}>
            {txt('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={mutation.isPending}
            disabled={password.length < MIN_PASSWORD_LENGTH}
          >
            {txt('employee.bulkPassword.apply')}
          </Button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 font-bold text-lg leading-none shrink-0">!</span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {txt('employee.bulkPassword.warning', { count: selectedIds.length })}
          </p>
        </div>

        {withoutLogin.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {txt('employee.bulkPassword.noLoginHint', { count: withoutLogin.length })}
          </p>
        )}

        <Input
          type="password"
          label={txt('employee.form.newTempPassword')}
          hint={txt('employee.bulkPassword.hint', { count: MIN_PASSWORD_LENGTH })}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          autoComplete="new-password"
        />
      </div>
    </AppDialog>
  );
};

export default NhanVienBulkPasswordDialog;
