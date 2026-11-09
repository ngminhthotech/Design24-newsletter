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
3. `pip install -r requirements.txt` nếu thiếu thư viện. Nhạc nền là nhạc tự tạo, không dùng nhạc có bản quyền: `autopost.run` tự dùng bản marimba (`render/tracks.py`), do người dùng chọn. Không cần đặt trường `music`.

## 1. Chọn chủ đề

- Lấy 2 chủ đề trong `assets/chu-de.md` theo đúng khung giờ, chưa có trong `D/da-dang.md` trong 45 ngày gần nhất.
- Tìm 2 đến 3 nguồn uy tín (Interaction Design Foundation, Nielsen Norman Group, Canva Design School, Smashing Magazine, Material Design, Adobe...). Viết lại bằng lời của mình, không chép nguyên văn. Ghi tên nguồn vào `sources`.

## 2. Viết kịch bản `video.json` (mẫu Studio)

Người dùng không muốn video đóng khuôn. Mỗi video phải có cách kể, hình ảnh và nhịp riêng, như một người làm nội dung giỏi thật sự hiểu người xem. `examples/studio-tuong-phan.json` chỉ là **một** ví dụ về cú pháp, không phải khuôn để chép thứ tự cảnh.

### 2.1 Hiểu người xem trước khi viết

Người xem là người mới học thiết kế, sinh viên, chủ shop nhỏ tự làm bài đăng. Họ lướt nhanh trên điện thoại, quyết định ở lại hay lướt đi trong 1 đến 2 giây đầu.

- **Câu mở đầu đánh vào thứ họ đang gặp**, không chào hỏi, không giới thiệu bản thân. Xoay vòng các kiểu mở đầu, không dùng cùng một kiểu 2 bài liền nhau:
  - chỉ ra lỗi họ đang mắc ("Poster của bạn khó đọc vì một lý do"),
  - câu hỏi đố ("Thiết kế nào trông đắt tiền hơn?"),
  - hiểu lầm phổ biến ("Nhiều màu chưa chắc đã nổi bật"),
  - cho xem kết quả trước ("Từ bài đăng này thành bài đăng này chỉ bằng 1 thay đổi"),
  - con số hứa hẹn ("3 lỗi khiến slide trông nghiệp dư").
- **Mở một vòng tò mò và chỉ đóng nó ở gần cuối** (hứa "lỗi thứ 3 ít ai để ý", "đáp án ở cuối video").
- **Đổi hình ảnh mỗi 3 đến 5 giây**: đổi loại cảnh, nền, cỡ khung, hoặc có chuyển động mới (khoanh, phóng to, sửa). Không để một khung hình đứng yên quá một câu.
- **Ví dụ gần gũi với đời sống Việt Nam**: menu quán, bài đăng bán hàng Facebook/Shopee, poster sự kiện ở trường, slide thuyết trình, danh thiếp, ảnh bìa YouTube. Tự viết chữ trên mẫu (tên quán, sản phẩm, giá bằng đồng) cho khớp câu chuyện của bài, không dùng chữ mặc định.
- **Lời đọc như nói chuyện**: câu ngắn, xưng "bạn", một ý mỗi cảnh, có con số cụ thể, tránh giọng sách giáo khoa và câu thừa.
- **Kết bằng một điều làm được ngay** rồi mới kêu gọi. Đổi cách kêu gọi giữa các bài: lưu lại, bình luận chọn A hay B, gửi cho bạn đang học thiết kế, theo dõi Design24.

### 2.2 Chọn dạng video theo chủ đề

Chọn dạng hợp chủ đề nhất, và khác dạng của bài đăng ngay trước đó (xem cột "Dạng" trong `da-dang.md`):

