import Image from "next/image";
import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { getHomeContent } from "@/lib/cms/site-content";
import type { HomeCmsPayload } from "@/lib/cms/types";

export function PromoBanner({ home }: { home?: HomeCmsPayload }) {
  const { promo } = home ?? getHomeContent();
  const promoPos = promo.objectPosition?.trim() || undefined;
  const lines = promo.heading.split(/\.\s+/).filter(Boolean);

  return (
    <section className="bg-white py-10 md:py-12">
      <div className="pb-container">
        <div className="relative min-h-[260px] overflow-hidden rounded-3xl bg-pb-sage md:min-h-[320px]">
          <Image
            src={promo.image || "/images/care-for-baby.png"}
            alt={promo.imageAlt || "Breast-care essentials arranged for comfortable feeding support"}
            fill
            sizes="(max-width:768px) 100vw, 1472px"
            className={`object-cover ${promoPos ? "" : "object-[70%_center] md:object-[78%_center]"}`}
            style={promoPos ? { objectPosition: promoPos } : undefined}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#c9d6c4]/96 via-[#c9d6c4]/78 to-transparent md:from-[#c9d6c4]/93 md:via-[#c9d6c4]/55 md:to-transparent"
            aria-hidden="true"
          />
          <div className="relative z-10 flex max-w-xl flex-col justify-center px-6 py-12 md:px-10 md:py-16 lg:max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold leading-[1.1] text-pb-charcoal md:text-4xl lg:text-[2.75rem]">
              {lines.length > 1 ? (
                lines.map((line, i) => (
                  <span key={line} className="block">
                    {line}
                    {i < lines.length - 1 && !line.endsWith(".") ? "." : ""}
                  </span>
                ))
              ) : (
                <span className="block">{promo.heading}</span>
              )}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-pb-charcoal/85 md:text-base">
              {promo.text}
            </p>
            <Link href={promo.ctaHref} className="pb-btn pb-btn-primary mt-7 w-fit text-base">
              {promo.cta}
              <IconChevronRight className="pb-btn-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
