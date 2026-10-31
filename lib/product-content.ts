import { toSafePlainText } from "@/lib/sanitize-html";

export type SpecRow = { label: string; value: string };

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type ParsedProductContent = {
  blocks: ContentBlock[];
  specs: SpecRow[];
  plain: string;
};

const SPEC_LABELS = [
  "Quantity",
  "Capacity",
  "Material",
  "Flow",
  "Flow Size",
  "Age",
  "Size",
  "Colour",
  "Color",
  "Neck",
  "Type",
  "Pack",
  "Pieces",
];

const HEADING_CANDIDATES = [
  "Further Details",
  "Increased Comfort by Ergonomic Shape",
  "Easy To Use, Clean and Assemble",
  "BPA Free",
  "Ribbed Design for Uninterrupted Feeding",
  "Innovative anti-colic Valve",
  "Innovated for your child",
  "SOFT SILICON",
  "SOFT SILICONE",
];

function decodeEntities(text: string): string {
  return toSafePlainText(text, 20_000);
}

function extractSkuFromName(name: string): string | null {
  const m = name.match(/\(([A-Za-z0-9][A-Za-z0-9\-\/]+)\)\s*$/);
  return m?.[1] ?? null;
}

/** Prefer catalog SKU; fall back to parenthetical code in the product name. */
export function displaySku(sku: string | null | undefined, name: string): string | null {
  if (sku && sku.trim()) return sku.trim();
  return extractSkuFromName(name);
}

function pullSpecs(text: string): { specs: SpecRow[]; remainder: string } {
  const specs: SpecRow[] = [];
  let remainder = text;

  for (const label of SPEC_LABELS) {
    const re = new RegExp(
      `${label}\\s*[:=]\\s*([^\\n]+?)(?=(?:${SPEC_LABELS.join("|")})\\s*[:=]|$)`,
      "i",
    );
    const m = remainder.match(re);
    if (m?.[1]) {
      const value = m[1].trim().replace(/\s+/g, " ");
      if (value && value.length < 120) {
        specs.push({ label, value });
        remainder = remainder.replace(m[0], " ");
      }
    }
  }

  // Capacity like "240 ml" near feeding bottle without label
  if (!specs.some((s) => /capacity/i.test(s.label))) {
    const cap = text.match(/\b(\d+\s*ml)\b/i);
    if (cap?.[1]) specs.push({ label: "Capacity", value: cap[1] });
  }

  return { specs, remainder: remainder.replace(/\s+/g, " ").trim() };
}

function splitIntoBlocks(text: string): ContentBlock[] {
  if (!text) return [];

  let working = text;
  // Insert breaks before known marketing headings that appear mid-paragraph
  for (const heading of HEADING_CANDIDATES) {
    const re = new RegExp(`(${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    working = working.replace(re, "\n\n$1\n");
  }

  // Break before Title Case phrases that look like section titles (3+ words, capitalised)
  working = working.replace(
    /(?<=[.!?])\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,8})\s+(?=[A-Z])/g,
    "\n\n$1\n",
  );

  const chunks = working
    .split(/\n+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const blocks: ContentBlock[] = [];
  for (const chunk of chunks) {
    const isHeading =
      HEADING_CANDIDATES.some((h) => chunk.toLowerCase().startsWith(h.toLowerCase())) ||
      (chunk.length < 80 &&
        !/[.!?]$/.test(chunk) &&
        /^[A-Z]/.test(chunk) &&
        chunk.split(/\s+/).length <= 10);

    if (isHeading && chunk.toLowerCase() !== "further details") {
      blocks.push({ type: "heading", text: chunk.replace(/\*$/, "").trim() });
      continue;
    }

    // Bullet-like semicolon or " - " lists
    if ((chunk.match(/;/g) || []).length >= 2) {
      const items = chunk
        .split(";")
        .map((i) => i.trim())
        .filter((i) => i.length > 2);
      if (items.length >= 3) {
        blocks.push({ type: "list", items });
        continue;
      }
    }

    // Split long walls into sentences groups
    const sentences = chunk.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 4) {
      for (let i = 0; i < sentences.length; i += 2) {
        blocks.push({
          type: "paragraph",
          text: sentences.slice(i, i + 2).join(" "),
        });
      }
    } else {
      blocks.push({ type: "paragraph", text: chunk });
    }
  }

  return blocks;
}

export function parseProductDescription(raw: string): ParsedProductContent {
  const plain = decodeEntities(raw || "");
  if (!plain) return { blocks: [], specs: [], plain: "" };

  const { specs, remainder } = pullSpecs(plain);
  // Drop leading "Further Details" noise
  const cleaned = remainder.replace(/^Further Details\s*/i, "").trim();
  const blocks = splitIntoBlocks(cleaned);

  return { blocks, specs, plain };
}
