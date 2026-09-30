export const MAX_PHOTO_DATA_URI_BYTES = 1_800_000;

export interface PhotoDataUriInfo {
  mimeType: "image/jpeg";
  byteLength: number;
}

/** Accepts only the compact JPEG data URI sent from the browser to the private vision endpoint. */
export function inspectPhotoDataUri(value: unknown): PhotoDataUriInfo | null {
  if (typeof value !== "string" || value.length > MAX_PHOTO_DATA_URI_BYTES * 1.4) return null;

  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;

  const base64 = match[1];
  if (base64.length % 4 !== 0) return null;

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = (base64.length / 4) * 3 - padding;
  if (byteLength < 1 || byteLength > MAX_PHOTO_DATA_URI_BYTES) return null;

  return { mimeType: "image/jpeg", byteLength };
}
