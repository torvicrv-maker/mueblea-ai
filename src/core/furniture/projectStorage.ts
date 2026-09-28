import type { FurnitureDimensions } from "./types";

export const PROJECT_STORAGE_KEY = "mueblea-ai.projects.v1";
export const MATERIAL_IDS = ["oak", "white", "walnut"] as const;
export type ProjectMaterialId = (typeof MATERIAL_IDS)[number];

export interface SavedFurnitureProject {
  id: string;
  name: string;
  dimensions: FurnitureDimensions;
  material: ProjectMaterialId;
  updatedAt: string;
}

interface ProjectEnvelope {
  version: 1;
  projects: SavedFurnitureProject[];
}

function isDimensions(value: unknown): value is FurnitureDimensions {
  if (!value || typeof value !== "object") return false;
  const dimensions = value as Record<string, unknown>;
  return Number.isFinite(dimensions.width) && Number(dimensions.width) >= 400
    && Number.isFinite(dimensions.height) && Number(dimensions.height) >= 500
    && Number.isFinite(dimensions.depth) && Number(dimensions.depth) >= 250;
}

function isSavedProject(value: unknown): value is SavedFurnitureProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Record<string, unknown>;
  return typeof project.id === "string" && project.id.length > 0
    && typeof project.name === "string"
    && isDimensions(project.dimensions)
    && MATERIAL_IDS.includes(project.material as ProjectMaterialId)
    && typeof project.updatedAt === "string";
}

export function readSavedProjects(raw: string | null): SavedFurnitureProject[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    const envelope = parsed as Partial<ProjectEnvelope>;
    if (envelope.version !== 1 || !Array.isArray(envelope.projects)) return [];
    return envelope.projects.filter(isSavedProject);
  } catch {
    return [];
  }
}

export function writeSavedProjects(projects: SavedFurnitureProject[]): string {
  return JSON.stringify({ version: 1, projects } satisfies ProjectEnvelope);
}
