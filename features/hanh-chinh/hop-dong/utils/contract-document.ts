/**
 * HTML builder for labor contract — Word export parity with React preview.
 */
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { escapeHtml } from '@/lib/print-document/escape-html';
import { useUIStore } from '@/store/useStore';
import type { HopDong } from '../core/types';
import {
  buildContractLegalViewModel,
  type ContractLegalViewModel,
} from './build-contract-view-model';

function fieldRow(label: string, valueHtml: string, labelWidth = 220): string {
  return `<tr><td width="${labelWidth}">${escapeHtml(label)}</td><td>: ${valueHtml}</td></tr>`;
}

export function buildContractLegalBodyHTML(vm: ContractLegalViewModel): string {
  const e = (s: string) => escapeHtml(s);

  return `
<div class="contract-legal-root">
  <div class="quochieu">
    <div class="dong1">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
    <div class="dong2">Độc lập – Tự do – Hạnh phúc</div>
  </div>

  <div class="so-hd">Số: <strong>${e(vm.ma_hop_dong)}</strong></div>

  <div class="ten-hd">
    Hợp đồng lao động
    <span class="loai">(${e(vm.loai_hop_dong_ten)})</span>
  </div>

  <p class="can-cu">
    Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019;<br/>
    Căn cứ Nghị định số 145/2020/NĐ-CP ngày 14/12/2020 của Chính phủ quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật Lao động;<br/>
    Căn cứ nhu cầu và khả năng thực tế của hai bên,
  </p>

  <p>Hôm nay, ngày <strong>${e(vm.ngay_ky_ngay)}</strong> tháng <strong>${e(vm.ngay_ky_thang)}</strong> năm <strong>${e(vm.ngay_ky_nam)}</strong>, tại <strong>${e(vm.dia_diem_ky)}</strong>, chúng tôi gồm:</p>

  <div class="ben">
    <div class="ben-tieu-de">Bên A (Người sử dụng lao động):</div>
    <table class="thong-tin">
      ${fieldRow('Tên công ty', `<strong>${e(vm.ten_cong_ty)}</strong>`)}
      ${fieldRow('Địa chỉ trụ sở', e(vm.dia_chi_cong_ty))}
      ${fieldRow('Mã số thuế', e(vm.mst_cong_ty))}
      ${fieldRow('Người đại diện', e(vm.nguoi_dai_dien_cong_ty))}
      ${fieldRow('Chức vụ', e(vm.chuc_vu_nguoi_dai_dien))}
      ${fieldRow('Điện thoại', e(vm.dien_thoai_cong_ty))}
    </table>
  </div>

  <div class="ben">
    <div class="ben-tieu-de">Bên B (Người lao động):</div>
    <table class="thong-tin">
      ${fieldRow('Họ và tên', `<strong>${e(vm.ho_ten_nhan_vien)}</strong>`)}
      ${fieldRow('Ngày sinh', e(vm.ngay_sinh_nhan_vien))}
      ${fieldRow('Giới tính', e(vm.gioi_tinh_nhan_vien))}
      ${fieldRow(
        'Số CCCD/CMND',
        `${e(vm.cccd_nhan_vien)} &nbsp; Ngày cấp: ${e(vm.ngay_cap_cccd)} &nbsp; Nơi cấp: ${e(vm.noi_cap_cccd)}`,
      )}
      ${fieldRow('Địa chỉ thường trú', e(vm.dia_chi_thuong_tru))}
      ${fieldRow('Chỗ ở hiện tại', e(vm.dia_chi_hien_tai))}
      ${fieldRow('Điện thoại', e(vm.so_dien_thoai_nhan_vien))}
      ${fieldRow('Số sổ BHXH (nếu có)', e(vm.so_so_bhxh))}
    </table>
  </div>

  <p>Hai bên thỏa thuận ký kết hợp đồng lao động và cam kết thực hiện đúng những điều khoản sau đây:</p>

  <div class="dieu">
    <div class="dieu-tieu-de">Điều 1: Thời hạn và công việc hợp đồng</div>
    <div class="khoan">1. Loại hợp đồng lao động: <strong>${e(vm.loai_hop_dong_ten)}</strong></div>
    <div class="khoan">2. Thời hạn hợp đồng: từ ngày <strong>${e(vm.ngay_hieu_luc)}</strong> đến ngày <strong>${e(vm.ngay_ket_thuc_hoac_khong_xac_dinh)}</strong></div>
    <div class="khoan">3. Chức danh/vị trí công việc: <strong>${e(vm.ten_chuc_vu)}</strong></div>
    <div class="khoan">4. Bộ phận công tác: <strong>${e(vm.ten_phong_ban)}</strong></div>
    <div class="khoan">5. Địa điểm làm việc: <strong>${e(vm.noi_lam_viec)}</strong></div>
  </div>

  <div class="dieu">
    <div class="dieu-tieu-de">Điều 2: Chế độ làm việc</div>
    <div class="khoan">1. Thời giờ làm việc: <strong>${e(vm.thoi_gian_lam_viec)}</strong></div>
    <div class="khoan">2. Được cấp phát những dụng cụ, trang thiết bị cần thiết theo yêu cầu của công việc.</div>
    <div class="khoan">3. Điều kiện an toàn, vệ sinh lao động tại nơi làm việc theo quy định hiện hành của Nhà nước.</div>
  </div>

  <div class="dieu">
    <div class="dieu-tieu-de">Điều 3: Nghĩa vụ và quyền lợi của người lao động</div>
    <div class="khoan"><em>Quyền lợi:</em></div>
    <ul class="khoan-list">
      <li>Mức lương: <strong>${e(vm.muc_luong)}</strong></li>
      <li>Hình thức trả lương: <strong>${e(vm.hinh_thuc_tra_luong_ten)}</strong></li>
      <li>Chế độ khác (phụ cấp, thưởng, bảo hiểm...): <strong>${e(vm.che_do_khac)}</strong></li>
      <li>Được đảm bảo các chế độ bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp theo quy định pháp luật hiện hành (áp dụng theo loại hợp đồng).</li>
      <li>Được nghỉ hàng năm, nghỉ lễ, tết, nghỉ việc riêng theo quy định của Bộ luật Lao động và nội quy công ty.</li>
    </ul>
    <div class="khoan"><em>Nghĩa vụ:</em></div>
    <ul class="khoan-list">
      <li>Hoàn thành công việc đã cam kết trong hợp đồng lao động.</li>
      <li>Chấp hành nội quy lao động, kỷ luật lao động, an toàn vệ sinh lao động và sự điều hành hợp pháp của người sử dụng lao động.</li>
      <li>Bồi thường vi phạm và vật chất theo quy định của công ty và pháp luật hiện hành (nếu có).</li>
    </ul>
  </div>

  <div class="dieu">
    <div class="dieu-tieu-de">Điều 4: Nghĩa vụ và quyền hạn của người sử dụng lao động</div>
    <div class="khoan"><em>Nghĩa vụ:</em></div>
    <ul class="khoan-list">
      <li>Bảo đảm việc làm và thực hiện đầy đủ các điều khoản đã ký trong hợp đồng lao động.</li>
      <li>Thanh toán đầy đủ, đúng thời hạn các chế độ và quyền lợi cho người lao động theo hợp đồng lao động, thỏa ước lao động tập thể (nếu có).</li>
    </ul>
    <div class="khoan"><em>Quyền hạn:</em></div>
    <ul class="khoan-list">
      <li>Điều hành người lao động hoàn thành công việc theo hợp đồng (bố trí, điều chuyển, tạm ngừng việc...).</li>
      <li>Tạm hoãn, chấm dứt hợp đồng lao động, kỷ luật người lao động theo quy định của pháp luật, thỏa ước lao động tập thể và nội quy lao động của công ty.</li>
    </ul>
  </div>

  <div class="dieu">
    <div class="dieu-tieu-de">Điều 5: Điều khoản thi hành</div>
    <div class="khoan">1. Những vấn đề về lao động không ghi trong hợp đồng này thì áp dụng theo quy định của thỏa ước tập thể, nội quy lao động và pháp luật lao động hiện hành.</div>
    <div class="khoan">2. Lưu ý khác: ${e(vm.luu_y_khac)}</div>
    <div class="khoan">3. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản, có hiệu lực kể từ ngày <strong>${e(vm.ngay_hieu_luc)}</strong>.</div>
  </div>

  <div class="chu-ky-wrap">
    <div class="cot">
      <div class="chuc-danh">Người lao động</div>
      <div>(Ký, ghi rõ họ tên)</div>
    </div>
    <div class="cot">
      <div class="chuc-danh">Người sử dụng lao động</div>
      <div>(Ký tên, đóng dấu)</div>
    </div>
  </div>

  <div class="ghi-chu-cuoi">
    Mã hợp đồng nội bộ: ${e(vm.ma_hop_dong)} · Trạng thái: ${e(vm.trang_thai_ten)} · Ngày tạo: ${e(vm.tg_tao)}
  </div>
</div>`;
}

