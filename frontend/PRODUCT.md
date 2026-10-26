# PRODUCT.md — Impeccable Design Blueprint

## Product Purpose & Identity
- **Product Name:** QuizCarLicense (Hệ thống Ôn thi Sát hạch Giấy phép Lái xe)
- **Target Audience:** Học viên thi bằng lái xe các hạng A1, A2, B1, B2, C, D, E tại Việt Nam; người nước ngoài cần luyện lý thuyết bằng lái bằng Tiếng Anh.
- **Tone of Voice:** Trang trọng, rõ ràng, tập trung cao độ, chuẩn xác như kỳ thi sát hạch chính quy của Bộ Giao thông Vận tải.

## Aesthetic Register: Official Assessment (Tối giản trang trọng)
Thiết kế tập trung vào tính năng thực dụng (**Product Surface**) cho phòng thi và sự rõ ràng, biên tập tinh gọn (**Brand Surface**) cho trang chủ và tra cứu 600 câu hỏi:
- **No AI Slop:**
  - Tuyệt đối KHÔNG dùng dải gradient tím/xanh ngọc lặp đi lặp lại.
  - Tuyệt đối KHÔNG lồng card trong card quá 1 cấp; dùng đường chia ô mảnh (`border-b`, `divide-y`, `border-border/60`).
  - Bo góc vừa phải (`rounded-md: 6px` và `rounded-lg: 8px`), tạo sự dứt khoát, tin cậy.

## Color System (OKLCH Precision & High Contrast)
- **Light Theme:**
  - Background (Nền giấy thi): `oklch(0.99 0 0)` (#fdfdfd)
  - Surface (Bảng điều khiển / Card): `oklch(0.97 0.002 250)` (#f8f9fa)
  - Foreground (Chữ chính): `oklch(0.14 0.005 250)` (#18191c)
  - Muted Foreground: `oklch(0.45 0.01 250)` (#686e77)
  - Border: `oklch(0.89 0.005 250)` (#e0e3e7)
- **Dark Theme:**
  - Background: `oklch(0.13 0.005 250)` (#121316)
  - Surface: `oklch(0.17 0.006 250)` (#191b1f)
  - Foreground: `oklch(0.96 0.002 250)` (#f3f4f6)
  - Border: `oklch(0.25 0.006 250)` (#2a2d34)
- **Single Brand Accent (Traffic Signal Emerald):**
  - Light: `oklch(0.52 0.15 155)` (#048848)
  - Dark: `oklch(0.65 0.16 155)` (#10b981)
- **Semantic Status Colors:**
  - Đạt / Đúng (Success): `oklch(0.52 0.15 155)`
  - Cảnh báo / Câu điểm liệt / Sai (Danger): `oklch(0.55 0.22 27)` (Đỏ tín hiệu dừng)
  - Đang chọn / Đang làm: `oklch(0.20 0.01 250)` (Đen đậm / Trắng sáng)

## Typography & Hierarchy
- **Primary Font:** `Be Vietnam Pro` (Sans-serif hiện đại, tối ưu 100% dấu thanh tiếng Việt).
- **Monospace Font:** `JetBrains Mono` với thuộc tính `font-variant-numeric: tabular-nums` cho đồng hồ đếm ngược, số thứ tự câu hỏi `01/35`, và điểm số để tránh giật giao diện khi số nhảy.

## Interaction & Accessibility (WCAG AA/AAA)
- Hỗ trợ đầy đủ phím tắt bàn phím trong phòng thi:
  - Phím `1, 2, 3, 4`: Chọn đáp án A, B, C, D
  - Phím `ArrowLeft` / `ArrowRight`: Chuyển câu hỏi trước/sau
  - Phím `F` hoặc `Space`: Đánh dấu cờ (Bookmark) xem lại
- Đồng hồ đếm ngược có `aria-live="polite"` khi còn dưới 1 phút.
