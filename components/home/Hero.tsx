import Image from "next/image";
import type { CSSProperties } from "react";
import { HeroMedia } from "@/components/home/HeroMedia";
import { HeroMotion } from "@/components/home/HeroMotion";
import { getHomeContent } from "@/lib/cms/site-content";
import type { HomeCmsPayload } from "@/lib/cms/types";

const DEFAULT_ALT = "Mother gently holding a sleeping newborn with Pink Baby feeding essentials";

export function Hero({ home: homeProp }: { home?: HomeCmsPayload }) {
  const home = homeProp ?? getHomeContent();
  const { hero } = home;

  const desktopSrc = hero.image || "/images/hero.png";
  const mobileSrc = hero.imageMobile || desktopSrc;
  const desktopAlt = hero.imageAlt || DEFAULT_ALT;
  const mobileAlt = hero.imageMobileAlt || hero.imageAlt || DEFAULT_ALT;
  const desktopPos = hero.objectPosition?.trim() || undefined;
  const mobilePos = hero.objectPositionMobile?.trim() || undefined;
  const separate = mobileSrc !== desktopSrc;

  return (
    <section className="relative isolate overflow-hidden bg-pb-blush">
      <HeroMedia>
        {separate ? (
          <>
            <Image
              src={mobileSrc}
              alt={mobileAlt}
              fill
              priority
              sizes="100vw"
              className={`pb-hero-img object-cover md:hidden ${mobilePos ? "" : "object-[62%_center] sm:object-[68%_center]"}`}
              style={mobilePos ? { objectPosition: mobilePos } : undefined}
            />
            <Image
              src={desktopSrc}
              alt={desktopAlt}
              fill
              priority
              sizes="100vw"
              className={`pb-hero-img hidden object-cover md:block ${desktopPos ? "" : "object-[68%_center] lg:object-[72%_center]"}`}
              style={desktopPos ? { objectPosition: desktopPos } : undefined}
            />
          </>
        ) : (
          <Image
            src={desktopSrc}
            alt={desktopAlt}
            fill
            priority
            sizes="100vw"
            className={
              desktopPos || mobilePos
                ? "pb-hero-img object-cover [object-position:var(--hero-pos-m)] md:[object-position:var(--hero-pos-d)]"
                : "pb-hero-img object-cover object-[62%_center] sm:object-[68%_center] lg:object-[72%_center]"
            }
            style={
              desktopPos || mobilePos
                ? ({
                    "--hero-pos-m": mobilePos ?? "62% center",
                    "--hero-pos-d": desktopPos ?? "72% center",
                  } as CSSProperties)
                : undefined
            }
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-r from-white/94 via-white/70 to-white/10 md:from-white/90 md:via-white/50 md:to-transparent"
          aria-hidden="true"
        />
      </HeroMedia>

      <div className="pb-container relative flex min-h-[480px] items-center py-14 md:min-h-[560px] md:py-16 lg:min-h-[620px] xl:min-h-[640px]">
        <div className="max-w-lg md:max-w-xl">
          <HeroMotion
            line1={hero.line1}
            line2={hero.line2}
            support={hero.support}
            cta={hero.cta}
            ctaHref={hero.ctaHref}
          />
        </div>
      </div>
    </section>
  );
}
