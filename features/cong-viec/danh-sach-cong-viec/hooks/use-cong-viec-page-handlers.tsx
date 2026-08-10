import { useCallback, startTransition } from 'react';
import type { FeaturePageHandlerContext, FeaturePageHandlers } from '@/lib/factories/create-feature-module';
import type { FormViewOrigin } from '@/lib/last-view-flow';
import { txt } from '@/lib/text';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '@/lib/button-labels';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { CongViec } from '../core/types';
import { useDeleteCongViec } from './use-cong-viec';

export function useCongViecPageHandlers(ctx: FeaturePageHandlerContext<CongViec>): FeaturePageHandlers<CongViec> {
  const {
    rawData,
    rawDataRef,
    viewingItemRef,
    editingItemRef,
    formOriginRef,
    setViewingItem,
    setEditingItem,
    setShowForm,
    setFormOrigin,
    clearSelection,
    keyExtractor,
  } = ctx;

  const deleteMutation = useDeleteCongViec();
  const confirm = useConfirmStore((s) => s.confirm);

  const handleEdit = useCallback(
    (item: CongViec, origin?: FormViewOrigin) => {
      const resolvedOrigin: FormViewOrigin = origin ?? (viewingItemRef.current ? 'detail' : 'list');
      startTransition(() => {
        setFormOrigin(resolvedOrigin);
        if (resolvedOrigin === 'list') setViewingItem(null);
        setEditingItem(item);
        setShowForm(true);
      });
    },
    [setFormOrigin, setEditingItem, setShowForm, setViewingItem, viewingItemRef],
  );

  const handleView = useCallback((item: CongViec) => startTransition(() => setViewingItem(item)), [setViewingItem]);

  const closeDetail = useCallback(() => setViewingItem(null), [setViewingItem]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    const origin = formOriginRef.current;
    const ed = editingItemRef.current;
    if (origin === 'list') {
      setViewingItem(null);
    } else if (origin === 'detail' && ed) {
      const fresh = rawDataRef.current.find((e) => keyExtractor(e) === keyExtractor(ed));
      setViewingItem(fresh ?? null);
    }
    setEditingItem(null);
    setFormOrigin('list');
  }, [setShowForm, editingItemRef, formOriginRef, rawDataRef, setViewingItem, setEditingItem, setFormOrigin, keyExtractor]);

  const handleDelete = useCallback(
    (id: string) => {
      const item = rawDataRef.current.find((e) => keyExtractor(e) === id);
      if (!item) return;
      confirm({
        title: txt('congViec.deleteConfirmTitle'),
        message: `${txt('congViec.deleteConfirmMessage')} "${item.tieu_de}"?`,
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          await deleteMutation.mutateAsync([id]);
          if (viewingItemRef.current && keyExtractor(viewingItemRef.current) === id) setViewingItem(null);
          if (editingItemRef.current && keyExtractor(editingItemRef.current) === id) setShowForm(false);
        },
      });
    },
    [confirm, deleteMutation, viewingItemRef, editingItemRef, setViewingItem, setShowForm, keyExtractor, rawDataRef],
  );

  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: txt('congViec.bulkDeleteTitle'),
        message: txt('congViec.bulkDeleteMessage', { count: ids.length }),
        variant: 'danger',
        confirmText: CONFIRM_DELETE_ALL(),
        onConfirm: async () => {
          await deleteMutation.mutateAsync(ids);
          clearSelection();
        },
      });
    },
    [confirm, deleteMutation, clearSelection],
  );

  const handleAdd = useCallback(() => {
    startTransition(() => {
      setFormOrigin('list');
      setShowForm(true);
    });
  }, [setFormOrigin, setShowForm]);

  void rawData;

  return { handleEdit, handleView, handleDelete, handleDeleteMany, closeForm, closeDetail, handleAdd };
}