| Dạng | Cách kể | Cảnh hay dùng |
| --- | --- | --- |
| Sửa thiết kế thật | 1 mẫu xấu được sửa từng bước tới đẹp | `hook`, nhiều `show` nối nhau trên cùng mẫu, `gallery` |
| Đố vui | 2 đến 3 vòng A hay B, giải thích sau mỗi vòng | `quiz`, `big`, `show` |
| Hiểu lầm và sự thật | Nêu niềm tin sai, lật lại bằng ví dụ | `big`, `split`, `stat` |
| Top lỗi | 3 lỗi, mỗi lỗi một cảnh sai/đúng, lỗi cuối bất ngờ nhất | `split`, `show`, `tips` |
| Quy tắc và con số | Một quy tắc có số đo, minh họa bằng mẫu | `stat`, `swatches`, `show` |
| Trước và sau nhanh | Nhiều mẫu khác nhau, mỗi mẫu một thay đổi | `gallery`, `split`, `show` |

### 2.3 Luật đa dạng (bắt buộc)

- 8 đến 12 cảnh, tổng 45 đến 70 giây; mỗi `say` 40 đến 100 ký tự.
- Mỗi video dùng ít nhất 4 loại cảnh khác nhau; không loại nào quá 3 lần; 2 cảnh liền nhau không cùng loại và cùng nền.
- Ít nhất 3 loại mẫu thiết kế (`kind`) khác nhau trong một video. Loại mẫu chính không trùng bài đăng trước.
- Mỗi ảnh chỉ dùng 1 lần trong video (trừ trước/sau của cùng một mẫu). Ảnh tự động không lặp giữa các bài nhờ nhật ký `anh-da-dung.tsv`. Từ khóa ảnh viết bằng tiếng Anh, cụ thể, khớp nội dung ("bubble tea shop", "wedding invitation flowers"). Sau khi dựng, xem ảnh trong `video/public/photos/`: có logo hãng, chữ, hình mờ, tranh cổ hay nội dung không phù hợp thì đổi từ khóa hoặc thêm `#1`, `#2` để lấy ảnh khác.
- Đổi bảng màu mẫu (`pal`) theo câu chuyện của bài, không giữ màu mặc định mãi.
- Không bắt đầu 2 bài liền nhau bằng cùng một loại cảnh. Loại mẫu chính không trùng bài trước. Thứ tự cảnh không giống bài trước quá nửa.

### 2.3b Phong cách hình ảnh (tự động, không cần làm tay)

Người dùng đã phàn nàn video "đơn điệu, một màu". Vì vậy mỗi video có một **phong cách** riêng: bảng màu nền, màu nhấn, phông tiêu đề, họa tiết nền, hình trang trí, kiểu phụ đề, bố cục cảnh mở đầu, khung đặt mẫu và bộ chuyển cảnh. Có 10 phong cách trong `video/src/studio/looks.ts`: `dem-xanh`, `cam-dat`, `pastel-keo`, `bao-do`, `rung-reu`, `neon-dem`, `hoang-hon`, `toi-gian`, `chanh-vang`, `bien-xanh`.

- `autopost.run` **tự chọn** phong cách khác 5 bài gần nhất và ghi vào trường `look` của `video.json`. Không cần đặt `look`; nếu đặt mà trùng 5 bài gần nhất thì nó tự đổi. Muốn ép một phong cách: `--look <tên>`.
- Trường `bg` của cảnh (`dark`, `ink`, `blue`, `paper`) là **vai trò nền**, màu thật lấy theo phong cách (ví dụ `blue` ở phong cách `chanh-vang` là nền vàng chanh). 2 cảnh liền nhau trùng nền thì mẫu tự đổi nền. Vẫn nên xen kẽ nền tối và sáng.
- `autopost.run` **kiểm tra luật đa dạng** ở mục 2.3 (số cảnh, số loại cảnh, cảnh liền nhau, loại mẫu, so với bài trước) trước khi dựng. Không đạt thì dừng và in lỗi: sửa `video.json` theo lỗi rồi chạy lại. Kiểm tra trước bằng `python3 -m autopost.dadang <thư mục bài>`.
- Không được né kiểm tra bằng cách bỏ `"template": "studio"` hay dùng mẫu cũ.

