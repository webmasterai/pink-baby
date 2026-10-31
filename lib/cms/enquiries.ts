import { getDb, newId, nowIso } from "@/lib/db";
import type { EnquiryRecord, SubscriberRecord } from "@/lib/cms/types";

export function listEnquiries(opts?: { status?: string; q?: string }) {
  let sql = `SELECT id, name, email, message, source, status, notes,
                    created_at AS createdAt, updated_at AS updatedAt
             FROM enquiries WHERE 1=1`;
  const params: string[] = [];
  if (opts?.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  if (opts?.q?.trim()) {
    sql += ` AND (name LIKE ? OR email LIKE ? OR message LIKE ?)`;
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY created_at DESC`;
  return getDb().prepare(sql).all(...params) as EnquiryRecord[];
}

export function updateEnquiry(
  id: string,
  patch: { status?: EnquiryRecord["status"]; notes?: string },
) {
  const at = nowIso();
  const cur = getDb()
    .prepare(`SELECT status, notes FROM enquiries WHERE id = ?`)
    .get(id) as { status: string; notes: string } | undefined;
  if (!cur) throw Object.assign(new Error("Enquiry not found."), { status: 404 });
  getDb()
    .prepare(`UPDATE enquiries SET status = ?, notes = ?, updated_at = ? WHERE id = ?`)
    .run(patch.status ?? cur.status, patch.notes ?? cur.notes, at, id);
}

export function insertEnquiry(input: {
  name: string;
  email: string;
  message: string;
  source?: string;
}): EnquiryRecord {
  const at = nowIso();
  const id = newId("enq");
  getDb()
    .prepare(
      `INSERT INTO enquiries
       (id, name, email, message, source, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'new', '', ?, ?)`,
    )
    .run(id, input.name, input.email, input.message, input.source || "contact", at, at);
  return {
    id,
    name: input.name,
    email: input.email,
    message: input.message,
    source: input.source || "contact",
    status: "new",
    notes: "",
    createdAt: at,
    updatedAt: at,
  };
}

export function listSubscribers(opts?: { q?: string; status?: string }) {
  let sql = `SELECT id, email, status, source, consent_at AS consentAt, created_at AS createdAt
             FROM newsletter_subscribers WHERE 1=1`;
  const params: string[] = [];
  if (opts?.status) {
    sql += ` AND status = ?`;
    params.push(opts.status);
  }
  if (opts?.q?.trim()) {
    sql += ` AND email LIKE ?`;
    params.push(`%${opts.q.trim()}%`);
  }
  sql += ` ORDER BY created_at DESC`;
  return getDb().prepare(sql).all(...params) as SubscriberRecord[];
}

export function upsertSubscriber(email: string, source = "website"): SubscriberRecord {
  const db = getDb();
  const normalized = email.toLowerCase();
  const existing = db
    .prepare(`SELECT * FROM newsletter_subscribers WHERE email = ?`)
    .get(normalized) as
    | {
        id: string;
        email: string;
        status: string;
        source: string;
        consent_at: string;
        created_at: string;
      }
    | undefined;
  if (existing) {
    if (existing.status !== "subscribed") {
      db.prepare(
        `UPDATE newsletter_subscribers SET status = 'subscribed', consent_at = ? WHERE id = ?`,
      ).run(nowIso(), existing.id);
    }
    return {
      id: existing.id,
      email: existing.email,
      status: "subscribed",
      source: existing.source,
      consentAt: existing.consent_at,
      createdAt: existing.created_at,
    };
  }
  const at = nowIso();
  const id = newId("sub");
  db.prepare(
    `INSERT INTO newsletter_subscribers (id, email, status, source, consent_at, created_at)
     VALUES (?, ?, 'subscribed', ?, ?, ?)`,
  ).run(id, normalized, source, at, at);
  return {
    id,
    email: normalized,
    status: "subscribed",
    source,
    consentAt: at,
    createdAt: at,
  };
}

export function setSubscriberStatus(
  id: string,
  status: "subscribed" | "unsubscribed",
) {
  getDb()
    .prepare(`UPDATE newsletter_subscribers SET status = ? WHERE id = ?`)
    .run(status, id);
}
