/**
 * Tài liệu "Hồ sơ nhân sự" — component THUẦN (props-only, không hook, không store).
 *
 * Dùng ở 2 môi trường:
 * - client: preview trên `/ho-so-nhan-vien/:id` và bản in trình duyệt
 * - server: `renderToStaticMarkup()` để dựng HTML cho Puppeteer render PDF
 *
 * QUY TẮC: chỉ dùng class `epdoc-*` (định nghĩa ở `lib/print-document/print-styles.ts`).
 * KHÔNG dùng class màu / alpha của Tailwind ở đây — palette Tailwind v4 là `oklch()`,
 * modifier alpha sinh `color-mix(in oklab, …)`, và token semantic đảo màu ở theme tối.
 */
import { pairProfileRows, type ProfileDocModel, type ProfileDocRow } from '../core/profile-document-model';

interface Props {
  model: ProfileDocModel;
  /** Nhãn ô dán ảnh khi nhân viên chưa có ảnh (vd. "Ảnh 3×4") */
  photoPlaceholder: string;
}

const FieldCells: React.FC<{ row: ProfileDocRow; span?: number }> = ({ row, span }) => (
  <>
    <td className="epdoc-label">{row.label}</td>
    <td className="epdoc-value" colSpan={span}>
      {row.value}
    </td>
  </>
);

const EmployeeProfileDocument: React.FC<Props> = ({ model, photoPlaceholder }) => {
  const { company, photo, heading, sections, signature } = model;
  const contactLine = [company.email, company.phone].filter(Boolean).join(' · ');

  return (
    <div className="epdoc-root epdoc-sheet">
      <table className="epdoc-letterhead">
        <tbody>
          <tr>
            {company.logo && (
              <td className="epdoc-letterhead-logo">
                <img src={company.logo} alt="" className="epdoc-header-logo" />
              </td>
            )}
            <td className="epdoc-letterhead-info">
              <div className="epdoc-company-name">{company.companyName}</div>
              {company.address && <p className="epdoc-company-meta">{company.address}</p>}
              {contactLine && <p className="epdoc-company-meta">{contactLine}</p>}
            </td>
            <td className="epdoc-letterhead-photo">
              {photo ? (
                <img src={photo} alt="" className="epdoc-photo" />
              ) : (
                <div className="epdoc-photo-placeholder">{photoPlaceholder}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <h1 className="epdoc-title">{heading.title}</h1>

      <table className="epdoc-heading">
        <tbody>
          <tr>
            <td className="epdoc-heading-name">{heading.name}</td>
            <td className="epdoc-heading-code">
              {heading.codeLabel} {heading.code}
            </td>
          </tr>
          {heading.role && (
            <tr>
              <td className="epdoc-heading-role" colSpan={2}>
                {heading.role}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {sections.map((section) => (
        <section key={section.key} className="epdoc-section">
          <div className="epdoc-section-bar">{section.title}</div>
          <table className="epdoc-fields">
            <tbody>
              {pairProfileRows(section.rows).map((pair, index) => (
                <tr key={`${section.key}-${index}`}>
                  {pair.length === 2 ? (
                    <>
                      <FieldCells row={pair[0]} />
                      <FieldCells row={pair[1]} />
                    </>
                  ) : (
                    <FieldCells row={pair[0]} span={3} />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <table className="epdoc-sign-footer">
        <tbody>
          <tr>
            {signature.map((role) => (
              <td key={role.key} className="epdoc-sign-box">
                <p className="epdoc-sign-box-title">{role.title}</p>
                <p className="epdoc-sign-box-hint">{role.hint}</p>
                <div className="epdoc-sign-space" aria-hidden="true" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className="epdoc-printed-at">
        {model.printedAtLabel} {model.printedAt}
      </p>
    </div>
  );
};

export default EmployeeProfileDocument;