### 2.4 Cú pháp

Gốc JSON: `"template": "studio"`, `series` ("Mẹo thiết kế" hoặc "Chữ và thương hiệu"), `topic`, `date`, `sources`, `scenes`. Ảnh viết `"photo:<từ khóa tiếng Anh>"` (thêm `#n` để lấy ảnh thứ n), được tải tự động (ảnh CC0, Openverse). Trong chữ tiêu đề, `*từ khóa*` được đánh dấu bằng màu nhấn của phong cách. Mọi cảnh có `say` và có thể có `bg`: `dark`, `ink`, `blue`, `paper` (vai trò nền theo phong cách, xem 2.3b), `photo` (ảnh mờ, cần `photo`) hoặc mã màu. Trường gốc `look` do `autopost.run` tự điền.

| type | Dùng khi | Trường |
| --- | --- | --- |
| `hook` | Mở đầu bằng ảnh tràn màn hình, chữ động | `photo`, `kicker`, `lines` (2 đến 4 dòng, mỗi dòng dưới 12 ký tự) |
| `big` | Câu chốt, lật vấn đề, mở đầu không ảnh | `lines`, `sub`, `icon` |
| `show` | Sửa trực tiếp một mẫu | `title`, `spec`, `from`, `to` (núm), `at` (0..1 lúc sửa), `notes` [{`x`,`y`,`w`,`h`,`text`,`at`,`side`}], `meter` (["ink","bg"] hoặc ["accentInk","accent"] để hiện độ tương phản), `labels` [trước, sau], `zoom` {`x`,`y`,`z`} |
| `split` | Sai và đúng cạnh nhau | `title`, `spec`, `bad`, `good` (núm), `badLabel`, `goodLabel` |
| `quiz` | Đố A hay B, đếm ngược 3-2-1 | `question`, `spec`, `a`, `b`, `answer` |
| `stat` | Một con số cần nhớ | `kicker`, `value` ("4,5:1", "60%"), `label`, `items` [{`value`,`label`}] |
| `swatches` | Các cặp màu chữ/nền, tự tính tỷ lệ tương phản | `title`, `rows` [{`bg`,`ink`,`label`}], `min` |
| `tips` | 2 đến 4 mẹo nhanh | `title`, `items` (mỗi ý dưới 40 ký tự), `photo` (nền mờ) |
| `gallery` | Loạt mẫu đẹp cắt nhanh | `title`, `specs` (2 đến 4 mẫu) |
| `cta` | Kết | chỉ `say` |

Mẫu thiết kế `spec`: `kind`, `photo`, `pal` {`bg`,`ink`,`sub`,`accent`,`accentInk`}, `text` (đổi chữ trên mẫu), và các núm.

| kind | Là gì | Chữ đổi được (`text`) |
| --- | --- | --- |
| `event` | Poster sự kiện, ảnh nền toàn khung | `kicker`, `title` (`\n` xuống dòng), `sub`, `button` |
| `cafe` | Bài đăng vuông của quán | `brand`, `title`, `sub`, `button` |
| `sale` | Bài bán hàng có giá | `tag`, `title`, `sub`, `price`, `old`, `button` |
| `app` | Màn hình ứng dụng trong điện thoại | `hello`, `title`, `sub`, `button` |
| `landing` | Trang web trong laptop | `logo`, `title`, `sub`, `button` |
| `thumb` | Ảnh bìa YouTube | `title` (dòng đầu màu nhấn) |
| `slide` | Slide thuyết trình | `kicker`, `title`, `sub`, `items` (ngăn bằng `\|`), `page` |
| `card` | Danh thiếp | `name`, `role`, `phone`, `mail`, `logo` |
| `story` | Story/menu dọc | `kicker`, `title`, `sub`, `price`, `button` |

