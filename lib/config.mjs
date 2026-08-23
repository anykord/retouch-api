export const MAX_FILE_BYTES = 4_000_000;

export const SUPPORTED_EFFECTS = [
  "double_chin",
  "cheeks",
  "eye_bags",
  "wrinkles",
  "waist",
  "belly",
  "sides",
  "posture",
  "acne",
  "skin",
  "teeth",
  "eyes"
];

export function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS?.trim();

  if (!raw) {
    return [
      "https://dream-foto.ru",
      "https://www.dream-foto.ru"
    ];
  }

  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function allowNullOrigin() {
  return String(process.env.ALLOW_NULL_ORIGIN || "").toLowerCase() === "true";
}

export function getWatermarkText() {
  return (process.env.WATERMARK_TEXT || "PREVIEW • DREAM-FOTO.RU").trim();
}
