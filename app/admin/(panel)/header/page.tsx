"use client";

import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { Card, Loading, Toggle } from "@/components/admin/AdminUi";

type HeaderCmsPayload = {
  announcement: string;
  announcementVisible: boolean;
  showSearch: boolean;
  showWishlist: boolean;
  showAccount: boolean;
};

export default function AdminHeaderPage() {
  const doc = useCmsDocument<HeaderCmsPayload>("header");
  const p = doc.payload;

  return (
    <div className="space-y-5">
      <DocToolbar
        title="Header & announcement bar"
        description="Top announcement text and which header icons are shown."
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
          <Card title="Announcement bar">
            <div className="grid gap-4">
              <Field label="Announcement text">
                <input
                  className={inputClass}
                  value={p.announcement}
                  onChange={(e) => doc.update({ ...p, announcement: e.target.value })}
                />
              </Field>
              <Toggle
                label="Show announcement bar"
                checked={p.announcementVisible}
                onChange={(announcementVisible) => doc.update({ ...p, announcementVisible })}
              />
            </div>
          </Card>
          <Card title="Header features">
            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle
                label="Show search"
                checked={p.showSearch}
                onChange={(showSearch) => doc.update({ ...p, showSearch })}
              />
              <Toggle
                label="Show wishlist"
                checked={p.showWishlist}
                onChange={(showWishlist) => doc.update({ ...p, showWishlist })}
              />
              <Toggle
                label="Show account"
                checked={p.showAccount}
                onChange={(showAccount) => doc.update({ ...p, showAccount })}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
