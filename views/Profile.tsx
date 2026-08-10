import React, { useState, useMemo, useCallback } from 'react';
import { txt } from '@/lib/text';
import { useAuthStore } from '@/store/useStore';
import Button from '@/components/ui/Button';
import SingleImageInput from '@/components/ui/SingleImageInput';
import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import DashboardToolbar from '@/components/shared/DashboardToolbar';
import DetailToolbar from '@/components/shared/DetailToolbar';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import EnumBadge from '@/components/ui/EnumBadge';
import PreviewableImage from '@/components/ui/PreviewableImage';
import { toast } from 'sonner';
import * as m from 'framer-motion/m';
import { AnimatePresence } from 'framer-motion';
import {
  User as UserIcon, Shield, Calendar,
  Key, X, Eye, EyeOff,
} from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { FORM_CONTROL_BASE, FORM_CONTROL_PLACEHOLDER } from '@/lib/constants/form-control';
import { STATUS_BADGE_CONFIG } from '@/features/he-thong/nhan-vien/core/constants';
import { canEditProfile } from '@/lib/profile-permissions';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useUpdateEmployee } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { employeeToFormValues } from '@/features/he-thong/nhan-vien/utils/employee-to-form';
import { changePassword } from '@/lib/employee-auth/change-password';

