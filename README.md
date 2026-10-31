# KHỐI SẮC MÀU — Block Puzzle 8×8

> **Phiên bản 0.2.0 — web prototype, chuẩn bị Android.** Dự án chưa có quảng cáo AdMob thật và chưa phát hành lên Google Play.

Game xếp khối 2D độc lập: xếp 3 khối mỗi lượt, xóa hàng/cột, ghi điểm/combo, lưu kỷ lục. Có màn bắt đầu và chơi lại. Sau **65–85 giây chơi thực**, game tăng xác suất xuất hiện khối lớn (*Bão Khối*), và khi hết nước đi có **1 lượt hồi sinh demo**, mở vùng 3×3 đông khối nhất.

## Chơi nhanh

Mở `www/index.html` bằng trình duyệt máy tính/Android hoặc dùng VS Code Live Server. Chạm chọn khối rồi chọn vị trí trên bảng, hoặc kéo thả. Không cần đăng ký tài khoản.

## Cấu trúc

```text
www/index.html          Giao diện và màn bắt đầu
www/style.css           Giao diện cho điện thoại
www/core.js             Quy tắc game tách riêng để test
www/game.js             Game loop, cảm ứng, hiệu ứng, độ khó, hồi sinh
tests/core.test.js      Unit tests bằng Node.js
capacitor.config.json   Cấu hình bọc thành Android (appId còn là ví dụ)
package.json            Script test / Capacitor
docs/ROADMAP.md         Kế hoạch phát triển
docs/ADMOB.md            Nguyên tắc tích hợp quảng cáo thưởng
```

## Kiểm thử

Cài Node.js 22 trở lên và chạy:

```bash
npm test
```

## Chuẩn bị đóng gói Android với Capacitor

> Cần Node.js 22+, Android Studio và Android SDK. Đây chỉ là **khung dự án**, thư mục `android/` chưa được tạo.

```bash
npm install
# Thay "com.example.khoisacmau" bằng Application ID riêng trước khi phát hành
npm run android:add
npm run android:sync
npm run android:open
```

Sau khi `npm run android:open`, dùng Android Studio chạy trên điện thoại/emulator, kiểm tra thao tác kéo/thả và sự ổn định. Mỗi khi sửa thư mục `www/`, chạy `npm run android:sync` trước khi build lại.

**Chưa tích hợp AdMob:** nút hồi sinh trong web là *demo miễn phí*. Khi tích hợp Android thật, cần plugin native và logic xác nhận đã nhận reward; không cấp hồi sinh khi người chơi không đủ điều kiện. Xem [`docs/ADMOB.md`](docs/ADMOB.md).

## Pháp lý và sản phẩm

- Tất cả khối được vẽ bằng CSS; **không sao chép logo, hình ảnh hay tên** của Block Blast.
- Trước khi phát hành: thiết kế icon riêng, chính sách quyền riêng tư, cài đặt nội dung quảng cáo, kiểm thử, review Play Console.
- `com.example.khoisacmau` chỉ là **Application ID mẫu**; thay bằng ID duy nhất của bạn trước khi phát hành.