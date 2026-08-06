import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ContactRound,
  FileText,
  Phone,
  Plus,
  Users,
  UsersRound,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Combobox from '@/components/ui/Combobox';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import {
  DetailField,
  DetailFieldGrid,
  DetailFooterActions,
  DetailSection,
  DetailSystemSection,
  DetailToolbar,
  EmptyState,
  GenericDrawer,
} from '@/components/views';
import type { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import EmbeddedChildDataGrid from '@/components/shared/EmbeddedChildDataGrid';
import { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import { DRAWER_Z_CONTENT_BASE, getDrawerWidthClass } from '@/lib/dialog-sizes';
import { CONFIRM_DELETE, CONFIRM_YES } from '@/lib/button-labels';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useNhomKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/hooks/use-nhom-khach-hang';
import { useTrangThaiKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/hooks/use-trang-thai-khach-hang';
import {
  useDeleteNguoiLienHe,
  useNguoiLienHeByCustomer,
} from '@/features/kinh-doanh/nguoi-lien-he/hooks/use-nguoi-lien-he';
import { NguoiLienHeRowActions } from '@/features/kinh-doanh/nguoi-lien-he/components/nguoi-lien-he-row-actions';
import type { NguoiLienHe } from '@/features/kinh-doanh/nguoi-lien-he/core/types';
import type { KhachHang } from '../core/types';
import { KHACH_HANG_FIELD_ICONS } from '../core/khach-hang-field-icons';
import { usePatchKhachHang } from '../hooks/use-khach-hang';
import { KhachHangGroupBadge, KhachHangStatusBadge } from './khach-hang-badges';

const NhomKhachHangForm = lazy(
  () =>
    import(
      '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/components/nhom-khach-hang-form'
    ),
);
const TrangThaiKhachHangForm = lazy(
  () =>
    import(
      '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/components/trang-thai-khach-hang-form'
    ),
);
const NguoiLienHeForm = lazy(
  () => import('@/features/kinh-doanh/nguoi-lien-he/components/nguoi-lien-he-form'),
);
const NguoiLienHeDetail = lazy(
  () => import('@/features/kinh-doanh/nguoi-lien-he/components/nguoi-lien-he-detail'),
);

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div
      className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-hidden
    />
  </div>
);

type NestedMasterForm = 'group' | 'status' | null;

interface Props {
  data: KhachHang;
  onClose: () => void;
  onEdit: (item: KhachHang) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: KhachHang) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const KhachHangDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const confirm = useConfirmStore((s) => s.confirm);
  const closeConfirm = useConfirmStore((s) => s.close);
  const patchMutation = usePatchKhachHang();
  const { data: groups = [] } = useNhomKhachHang();
  const { data: statuses = [] } = useTrangThaiKhachHang();
  const [nestedForm, setNestedForm] = useState<NestedMasterForm>(null);
  const [contactMenuOpenId, setContactMenuOpenId] = useState<string | null>(null);
  const [viewingContact, setViewingContact] = useState<NguoiLienHe | null>(null);
  const [editingContact, setEditingContact] = useState<NguoiLienHe | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: contacts = [] } = useNguoiLienHeByCustomer(data.id);
  const deleteContactMutation = useDeleteNguoiLienHe();

  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'customers', recordCtx);
  const canDelete = useCanOnRecord('delete', 'customers', recordCtx);
  const canCreate = useCan('create', 'customers');
  const canCreateSettings = useCan('create', 'customerSettings');
  const canViewContacts = useCan('view', 'contacts');
  const canCreateContact = useCan('create', 'contacts');

  const contactStackLevel = stackLevel + 1;
  const contactDrawerWidth = getDrawerWidthClass(contactStackLevel);

  const resolvedViewingContact = useMemo(() => {
    if (!viewingContact) return null;
    return contacts.find((c) => c.id === viewingContact.id) ?? viewingContact;
  }, [contacts, viewingContact]);

  const handleCloseContactForm = useCallback(() => {
    setShowContactForm(false);
    setEditingContact(null);
  }, []);

  const handleDeleteContact = useCallback(
    (id: string) => {
      confirm({
        title: txt('contact.deleteTitle'),
        message: txt('contact.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteContactMutation.mutate([id], {
            onSuccess: () => {
              if (viewingContact?.id === id) setViewingContact(null);
            },
          });
        },
      });
    },
    [confirm, deleteContactMutation, viewingContact?.id],
  );

  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: g.id, label: g.ten_nhom })),
    [groups],
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ value: s.id, label: s.ten_trang_thai })),
    [statuses],
  );

  const addNewLabel = txt('customer.form.addNewOption');

  const openCreateStatus = useCallback(() => {
    closeConfirm();
    setNestedForm('status');
  }, [closeConfirm]);

  const openCreateGroup = useCallback(() => {
    closeConfirm();
    setNestedForm('group');
  }, [closeConfirm]);

  const handleChangeStatus = useCallback(() => {
    let selectedId = data.id_trang_thai;
    confirm({
      title: txt('customer.detail.statusChangeTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">
            {txt('customer.detail.statusChangeMessage')}{' '}
            <strong>{data.ten_khach_hang}</strong>:
          </p>
          <Combobox
            value={data.id_trang_thai}
            options={statusOptions}
            onChange={(v) => {
              selectedId = String(v ?? '');
            }}
            searchable={false}
            dropdownInPortal
            onAddNew={canCreateSettings ? openCreateStatus : undefined}
            addNewLabel={addNewLabel}
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        if (!selectedId || selectedId === data.id_trang_thai) return;
        await patchMutation.mutateAsync({
          id: data.id,
          data: { id_trang_thai: selectedId },
        });
      },
    });
  }, [
    addNewLabel,
    canCreateSettings,
    confirm,
    data.id,
    data.id_trang_thai,
    data.ten_khach_hang,
    openCreateStatus,
    patchMutation,
    statusOptions,
  ]);

  const handleChangeGroup = useCallback(() => {
    let selectedId = data.id_nhom;
    confirm({
      title: txt('customer.detail.groupChangeTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">
            {txt('customer.detail.groupChangeMessage')}{' '}
            <strong>{data.ten_khach_hang}</strong>:
          </p>
          <Combobox
            value={data.id_nhom}
            options={groupOptions}
            onChange={(v) => {
              selectedId = String(v ?? '');
            }}
            searchable={false}
            dropdownInPortal
            onAddNew={canCreateSettings ? openCreateGroup : undefined}
            addNewLabel={addNewLabel}
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        if (!selectedId || selectedId === data.id_nhom) return;
        await patchMutation.mutateAsync({
          id: data.id,
          data: { id_nhom: selectedId },
        });
      },
    });
  }, [
    addNewLabel,
    canCreateSettings,
    confirm,
    data.id,
    data.id_nhom,
    data.ten_khach_hang,
    groupOptions,
    openCreateGroup,
    patchMutation,
  ]);

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    if (!canEdit) return [];
    return [
      {
        label: txt('customer.detail.changeStatus'),
        icon: <Activity />,
        onClick: handleChangeStatus,
        variant: 'info',
      },
      {
        label: txt('customer.detail.changeGroup'),
        icon: <UsersRound />,
        onClick: handleChangeGroup,
        variant: 'primary',
      },
    ];
  }, [canEdit, handleChangeStatus, handleChangeGroup]);

  const nestedStackLevel = stackLevel + 1;

  return (
    <>
      <GenericDrawer
        title={txt('customer.detail.title')}
        subtitle={txt('customer.detail.subtitle')}
        icon={<Users size={ICON_SIZE.prominent} />}
        onClose={onClose}
        maxWidthClass={maxWidthClass}
        stackLevel={stackLevel}
        footerCompact
        footer={
          <DetailFooterActions
            onClose={onClose}
            onDuplicate={
              canCreate && onDuplicate
                ? () => {
                    onDuplicate(data);
                    onClose();
                  }
                : undefined
            }
            onEdit={
              canEdit
                ? () => {
                    onEdit(data);
                    onClose();
                  }
                : undefined
            }
            onDelete={
              canDelete
                ? () => {
                    onDelete(data.id);
                    onClose();
                  }
                : undefined
            }
          />
        }
      >
        <div className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shrink-0">
              <Users size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  {data.ten_khach_hang}
                </h2>
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {data.ma_khach_hang}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {data.ten_nhom && <KhachHangGroupBadge value={data.ten_nhom} />}
                {data.ten_trang_thai && <KhachHangStatusBadge value={data.ten_trang_thai} />}
              </div>
            </div>
          </div>

          <DetailToolbar
            actions={toolbarActions}
            className="bg-card rounded-xl border border-border"
          />

          <DetailSection title={txt('customer.form.generalInfo')} icon={<FileText size={14} />}>
            <DetailFieldGrid>
              <DetailField
                label={txt('customer.form.code')}
                value={data.ma_khach_hang}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ma_khach_hang)}
              />
              <DetailField
                label={txt('customer.form.name')}
                value={data.ten_khach_hang}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ten_khach_hang)}
              />
              <DetailField
                label={txt('customer.form.group')}
                value={<KhachHangGroupBadge value={data.ten_nhom} />}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.id_nhom)}
              />
              <DetailField
                label={txt('customer.form.status')}
                value={<KhachHangStatusBadge value={data.ten_trang_thai} />}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.id_trang_thai)}
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={txt('customer.form.contactInfo')} icon={<Phone size={14} />}>
            <DetailFieldGrid>
              <DetailField
                label={txt('customer.form.phone')}
                value={data.so_dien_thoai || '—'}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.so_dien_thoai)}
              />
              <DetailField
                label={txt('customer.form.address')}
                value={data.dia_chi || '—'}
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.dia_chi)}
              />
              <DetailField
                label={txt('customer.form.note')}
                value={data.ghi_chu || '—'}
                className="sm:col-span-2"
                icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ghi_chu)}
              />
            </DetailFieldGrid>
          </DetailSection>

          {canViewContacts ? (
            <DetailSection
              title={txt('contact.detail.sectionTitle')}
              icon={<ContactRound size={14} />}
              headerRight={
                <>
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
                    {contacts.length}
                  </span>
                  {canCreateContact ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingContact(null);
                        setShowContactForm(true);
                      }}
                      className="h-8 shrink-0 bg-primary px-3 text-white shadow-sm hover:bg-primary/90"
                    >
                      <Plus size={14} className="mr-1.5" />
                      {txt('contact.detail.add')}
                    </Button>
                  ) : null}
                </>
              }
            >
              {contacts.length === 0 ? (
                <EmptyState
                  title={txt('contact.detail.empty')}
                  description={txt('contact.emptyHint')}
                  icon={<ContactRound className="h-10 w-10 text-muted-foreground" />}
                />
              ) : (
                <EmbeddedChildDataGrid<NguoiLienHe>
                  rows={contacts}
                  getRowKey={(row) => row.id}
                  labelColumn={{
                    header: txt('contact.form.name'),
                    minWidthClass: 'min-w-[140px]',
                    renderCell: (row) => (
                      <span className="font-medium text-foreground">{row.ho_ten}</span>
                    ),
                  }}
                  columns={[
                    {
                      id: 'chuc_vu',
                      header: txt('contact.form.title'),
                      renderCell: (row) => (
                        <span className="text-xs text-muted-foreground">{row.chuc_vu || '—'}</span>
                      ),
                    },
                    {
                      id: 'phone',
                      header: txt('contact.form.phone'),
                      renderCell: (row) => (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {row.so_dien_thoai || '—'}
                        </span>
                      ),
                    },
                    {
                      id: 'email',
                      header: txt('contact.form.email'),
                      renderCell: (row) => (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                          {row.email || '—'}
                        </span>
                      ),
                    },
                  ]}
                  actionsColumn={{
                    header: txt('common.actions'),
                    widthClass: 'w-[92px] min-w-[92px]',
                    headerClassName: 'px-2',
                    cellClassName: 'px-2',
                    renderCell: (row) => (
                      <NguoiLienHeRowActions
                        item={row}
                        menuOpenId={contactMenuOpenId}
                        onMenuOpenChange={setContactMenuOpenId}
                        onEdit={(item) => {
                          setEditingContact(item);
                          setShowContactForm(true);
                          setViewingContact(null);
                        }}
                        onDelete={handleDeleteContact}
                      />
                    ),
                  }}
                  onRowClick={(row) => setViewingContact(row)}
                  containerClassName="border-0 shadow-none"
                />
              )}
            </DetailSection>
          ) : null}

          <DetailSystemSection
            title={txt('customer.detail.systemInfo')}
            createdAt={data.tg_tao}
            updatedAt={data.tg_cap_nhat}
            createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
            labels={{
              createdAt: txt('customer.detail.createdAt'),
              updated: txt('customer.detail.updated'),
            }}
          />
        </div>
      </GenericDrawer>

      {nestedForm === 'group' && (
        <Suspense fallback={null}>
          <NhomKhachHangForm
            initialData={null}
            stackLevel={nestedStackLevel}
            onClose={() => setNestedForm(null)}
            onCreated={(created) => {
              void patchMutation.mutateAsync({
                id: data.id,
                data: { id_nhom: created.id },
              });
            }}
          />
        </Suspense>
      )}
      {nestedForm === 'status' && (
        <Suspense fallback={null}>
          <TrangThaiKhachHangForm
            initialData={null}
            stackLevel={nestedStackLevel}
            onClose={() => setNestedForm(null)}
            onCreated={(created) => {
              void patchMutation.mutateAsync({
                id: data.id,
                data: { id_trang_thai: created.id },
              });
            }}
          />
        </Suspense>
      )}

      {showContactForm ? (
        <Suspense fallback={<DrawerLazyFallback />}>
          <NguoiLienHeForm
            initialData={editingContact}
            defaultKhachHangId={data.id}
            stackLevel={contactStackLevel}
            onClose={handleCloseContactForm}
          />
        </Suspense>
      ) : null}

      {resolvedViewingContact && !showContactForm ? (
        <Suspense fallback={<DrawerLazyFallback />}>
          <NguoiLienHeDetail
            data={resolvedViewingContact}
            maxWidthClass={contactDrawerWidth}
            stackLevel={contactStackLevel}
            onClose={() => setViewingContact(null)}
            onEdit={(item) => {
              setEditingContact(item);
              setShowContactForm(true);
              setViewingContact(null);
            }}
            onDelete={handleDeleteContact}
          />
        </Suspense>
      ) : null}
    </>
  );
};

export default KhachHangDetail;
