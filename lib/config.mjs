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

export function getWatermarkText() {
  return (process.env.WATERMARK_TEXT || "PREVIEW • DREAM-FOTO.RU").trim();
}
