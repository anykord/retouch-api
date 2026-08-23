import sharp from "sharp";
import { getWatermarkText } from "./config.mjs";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildWatermarkSvg(width, height, text) {
  const safeText = escapeXml(text);
  const lineGap = Math.max(180, Math.round(width * 0.19));
  const rows = Math.max(6, Math.ceil(height / 120) + 3);
  const cols = Math.max(4, Math.ceil(width / lineGap) + 4);

  const items = [];

  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const x = col * lineGap + (row % 2 === 0 ? 0 : lineGap / 2);
      const y = row * 110 + 40;

      items.push(`
        <text
          x="${x}"
          y="${y}"
          fill="rgba(255,255,255,0.22)"
          font-size="34"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="800"
          letter-spacing="1.2"
        >${safeText}</text>
      `);
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-24 ${width / 2} ${height / 2})">
        ${items.join("\n")}
      </g>

      <rect x="16" y="${height - 58}" rx="12" ry="12" width="260" height="42" fill="rgba(24,18,32,0.48)" />
      <text
        x="34"
        y="${height - 31}"
        fill="rgba(255,255,255,0.96)"
        font-size="18"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="800"
      >Демо-результат • без оплаты не скачивается</text>
    </svg>
  `;
}

export async function applyPreviewWatermark(imageBuffer) {
  const base = sharp(imageBuffer).rotate();
  const meta = await base.metadata();

  const width = meta.width || 1200;
  const height = meta.height || 1200;

  const svg = buildWatermarkSvg(width, height, getWatermarkText());

  return base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({
      quality: 88,
      mozjpeg: true
    })
    .toBuffer();
}
