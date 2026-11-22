import Image from "next/image";
import Link from "next/link";

/** Raster brand asset. Keep Arabic name as accessible HTML text, never as SVG. */
export const DADYOOM_RASTER_MARK = "/brand/dadyoom-mark-2026.png";

type Props = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function DadyoomMark({
  inverse = false,
  className = "",
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${inverse ? "bg-[#fdf6e8]" : "bg-[#f4efdf]"} ${className}`}
    >
      <Image
        src={DADYOOM_RASTER_MARK}
        alt=""
        width={160}
        height={160}
        priority={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export default function DadyoomLogo({
  href = "/",
  compact = false,
  inverse = false,
  className = "",
}: Props) {
  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`} dir="rtl">
      <DadyoomMark inverse={inverse} />
      {compact ? null : (
        <span className="leading-none">
          <span
            className={`block font-arabic-display text-2xl font-black tracking-[-0.04em] ${inverse ? "text-white" : "text-[#123f39]"}`}
          >
            ضاديوم
          </span>
          <span
            className={`mt-1.5 block text-[10px] font-black tracking-wide ${inverse ? "text-[#f7e6bc]" : "text-[#8a6a2a]"}`}
          >
            بيت العربية الرقمي
          </span>
        </span>
      )}
    </span>
  );
  return href ? (
    <Link href={href} aria-label="ضاديوم — بيت العربية الرقمي" className="inline-flex">
      {content}
    </Link>
  ) : content;
}
