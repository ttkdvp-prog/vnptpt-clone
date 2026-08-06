# Audit hierarchy — Chức vụ (Phase D2.2)

**Ngày:** 2026-07-16  
**Phạm vi:** Prisma · repository · API · tree builder · business rules · UI  
**Không sửa runtime** trong phase này.

---

## Kết luận

Hierarchy thực sự là **A) Department → Position**.

Không phải **B) Position → Child Position**.

UI list (banner phòng + dòng chức vụ) **khớp** model dữ liệu A. Không có mismatch A/B.

Mismatch đã ghi nhận (UX, không phải schema): header cột `ten_chuc_vu` từng gắn filter `id_phong_goc` — xử lý ở **D2.3**.

---

## Current model (DB / Prisma)

| Model | Parent FK | Quan hệ cây |
|-------|-----------|-------------|
| `var_phong_ban` | `id_cha` → self | Cây phòng ban |
| `var_chuc_vu` | `id_phong_ban` → `var_phong_ban` | **Phẳng** — không `cha_id` / `chuc_vu_cha` |

Nguồn: [`prisma/schema.prisma`](../../prisma/schema.prisma).

---

## Business model

- Chức vụ thuộc một phòng ban (`phong_ban_id`).
- Form Zod / create-update API chỉ gán phòng — không parent chức vụ.
- Docs module: [`chuc-vu.md`](./chuc-vu.md) field map `id_phong_ban` ↔ `phong_ban_id`.

---

## Repository / API

[`server/repositories/chuc-vu.ts`](../../server/repositories/chuc-vu.ts):

- Include `phong_ban` để enrich `ten_phong_ban`.
- Create/update: `id_phong_ban` bắt buộc; không field parent position.
- Page: search / activeOnly / order — không hierarchy position.

---

## UI model

[`build-position-tree-rows.ts`](../../features/he-thong/chuc-vu/utils/build-position-tree-rows.ts):

1. Flatten cây **phòng ban** theo `cha_id`.
2. Group chức vụ theo `phong_ban_id`.
3. Emit banner `kind:'department'` + leaves `kind:'position'` (`level = cap_do + 1`).

Shell: `createFlatListFeatureModule` + `HierarchyTable` — data phẳng, UI cây theo phòng.

---

## So khớp

| Layer | Model | Khớp A? |
|-------|--------|---------|
| Prisma / API / form | Dept owns positions | Có |
| List tree | Dept tree + positions dưới dept | Có |
| Position self-tree | Không tồn tại | N/A |

**Mismatch A vs B:** Không.

---

## Đề xuất

1. Giữ model A — không thêm FK parent-position trừ khi product đổi nghiệp vụ rõ ràng.
2. D2.3: sửa header cột tên chức vụ (không filter phòng gốc trên cột tên).
3. Tài liệu / onboarding: gọi rõ “hierarchy UI = phòng → chức vụ”, không “cây chức vụ”.
