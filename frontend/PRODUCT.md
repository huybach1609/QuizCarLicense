# PRODUCT.md — Impeccable Design Blueprint & Design Tokens

## 1. Product Purpose & Identity
- **Product Name:** QuizCarLicense (Hệ thống Ôn thi Sát hạch Giấy phép Lái xe)
- **Target Audience:** Học viên thi bằng lái xe các hạng A1, A2, B1, B2, C, D, E tại Việt Nam; người nước ngoài cần luyện lý thuyết bằng lái bằng Tiếng Anh.
- **Tone of Voice:** Trang trọng, rõ ràng, tập trung cao độ, chuẩn xác như kỳ thi sát hạch chính quy của Bộ Giao thông Vận tải.
- **UI Architecture:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + **shadcn/ui** (Preset: `base-lyra` / `mist`).

---

## 2. Aesthetic Register: Official Assessment (Tối giản Trang trọng)
Thiết kế tập trung vào tính năng thực dụng (**Product Surface**) cho phòng thi sát hạch và sự biên tập tinh gọn (**Brand Surface**) cho trang chủ và bộ 600 câu hỏi:
- **No AI Slop:**
  - Tuyệt đối **KHÔNG** dùng dải gradient tím/xanh ngọc lặp đi lặp lại.
  - Tuyệt đối **KHÔNG** lồng card trong card quá 1 cấp; dùng đường chia ô mảnh (`border-b`, `divide-y`, `border-border/60`).
  - Bo góc dứt khoát, chuẩn mực: `--radius: 0.375rem` (6px), tương thích hoàn hảo với `rounded-md` (4.8px) và `rounded-lg` (6px).
- **Phân cấp giao diện:**
  - Nền giấy thi sáng phẳng, không bóng đổ quá mức (`shadow-xs` / `shadow-sm`).
  - Bảng điều khiển thi (Exam Surface) tách biệt rõ ràng giữa khu vực câu hỏi, ma trận câu hỏi (Question Matrix) và thẻ thông tin thí sinh (Candidate Card).

---

## 3. Design Tokens System (OKLCH & shadcn/ui)

