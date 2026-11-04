# Design24 Auto Post

Hệ thống soạn và đăng video "kiến thức thiết kế" tự động cho 3 kênh của Học viện Design24 (Facebook, TikTok, YouTube Shorts).
Code dùng lại từ luồng Tìm Việc Số (`ngminhthotech/auto-post`): đăng qua Buffer, URL công khai từ nhánh `media`, giọng đọc Vbee, video Remotion, logo D24.

**Trạng thái:** đang duyệt video mẫu. Chưa bật lịch đăng, chưa đăng bài nào.

## Cấu trúc

| Đường dẫn | Việc |
| --- | --- |
| `examples/kienthuc-mau.json` | Kịch bản mẫu "Quy tắc 60-30-10": danh sách cảnh, mỗi cảnh có lời đọc `say` |
| `examples/artboard-60-30-10.json` | Kịch bản mẫu kiểu "bảng vẽ" (giống phong cách @hudesign): 12 bước sửa một poster thật, bảng màu `palettes` |
| `video/src/artboard/` | Mẫu video Remotion "Artboard": nền tối chữ chìm DESIGN24, thẻ giấy ở giữa, bảng chọn màu, con trỏ, so sánh trước/sau, vòng màu; chú thích chữ đen nền vàng. Phông Oswald + Be Vietnam Pro đóng gói trong `video/public/fonts` |
| `examples/bai-mau-kienthuc/` | Chú thích mẫu cho Facebook, TikTok, YouTube |
| `video/src/kienthuc/` | Mẫu video Remotion "KienThuc" 1080x1920: cảnh `hook`, `ratio`, `point`, `compare`, `list`, `outro`; phụ đề, nhạc nền, chuyển cảnh |
| `video/src/ui.tsx`, `brand.ts` | Nền, logo và màu nhận diện Design24 |
| `render/video.sh` | Dựng video MP4 từ JSON (thêm `--voice` để có giọng đọc) |
| `render/voice.py` | Giọng đọc Vbee cho từng cảnh; cách đọc từ chuyên ngành trong `assets/phat-am.json` |
| `render/music.py` | Nhạc nền và âm chuyển cảnh tự tổng hợp (không dính bản quyền) |
| `autopost/buffer.py` | Đăng lên Facebook, TikTok, YouTube qua Buffer GraphQL API |
| `autopost/media.py` | Đưa video lên nhánh `media` để có URL công khai cho Buffer (repo phải Public) |
| `autopost/insights.py` | Tổng hợp hiệu quả bài đã đăng từ Buffer |
| `channels.json` | Id kênh Buffer của Design24 (điền khi có tài khoản) |

## Dựng video

```bash
pip install -r requirements.txt
render/video.sh examples/kienthuc-mau.json out/video.mp4            # chưa có giọng: phụ đề theo tốc độ ước lượng
python3 render/voice.py examples/kienthuc-mau.json --dry-run         # xem lời đọc
render/video.sh examples/kienthuc-mau.json out/video.mp4 --voice    # có giọng Vbee
render/video.sh examples/artboard-60-30-10.json out/video.mp4 --voice  # mẫu bảng vẽ (tự chọn khi JSON có "palettes")
```

Xem trước và chỉnh mẫu: `cd video && npx remotion studio`.

## Viết kịch bản mới

Chép `examples/kienthuc-mau.json`, đổi `series`, `topic`, `sources` và các cảnh. Mỗi cảnh một ý, lời đọc `say` khoảng 100 ký tự (khoảng 7 giây).
Các loại cảnh: `hook` (tiêu đề mở đầu), `ratio` (tỉ lệ, các khối màu), `point` (một ý chính: số lớn, biểu tượng, nội dung, nhãn ví dụ),
`compare` (sai và đúng với bản thu nhỏ trang web), `list` (các điều cần nhớ), `outro` (lời mời theo dõi, nguồn tham khảo).
Biểu tượng: tên trong `video/src/kienthuc/kit.tsx` (palette, layers, grid, click, type, pen, bulb, eye, monitor, megaphone, cpu...).

## Môi trường (không commit khóa vào repo)

Lưu thành Network secret trong môi trường cloud của Claude:

| Host | Header |
| --- | --- |
| `api.buffer.com` | `Authorization: Bearer <khóa Buffer của Design24>` |
| `api.vbee.vn` | `Authorization: Bearer <token>` và `App-Id: <app id>` |

Môi trường cũng phải cho phép truy cập 2 host trên (và internet nếu routine tự tìm nguồn).
