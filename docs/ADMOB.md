# Rewarded Ad cho hồi sinh — CHƯA triển khai quảng cáo thật

Luồng mong muốn:
1. Khi hết nước đi, hiện **Game Over** và cho chọn **Xem quảng cáo hồi sinh** hoặc **Chơi lại**.
2. Nếu người chơi tự chọn xem, tải/hiển thị rewarded ad bằng plugin/SDK native trên Android.
3. Chỉ cấp thưởng khi SDK phát callback `earnedReward`; không cấp khi đóng sớm/không tải được.
4. Khi thưởng hợp lệ, mở trống vùng 3×3, giữ điểm, giới hạn một lần mỗi ván.

Code game.js hiện dự kiến bridge `window.NativeAds.showRewarded(): Promise<boolean>`.
**Đây là hợp đồng thiết kế, không phải tính năng có sẵn của Capacitor.** Khi tích hợp, cần cài plugin native tương thích, nối callback vào bridge hoặc thay bằng API plugin. Web demo khi không có bridge sẽ cấp hồi sinh miễn phí và thông báo rõ. Không dùng quảng cáo thật để tự kiểm thử: dùng test ad unit ID trước.

Trước khi phát hành: thiết lập AdMob IDs, consent/UMP theo thị trường, chính sách riêng tư, khai báo Data safety và quảng cáo trên Play Console. Không cố tình làm game bất khả thi để ép xem quảng cáo.
