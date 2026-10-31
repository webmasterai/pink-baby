"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  Loading,
  Notice,
  PageHead,
  readJson,
  tableWrap,
  tdClass,
  thClass,
} from "@/components/admin/AdminUi";
import { apiFetch } from "@/lib/client-fetch";
import type { ProductRecord } from "@/lib/cms/types";

type AttrSummary = {
  name: string;
  taxonomy: string;
  productCount: number;
  variationProducts: number;
  terms: string[];
};

const MAX_PRODUCTS = 300;
const BATCH = 10;

export default function AdminAttributesPage() {
  const [attrs, setAttrs] = useState<AttrSummary[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/admin/cms/products");
        const list = await readJson<{ products?: { id: string; attributes?: ProductRecord["attributes"] }[] }>(res);
        if (!res.ok || !list.products) throw new Error(list.error || "Failed to load products");
        const ids = list.products.slice(0, MAX_PRODUCTS);
        setTotal(list.products.length);

        const map = new Map<string, AttrSummary>();
        const collect = (attributes: ProductRecord["attributes"] | undefined) => {
          for (const a of attributes || []) {
            const key = a.taxonomy || a.name;
            const cur = map.get(key) || {
              name: a.name,
              taxonomy: a.taxonomy,
              productCount: 0,
              variationProducts: 0,
              terms: [],
            };
            cur.productCount += 1;
            if (a.hasVariations) cur.variationProducts += 1;
            for (const t of a.terms || []) if (!cur.terms.includes(t)) cur.terms.push(t);
            map.set(key, cur);
          }
        };

        let n = 0;
        for (let i = 0; i < ids.length; i += BATCH) {
          const batch = ids.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map(async (p) => {
              if (p.attributes) return p.attributes;
              const r = await apiFetch(`/api/admin/cms/products/${encodeURIComponent(p.id)}`);
              const d = await readJson<{ product?: ProductRecord }>(r);
              return d.product?.attributes;
            }),
          );
          results.forEach(collect);
          n += batch.length;
          if (cancelled) return;
          setScanned(n);
        }
        if (cancelled) return;
        setAttrs([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load attributes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageHead title="Product attributes & variants" />
      <Card>
        <p className="text-sm text-slate-600">
          Attributes (such as size, colour or material) and variants are stored on each product
          record, not managed globally. To add or change an attribute, edit the product from{" "}
          <Link href="/admin/products" className="font-semibold text-pb-pink hover:underline">
            Products
          </Link>
          . The list below summarises the attribute names currently in use across products.
        </p>
      </Card>
      <Notice error={error} />
      {!attrs && !error ? (
        <Loading label={`Scanning products… ${scanned}/${Math.min(total, MAX_PRODUCTS) || "…"}`} />
      ) : null}
      {attrs ? (
        <>
          {total > MAX_PRODUCTS ? (
            <Notice info={`Only the first ${MAX_PRODUCTS} of ${total} products were scanned.`} />
          ) : null}
          <div className={tableWrap}>
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={thClass}>Attribute</th>
                  <th className={thClass}>Taxonomy</th>
                  <th className={thClass}>Products</th>
                  <th className={thClass}>Used for variants</th>
                  <th className={thClass}>Values</th>
                </tr>
              </thead>
              <tbody>
                {attrs.length === 0 ? (
                  <tr>
                    <td className={tdClass} colSpan={5}>
                      No product attributes found.
                    </td>
                  </tr>
                ) : (
                  attrs.map((a) => (
                    <tr key={a.taxonomy || a.name}>
                      <td className={`${tdClass} font-semibold`}>{a.name}</td>
                      <td className={tdClass}>{a.taxonomy || "—"}</td>
                      <td className={tdClass}>{a.productCount}</td>
                      <td className={tdClass}>{a.variationProducts}</td>
                      <td className={tdClass}>
                        {a.terms.slice(0, 12).join(", ")}
                        {a.terms.length > 12 ? ` +${a.terms.length - 12} more` : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
