// Module-level storage for the captured image blob.
// Not persisted to localStorage (too large). Cleared on page reload.
let capturedImage: Blob | null = null;

export function setCapturedImage(blob: Blob | null) {
  capturedImage = blob;
}

export function getCapturedImage(): Blob | null {
  return capturedImage;
}
