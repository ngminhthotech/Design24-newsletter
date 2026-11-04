import { continueRender, delayRender, staticFile } from "remotion";

// Phông chữ đóng gói sẵn trong public/fonts (Oswald cho tiêu đề, Be Vietnam Pro cho chữ thường), đủ dấu tiếng Việt.
export const HEAD = "Oswald, 'Be Vietnam Pro', sans-serif";
export const BODY = "'Be Vietnam Pro', Inter, sans-serif";
export const SERIF = "'Playfair Display', Georgia, serif";

const VI = "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB";
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

const FILES: [string, string, string][] = [
  ["Oswald", "oswald", "500"],
  ["Oswald", "oswald", "700"],
  ["Be Vietnam Pro", "be-vietnam-pro", "500"],
  ["Be Vietnam Pro", "be-vietnam-pro", "700"],
  ["Be Vietnam Pro", "be-vietnam-pro", "800"],
  ["Playfair Display", "playfair-display", "700"],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("fonts");
  const faces = FILES.flatMap(([family, file, weight]) =>
    (
      [
        ["latin", LATIN],
        ["vietnamese", VI],
      ] as const
    ).map(([sub, range]) => new FontFace(family, `url(${staticFile(`fonts/${file}-${sub}-${weight}-normal.woff2`)}) format('woff2')`, { weight, unicodeRange: range })),
  );
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => fs.forEach((f) => document.fonts.add(f)))
    .finally(() => continueRender(handle));
};
