"use client";

import { useState } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function SafeImage({
  src,
  alt,
  className = "w-full h-full object-cover",
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(src || null);
  const [error, setError] = useState(false);

  // If no src or already errored, show placeholder
  if (!imageSrc || error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/placeholder-product.svg" alt={alt} className={className} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        console.log("Image failed to load:", imageSrc, "- using placeholder");
        setError(true);
      }}
      onLoad={() => {
        console.log("Image loaded successfully:", imageSrc);
      }}
    />
  );
}