const Profile: React.FC = () => {
  const { user, login, patchUser } = useAuthStore();
  const { data: employees = [] } = useEmployees();
  const updateEmployeeMutation = useUpdateEmployee();

  const currentEmployee = useMemo(() => {
    if (!user) return null;
    if (user.employee_id) {
      return employees.find((e) => e.id === user.employee_id) ?? null;
    }
    return null;
  }, [employees, user]);

  const displayData: Employee = useMemo(() => {
    if (currentEmployee) return currentEmployee;
    return {
      id: '',
      ho_ten: user?.full_name ?? '',
      trang_thai: 'Đang làm việc',
    };
  }, [currentEmployee, user?.full_name]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordShow, setPasswordShow] = useState({ current: false, new: false, confirm: false });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const resetPasswordModal = useCallback(() => {
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordShow({ current: false, new: false, confirm: false });
    setPasswordError(null);
  }, []);

  const handlePasswordModalOpen = useCallback(() => {
    resetPasswordModal();
    setPasswordModalOpen(true);
  }, [resetPasswordModal]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    const { current, new: newPw, confirm } = passwordForm;
    if (!current.trim()) {
      setPasswordError(txt('nav.changePassword.errorCurrentRequired'));
      return;
    }
    if (newPw.length < 6) {
      setPasswordError(txt('nav.changePassword.errorNewMin'));
      return;
    }
    if (newPw !== confirm) {
      setPasswordError(txt('nav.changePassword.errorConfirmMismatch'));
      return;
    }
    if (current === newPw) {
      setPasswordError(txt('nav.changePassword.errorSameAsCurrent'));
      return;
    }
    if (!user) return;
    const employeeId = user.employee_id ?? '';
    if (!employeeId) {
      setPasswordError('Chưa có mã nhân viên');
      return;
    }
    setPasswordSubmitting(true);
    const result = await changePassword({
      employeeId,
      currentPassword: current,
      newPassword: newPw,
    });
    setPasswordSubmitting(false);
    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }
    if (user.must_change_password) {
      patchUser({ must_change_password: false });
    }
    setPasswordModalOpen(false);
    resetPasswordModal();
    toast.success(txt('nav.changePassword.success'));
  };

  const editable = canEditProfile(user);

  const displayName = currentEmployee?.ho_ten ?? user?.full_name ?? '';
  const displayAvatar = currentEmployee?.anh_dai_dien ?? user?.avatar_url ?? null;

  const handleAvatarChange = async (value: string | null) => {
    if (!user || !editable) return;
    if (currentEmployee) {
      try {
        const payload = employeeToFormValues(currentEmployee);
        await updateEmployeeMutation.mutateAsync({
          id: currentEmployee.id,
          data: { ...payload, anh_dai_dien: value },
        });
        login({ ...user, avatar_url: value ?? undefined });
        toast.success(txt('page.profile.avatarUpdateSuccess'));
      } catch {
        toast.error(txt('page.profile.userNotFound'));
      }
      return;
    }
    login({ ...user, avatar_url: value ?? undefined });
    toast.success(txt('page.profile.avatarUpdateSuccess'));
  };

  const avatarAlt = displayName
    ? txt('page.profile.avatarAlt', { name: displayName })
    : txt('page.profile.avatarAltFallback');
  const emptyText = txt('page.profile.emptyField');

  const toolbarActions = useMemo(() => {
    if (!editable) return [];
    return [
      {
        label: txt('page.profile.changePassword'),
        icon: <Key />,
        onClick: handlePasswordModalOpen,
        variant: 'secondary' as const,
      },
    ];
  }, [editable, handlePasswordModalOpen]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">{txt('page.profile.userNotFound')}</p>
      </div>
    );
  }

  const data = displayData;

  return (
    <div className="flex flex-col min-h-0">
      <DashboardToolbar
        leadingContent={
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserIcon className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {txt('page.profile.title')}
            </h1>
          </div>
        }
      />
      <div className="px-4 sm:px-6 space-y-4 sm:space-y-6 pb-10 pt-3 md:pt-4 max-w-full">
      {/* View-only banner */}
      {!editable && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200"
          role="status"
        >
          {txt('page.profile.viewOnlyBanner')}
        </m.div>
      )}

      {/* ===== Main layout: sidebar + content ===== */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch lg:items-start w-full">
        {/* --- Sidebar: compact horizontal on mobile, vertical card on desktop --- */}
        <m.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-6"
        >
          <div className="rounded-xl border border-border bg-card shadow-sm relative overflow-hidden">
            {/* Cover gradient – shorter on mobile */}
            <div className="h-16 sm:h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" aria-hidden="true" />

            {/* Avatar + identity: horizontal on mobile, centered on desktop */}
            <div className="px-4 sm:px-6 -mt-8 sm:-mt-12">
              {/* Mobile: flex row | Desktop: text-center stacked */}
              <div className="flex items-end gap-3 sm:block sm:text-center">
                <div className="relative shrink-0 sm:inline-block">
                  {editable ? (
                    <SingleImageInput
                      value={displayAvatar}
                      onChange={(value) => void handleAvatarChange(value)}
                      shape="circle"
                      aspectRatio="1/1"
                      maxSizeMB={10}
                      uploadContext={{ folder: CLOUDINARY_FOLDERS.employeeAvatar }}
                      placeholder={txt('page.profile.changeAvatar')}
                      hint={txt('page.profile.avatarModalHint')}
                      className="w-[96px] sm:w-[180px]"
                      disabled={updateEmployeeMutation.isPending}
                    />
                  ) : (
                    <>
                      <PreviewableImage
                        src={displayAvatar ?? getAvatarUrl(displayName, 128)}
                        alt={avatarAlt}
                        imgClassName="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-[3px] sm:border-4 border-card shadow-lg object-cover"
                      />
                      <span
                        className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-card rounded-full pointer-events-none"
                        title={txt('page.profile.activeStatus')}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>
                <div className="pb-1 sm:pb-0 sm:mt-3 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-foreground leading-tight truncate">{displayName}</h3>
                </div>
              </div>
            </div>

            {/* Quick info – 2-col grid on mobile, stacked on desktop */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                  <Shield size={14} className="shrink-0" />
                  <span>{txt('page.profile.verified')}</span>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            {toolbarActions.length > 0 && (
              <div className="border-t border-border">
                <DetailToolbar
                  actions={toolbarActions}
                  columns={2}
                  className="py-3 sm:py-4"
                />
              </div>
            )}
          </div>
        </m.aside>

        {/* --- Content: sections xếp dọc, full width mobile --- */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full min-w-0 flex-1 space-y-4 sm:space-y-5"
        >
          <DetailSection title={txt('employee.detail.personalInfo')} icon={<UserIcon size={14} />} variant="primary">
            <DetailFieldGrid cols={3}>
              <DetailField label={txt('employee.detail.fullName')} value={data.ho_ten} icon={<UserIcon size={12} />} emptyText={emptyText} />
              <DetailField label="ID" value={data.id || undefined} emptyText={emptyText} />
              <DetailField label={txt('employee.status')} value={data.trang_thai ? <EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} /> : undefined} emptyText={emptyText} />
            </DetailFieldGrid>
          </DetailSection>
        </m.div>
      </div>
      </div>

      {/* ===== Modal: Đổi mật khẩu ===== */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !passwordSubmitting && setPasswordModalOpen(false)}
            />
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl shadow-xl border border-border w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{txt('page.profile.changePasswordTitle')}</h3>
                <button
                  type="button"
                  onClick={() => !passwordSubmitting && setPasswordModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={txt('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{txt('page.profile.changePasswordDesc')}</p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                    {passwordError}
                  </div>
                )}
                {(['current', 'new', 'confirm'] as const).map((field) => {
                  const labelKey =
                    field === 'current'
                      ? 'page.profile.currentPassword'
                      : field === 'new'
                        ? 'page.profile.newPassword'
                        : 'page.profile.confirmPassword';
                  return (
                    <div key={field}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{txt(labelKey)}</label>
                      <div className="relative">
                        <input
                          type={passwordShow[field] ? 'text' : 'password'}
                          value={passwordForm[field]}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
                          autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                          className={cn(FORM_CONTROL_BASE, 'pl-3 pr-10', FORM_CONTROL_PLACEHOLDER)}
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordShow((s) => ({ ...s, [field]: !s[field] }))}
                          aria-label={passwordShow[field] ? txt('nav.changePassword.hidePassword') : txt('nav.changePassword.showPassword')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {passwordShow[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setPasswordModalOpen(false)}
                    disabled={passwordSubmitting}
                  >
                    {txt('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl" isLoading={passwordSubmitting} disabled={passwordSubmitting}>
                    {txt('nav.changePassword.submit')}
                  </Button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
