export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * 指定した矩形範囲(ピクセル座標)で画像を切り抜き、PNG Blobとして返す。
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  area: PixelArea,
  maxOutputSize = 640
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const aspect = area.width / area.height;
  const outputWidth = aspect >= 1 ? maxOutputSize : Math.round(maxOutputSize * aspect);
  const outputHeight = aspect >= 1 ? Math.round(maxOutputSize / aspect) : maxOutputSize;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export cropped image"))),
      "image/png"
    );
  });
}
