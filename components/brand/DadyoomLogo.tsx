
import Link from "next/link";

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
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 84 84"
        className="h-14 w-14 overflow-visible drop-shadow-sm"
        role="presentation"
      >
        <path
          d="M8 24c12-6 23-5 34 3 11-8 22-9 34-3v40c-12-5-23-4-34 3-11-7-22-8-34-3V24Z"
          fill={inverse ? "#fffaf0" : "#174f47"}
        />
        <path
          d="M42 27v40M12 29c10-4 19-2 30 5M72 29c-10-4-19-2-30 5"
          fill="none"
          stroke={inverse ? "#f5cf7a" : "#d6ad57"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M58 9c7 1 12 5 14 11-8 0-14 4-19 12l-5-3c3-9 6-16 10-20Z"
          fill={inverse ? "#f5cf7a" : "#c8902f"}
        />
        <text
          x="42"
          y="55"
          textAnchor="middle"
          fontSize="31"
          fontWeight="900"
          fill={inverse ? "#174f47" : "#f5cf7a"}
          fontFamily="serif"
        >
          ض
        </text>
      </svg>
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
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <DadyoomMark inverse={inverse} />
      {!compact ? (
        <span className="leading-none">
          <span
            className={`block font-arabic-display text-2xl font-black tracking-[-0.04em] ${
              inverse ? "text-white" : "text-[#123f39]"
            }`}
          >
            ضاديوم
          </span>
          <span
            className={`mt-1.5 block text-[10px] font-black tracking-wide ${
              inverse ? "text-[#f7e6bc]" : "text-[#8a6a2a]"
            }`}
          >
            بيت العربية الرقمي
          </span>
        </span>
      ) : null}
    </span>
  );

  return href ? (
    <Link href={href} aria-label="ضاديوم — بيت العربية الرقمي">
      {content}
    </Link>
  ) : content;
}
