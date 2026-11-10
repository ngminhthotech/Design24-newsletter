# Design24 Auto Post

Hệ thống soạn và đăng video "kiến thức thiết kế" tự động cho 3 kênh của Học viện Design24 (Facebook, TikTok, YouTube Shorts).
Code dùng lại từ luồng Tìm Việc Số (`ngminhthotech/auto-post`): đăng qua Buffer, URL công khai từ nhánh `media`, giọng đọc Vbee, video Remotion, logo D24.

**Trạng thái:** đã có luồng tự động 2 bài/ngày (xem `ROUTINE.md`), chưa bật lịch: chờ khóa Buffer của tài khoản Design24 và xác nhận kênh trong `channels.json`.

## Cấu trúc

| Đường dẫn | Việc |
| --- | --- |
| `examples/kienthuc-mau.json` | Kịch bản mẫu "Quy tắc 60-30-10": danh sách cảnh, mỗi cảnh có lời đọc `say` |
| `examples/artboard-60-30-10.json` | Kịch bản mẫu kiểu "bảng vẽ" (giống phong cách @hudesign): 12 bước sửa một poster thật, bảng màu `palettes` |
| `video/src/artboard/` | Mẫu video Remotion "Artboard": nền tối chữ chìm DESIGN24, thẻ giấy ở giữa, bảng chọn màu, con trỏ, so sánh trước/sau, vòng màu; chú thích chữ đen nền vàng. Phông Oswald + Be Vietnam Pro đóng gói trong `video/public/fonts` |
| `examples/bai-mau-kienthuc/` | Chú thích mẫu cho Facebook, TikTok, YouTube |
| `video/src/kienthuc/` | Mẫu video Remotion "KienThuc" 1080x1920: cảnh `hook`, `ratio`, `point`, `compare`, `list`, `outro`; phụ đề, nhạc nền, chuyển cảnh |
| `video/src/ui.tsx`, `brand.ts` | Nền, logo và màu nhận diện Design24 |
| `video/src/studio/` | Mẫu video "Studio" (dùng cho bài mới). `looks.ts`: 10 phong cách hình ảnh (bảng màu, phông, họa tiết, phụ đề, bố cục mở đầu, chuyển cảnh), mỗi bài một phong cách |
| `autopost/dadang.py` | Chống đơn điệu: tự chọn phong cách khác 5 bài gần nhất, kiểm tra luật đa dạng của kịch bản (`python3 -m autopost.dadang <thư mục bài>`) |
| `video/xem-phong-cach.mjs` | Xem nhanh một kịch bản ở nhiều phong cách (ảnh lưới khung hình, không dựng video) |
| `autopost/run.py` | Chạy trọn luồng một bài: giọng Vbee, dựng, nén, tải lên nhánh `media`, hẹn giờ Buffer 3 kênh (`--dry-run`, `--draft`, `--at`) |
| `assets/chu-de.md` | Danh sách chủ đề cho 2 khung giờ 9:00 và 19:00 |
| `examples/artboard-khoang-trang.json` | Kịch bản mẫu dùng cảnh chung: `fix`, `versus`, `dodont`, `point`, `list` |
| `render/tracks.py` | 8 bản nhạc nền tự tạo (lofi, chill, house, tech, acoustic, marimba, synthwave, piano), xoay vòng giữa các video |
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

Mọi video tự nối thêm outro "Bản tin Design24" (`assets/outro-d24.mp4`, 4,4 giây) ở cuối, nên cả `video.mp4`, `video-fb-yt.mp4` và `video-tiktok.mp4` đều có. Muốn đổi outro thì thay file đó; muốn dựng không có outro thì chạy `NO_OUTRO=1 render/video.sh ...`.

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
