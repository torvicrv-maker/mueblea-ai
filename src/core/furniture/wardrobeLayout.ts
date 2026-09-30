import type { WardrobeLayout, WardrobeSection } from "./types";

export const DEFAULT_WARDROBE_LAYOUT: WardrobeLayout = {
  sections: [{ widthRatio: 1, shelfCount: 1, hanging: false, frontStyle: "open", drawerCount: 0 }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates and normalizes an editable closet layout received from storage or the AI service. */
export function normalizeWardrobeLayout(value: unknown): WardrobeLayout | null {
  if (!isRecord(value) || !Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 4) return null;

  const sections: WardrobeSection[] = [];
  for (const candidate of value.sections) {
    if (!isRecord(candidate)) return null;
    const { widthRatio, shelfCount, hanging, frontStyle, drawerCount } = candidate;
    if (typeof widthRatio !== "number" || !Number.isFinite(widthRatio) || widthRatio < 0.02 || widthRatio > 1) return null;
    if (!Number.isInteger(shelfCount) || Number(shelfCount) < 0 || Number(shelfCount) > 8) return null;
    if (typeof hanging !== "boolean") return null;
    if (frontStyle !== "open" && frontStyle !== "doors" && frontStyle !== "drawers") return null;
    if (!Number.isInteger(drawerCount) || Number(drawerCount) < 0 || Number(drawerCount) > 6) return null;
    if ((frontStyle === "drawers") !== (Number(drawerCount) > 0)) return null;

    sections.push({ widthRatio, shelfCount: Number(shelfCount), hanging, frontStyle, drawerCount: Number(drawerCount) });
  }

  const totalRatio = sections.reduce((sum, section) => sum + section.widthRatio, 0);
  if (!Number.isFinite(totalRatio) || totalRatio <= 0) return null;

  return { sections: sections.map((section) => ({ ...section, widthRatio: section.widthRatio / totalRatio })) };
}

export function copyWardrobeLayout(layout: WardrobeLayout): WardrobeLayout {
  return { sections: layout.sections.map((section) => ({ ...section })) };
}
