const blobs = new Map<string, Blob>();
export async function storeResidentFile(file: File, fileId: string) {
  blobs.set(fileId, file.slice(0, file.size, file.type));
  return `resident-file://${fileId}`;
}
export function openResidentFile(fileId: string, fileName: string) {
  const blob = blobs.get(fileId);
  if (!blob) throw new Error("This file is not available in the current local session.");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
