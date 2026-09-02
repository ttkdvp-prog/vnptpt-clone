import React, { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { txt } from '@/lib/text';
import AppDialog from '@/components/shared/AppDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useResetEmployeePassword } from '../hooks/use-nhan-vien';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

const MIN_PASSWORD_LENGTH = 1;

const NhanVienChangePasswordDialog: React.FC<Props> = ({ open, onClose, employeeId, employeeName }) => {
  const [password, setPassword] = useState('');
  const resetPasswordMutation = useResetEmployeePassword();
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus ô mật khẩu khi mở — dùng ref thay `autoFocus` để không vi phạm
  // jsx-a11y/no-autofocus, theo đúng cách GenericTable/GenericDrawer đang làm.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => passwordRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const error =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? txt('employee.validation.tempPasswordMin')
      : undefined;

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) return;
    await resetPasswordMutation.mutateAsync({ id: employeeId, password });
    handleClose();
  };

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title={txt('employee.detail.changePassword')}
      subtitle={employeeName}
      icon={KeyRound}
      size="COMPACT"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={resetPasswordMutation.isPending}>
            {txt('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={resetPasswordMutation.isPending}
            disabled={password.length < MIN_PASSWORD_LENGTH}
          >
            {txt('common.save')}
          </Button>
        </>
      }
    >
      <div className="p-5">
        <Input
          type="password"
          label={txt('employee.form.newTempPassword')}
          hint={error ? undefined : txt('employee.form.tempPasswordHint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          ref={passwordRef}
        />
      </div>
    </AppDialog>
  );
};

export default NhanVienChangePasswordDialog;
