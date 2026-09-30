import { normalizeWardrobeLayout } from "./wardrobeLayout";
import type { WardrobeLayout } from "./types";

export interface PhotoDesignProposal {
  supported: boolean;
  summary: string;
  layout: WardrobeLayout | null;
  assumptions: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePhotoDesignProposal(value: unknown): PhotoDesignProposal | null {
  if (!isRecord(value) || typeof value.supported !== "boolean" || typeof value.summary !== "string" || !Array.isArray(value.assumptions)) {
    return null;
  }

  const summary = value.summary.trim();
  if (!summary || summary.length > 600 || value.assumptions.length > 8) return null;
  const assumptions: string[] = [];
  for (const assumption of value.assumptions) {
    if (typeof assumption !== "string" || assumption.trim().length === 0 || assumption.length > 220) return null;
    assumptions.push(assumption.trim());
  }

  if (!value.supported) {
    return (Array.isArray(value.sections) && value.sections.length === 0) || value.layout === null
      ? { supported: false, summary, layout: null, assumptions }
      : null;
  }

  const layout = normalizeWardrobeLayout(value.layout ?? { sections: value.sections });
  if (!layout) return null;
  return { supported: true, summary, layout, assumptions };
}
