# Hướng dẫn cho routine đăng video Design24 (2 bài/ngày)

Mỗi tối routine chạy một lần, soạn và **hẹn giờ 2 video cho ngày hôm sau** trên 3 kênh Facebook, TikTok, YouTube của Design24 qua Buffer.

| Giờ đăng (giờ Việt Nam) | Nội dung | Độ dài |
| --- | --- | --- |
| 9:00 | Mẹo thiết kế: màu, bố cục, khoảng trắng, căn lề, lưới | 45 đến 70 giây |
| 19:00 | Chữ và thương hiệu: phông chữ, phân cấp, tương phản, logo, poster | 45 đến 70 giây |

Thư mục làm việc `D`: `/mnt/project-files/design24-auto-post/` nếu có. Nếu phiên không có thư mục đó, dùng `nhat-ky/` trong repo và cuối buổi commit `nhat-ky/da-dang.md`, `nhat-ky/bao-cao/` lên nhánh `nhat-ky` (không đưa video vào nhánh này; video đã nằm ở nhánh `media`).

## 0. Kiểm tra trước khi làm

1. `channels.json` phải có `"confirmed": true`. Nếu chưa: dừng, chỉ ghi báo cáo "chưa xác nhận kênh".
2. `python3 -m autopost.buffer channels` phải liệt kê đúng 3 kênh Design24 có trong `channels.json`. Thấy kênh của thương hiệu khác (ví dụ Tìm Việc Số) mà không thấy kênh Design24: dừng và báo lỗi khóa Buffer. **Không bao giờ đăng vào kênh không có trong `channels.json`.**
3. `pip install -r requirements.txt` nếu thiếu thư viện. Nhạc nền là nhạc tự tạo, không dùng nhạc có bản quyền: `autopost.run` tự xoay vòng 4 bản trong `render/tracks.py` (lofi, chill, house, tech). Không cần đặt trường `music`.

## 1. Chọn chủ đề

- Lấy 2 chủ đề trong `assets/chu-de.md` theo đúng khung giờ, chưa có trong `D/da-dang.md` trong 45 ngày gần nhất.
- Tìm 2 đến 3 nguồn uy tín (Interaction Design Foundation, Nielsen Norman Group, Canva Design School, Smashing Magazine, Material Design, Adobe...). Viết lại bằng lời của mình, không chép nguyên văn. Ghi tên nguồn vào `sources`.

## 2. Viết kịch bản `video.json`

Theo mẫu `examples/artboard-khoang-trang.json` (chủ đề chung) hoặc `examples/artboard-60-30-10.json` (riêng phối màu). Phong cách: một tấm thẻ giấy ở giữa, poster "Khóa học thiết kế đồ họa" được **sửa trực tiếp** trước mắt người xem.

- 7 đến 10 cảnh. Mỗi cảnh có `say` là lời đọc 50 đến 100 ký tự (4 đến 7 giây), câu ngắn, nói như người thật, xưng "bạn".
- Cảnh đầu luôn là `cover` (câu hỏi gây tò mò: `pre` + `word` + `post`, ví dụ "BẠN ĐÃ DÙNG / KHOẢNG TRẮNG / đúng cách chưa?"). Cảnh cuối luôn là `outro` với lời kêu gọi lưu video và theo dõi Design24.
- Có ít nhất 2 cảnh `fix` (sửa trực tiếp) và 1 cảnh `versus` hoặc `dodont`, để video có hình ảnh trực quan, không chỉ chữ.

Các loại cảnh:

| type | Dùng khi | Trường chính |
| --- | --- | --- |
| `cover` | Mở đầu | `pre`, `word` (từ khoá, ngắn), `post` |
| `fix` | Sửa một thuộc tính, poster biến đổi | `num`, `title`, `sub`, `from`, `to` (kiểu poster), `prop` {`name`, `from`, `to`}, `focus` (`top`/`body`/`button`/`all`) |
| `versus` | So sánh trước/sau có thanh trượt | `from`, `to`, `sub` |
| `dodont` | Nên / không nên, 2 poster nhỏ | `title`, `bad` {`label`, `style`}, `good` {`label`, `style`} |
| `point` | Ý chính cần nhớ | `title`, `big` (2 đến 4 chữ), `body`, `icon`, `bullets` (tối đa 3) |
| `list` | 3 đến 5 mẹo nhanh | `title`, `items` (mỗi ý dưới 34 ký tự) |
| `bad`, `pick`, `compare`, `flow`, `ratio`, `mistake`, `wheel`, `examples` | Chỉ cho chủ đề phối màu | xem `examples/artboard-60-30-10.json` |
| `outro` | Kết | chỉ `say` |

