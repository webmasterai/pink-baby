import type { PageCmsPayload, PageSection } from "@/lib/cms/types";

export type RichtextSection = Extract<PageSection, { type: "richtext" }>;

/** Find a richtext section by id (non-empty body only). */
export function findRichtext(
  page: PageCmsPayload | null | undefined,
  id: string,
): RichtextSection | undefined {
  const s = page?.sections.find((x) => x.type === "richtext" && x.id === id);
  return s && s.type === "richtext" && s.body.trim() ? s : undefined;
}

/** First richtext section with a non-empty body. */
export function firstRichtext(
  page: PageCmsPayload | null | undefined,
): RichtextSection | undefined {
  const s = page?.sections.find((x) => x.type === "richtext" && x.body.trim());
  return s && s.type === "richtext" ? s : undefined;
}
