import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  priority?: boolean;
  /** CMS primary logo path; falls back to the storefront wordmark. */
  src?: string;
  alt?: string;
};

export function BrandLogo({
  className = "",
  priority = false,
  src = "/images/logo-wordmark.png",
  alt = "Pink Baby",
}: Props) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="Pink Baby home"
    >
      <Image
        src={src || "/images/logo-wordmark.png"}
        alt={alt}
        width={220}
        height={58}
        priority={priority}
        className="h-11 w-auto md:h-12 lg:h-[3.35rem]"
      />
    </Link>
  );
}
