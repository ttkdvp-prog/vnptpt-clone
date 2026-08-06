import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@/lib/text/bootstrap-module-strings';
import DataField from '@/components/data-types/DataField';
import type { DataTypeId } from '@/lib/data-types';

/**
 * Hồi quy cho lỗi: `DataField` nhận prop `placeholder` nhưng chỉ chuyển tiếp cho 4/34 nhánh,
 * nên mọi ô chọn trong app đều rơi về chuỗi hard-code "Chọn một mục..." bất kể module đã
 * viết chữ riêng (vd. khach-hang-form truyền 'Chọn nhóm khách hàng' cho field `ref`).
 */

const OPTIONS = [
  { label: 'Nhóm A', value: 'a' },
  { label: 'Nhóm B', value: 'b' },
];

function renderField(dataType: DataTypeId, placeholder: string) {
  return render(
    <DataField
      dataType={dataType}
      label="Nhóm khách hàng"
      value={null}
      onChange={vi.fn()}
      options={OPTIONS}
      placeholder={placeholder}
    />,
  );
}

describe('DataField chuyển tiếp placeholder', () => {
  // Ô chọn: placeholder là text node trên trigger.
  it.each<[DataTypeId, string]>([
    ['ref', 'Chọn nhóm khách hàng'],
    ['enum', 'Chọn loại hợp đồng'],
    ['enum_list', 'Chọn chức vụ được xem'],
  ])('ô chọn kiểu «%s» hiển thị placeholder của module', (dataType, placeholder) => {
    const { unmount } = renderField(dataType, placeholder);
    expect(screen.getByText(placeholder)).toBeInTheDocument();
    expect(screen.queryByText(/Chọn một mục/)).not.toBeInTheDocument();
    unmount();
  });

  // Ô nhập: placeholder là thuộc tính HTML.
  it.each<[DataTypeId, string]>([
    ['long_text', 'Mô tả nhiệm vụ, trách nhiệm'],
    ['address', 'Số nhà, đường, phường/xã, tỉnh/thành'],
    ['text', 'VD: NV001'],
  ])('ô nhập kiểu «%s» hiển thị placeholder của module', (dataType, placeholder) => {
    const { unmount } = renderField(dataType, placeholder);
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    unmount();
  });

  it('ô chọn không có placeholder thì dùng mặc định trung tính, không phải "Chọn một mục..."', () => {
    render(
      <DataField dataType="ref" label="Nhóm" value={null} onChange={vi.fn()} options={OPTIONS} />,
    );
    expect(screen.getByText('— Chưa chọn —')).toBeInTheDocument();
  });
});

describe('DataField chuyển tiếp hint', () => {
  it('hint hiển thị dưới control và nối vào aria-describedby', () => {
    render(
      <DataField
        dataType="text"
        label="Mã phòng ban"
        value=""
        onChange={vi.fn()}
        placeholder="VD: IT_DEV"
        hint="Chỉ chữ in hoa, số và dấu gạch dưới (_)."
      />,
    );
    const hint = screen.getByText('Chỉ chữ in hoa, số và dấu gạch dưới (_).');
    expect(hint).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
  });

  it('có lỗi thì vẫn giữ hint — hint thường chính là cách sửa lỗi', () => {
    render(
      <DataField
        dataType="text"
        label="Mã phòng ban"
        value="it dev"
        onChange={vi.fn()}
        hint="Chỉ chữ in hoa, số và dấu gạch dưới (_)."
        error="Mã không đúng định dạng"
      />,
    );
    expect(screen.getByText('Mã không đúng định dạng')).toBeInTheDocument();
    expect(screen.getByText('Chỉ chữ in hoa, số và dấu gạch dưới (_).')).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    expect(ids).toHaveLength(2); // lỗi trước, hint sau
  });
});
