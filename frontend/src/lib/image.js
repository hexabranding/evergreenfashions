export const MAX_RETURN_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

export async function compressImage(file) {
  if (!file) throw new Error("No file selected");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Image must be under 5MB");

  const dataUrl = await fileToDataUrl(file);

  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    if (scale === 1) return dataUrl;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return dataUrl;
  }
}
