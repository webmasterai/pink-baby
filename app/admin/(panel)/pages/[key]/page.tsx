"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { btnDanger, btnSecondary, btnSmall, Card, Loading, Toggle } from "@/components/admin/AdminUi";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PageCmsPayload, PageSection } from "@/lib/cms/types";

const PAGE_PATHS: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  delivery: "/delivery",
  returns: "/returns",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
  cart: "/cart",
  checkout: "/checkout",
  account: "/account",
  wishlist: "/wishlist",
  "order-tracking": "/order-tracking",
  "empty-states": "/",
};

function newId(type: string) {
  return `${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export default function AdminPageEditor() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(String(params?.key || ""));
  const doc = useCmsDocument<PageCmsPayload>(`page:${key}`);
  const p = doc.payload;

  function setSection(i: number, s: PageSection) {
    if (!p) return;
    const sections = [...p.sections];
    sections[i] = s;
    doc.update({ ...p, sections });
  }

  function moveSection(i: number, dir: -1 | 1) {
    if (!p) return;
    const j = i + dir;
    if (j < 0 || j >= p.sections.length) return;
    const sections = [...p.sections];
    [sections[i], sections[j]] = [sections[j], sections[i]];
    doc.update({ ...p, sections });
  }

  function addSection(type: PageSection["type"]) {
    if (!p) return;
    const id = newId(type);
    const s: PageSection =
      type === "richtext"
        ? { type, id, heading: "", body: "" }
        : type === "list"
          ? { type, id, heading: "", items: [""] }
          : { type, id, items: [{ question: "", answer: "" }] };
    doc.update({ ...p, sections: [...p.sections, s] });
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/pages" className="text-sm font-semibold text-pb-pink hover:underline">
        ← All pages
      </Link>
      <DocToolbar
        title={`Page: ${key}`}
        description="Title, intro, SEO and content sections."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
        previewHref={`${PAGE_PATHS[key] || "/"}?preview=1`}
      />
      {!p ? (
        doc.error ? null : <Loading />
      ) : (
        <>
          <Card title="Basics">
            <div className="grid gap-4">
              <Field label="Page title">
                <input
                  className={inputClass}
                  value={p.title}
                  onChange={(e) => doc.update({ ...p, title: e.target.value })}
                />
              </Field>
              <Field label="Intro">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={p.intro}
                  onChange={(e) => doc.update({ ...p, intro: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card title="SEO">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SEO title">
                <input
                  className={inputClass}
                  value={p.seo.title}
                  onChange={(e) => doc.update({ ...p, seo: { ...p.seo, title: e.target.value } })}
                />
              </Field>
              <MediaPicker
                label="Open Graph image"
                value={p.seo.ogImage}
                alt={p.seo.title || p.title}
                onChange={({ src }) => doc.update({ ...p, seo: { ...p.seo, ogImage: src } })}
              />
              <div className="md:col-span-2">
                <Field label="Meta description">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={p.seo.description}
                    onChange={(e) =>
                      doc.update({ ...p, seo: { ...p.seo, description: e.target.value } })
                    }
                  />
                </Field>
              </div>
              <Toggle
                label="Hide from search engines (noindex)"
                checked={p.seo.noindex}
                onChange={(noindex) => doc.update({ ...p, seo: { ...p.seo, noindex } })}
              />
            </div>
          </Card>

          <Card
            title="Sections"
            actions={
              <>
                <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => addSection("richtext")}>
                  + Text
                </button>
                <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => addSection("list")}>
                  + List
                </button>
                <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => addSection("faq")}>
                  + FAQ
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {p.sections.length === 0 ? (
                <p className="text-sm text-slate-500">No sections yet. Add one above.</p>
              ) : null}
              {p.sections.map((s, i) => (
                <div key={s.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-pb-pink">
                      {s.type === "richtext" ? "Text" : s.type === "list" ? "List" : "FAQ"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`${btnSecondary} ${btnSmall}`}
                        disabled={i === 0}
                        onClick={() => moveSection(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={`${btnSecondary} ${btnSmall}`}
                        disabled={i === p.sections.length - 1}
                        onClick={() => moveSection(i, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={`${btnDanger} ${btnSmall}`}
                        onClick={() =>
                          doc.update({ ...p, sections: p.sections.filter((_, j) => j !== i) })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {s.type === "richtext" ? (
                    <div className="grid gap-3">
                      <Field label="Heading (optional)">
                        <input
                          className={inputClass}
                          value={s.heading || ""}
                          onChange={(e) => setSection(i, { ...s, heading: e.target.value })}
                        />
                      </Field>
                      <Field label="Body" hint="Separate paragraphs with a blank line.">
                        <textarea
                          rows={6}
                          className={inputClass}
                          value={s.body}
                          onChange={(e) => setSection(i, { ...s, body: e.target.value })}
                        />
                      </Field>
                      <MediaPicker
                        label="Section image (optional)"
                        value={s.image?.src || ""}
                        alt={s.image?.alt || ""}
                        onChange={({ src, alt }) =>
                          setSection(i, {
                            ...s,
                            image: src ? { src, alt: alt || "" } : undefined,
                          })
                        }
                      />
                    </div>
                  ) : null}

                  {s.type === "list" ? (
                    <div className="grid gap-3">
                      <Field label="Heading (optional)">
                        <input
                          className={inputClass}
                          value={s.heading || ""}
                          onChange={(e) => setSection(i, { ...s, heading: e.target.value })}
                        />
                      </Field>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Items</p>
                        {s.items.map((item, k) => (
                          <div key={k} className="flex gap-2">
                            <input
                              className={inputClass}
                              value={item}
                              onChange={(e) => {
                                const items = [...s.items];
                                items[k] = e.target.value;
                                setSection(i, { ...s, items });
                              }}
                            />
                            <button
                              type="button"
                              className={`${btnDanger} ${btnSmall}`}
                              onClick={() =>
                                setSection(i, { ...s, items: s.items.filter((_, m) => m !== k) })
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={`${btnSecondary} ${btnSmall}`}
                          onClick={() => setSection(i, { ...s, items: [...s.items, ""] })}
                        >
                          + Add item
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {s.type === "faq" ? (
                    <div className="space-y-3">
                      {s.items.map((item, k) => (
                        <div key={k} className="rounded-lg bg-slate-50 p-3">
                          <div className="grid gap-3">
                            <Field label="Question">
                              <input
                                className={inputClass}
                                value={item.question}
                                onChange={(e) => {
                                  const items = [...s.items];
                                  items[k] = { ...item, question: e.target.value };
                                  setSection(i, { ...s, items });
                                }}
                              />
                            </Field>
                            <Field label="Answer">
                              <textarea
                                rows={3}
                                className={inputClass}
                                value={item.answer}
                                onChange={(e) => {
                                  const items = [...s.items];
                                  items[k] = { ...item, answer: e.target.value };
                                  setSection(i, { ...s, items });
                                }}
                              />
                            </Field>
                            <div>
                              <button
                                type="button"
                                className={`${btnDanger} ${btnSmall}`}
                                onClick={() =>
                                  setSection(i, {
                                    ...s,
                                    items: s.items.filter((_, m) => m !== k),
                                  })
                                }
                              >
                                Remove question
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className={`${btnSecondary} ${btnSmall}`}
                        onClick={() =>
                          setSection(i, {
                            ...s,
                            items: [...s.items, { question: "", answer: "" }],
                          })
                        }
                      >
                        + Add question
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