export function getContractLegalCSS(): string {
  return `
@page { size: A4; margin: 2cm; }
.contract-legal-root, .contract-preview-content {
  font-family: "Times New Roman", Times, serif;
  font-size: 13.5pt;
  line-height: 1.5;
  color: #111;
  background: #fff;
}
.quochieu { text-align: center; margin-bottom: 4px; }
.quochieu .dong1 { font-weight: bold; text-transform: uppercase; font-size: 13.5pt; }
.quochieu .dong2 { font-weight: bold; margin-top: 2px; }
.quochieu .dong2::after {
  content: ""; display: block; width: 140px; height: 0; border-top: 1px solid #111;
  margin: 4px auto 0;
}
.so-hd { text-align: right; font-style: italic; margin: 16px 0 6px; font-size: 12.5pt; }
.ten-hd {
  text-align: center; font-weight: bold; text-transform: uppercase;
  font-size: 17pt; margin: 18px 0 4px;
}
.ten-hd .loai {
  display: block; font-size: 13.5pt; font-weight: normal; font-style: italic; margin-top: 4px;
}
.can-cu { font-style: italic; margin: 4px 0; }
.ben { margin-top: 18px; }
.ben-tieu-de { font-weight: bold; text-transform: uppercase; }
table.thong-tin { width: 100%; border-collapse: collapse; margin: 6px 0; }
table.thong-tin td { padding: 2px 4px; vertical-align: top; }
.dieu { margin-top: 20px; }
.dieu-tieu-de { font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
.khoan { margin: 6px 0; }
.khoan-list { margin: 0; padding-left: 20px; }
.khoan-list li { margin-bottom: 4px; }
.chu-ky-wrap {
  display: flex; justify-content: space-between; margin-top: 40px; text-align: center;
}
.chu-ky-wrap .cot { width: 45%; }
.chu-ky-wrap .chuc-danh { font-weight: bold; text-transform: uppercase; margin-bottom: 70px; }
.ghi-chu-cuoi {
  font-size: 11.5pt; font-style: italic; margin-top: 30px;
  border-top: 1px dashed #999; padding-top: 8px;
}
`;
}

export function buildContractFullHTML(
  contract: HopDong,
  employee: Employee | null | undefined,
): string {
  const company = useUIStore.getState().companyInfo;
  const vm = buildContractLegalViewModel(contract, employee, company);
  const body = buildContractLegalBodyHTML(vm);
  const styles = getContractLegalCSS();
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Hợp đồng lao động - ${escapeHtml(vm.ma_hop_dong)}</title><style>${styles}</style></head><body style="max-width:21cm;margin:0 auto;padding:2cm;background:#fff">${body}</body></html>`;
}
