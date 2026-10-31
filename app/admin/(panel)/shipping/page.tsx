"use client";

import {
  DocToolbar,
  Field,
  inputClass,
  useCmsDocument,
} from "@/components/admin/StructuredDocForm";
import { Card, Loading } from "@/components/admin/AdminUi";

type ShippingPaymentsPayload = {
  flatShippingPkr: string;
  freeShippingThresholdPkr: string;
  customerInstructions: string;
  paymentNotes: string;
  notificationEmails: string;
};

export default function AdminShippingPage() {
  const doc = useCmsDocument<ShippingPaymentsPayload>("shipping_payments");
  const p = doc.payload;

  return (
    <div className="space-y-5">
      <DocToolbar
        title="Shipping & payment settings"
        description="Customer-facing shipping rules and notes."
        meta={doc.meta}
        dirty={doc.dirty}
        busy={doc.busy}
        error={doc.error}
        ok={doc.ok}
        onSave={doc.saveDraft}
        onPublish={doc.publish}
      />

      <Card title="Secrets & environment">
        <p className="text-sm text-slate-600">
          Payment gateway keys, SMTP credentials and other secrets are{" "}
          <strong>never stored in the CMS</strong>. They live in the server environment
          (for example <code className="rounded bg-slate-100 px-1">.env.local</code> or your
          hosting provider&apos;s environment settings) and are intentionally not shown here.
          Changing them requires a server restart or redeploy.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
          <li>Payment methods appear at checkout only when enabled in the environment.</li>
          <li>
            <code className="rounded bg-slate-100 px-1">SHIPPING_FLAT_PKR</code> /{" "}
            <code className="rounded bg-slate-100 px-1">ADMIN_EMAILS</code> only seed the
            initial values below.
          </li>
        </ul>
      </Card>

      {!p ? (
        doc.error ? null : <Loading />
      ) : (
        <Card title="Shipping & payment copy">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Flat shipping rate (PKR)">
              <input
                className={inputClass}
                inputMode="numeric"
                value={p.flatShippingPkr}
                onChange={(e) => doc.update({ ...p, flatShippingPkr: e.target.value })}
              />
            </Field>
            <Field label="Free shipping threshold (PKR)" hint="Leave empty to disable.">
              <input
                className={inputClass}
                inputMode="numeric"
                value={p.freeShippingThresholdPkr}
                onChange={(e) => doc.update({ ...p, freeShippingThresholdPkr: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Customer shipping instructions">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={p.customerInstructions}
                  onChange={(e) => doc.update({ ...p, customerInstructions: e.target.value })}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Payment notes (shown to customers)">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={p.paymentNotes}
                  onChange={(e) => doc.update({ ...p, paymentNotes: e.target.value })}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Order notification emails" hint="Comma-separated.">
                <input
                  className={inputClass}
                  value={p.notificationEmails}
                  onChange={(e) => doc.update({ ...p, notificationEmails: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
