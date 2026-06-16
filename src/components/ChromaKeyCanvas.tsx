"use client";

import { useEffect, useRef } from "react";

interface ChromaKeyCanvasProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ChromaKeyCanvas({ src, alt, className }: ChromaKeyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // ほぼ純緑のみ透明化 (r/bの2.5倍以上かつg>100)
        if (g > 100 && g > r * 2.5 && g > b * 2.5) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };
    img.src = src;
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      className={className}
      // 初期サイズは画像の自然サイズ (800×873) に合わせてアスペクト比をCSSで制御
      style={{ aspectRatio: "800 / 873", width: "100%", height: "auto" }}
    />
  );
}
