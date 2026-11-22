const SIZE = 256;

/**
 * Redraws the picture as a small square. Redrawing also discards hidden photo details
 * (EXIF), which often include the exact GPS position where the photo was taken.
 */
export async function resizePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  const side = Math.min(bitmap.width, bitmap.height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, SIZE, SIZE);
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}
