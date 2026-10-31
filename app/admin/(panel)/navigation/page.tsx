"use client";

import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { btnDanger, btnSecondary, btnSmall, Card, Loading, Toggle } from "@/components/admin/AdminUi";
import type { NavCmsPayload, NavItem } from "@/lib/cms/types";

export default function AdminNavigationPage() {
  const doc = useCmsDocument<NavCmsPayload>("nav");
  const p = doc.payload;

  function setItem(i: number, item: NavItem) {
    if (!p) return;
    const items = [...p.items];
    items[i] = item;
    doc.update({ ...p, items });
  }

  /** Swap positions in the array (array order is the display order). */
  function move(i: number, dir: -1 | 1) {
    if (!p) return;
    const j = i + dir;
    if (j < 0 || j >= p.items.length) return;
    const items = [...p.items];
    [items[i], items[j]] = [items[j], items[i]];
    doc.update({ ...p, items });
  }

  return (
    <div className="space-y-5">
      <DocToolbar
        title="Navigation"
        description="Main menu links. Items are shown top to bottom in the order listed."
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
        <Card
          title="Menu items"
          actions={
            <button
              type="button"
              className={`${btnSecondary} ${btnSmall}`}
              onClick={() =>
                doc.update({
                  ...p,
                  items: [
                    ...p.items,
                    { id: `nav-${Date.now().toString(36)}`, label: "", href: "/", visible: true },
                  ],
                })
              }
            >
              + Add item
            </button>
          }
        >
          <div className="space-y-3">
            {p.items.length === 0 ? <p className="text-sm text-slate-500">No items.</p> : null}
            {p.items.map((item, i) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="grid items-end gap-3 md:grid-cols-[5rem_1fr_1fr_auto]">
                  <Field label="Order">
                    <input
                      type="number"
                      min={1}
                      max={p.items.length}
                      className={inputClass}
                      value={i + 1}
                      onChange={(e) => {
                        const target = Math.min(
                          Math.max(1, Number(e.target.value) || 1),
                          p.items.length,
                        );
                        if (target - 1 === i) return;
                        const items = [...p.items];
                        const [moved] = items.splice(i, 1);
                        items.splice(target - 1, 0, moved);
                        doc.update({ ...p, items });
                      }}
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputClass}
                      value={item.label}
                      onChange={(e) => setItem(i, { ...item, label: e.target.value })}
                    />
                  </Field>
                  <Field label="Link (href)">
                    <input
                      className={inputClass}
                      value={item.href}
                      onChange={(e) => setItem(i, { ...item, href: e.target.value })}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    <Toggle
                      label="Visible"
                      checked={item.visible}
                      onChange={(visible) => setItem(i, { ...item, visible })}
                    />
                    <button
                      type="button"
                      className={`${btnSecondary} ${btnSmall}`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={`${btnSecondary} ${btnSmall}`}
                      disabled={i === p.items.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${btnDanger} ${btnSmall}`}
                      onClick={() =>
                        doc.update({ ...p, items: p.items.filter((_, j) => j !== i) })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
