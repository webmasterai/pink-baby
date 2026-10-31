import { IconHand, IconHeart, IconTruck } from "@/components/icons";
import { Stagger } from "@/components/ui/Reveal";
import { getHomeContent } from "@/lib/cms/site-content";
import type { HomeCmsPayload } from "@/lib/cms/types";

const icons = {
  heart: IconHeart,
  hand: IconHand,
  truck: IconTruck,
} as const;

const tones = {
  heart: "bg-[var(--pb-icon-soft)] text-pb-pink",
  hand: "bg-[var(--pb-icon-sage)] text-pb-pink",
  truck: "bg-[var(--pb-icon-soft)] text-pb-pink",
} as const;

export function Benefits({ home }: { home?: HomeCmsPayload }) {
  const { benefits } = home ?? getHomeContent();

  return (
    <section className="border-b border-pb-border bg-pb-ivory">
      <Stagger
        className="pb-container grid gap-6 py-7 md:grid-cols-3 md:gap-0 md:py-9"
        maxStagger={3}
        stepMs={70}
      >
        {benefits.map((item, index) => {
          const key = (item.icon in icons ? item.icon : "heart") as keyof typeof icons;
          const Icon = icons[key];
          return (
            <div
              key={`${item.title}-${index}`}
              className={`flex items-start gap-4 px-0 md:px-5 ${
                index > 0 ? "md:border-l md:border-pb-border" : ""
              }`}
            >
              <span
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full md:h-14 md:w-14 ${tones[key]}`}
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-pb-charcoal md:text-lg">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-snug text-pb-muted md:text-[0.95rem]">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </Stagger>
    </section>
  );
}
