import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

/** Display the committed raster mark. Never render an inline SVG as a logo. */
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
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${inverse ? "drop-shadow-md" : "drop-shadow-sm"} ${className}`}
    >
      <Image
        src="/brand/dadyoom-icon.png"
        alt=""
        width={56}
        height={56}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * One image identity in all dashboard headers, the homepage and footer.
 * The light/dark logos are true WebP images with transparent backgrounds.
 */
export default function DadyoomLogo({
  href = "/",
  compact = false,
  inverse = false,
  className = "",
}: Props) {
  const content = compact ? (
    <span className={`inline-flex items-center ${className}`}>
      <DadyoomMark inverse={inverse} />
    </span>
  ) : (
    <span className={`inline-flex min-h-14 items-center ${className}`}>
      <Image
        src={inverse
          ? "/brand/dadyoom-logo-inverse.webp"
          : "/brand/dadyoom-logo.webp"}
        alt="ضاديوم — بيت العربية الرقمي"
        width={1000}
        height={300}
        priority
        className="h-auto w-[205px] max-w-[70vw] object-contain sm:w-[230px]"
      />
    </span>
  );

  return href ? (
    <Link href={href} aria-label="ضاديوم — بيت العربية الرقمي">
      {content}
    </Link>
  ) : content;
}
