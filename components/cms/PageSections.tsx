import type { PageSection } from "@/lib/cms/types";

function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Renders CMS page sections (richtext / list / faq) for storefront pages. */
export function PageSections({ sections }: { sections: PageSection[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-pb-muted md:text-base">
      {sections.map((s) => {
        if (s.type === "richtext") {
          return (
            <section key={s.id} className="space-y-3">
              {s.heading ? (
                <h2 className="font-display text-xl font-bold text-pb-charcoal">{s.heading}</h2>
              ) : null}
              {s.image?.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.image.src}
                  alt={s.image.alt || ""}
                  className="h-auto max-h-96 w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : null}
              {paragraphs(s.body).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          );
        }
        if (s.type === "list") {
          return (
            <section key={s.id} className="space-y-3">
              {s.heading ? (
                <h2 className="font-display text-xl font-bold text-pb-charcoal">{s.heading}</h2>
              ) : null}
              <ul className="list-disc space-y-3 pl-5">
                {s.items
                  .filter((item) => item.trim())
                  .map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </section>
          );
        }
        return (
          <section key={s.id} className="space-y-4">
            {s.items.map((item, i) => (
              <div key={i}>
                <h3 className="font-semibold text-pb-charcoal">{item.question}</h3>
                <p className="mt-1">{item.answer}</p>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