Kiểu poster (`from`, `to`, `style`) gồm các núm chỉnh, bỏ trống là giá trị chuẩn (đẹp):

| Núm | Ý nghĩa | Giá trị "sai" gợi ý |
| --- | --- | --- |
| `palette` | tên bảng màu trong `palettes` (cần có `good`) hoặc bảng màu đầy đủ | bảng màu chói, tương phản thấp |
| `font` | `oswald` (chuẩn), `sans`, `serif`, `mixed` (lộn xộn nhiều phông) | `mixed` |
| `align` | `left` hoặc `center` | |
| `gap` | khoảng cách dọc nội dung (1 chuẩn) | 0.6 |
| `pad` | lề trái px (56 chuẩn) | 20 |
| `head`, `body` | hệ số cỡ chữ tiêu đề / nội dung | tiêu đề 0.55 với nội dung 1.4 (sai phân cấp) |
| `track`, `lead` | giãn chữ (px), giãn dòng tiêu đề | -4, 0.82 |
| `mis` | 0..1, mức lệch lề | 1 |
| `grid` | 0..1, hiện lưới cột | 1 khi giảng về lưới |
| `noise` | 0..1, chi tiết trang trí thừa | 1 |
| `text` | đổi chữ trên poster: `kicker`, `title` (xuống dòng bằng `\n`), `sub`, `items`, `button`, `tag`, `tagBig` | |

Biểu tượng (`icon`): book, bookmark, brush, check, eye, heart, layers, grid, bulb, megaphone, monitor, click, palette, pen, pipette, search, send, sparkles, type, follow.

Kiểm tra lời đọc: `python3 render/voice.py <thư mục>/video.json --dry-run`. Từ tiếng Anh hay viết tắt đọc sai thì thêm vào `assets/phat-am.json`.

## 3. Chú thích

Theo `examples/bai-mau-kienthuc/`: `caption-facebook.txt` (tóm tắt ý, nguồn, lời mời theo dõi, design24.vn, 8 đến 12 hashtag), `caption-tiktok.txt` (1 đến 2 câu, 5 đến 6 hashtag), `youtube-tieude.txt` (dưới 100 ký tự, có #Shorts), `youtube-mota.txt`.

## 4. Dựng và hẹn giờ

Mỗi bài một thư mục `D/bai/<ngày>-<giờ>/` (ví dụ `D/bai/2026-11-05-0900/`), chứa `video.json` và 4 file chú thích.

```
python3 -m autopost.run D/bai/2026-11-05-0900 --at 2026-11-05T09:00:00+07:00
python3 -m autopost.run D/bai/2026-11-05-1900 --at 2026-11-05T19:00:00+07:00
```

Lệnh này tự tạo giọng Vbee (giọng clone Nguyễn Hoài Anh), dựng video, nén, đưa lên nhánh `media` để có URL công khai, rồi hẹn giờ trên cả 3 kênh. Trước khi hẹn giờ, xem vài khung hình của `video.mp4` (ffmpeg) để chắc chữ không tràn, không đè nhau. Muốn thử mà không đăng: `--dry-run` (chỉ dựng) hoặc `--draft` (lưu nháp trong Buffer).

## 5. Ghi lại

- Thêm vào `D/da-dang.md` một dòng: ngày, giờ, chủ đề.
- Báo cáo `D/bao-cao/<ngày>.md`: 2 chủ đề, nguồn, đường dẫn video, id bài Buffer từng kênh, lỗi nếu có. Kênh lỗi thì thử lại tối đa 2 lần rồi ghi lỗi, không đăng trùng.
- Mỗi tuần một lần (thứ Hai) chạy `python3 -m autopost.insights` nếu có, ghi lượt xem để chọn chủ đề tốt hơn.
