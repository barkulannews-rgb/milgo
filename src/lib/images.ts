const MAX_IMAGE_WIDTH = 1920;
const JPEG_QUALITY = 0.82;

// Downscale and re-encode a chosen photo before it is uploaded, so uploads stay small (a few hundred KB).
// Transparent PNGs become WebP, which keeps the transparency; browsers without WebP fall back to JPEG.
export async function resizeImage(file: File, maxWidth = MAX_IMAGE_WIDTH): Promise<{ blob: Blob; name: string }> {
  const toBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();
  if (file.type === 'image/png' || file.type === 'image/webp') {
    const blob = await toBlob(await compressImage(file, maxWidth, 'image/webp'));
    if (blob.type === 'image/webp') return { blob, name: 'photo.webp' };
  }
  return { blob: await toBlob(await compressImage(file, maxWidth, 'image/jpeg')), name: 'photo.jpg' };
}

// Downscale and re-encode a photo into a data URL (used when no server is connected).
export function compressImage(file: File, maxWidth = MAX_IMAGE_WIDTH, type = 'image/jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Image processing is not supported in this browser.'));
        // JPEG has no transparency: put see-through areas on white instead of black
        if (type === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(type, JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
