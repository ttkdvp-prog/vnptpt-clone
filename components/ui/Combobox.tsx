import React, { useState, useRef, useEffect, useMemo, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Plus, Search, X } from 'lucide-react';
import * as m from 'framer-motion/m';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { txt } from '@/lib/text';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';

export interface Option {
  label: string;
  value: string | number;
  subLabel?: string;
  /** Header / group label — not selectable */
  disabled?: boolean;
}

interface ComboboxProps {
  options: Option[];
  value?: string | number | null;
  onChange: (value: string | number | '') => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Khác `placeholder` ở chỗ không mất khi chọn. */
  hint?: React.ReactNode;
  /** Icon hiển thị bên trái ô trigger */
  icon?: React.ReactNode;
  /** Khi true (mặc định) hiển thị ô tìm kiếm trong dropdown */
  searchable?: boolean;
  /** Custom render cho từng option (vd. preview font) */
  renderOption?: (option: Option) => React.ReactNode;
  /** Custom render giá trị đã chọn trên trigger (vd. tên font hiển thị đúng kiểu chữ) */
  renderValue?: (option: Option) => React.ReactNode;
  /** Class cho ô trigger (mở dropdown) */
  triggerClassName?: string;
  /** Render dropdown qua portal vào body để tránh bị cắt bởi overflow (bảng, drawer) */
  dropdownInPortal?: boolean;
  /** Khi false, ẩn nút xóa lựa chọn (vd. trường bắt buộc luôn có giá trị) */
  clearable?: boolean;
  /** Hàng cố định đầu dropdown — mở form tạo mới (không chọn value) */
  onAddNew?: () => void;
  /** Nhãn hàng thêm mới (mặc định: Thêm mới) */
  addNewLabel?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  searchPlaceholder,
  error,
  required,
  className,
  disabled = false,
  icon,
  hint,
  searchable = true,
  renderOption,
  renderValue,
  triggerClassName,
  dropdownInPortal = false,
  clearable = true,
  onAddNew,
  addNewLabel = 'Thêm mới',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const resolvedPlaceholder = placeholder ?? txt('field.selectEmpty');
  const resolvedSearchPlaceholder = searchPlaceholder ?? txt('field.searchInList');
  const { hintId, errorId, describedBy } = useFieldMessageIds(listboxId, { hint, error });

  const updateDropdownRect = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const listHeight = 320;
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : listHeight;
    const openAbove = spaceBelow < Math.min(listHeight, 240);
    setDropdownRect({
      top: openAbove ? rect.top - listHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (dropdownInPortal) {
      updateDropdownRect();
    }
  }, [isOpen, dropdownInPortal, updateDropdownRect]);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Close when clicking outside (portal: also ignore clicks inside the portaled dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownInPortal && (target as Element).closest?.('[data-combobox-dropdown]')) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownInPortal]);

  /** Portal dropdown: bám theo trigger khi cuộn/resize — không đóng để dễ thao tác */
  useEffect(() => {
    if (!isOpen || !dropdownInPortal) return;
    const reposition = () => updateDropdownRect();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen, dropdownInPortal, updateDropdownRect]);

  // Filter options based on search term (or show all when not searchable)
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm, searchable]);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string | number) => {
    const option = options.find((opt) => opt.value === optionValue);
    if (option?.disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNew = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSearchTerm('');
    onAddNew?.();
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const renderAddNewRow = () => {
    if (!onAddNew) return null;
    return (
      <div
        role="option"
        aria-selected={false}
        tabIndex={0}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors border-b border-border mb-1"
        onClick={handleAddNew}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddNew(e);
          }
        }}
      >
        <Plus size={16} className="shrink-0" />
        <span>{addNewLabel}</span>
      </div>
    );
  };

  return (
    <div className={cn("w-full relative", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-muted-foreground">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        role="combobox"
        disabled={disabled}
        className={cn(
          "relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground ring-offset-background flex items-center justify-between cursor-pointer transition-all duration-200 text-left",
          isOpen ? "border-primary ring-2 ring-primary/20" : "hover:border-border/80 focus-within:border-border/80",
          error ? "border-destructive focus-visible:ring-destructive" : "",
          disabled ? "opacity-50 cursor-not-allowed bg-muted" : "",
          triggerClassName
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("truncate flex-1 min-w-0", !selectedOption && "text-placeholder italic")}>
          {selectedOption ? (renderValue ? renderValue(selectedOption) : selectedOption.label) : resolvedPlaceholder}
        </span>
        
        <div className="flex items-center gap-1 shrink-0">
            {clearable && selectedOption && !disabled && (
                <div 
                    onClick={(e) => { e.stopPropagation(); clearSelection(e); }}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                    role="button"
                    tabIndex={-1}
                    aria-hidden
                >
                    <X size={14} />
                </div>
            )}
            <ChevronDown 
                size={16} 
                className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} 
            />
        </div>
      </button>

      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />

      {dropdownInPortal && isOpen && dropdownRect && typeof document !== 'undefined' ? (
        createPortal(
          <AnimatePresence>
            <m.div
              id={listboxId}
              role="listbox"
              data-combobox-dropdown
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[9999] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: Math.max(dropdownRect.width, 280),
                maxHeight: 320,
              }}
            >
              {searchable && (
                <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-sm text-foreground bg-muted border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder={resolvedSearchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {renderAddNewRow()}
                {filteredOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                    <Search size={24} className="mb-2 opacity-20" />
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={value === option.value}
                      aria-disabled={option.disabled || undefined}
                      tabIndex={option.disabled ? -1 : 0}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        option.disabled
                          ? "cursor-default bg-muted/40 text-xs font-semibold uppercase tracking-wide text-primary/80"
                          : "cursor-pointer",
                        !option.disabled && value === option.value
                          ? "bg-primary/5 text-primary font-medium"
                          : !option.disabled
                            ? "text-foreground hover:bg-muted/50"
                            : "",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                      onKeyDown={(e) => {
                        if (option.disabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(option.value);
                        }
                      }}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        {renderOption ? renderOption(option) : (
                          <>
                            <span>{option.label}</span>
                            {option.subLabel && <span className="text-xs text-muted-foreground font-normal">{option.subLabel}</span>}
                          </>
                        )}
                      </div>
                      {value === option.value && <Check size={16} className="text-primary shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </m.div>
          </AnimatePresence>,
          document.body
        )
      ) : (
        <AnimatePresence>
          {isOpen && !disabled && !dropdownInPortal && (
            <m.div
              id={listboxId}
              role="listbox"
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-sm text-foreground bg-muted border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder={resolvedSearchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {renderAddNewRow()}
                {filteredOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                    <Search size={24} className="mb-2 opacity-20" />
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={value === option.value}
                      aria-disabled={option.disabled || undefined}
                      tabIndex={option.disabled ? -1 : 0}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        option.disabled
                          ? "cursor-default bg-muted/40 text-xs font-semibold uppercase tracking-wide text-primary/80"
                          : "cursor-pointer",
                        !option.disabled && value === option.value
                          ? "bg-primary/5 text-primary font-medium"
                          : !option.disabled
                            ? "text-foreground hover:bg-muted/50"
                            : "",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                      onKeyDown={(e) => {
                        if (option.disabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(option.value);
                        }
                      }}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        {renderOption ? renderOption(option) : (
                          <>
                            <span>{option.label}</span>
                            {option.subLabel && <span className="text-xs text-muted-foreground font-normal">{option.subLabel}</span>}
                          </>
                        )}
                      </div>
                      {value === option.value && <Check size={16} className="text-primary shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Combobox;
