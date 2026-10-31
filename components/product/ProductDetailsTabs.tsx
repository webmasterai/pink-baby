"use client";

import { useId, useState, type ReactNode } from "react";
import type { ContentBlock, SpecRow } from "@/lib/product-content";
import { ProductReviews } from "@/components/product/ProductReviews";

function AccordionPanel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`pb-accordion-body ${open ? "is-open" : ""}`}>
      <div className="pb-accordion-inner">
        <div className="border-t border-pb-border px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  blocks: ContentBlock[];
  specs: SpecRow[];
  productId: string;
};

export function ProductDetailsTabs({ blocks, specs, productId }: Props) {
  const baseId = useId();
  const [tab, setTab] = useState<"description" | "specs" | "reviews">("description");

  const tabs = [
    { id: "description" as const, label: "Description" },
    { id: "specs" as const, label: "Specifications" },
    { id: "reviews" as const, label: "Reviews" },
  ];

  return (
    <section className="mt-10 border-t border-pb-border pt-8" aria-label="Product details">
      {/* Desktop / tablet tabs */}
      <div className="hidden md:block">
        <div role="tablist" aria-label="Product information" className="flex gap-2 border-b border-pb-border">
          {tabs.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`${baseId}-${t.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${t.id}`}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold ${
                  selected
                    ? "border-pb-pink text-pb-pink"
                    : "border-transparent text-pb-muted hover:text-pb-charcoal"
                }`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          id={`${baseId}-panel-description`}
          aria-labelledby={`${baseId}-description`}
          hidden={tab !== "description"}
          className="pt-6"
        >
          {tab === "description" ? (
            <div className="pb-tab-panel">
              <DescriptionBlocks blocks={blocks} />
            </div>
          ) : null}
        </div>
        <div
          role="tabpanel"
          id={`${baseId}-panel-specs`}
          aria-labelledby={`${baseId}-specs`}
          hidden={tab !== "specs"}
          className="pt-6"
        >
          {tab === "specs" ? (
            <div className="pb-tab-panel">
              <SpecsTable specs={specs} />
            </div>
          ) : null}
        </div>
        <div
          role="tabpanel"
          id={`${baseId}-panel-reviews`}
          aria-labelledby={`${baseId}-reviews`}
          hidden={tab !== "reviews"}
          className="pt-6"
        >
          {tab === "reviews" ? (
            <div className="pb-tab-panel">
              <ProductReviews productId={productId} compact />
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile accordion */}
      <div className="space-y-3 md:hidden">
        <Accordion title="Description" defaultOpen>
          <DescriptionBlocks blocks={blocks} />
        </Accordion>
        <Accordion title="Specifications">
          <SpecsTable specs={specs} />
        </Accordion>
        <Accordion title="Reviews">
          <ProductReviews productId={productId} compact />
        </Accordion>
      </div>
    </section>
  );
}

function DescriptionBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-pb-muted">No description available from the catalog.</p>;
  }
  return (
    <div className="prose-product max-w-3xl space-y-4 text-sm leading-relaxed text-pb-muted md:text-base">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`h-${i}`}
              className="font-display text-lg font-bold text-pb-charcoal"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`l-${i}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={`p-${i}`}>{block.text}</p>;
      })}
    </div>
  );
}

function SpecsTable({ specs }: { specs: SpecRow[] }) {
  if (specs.length === 0) {
    return (
      <p className="text-sm text-pb-muted">
        No structured specifications were found in the imported description.
      </p>
    );
  }
  return (
    <table className="w-full max-w-xl border-collapse text-sm">
      <tbody>
        {specs.map((row) => (
          <tr key={row.label} className="border-b border-pb-border">
            <th scope="row" className="py-2 pr-4 text-left font-semibold text-pb-charcoal">
              {row.label}
            </th>
            <td className="py-2 text-pb-muted">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-pb-border bg-white">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left font-display text-base font-bold"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span
          aria-hidden="true"
          className={`text-pb-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      <AccordionPanel open={open}>{children}</AccordionPanel>
    </div>
  );
}