Toàn bộ hệ thống token màu được cấu hình tại [frontend/src/app/globals.css](file:///home/weback1609/Documents/source/QuizCarLicense/frontend/src/app/globals.css) theo chuẩn OKLCH, tích hợp trực tiếp với Tailwind CSS v4 (`@theme inline`):

### 3.1. Bảng Token Màu Cốt Lõi (Core Color Tokens)

| Token CSS | Vai trò (Semantic Purpose) | Light Mode (OKLCH) | Dark Mode (OKLCH) | Ghi chú & Mã tương đương |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | Nền trang (Nền giấy thi) | `oklch(0.99 0 0)` | `oklch(0.13 0.005 250)` | Light: #fdfdfd / Dark: #121316 |
| `--foreground` | Màu chữ chính | `oklch(0.14 0.005 250)` | `oklch(0.96 0.002 250)` | Tương phản cao, dễ đọc |
| `--card` | Nền Card / Bảng điều khiển | `oklch(0.98 0.002 250)` | `oklch(0.17 0.006 250)` | Phân biệt nhẹ với nền trang |
| `--card-foreground`| Chữ hiển thị trên Card | `oklch(0.14 0.005 250)` | `oklch(0.96 0.002 250)` | Đồng bộ với `--foreground` |
| `--popover` | Nền Dropdown / Dialog / Tooltip | `oklch(0.99 0 0)` | `oklch(0.15 0.005 250)` | Nổi bật trên nền chung |
| `--popover-foreground`| Chữ trên Popover / Dialog | `oklch(0.14 0.005 250)` | `oklch(0.96 0.002 250)` | Đồng bộ độ tương phản |
| `--primary` | **Brand Accent: Traffic Signal Emerald** | `oklch(0.52 0.15 155)` | `oklch(0.65 0.16 155)` | Xanh tín hiệu giao thông (#048848) |
| `--primary-foreground`| Chữ trên nền Primary | `oklch(0.99 0 0)` | `oklch(0.12 0.005 250)` | Tương phản tối đa với primary |
| `--secondary` | Nền nút phụ, badge trung tính | `oklch(0.95 0.004 250)` | `oklch(0.22 0.008 250)` | Nền xám nhạt dịu mắt |
| `--secondary-foreground`| Chữ trên nền Secondary | `oklch(0.20 0.01 250)` | `oklch(0.95 0.002 250)` | Độ tương phản WCAG AAA |
| `--muted` | Khu vực nền mờ, hàng chẵn/lẻ | `oklch(0.95 0.004 250)` | `oklch(0.20 0.006 250)` | Dùng cho bảng biểu, hàng đợi |
| `--muted-foreground` | Nhãn phụ, caption, placeholder | `oklch(0.45 0.01 250)` | `oklch(0.65 0.008 250)` | Xám trung tính |
| `--accent` | Trạng thái hover / active nhẹ | `oklch(0.94 0.008 250)` | `oklch(0.22 0.008 250)` | Dùng cho menu item hover |
| `--accent-foreground`| Chữ khi hover | `oklch(0.14 0.005 250)` | `oklch(0.96 0.002 250)` | Chữ đậm rõ nét |
| `--destructive` | **Danger: Câu điểm liệt / Trượt** | `oklch(0.55 0.22 27)` | `oklch(0.60 0.22 27)` | Đỏ tín hiệu dừng (#dc2626) |
| `--destructive-foreground`| Chữ trên nền Destructive | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` | Trắng tương phản cao |
| `--border` | Đường viền ngăn cách | `oklch(0.89 0.005 250)` | `oklch(0.25 0.006 250)` | Viền mảnh trang nhã |
| `--input` | Viền input / control | `oklch(0.89 0.005 250)` | `oklch(0.25 0.006 250)` | Đồng bộ với `--border` |
| `--ring` | Vòng focus bàn phím (Accessibility) | `oklch(0.52 0.15 155)` | `oklch(0.65 0.16 155)` | Xanh Emerald focus ring |

### 3.2. Sidebar & Chart Tokens

```css
/* Sidebar Tokens (Dành cho Dashboard & Admin) */
--sidebar: var(--card);
--sidebar-foreground: var(--foreground);
--sidebar-primary: var(--primary);
--sidebar-primary-foreground: var(--primary-foreground);
--sidebar-accent: var(--accent);
--sidebar-accent-foreground: var(--accent-foreground);
--sidebar-border: var(--border);
--sidebar-ring: var(--ring);

/* Chart Tokens (Dành cho Thống kê Kết quả thi) */
--chart-1: oklch(0.52 0.15 155); /* Xanh lá: Tỉ lệ đạt / Câu đúng */
--chart-2: oklch(0.55 0.22 27);  /* Đỏ: Câu sai / Điểm liệt */
--chart-3: oklch(0.60 0.14 220); /* Xanh dương: Câu chưa làm */
--chart-4: oklch(0.70 0.15 70);  /* Vàng: Câu gắn cờ xem lại */
--chart-5: oklch(0.45 0.01 250); /* Xám: Trung bình */
```

### 3.3. Bo góc (Radius Tokens)
- `--radius: 0.375rem;` (6px)
  - `rounded-sm`: calc(var(--radius) - 4px) = 2px (Dùng cho Badge nhỏ, checkbox)
  - `rounded-md`: calc(var(--radius) - 2px) = 4px (Dùng cho Button, Input)
  - `rounded-lg`: var(--radius) = 6px (Dùng cho Card, Dialog, Container)
  - `rounded-xl`: calc(var(--radius) + 4px) = 10px (Dùng cho Modal nổi)

---

## 4. Typography & Font Hierarchy

Hệ thống font chữ được cấu hình tương thích cả Web Fonts và System Fallbacks, tối ưu hiển thị trọn vẹn dấu thanh tiếng Việt:

1. **`--font-sans` (Font chính toàn bộ ứng dụng)**:
   - Stack: `"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
   - Áp dụng trên `html`, `body` và toàn bộ text nội dung.
2. **`--font-heading` (Tiêu đề)**:
   - Stack: `"Be Vietnam Pro", Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
   - Dùng cho các thẻ `<h1>`, `<h2>`, `<h3>` của bài thi và landing page.
3. **`--font-serif` (Biên tập & Trích dẫn luật)**:
   - Stack: `"Roboto Slab", Georgia, Cambria, "Times New Roman", serif`
   - Dùng cho trích dẫn điều khoản luật Giao thông Đường bộ hoặc văn bản quy phạm.
4. **`--font-mono` & `.tabular-nums`**:
   - Stack: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
   - Thuộc tính `font-variant-numeric: tabular-nums` bắt buộc dùng cho:
     - Đồng hồ đếm ngược thời gian làm bài (tránh giật layout khi số giây thay đổi).
     - Chỉ số câu hỏi ma trận: `01/35`, `02/35`.
     - Thống kê điểm số: `32/35`.

---

## 5. Interaction & Accessibility (WCAG AA/AAA)

1. **Phím tắt trong phòng thi**:
   - Phím `1, 2, 3, 4`: Chọn đáp án A, B, C, D tương ứng.
   - Phím `ArrowLeft` / `ArrowRight`: Chuyển qua lại giữa các câu hỏi.
   - Phím `F` hoặc `Space`: Bật/Tắt cờ (Bookmark) đánh dấu câu cần kiểm tra lại.
2. **Focus Management**:
   - Mọi nút, input, checkbox đều có `outline-ring/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`.
3. **Live Regions**:
   - Đồng hồ đếm ngược thông báo `aria-live="polite"` khi thời gian làm bài còn dưới 1 phút.

---

## 6. Quy chuẩn Lập trình Giao diện (shadcn/ui Rules)
- **Semantic Tokens Only**: Tuyệt đối không dùng mã hex cố định (`#10b981`) hay Tailwind raw colors (`bg-green-500`, `text-blue-600`). Luôn dùng `bg-primary`, `text-foreground`, `border-border`, `text-muted-foreground`.
- **Layout Stacks**: Không dùng `space-y-*` hoặc `space-x-*`. Luôn dùng `flex flex-col gap-*` hoặc `grid gap-*`.
- **Icon Sizing**: Dùng icon object từ `lucide-react` (hoặc `hugeicons`), không can thiệp class kích thước khi icon nằm trong component shadcn (Button tự điều khiển kích thước icon với `data-icon`).
- **Composition**: Form sử dụng đầy đủ cấu trúc `FieldGroup` + `Field` + `FieldLabel` + `Input`. Card sử dụng `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
