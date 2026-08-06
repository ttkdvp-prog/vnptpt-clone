import type { ReactNode } from 'react';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { cn } from '@/lib/utils';
import { PRINT_PREVIEW_PADDING_CLASS } from '@/lib/print-document/print-styles';
import { useUIStore } from '@/store/useStore';
import type { HopDong } from '../core/types';
import { buildContractLegalViewModel } from '../utils/build-contract-view-model';

interface Props {
  contract: HopDong;
  employee?: Employee | null;
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <tr>
      <td className="w-[220px] py-0.5 pr-1 align-top">{label}</td>
      <td className="py-0.5 align-top">: {children}</td>
    </tr>
  );
}

const ContractPrintContent: React.FC<Props> = ({ contract, employee }) => {
  const companyInfo = useUIStore((s) => s.companyInfo);
  const vm = buildContractLegalViewModel(contract, employee, companyInfo);

  return (
    <div
      className={cn(
        'contract-preview-content contract-legal-root bg-white text-[#111]',
        'font-["Times_New_Roman",Times,serif] text-[13.5pt] leading-[1.5] min-h-full',
        PRINT_PREVIEW_PADDING_CLASS,
      )}
    >
      <div className="quochieu text-center mb-1">
        <div className="dong1 font-bold uppercase text-[13.5pt]">
          Cộng hòa xã hội chủ nghĩa Việt Nam
        </div>
        <div className="dong2 font-bold mt-0.5 relative inline-block">
          Độc lập – Tự do – Hạnh phúc
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1 block w-[140px] border-t border-[#111]"
            aria-hidden
          />
        </div>
      </div>

      <div className="so-hd text-right italic mt-4 mb-1.5 text-[12.5pt]">
        Số: <strong>{vm.ma_hop_dong}</strong>
      </div>

      <div className="ten-hd text-center font-bold uppercase text-[17pt] mt-4 mb-1">
        Hợp đồng lao động
        <span className="loai block text-[13.5pt] font-normal italic mt-1">
          ({vm.loai_hop_dong_ten})
        </span>
      </div>

      <p className="can-cu italic my-1">
        Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019;
        <br />
        Căn cứ Nghị định số 145/2020/NĐ-CP ngày 14/12/2020 của Chính phủ quy định chi tiết và
        hướng dẫn thi hành một số điều của Bộ luật Lao động;
        <br />
        Căn cứ nhu cầu và khả năng thực tế của hai bên,
      </p>

      <p className="my-2">
        Hôm nay, ngày <strong>{vm.ngay_ky_ngay}</strong> tháng <strong>{vm.ngay_ky_thang}</strong>{' '}
        năm <strong>{vm.ngay_ky_nam}</strong>, tại <strong>{vm.dia_diem_ky}</strong>, chúng tôi
        gồm:
      </p>

      <div className="ben mt-4">
        <div className="ben-tieu-de font-bold uppercase">Bên A (Người sử dụng lao động):</div>
        <table className="thong-tin w-full border-collapse my-1.5">
          <tbody>
            <InfoRow label="Tên công ty">
              <strong>{vm.ten_cong_ty}</strong>
            </InfoRow>
            <InfoRow label="Địa chỉ trụ sở">{vm.dia_chi_cong_ty}</InfoRow>
            <InfoRow label="Mã số thuế">{vm.mst_cong_ty}</InfoRow>
            <InfoRow label="Người đại diện">{vm.nguoi_dai_dien_cong_ty}</InfoRow>
            <InfoRow label="Chức vụ">{vm.chuc_vu_nguoi_dai_dien}</InfoRow>
            <InfoRow label="Điện thoại">{vm.dien_thoai_cong_ty}</InfoRow>
          </tbody>
        </table>
      </div>

      <div className="ben mt-4">
        <div className="ben-tieu-de font-bold uppercase">Bên B (Người lao động):</div>
        <table className="thong-tin w-full border-collapse my-1.5">
          <tbody>
            <InfoRow label="Họ và tên">
              <strong>{vm.ho_ten_nhan_vien}</strong>
            </InfoRow>
            <InfoRow label="Ngày sinh">{vm.ngay_sinh_nhan_vien}</InfoRow>
            <InfoRow label="Giới tính">{vm.gioi_tinh_nhan_vien}</InfoRow>
            <InfoRow label="Số CCCD/CMND">
              {vm.cccd_nhan_vien}
              {' · '}Ngày cấp: {vm.ngay_cap_cccd}
              {' · '}Nơi cấp: {vm.noi_cap_cccd}
            </InfoRow>
            <InfoRow label="Địa chỉ thường trú">{vm.dia_chi_thuong_tru}</InfoRow>
            <InfoRow label="Chỗ ở hiện tại">{vm.dia_chi_hien_tai}</InfoRow>
            <InfoRow label="Điện thoại">{vm.so_dien_thoai_nhan_vien}</InfoRow>
            <InfoRow label="Số sổ BHXH (nếu có)">{vm.so_so_bhxh}</InfoRow>
          </tbody>
        </table>
      </div>

      <p className="my-3">
        Hai bên thỏa thuận ký kết hợp đồng lao động và cam kết thực hiện đúng những điều khoản sau
        đây:
      </p>

      <div className="dieu mt-5">
        <div className="dieu-tieu-de font-bold uppercase mb-1.5">
          Điều 1: Thời hạn và công việc hợp đồng
        </div>
        <div className="khoan my-1.5">
          1. Loại hợp đồng lao động: <strong>{vm.loai_hop_dong_ten}</strong>
        </div>
        <div className="khoan my-1.5">
          2. Thời hạn hợp đồng: từ ngày <strong>{vm.ngay_hieu_luc}</strong> đến ngày{' '}
          <strong>{vm.ngay_ket_thuc_hoac_khong_xac_dinh}</strong>
        </div>
        <div className="khoan my-1.5">
          3. Chức danh/vị trí công việc: <strong>{vm.ten_chuc_vu}</strong>
        </div>
        <div className="khoan my-1.5">
          4. Bộ phận công tác: <strong>{vm.ten_phong_ban}</strong>
        </div>
        <div className="khoan my-1.5">
          5. Địa điểm làm việc: <strong>{vm.noi_lam_viec}</strong>
        </div>
      </div>

      <div className="dieu mt-5">
        <div className="dieu-tieu-de font-bold uppercase mb-1.5">Điều 2: Chế độ làm việc</div>
        <div className="khoan my-1.5">
          1. Thời giờ làm việc: <strong>{vm.thoi_gian_lam_viec}</strong>
        </div>
        <div className="khoan my-1.5">
          2. Được cấp phát những dụng cụ, trang thiết bị cần thiết theo yêu cầu của công việc.
        </div>
        <div className="khoan my-1.5">
          3. Điều kiện an toàn, vệ sinh lao động tại nơi làm việc theo quy định hiện hành của Nhà
          nước.
        </div>
      </div>

      <div className="dieu mt-5">
        <div className="dieu-tieu-de font-bold uppercase mb-1.5">
          Điều 3: Nghĩa vụ và quyền lợi của người lao động
        </div>
        <div className="khoan my-1.5">
          <em>Quyền lợi:</em>
        </div>
        <ul className="khoan-list m-0 pl-5">
          <li className="mb-1">
            Mức lương: <strong>{vm.muc_luong}</strong>
          </li>
          <li className="mb-1">
            Hình thức trả lương: <strong>{vm.hinh_thuc_tra_luong_ten}</strong>
          </li>
          <li className="mb-1">
            Chế độ khác (phụ cấp, thưởng, bảo hiểm...): <strong>{vm.che_do_khac}</strong>
          </li>
          <li className="mb-1">
            Được đảm bảo các chế độ bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp theo quy
            định pháp luật hiện hành (áp dụng theo loại hợp đồng).
          </li>
          <li className="mb-1">
            Được nghỉ hàng năm, nghỉ lễ, tết, nghỉ việc riêng theo quy định của Bộ luật Lao động và
            nội quy công ty.
          </li>
        </ul>
        <div className="khoan my-1.5">
          <em>Nghĩa vụ:</em>
        </div>
        <ul className="khoan-list m-0 pl-5">
          <li className="mb-1">Hoàn thành công việc đã cam kết trong hợp đồng lao động.</li>
          <li className="mb-1">
            Chấp hành nội quy lao động, kỷ luật lao động, an toàn vệ sinh lao động và sự điều hành
            hợp pháp của người sử dụng lao động.
          </li>
          <li className="mb-1">
            Bồi thường vi phạm và vật chất theo quy định của công ty và pháp luật hiện hành (nếu
            có).
          </li>
        </ul>
      </div>

      <div className="dieu mt-5">
        <div className="dieu-tieu-de font-bold uppercase mb-1.5">
          Điều 4: Nghĩa vụ và quyền hạn của người sử dụng lao động
        </div>
        <div className="khoan my-1.5">
          <em>Nghĩa vụ:</em>
        </div>
        <ul className="khoan-list m-0 pl-5">
          <li className="mb-1">
            Bảo đảm việc làm và thực hiện đầy đủ các điều khoản đã ký trong hợp đồng lao động.
          </li>
          <li className="mb-1">
            Thanh toán đầy đủ, đúng thời hạn các chế độ và quyền lợi cho người lao động theo hợp
            đồng lao động, thỏa ước lao động tập thể (nếu có).
          </li>
        </ul>
        <div className="khoan my-1.5">
          <em>Quyền hạn:</em>
        </div>
        <ul className="khoan-list m-0 pl-5">
          <li className="mb-1">
            Điều hành người lao động hoàn thành công việc theo hợp đồng (bố trí, điều chuyển, tạm
            ngừng việc...).
          </li>
          <li className="mb-1">
            Tạm hoãn, chấm dứt hợp đồng lao động, kỷ luật người lao động theo quy định của pháp
            luật, thỏa ước lao động tập thể và nội quy lao động của công ty.
          </li>
        </ul>
      </div>

      <div className="dieu mt-5">
        <div className="dieu-tieu-de font-bold uppercase mb-1.5">Điều 5: Điều khoản thi hành</div>
        <div className="khoan my-1.5">
          1. Những vấn đề về lao động không ghi trong hợp đồng này thì áp dụng theo quy định của
          thỏa ước tập thể, nội quy lao động và pháp luật lao động hiện hành.
        </div>
        <div className="khoan my-1.5">2. Lưu ý khác: {vm.luu_y_khac}</div>
        <div className="khoan my-1.5">
          3. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01
          (một) bản, có hiệu lực kể từ ngày <strong>{vm.ngay_hieu_luc}</strong>.
        </div>
      </div>

      <div className="chu-ky-wrap flex justify-between mt-10 text-center break-inside-avoid">
        <div className="cot w-[45%]">
          <div className="chuc-danh font-bold uppercase mb-[70px]">Người lao động</div>
          <div>(Ký, ghi rõ họ tên)</div>
        </div>
        <div className="cot w-[45%]">
          <div className="chuc-danh font-bold uppercase mb-[70px]">Người sử dụng lao động</div>
          <div>(Ký tên, đóng dấu)</div>
        </div>
      </div>

      <div className="ghi-chu-cuoi text-[11.5pt] italic mt-8 border-t border-dashed border-[#999] pt-2">
        Mã hợp đồng nội bộ: {vm.ma_hop_dong} · Trạng thái: {vm.trang_thai_ten} · Ngày tạo:{' '}
        {vm.tg_tao}
      </div>
    </div>
  );
};

export default ContractPrintContent;
