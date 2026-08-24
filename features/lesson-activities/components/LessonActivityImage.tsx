"use client";

import {
  useState,
} from "react";

type ImageRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  src: string;
  alt: string;
  region?: ImageRegion | null;
};

export default function LessonActivityImage({
  src,
  alt,
  region,
}: Props) {
  const [naturalSize, setNaturalSize] =
    useState<{
      width: number;
      height: number;
    } | null>(null);

  if (!region) {
    return (
      <img
        src={src}
        alt={alt}
        className="mx-auto max-h-[520px] w-auto rounded-xl object-contain"
      />
    );
  }

  const validRegion =
    region.width > 0 &&
    region.height > 0 &&
    region.x >= 0 &&
    region.y >= 0 &&
    region.x + region.width <= 100 &&
    region.y + region.height <= 100;

  if (!validRegion) {
    return (
      <img
        src={src}
        alt={alt}
        className="mx-auto max-h-[520px] w-auto rounded-xl object-contain"
      />
    );
  }

  const sourceAspect =
    naturalSize
      ? naturalSize.width /
        naturalSize.height
      : 1;

  const cropAspect =
    sourceAspect *
    (region.width /
      region.height);

  return (
    <div
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white"
      style={{
        aspectRatio:
          cropAspect > 0
            ? String(cropAspect)
            : undefined,
        position: "relative",
      }}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(event) => {
          const image =
            event.currentTarget;

          setNaturalSize({
            width:
              image.naturalWidth,
            height:
              image.naturalHeight,
          });
        }}
        style={{
          position: "absolute",
          width:
            `${10000 / region.width}%`,
          maxWidth: "none",
          left:
            `${-(region.x / region.width) * 100}%`,
          top:
            `${-(region.y / region.height) * 100}%`,
        }}
      />
    </div>
  );
}
