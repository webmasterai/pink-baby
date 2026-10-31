"use client";

import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { btnDanger, btnSecondary, btnSmall, Card, Loading } from "@/components/admin/AdminUi";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { SiteCmsPayload } from "@/lib/cms/types";

export default function AdminContactPage() {
  const doc = useCmsDocument<SiteCmsPayload>("site");
  const p = doc.payload;

  return (
    <div className="space-y-5">
      <DocToolbar
        title="Contact & social links"
        description="Brand identity, phone numbers, WhatsApp, email, address and social URLs (stored in the site document)."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
        previewHref="/contact?preview=1"
      />
      {!p ? (
        doc.error ? null : <Loading />
      ) : (
        <>
          <Card title="Brand">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Site name">
                <input
                  className={inputClass}
                  value={p.name}
                  onChange={(e) => doc.update({ ...p, name: e.target.value })}
                />
              </Field>
              <Field label="Legal name">
                <input
                  className={inputClass}
                  value={p.legalName}
                  onChange={(e) => doc.update({ ...p, legalName: e.target.value })}
                />
              </Field>
              <Field label="Tagline">
                <input
                  className={inputClass}
                  value={p.tagline}
                  onChange={(e) => doc.update({ ...p, tagline: e.target.value })}
                />
              </Field>
              <MediaPicker
                label="Primary logo"
                value={p.logos.primary}
                alt={`${p.name} logo`}
                onChange={({ src }) => doc.update({ ...p, logos: { ...p.logos, primary: src } })}
              />
              <MediaPicker
                label="Favicon"
                value={p.logos.favicon}
                alt={`${p.name} favicon`}
                onChange={({ src }) => doc.update({ ...p, logos: { ...p.logos, favicon: src } })}
              />
              <div className="md:col-span-2">
                <Field label="Site description">
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={p.description}
                    onChange={(e) => doc.update({ ...p, description: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="WhatsApp & call">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="WhatsApp display number">
                <input
                  className={inputClass}
                  value={p.contact.whatsapp.display}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: {
                        ...p.contact,
                        whatsapp: { ...p.contact.whatsapp, display: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="WhatsApp link" hint="e.g. https://wa.me/923001234567">
                <input
                  className={inputClass}
                  value={p.contact.whatsapp.href}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: {
                        ...p.contact,
                        whatsapp: { ...p.contact.whatsapp, href: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="WhatsApp number (E.164)" hint="e.g. +923001234567">
                <input
                  className={inputClass}
                  value={p.contact.whatsapp.e164}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: {
                        ...p.contact,
                        whatsapp: { ...p.contact.whatsapp, e164: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <div />
              <Field label="Primary call number (display)">
                <input
                  className={inputClass}
                  value={p.contact.call.display}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: { ...p.contact, call: { ...p.contact.call, display: e.target.value } },
                    })
                  }
                />
              </Field>
              <Field label="Primary call link" hint="e.g. tel:+923001234567">
                <input
                  className={inputClass}
                  value={p.contact.call.href}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: { ...p.contact, call: { ...p.contact.call, href: e.target.value } },
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card
            title="Phone numbers"
            actions={
              <button
                type="button"
                className={`${btnSecondary} ${btnSmall}`}
                onClick={() =>
                  doc.update({
                    ...p,
                    contact: {
                      ...p.contact,
                      phones: [...p.contact.phones, { label: "", display: "", href: "" }],
                    },
                  })
                }
              >
                + Add phone
              </button>
            }
          >
            <div className="space-y-3">
              {p.contact.phones.map((ph, i) => (
                <div key={i} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                  {(["label", "display", "href"] as const).map((f) => (
                    <Field
                      key={f}
                      label={f === "label" ? "Label" : f === "display" ? "Display" : "Link (tel:)"}
                    >
                      <input
                        className={inputClass}
                        value={ph[f]}
                        onChange={(e) => {
                          const phones = [...p.contact.phones];
                          phones[i] = { ...ph, [f]: e.target.value };
                          doc.update({ ...p, contact: { ...p.contact, phones } });
                        }}
                      />
                    </Field>
                  ))}
                  <button
                    type="button"
                    className={`${btnDanger} ${btnSmall} mb-1`}
                    onClick={() =>
                      doc.update({
                        ...p,
                        contact: {
                          ...p.contact,
                          phones: p.contact.phones.filter((_, j) => j !== i),
                        },
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Email & address">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={p.contact.email}
                  onChange={(e) =>
                    doc.update({
                      ...p,
                      contact: {
                        ...p.contact,
                        email: e.target.value,
                        emailHref: `mailto:${e.target.value}`,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Email link" hint="Updated automatically from email.">
                <input className={inputClass} readOnly value={p.contact.emailHref} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address" hint="One line per row.">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={p.contact.addressLines.join("\n")}
                    onChange={(e) =>
                      doc.update({
                        ...p,
                        contact: { ...p.contact, addressLines: e.target.value.split("\n") },
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Social links">
            <div className="grid gap-4 md:grid-cols-2">
              {(["facebook", "instagram", "youtube", "pinterest"] as const).map((k) => (
                <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1) + " URL"}>
                  <input
                    className={inputClass}
                    placeholder="https://"
                    value={p.social[k]}
                    onChange={(e) =>
                      doc.update({ ...p, social: { ...p.social, [k]: e.target.value } })
                    }
                  />
                </Field>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