Núm (dùng trong `from`, `to`, `bad`, `good`, `a`, `b`, hoặc thẳng trong `spec`): `pal` (màu), `overlay` (0..1 lớp phủ tối trên ảnh), `font` (`head`, `sans`, `serif`, `mixed` là lộn xộn), `align` (`left`, `center`), `head`, `body` (hệ số cỡ chữ), `gap` (khoảng cách, 1 chuẩn), `pad` (lề), `mis` (0..1 lệch lề), `noise` (0..1 chi tiết thừa), `btn` (cỡ nút).

Biểu tượng (`icon`): book, bookmark, brush, check, eye, heart, layers, grid, bulb, megaphone, monitor, click, palette, pen, pipette, search, send, sparkles, type, follow.

Kiểm tra lời đọc: `python3 render/voice.py <thư mục>/video.json --dry-run`. Từ tiếng Anh hay viết tắt đọc sai thì thêm vào `assets/phat-am.json`.

Kiểm tra hình trước khi hẹn giờ: dựng bằng `--dry-run`, rồi cắt 24 khung hình đều nhau thành một ảnh lưới và xem kỹ: chữ không tràn, không đè nhau, vòng khoanh đúng chỗ, ảnh hợp nội dung, không có 2 khung liền nhau trông giống hệt. Có lỗi thì sửa `video.json` và dựng lại với `--rerender --dry-run` trước khi hẹn giờ.

Mẫu cũ (Artboard, `examples/artboard-*.json`) vẫn chạy được nhưng không dùng cho bài mới.

## 3. Chú thích

Theo `examples/bai-mau-kienthuc/`: `caption-facebook.txt` (tóm tắt ý, nguồn, lời mời theo dõi, design24.vn, 8 đến 12 hashtag), `caption-tiktok.txt` (1 đến 2 câu, 5 đến 6 hashtag), `youtube-tieude.txt` (dưới 100 ký tự, có #Shorts), `youtube-mota.txt`.

## 4. Dựng và hẹn giờ

Mỗi bài một thư mục `D/bai/<ngày>-<giờ>/` (bắt buộc đúng tên này: nhật ký ảnh `D/anh-da-dung.tsv` dựa vào nó) (ví dụ `D/bai/2026-11-05-0900/`), chứa `video.json` và 4 file chú thích.

```
python3 -m autopost.run D/bai/2026-11-05-0900 --at 2026-11-05T09:00:00+07:00
python3 -m autopost.run D/bai/2026-11-05-1900 --at 2026-11-05T19:00:00+07:00
```

Lệnh này tự tạo giọng Vbee (giọng clone Hoài Anh bản quảng cáo, `s_cantho_male_nghoaianh_zero_shot_advertise_vc`), dựng video, nén, đưa lên nhánh `media` để có URL công khai, rồi hẹn giờ trên cả 3 kênh. Trước khi hẹn giờ, xem vài khung hình của `video.mp4` (ffmpeg) để chắc chữ không tràn, không đè nhau. Muốn thử mà không đăng: `--dry-run` (chỉ dựng) hoặc `--draft` (lưu nháp trong Buffer).

## 5. Ghi lại

- Thêm vào `D/da-dang.md` một dòng: ngày, giờ, chủ đề, dạng video, kiểu mở đầu, loại mẫu chính, phong cách (`look` trong `video.json` sau khi dựng) để bài sau chọn khác.
- Báo cáo `D/bao-cao/<ngày>.md`: 2 chủ đề, nguồn, đường dẫn video, id bài Buffer từng kênh, lỗi nếu có. Kênh lỗi thì thử lại tối đa 2 lần rồi ghi lỗi, không đăng trùng.
- Mỗi tuần một lần (thứ Hai) chạy `python3 -m autopost.insights` nếu có, ghi lượt xem để chọn chủ đề tốt hơn.
