export const MAX_IMAGE_3D_DATA_URI_BYTES = 1_800_000;

export interface ImageDataUriInfo {
  mimeType: "image/jpeg";
  byteLength: number;
}

/** Accepts only the compact JPEG data URI sent by the browser to the 3D service. */
export function inspectImage3DDataUri(value: unknown): ImageDataUriInfo | null {
  if (typeof value !== "string" || value.length > MAX_IMAGE_3D_DATA_URI_BYTES * 1.4) return null;

  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;

  const base64 = match[1];
  if (base64.length % 4 !== 0) return null;

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = (base64.length / 4) * 3 - padding;
  if (byteLength < 1 || byteLength > MAX_IMAGE_3D_DATA_URI_BYTES) return null;

  return { mimeType: "image/jpeg", byteLength };
}

export type Image3DTaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

export interface Image3DTaskResponse {
  taskId: string;
}

export interface Image3DStatusResponse {
  taskId: string;
  status: Image3DTaskStatus;
  progress: number;
}
