# Kế hoạch phát triển Khối Sắc Màu

## v0.2 — Prototype + khung Android (nhánh này)
- [x] Web game 8×8; chạm/kéo thả, xóa hàng/cột, combo, kỷ lục.
- [x] Cơ chế tăng độ khó ẩn sau 65–85 giây chơi, nhiều khối lớn hơn.
- [x] Hồi sinh một lần/ván ở Game Over (demo không quảng cáo).
- [x] Tách các quy tắc game ra core.js và thêm 4 unit tests.
- [x] Màn hình bắt đầu và Capacitor config cho Android.

## v0.3 — Đóng gói Android
- [ ] npm install, npm run android:add, npm run android:sync, npm run android:open.
- [ ] Thay appId mẫu, thêm icon/splash độc quyền.
- [ ] Test trên điện thoại thật nhiều kích cỡ và xử lý Back.
- [ ] Lưu trạng thái ván đang chơi để không mất khi đóng ứng dụng.

## v0.4 — Quảng cáo thưởng
- [ ] Tích hợp SDK AdMob thật qua plugin Capacitor tương thích.
- [ ] Thiết lập consent, privacy policy, cấu hình test ads.
- [ ] Chỉ cấp hồi sinh khi callback xác nhận đã nhận thưởng.
- [ ] Khi không có mạng/ads không tải được, vẫn cho chơi lại.

## v1.0 — Google Play
- [ ] Kiểm thử gameplay, chính sách dữ liệu & quảng cáo.
- [ ] Tạo AAB release và hồ sơ Google Play Console.
- [ ] Closed testing, xét duyệt và theo dõi crash/retention.
