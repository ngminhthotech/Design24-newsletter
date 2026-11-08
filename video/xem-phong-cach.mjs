// Xem nhanh một kịch bản Studio ở nhiều phong cách: mỗi phong cách một ảnh lưới khung hình (không dựng video).
// Cách dùng (trong thư mục video/): node xem-phong-cach.mjs <props.json đã giải ảnh> <thư mục ra> [phong-cach ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [propsFile, outDir, ...only] = process.argv.slice(2);
const props = JSON.parse(fs.readFileSync(propsFile, "utf8"));
const src = fs.readFileSync(new URL("./src/studio/looks.ts", import.meta.url), "utf8");
const ids = only.length ? only : [...src.matchAll(/^ {2}"([a-z-]+)": \{/gm)].map((m) => m[1]);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const id of ids) {
  const inputProps = { ...props, look: id };
  const comp = await selectComposition({ serveUrl, id: "Studio", inputProps });
  const n = 12;
  const files = [];
  for (let i = 0; i < n; i++) {
    const frame = Math.round(((i + 0.5) / n) * (comp.durationInFrames - 1));
    const f = path.join(outDir, `${id}-${String(i).padStart(2, "0")}.png`);
    await renderStill({ serveUrl, composition: comp, inputProps, frame, output: f, scale: 0.25 });
    files.push(f);
  }
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(outDir, `${id}-%02d.png`), "-vf", "tile=6x2", "-frames:v", "1", path.join(outDir, `luoi-${id}.png`)]);
  files.forEach((f) => fs.unlinkSync(f));
  console.log(path.join(outDir, `luoi-${id}.png`));
}
