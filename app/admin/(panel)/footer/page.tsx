"use client";

import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { btnDanger, btnSecondary, btnSmall, Card, Loading, Toggle } from "@/components/admin/AdminUi";
import type { FooterCmsPayload } from "@/lib/cms/types";

type Column = FooterCmsPayload["columns"][number];

export default function AdminFooterPage() {
  const doc = useCmsDocument<FooterCmsPayload>("footer");
  const p = doc.payload;

  function setColumn(i: number, col: Column) {
    if (!p) return;
    const columns = [...p.columns];
    columns[i] = col;
    doc.update({ ...p, columns });
  }

  return (
    <div className="space-y-5">
      <DocToolbar
        title="Footer"
        description="Footer blurb and link columns."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
        previewHref="/?preview=1"
      />
      {!p ? (
        doc.error ? null : <Loading />
      ) : (
        <>
          <Card title="General">
            <div className="grid gap-4">
              <Field label="Footer blurb">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={p.blurb}
                  onChange={(e) => doc.update({ ...p, blurb: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-6">
                <Toggle
                  label="Show contact details"
                  checked={p.showContact}
                  onChange={(showContact) => doc.update({ ...p, showContact })}
                />
                <Toggle
                  label="Show social links"
                  checked={p.showSocial}
                  onChange={(showSocial) => doc.update({ ...p, showSocial })}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Link columns"
            actions={
              <button
                type="button"
                className={`${btnSecondary} ${btnSmall}`}
                onClick={() =>
                  doc.update({
                    ...p,
                    columns: [...p.columns, { title: "", links: [{ label: "", href: "/" }] }],
                  })
                }
              >
                + Add column
              </button>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {p.columns.map((col, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-3 flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="Column title">
                        <input
                          className={inputClass}
                          value={col.title}
                          onChange={(e) => setColumn(i, { ...col, title: e.target.value })}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      className={`${btnDanger} ${btnSmall} mb-1`}
                      onClick={() =>
                        doc.update({ ...p, columns: p.columns.filter((_, j) => j !== i) })
                      }
                    >
                      Remove column
                    </button>
                  </div>
                  <div className="space-y-2">
                    {col.links.map((link, k) => (
                      <div key={k} className="flex gap-2">
                        <input
                          className={inputClass}
                          placeholder="Label"
                          aria-label="Link label"
                          value={link.label}
                          onChange={(e) => {
                            const links = [...col.links];
                            links[k] = { ...link, label: e.target.value };
                            setColumn(i, { ...col, links });
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder="/path"
                          aria-label="Link URL"
                          value={link.href}
                          onChange={(e) => {
                            const links = [...col.links];
                            links[k] = { ...link, href: e.target.value };
                            setColumn(i, { ...col, links });
                          }}
                        />
                        <button
                          type="button"
                          className={`${btnDanger} ${btnSmall}`}
                          aria-label="Remove link"
                          onClick={() =>
                            setColumn(i, { ...col, links: col.links.filter((_, m) => m !== k) })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={`${btnSecondary} ${btnSmall}`}
                      onClick={() =>
                        setColumn(i, { ...col, links: [...col.links, { label: "", href: "/" }] })
                      }
                    >
                      + Add link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
