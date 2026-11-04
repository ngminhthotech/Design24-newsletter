# Hướng dẫn cho routine (bản nháp, CHƯA BẬT)

Lịch dự kiến (giờ Việt Nam), sẽ bật sau khi video mẫu được duyệt:

| Giờ | Loại | Độ dài |
| --- | --- | --- |
| 7:30 | Mẹo hoặc quy tắc thiết kế ngắn | 30 đến 45 giây |
| 12:00 | Hướng dẫn thao tác công cụ (Figma, Photoshop, AI...) | 45 đến 60 giây |
| 20:00 | Kiến thức truyền thông, công nghệ hoặc kinh nghiệm nghề | 45 đến 60 giây |

## Soạn bài (tối hôm trước)

1. Chọn chủ đề chưa làm trong 30 ngày (xem `/mnt/project-files/design24-auto-post/da-dang.md`).
2. Tìm 2 đến 3 nguồn uy tín trên internet. Viết lại bằng lời mình, không chép nguyên văn; ghi tên nguồn vào `sources`.
3. Viết JSON theo `examples/kienthuc-mau.json`. Kiểm tra lời đọc: `python3 render/voice.py <json> --dry-run`; từ đọc sai thì thêm vào `assets/phat-am.json`.
4. Dựng: `render/video.sh <json> out/video.mp4 --voice`. Xem vài khung hình trước khi lưu.
5. Viết chú thích theo `examples/bai-mau-kienthuc/` (Facebook có tóm tắt, nguồn, 8 đến 12 hashtag; TikTok 1 đến 2 câu và 5 đến 6 hashtag; YouTube tiêu đề dưới 100 ký tự có #Shorts).
6. Lưu tất cả vào `/mnt/project-files/design24-auto-post/bai-<ngày>-<giờ>/`.

## Đăng bài

1. Nén: `-crf 28 -maxrate 1.0M`; bản TikTok `-crf 30 -maxrate 0.7M`.
2. `python3 -m autopost.media <file...> --folder <ngày>` để lấy URL công khai.
3. Đăng qua Buffer với id kênh trong `channels.json`: Facebook `--video-url` (Reels, ≤90 giây); TikTok `--service tiktok --title`; YouTube `--service youtube --title "... #Shorts"`.
4. Ghi kết quả vào `/mnt/project-files/design24-auto-post/bao-cao/<ngày>.md`. Kênh lỗi: ghi lỗi, không đăng lại quá 2 lần.
