
import React, { useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { Users, Briefcase } from 'lucide-react';
import GenericDrawer from '@/components/shared/GenericDrawer';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import FormSection from '@/components/shared/FormSection';
import Combobox from '@/components/ui/Combobox';
import { getAvatarUrl } from '@/lib/utils';
import { STATUS_OPTIONS } from '../core/constants';
import { EMPLOYEE_FIELD_ICONS } from '../core/employee-field-icons';
import { useBulkUpdateEmployees } from '../hooks/use-nhan-vien';
import { useConfirmStore } from '@/store/useConfirmStore';
import { Employee } from '../core/types';

const BULK_EDIT_FORM_ID = 'employee-bulk-edit-form';

export interface BulkEditFields {
  trang_thai?: string;
}

interface Props {
  selectedEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkEditSheet: React.FC<Props> = ({ selectedEmployees, onClose, onSuccess }) => {
  const [fields, setFields] = useState<BulkEditFields>({});
  const [enabledFields, setEnabledFields] = useState<Set<keyof BulkEditFields>>(new Set());

  const bulkMutation = useBulkUpdateEmployees(() => {
    onSuccess();
    onClose();
  });

  const statusOptions = STATUS_OPTIONS.map(s => ({ value: String(s.value), label: s.label }));

  const toggleField = (field: keyof BulkEditFields) => {
    const next = new Set(enabledFields);
    if (next.has(field)) {
      next.delete(field);
      const nextFields = { ...fields };
      delete nextFields[field];
      setFields(nextFields);
    } else {
      next.add(field);
    }
    setEnabledFields(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const ids = selectedEmployees.map(emp => emp.id);
    const payload: Partial<BulkEditFields> = {};
    enabledFields.forEach(key => {
      if (fields[key] !== undefined && fields[key] !== '') {
        payload[key] = fields[key] as BulkEditFields[typeof key];
      }
    });
    if (Object.keys(payload).length === 0) return;
    useConfirmStore.getState().confirm({
      title: txt('employee.bulk.confirmTitle'),
      message: txt('employee.bulk.confirmMessage', { count: ids.length }),
      variant: 'warning',
      onConfirm: () => bulkMutation.mutate({ ids, fields: payload }),
    });
  };

  const hasChanges = enabledFields.size > 0 && Array.from(enabledFields).some(k => {
    return fields[k] !== undefined && fields[k] !== '';
  });

  const renderFieldToggle = (field: keyof BulkEditFields, label: string) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={enabledFields.has(field)}
        onChange={() => toggleField(field)}
        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
      />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );

  const footer = (
    <FormDrawerFooter
      formId={BULK_EDIT_FORM_ID}
      onCancel={onClose}
      isLoading={bulkMutation.isPending}
      disabled={!hasChanges}
      isEdit
      saveLabel={txt('employee.bulk.applyButton', { count: selectedEmployees.length })}
    />
  );

  return (
    <GenericDrawer
      title={txt('employee.bulk.title')}
      subtitle={`${selectedEmployees.length} ${txt('employee.bulk.subtitle')}`}
      icon={<Users size={ICON_SIZE.prominent} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass="sm:w-[36rem] sm:min-w-[36rem] sm:max-w-[36rem]"
    >
      <form id={BULK_EDIT_FORM_ID} onSubmit={handleSubmit} className="space-y-1">
        <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">{txt('employee.bulk.selectedLabel')}</p>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
            {selectedEmployees.map(emp => (
              <span key={emp.id} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 text-xs">
                <img src={emp.anh_dai_dien || getAvatarUrl(emp.ho_ten ?? '')} className="w-5 h-5 rounded-full object-cover" alt={emp.ho_ten} />
                <span className="font-medium text-foreground">{emp.ho_ten}</span>
                <span className="text-muted-foreground font-mono">#{emp.id}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 font-bold text-lg leading-none shrink-0">!</span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {txt('employee.bulk.warning')}
          </p>
        </div>

        <FormSection title={txt('employee.bulk.workSection')} icon={<Briefcase size={ICON_SIZE.compact} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              {renderFieldToggle('trang_thai', txt('employee.bulk.changeStatus'))}
              {enabledFields.has('trang_thai') && (
                <Combobox
                  label={txt('employee.form.workStatus')}
                  options={statusOptions}
                  value={fields.trang_thai ?? ''}
                  onChange={(val) => setFields((prev) => ({ ...prev, trang_thai: String(val) }))}
                  placeholder={txt('employee.form.workStatusPlaceholder')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trang_thai)}
                  searchable={false}
                />
              )}
            </div>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default BulkEditSheet;
