const effectText = {
  double_chin: "subtly reduce the appearance of the double chin and make the jawline slightly cleaner",
  cheeks: "subtly make the cheeks and face contour appear a little slimmer",
  eye_bags: "gently reduce under-eye bags and dark tired-looking areas while keeping natural skin texture",
  wrinkles: "gently soften visible wrinkles while preserving realistic skin texture and age-appropriate detail",
  waist: "make a subtle, non-sexual, clothing-preserving silhouette adjustment around the waist while preserving realistic body proportions",
  belly: "make a subtle, non-sexual, clothing-preserving adjustment so the abdomen appears slightly flatter while preserving realistic body proportions",
  sides: "subtly smooth the side waist silhouette while fully preserving clothing coverage and realistic anatomy",
  posture: "slightly improve posture in a natural way without changing body identity or clothing",
  acne: "remove visible acne and temporary blemishes while preserving pores and natural skin texture",
  skin: "gently even the skin tone while preserving pores, freckles, moles, and natural facial identity",
  teeth: "gently whiten the teeth to a natural shade without changing their shape",
  eyes: "make the eye area look slightly fresher and brighter without changing eye shape or identity"
};

const intensityText = {
  "1": "The edit must be very subtle and natural.",
  "2": "The edit may be noticeable but must remain realistic and natural.",
  "3": "Make the requested changes stronger, but keep realistic anatomy and preserve the person's identity."
};

export function buildPrompt(effects, intensity) {
  const requested = effects
    .map((effect) => effectText[effect])
    .filter(Boolean);

  if (!requested.length) {
    throw new Error("No supported effects selected");
  }

  return `
Edit the supplied photograph. This is a realistic, non-sexual photo-retouching task.

ABSOLUTE REQUIREMENTS:
- Preserve the identity of the person exactly.
- Keep the same person, facial identity, hairstyle, clothing coverage, pose, camera angle, lighting, background, and composition.
- Modify ONLY the explicitly requested areas.
- Do not sexualize the person or change clothing coverage.
- Do not beautify or alter unrelated features.
- Do not add makeup unless explicitly requested.
- Do not change age, ethnicity, facial structure, body shape outside the requested areas, clothing, hands, or background.
- Avoid plastic skin, warped anatomy, distorted clothing, or bent background lines.
- The result must look like careful professional photo retouching, not a newly generated person.

REQUESTED EDITS:
${requested.map((x, i) => `${i + 1}. ${x}`).join("\n")}

INTENSITY:
${intensityText[intensity] || intensityText["1"]}

Return a photorealistic edited version of the same photograph.
`.trim();
}
