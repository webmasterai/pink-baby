import { promises as fs } from "fs";
import path from "path";
import type { ContactRecord, NewsletterRecord } from "@/lib/types";

function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM,
  );
}

export async function saveNewsletterSubscriber(
  email: string,
): Promise<{ created: boolean; record: NewsletterRecord }> {
  const { ensureCmsReady } = await import("@/lib/cms/runtime");
  const { upsertSubscriber, listSubscribers } = await import("@/lib/cms/enquiries");
  ensureCmsReady();
  const before = listSubscribers({ q: email }).find(
    (s) => s.email === email.toLowerCase() && s.status === "subscribed",
  );
  const row = upsertSubscriber(email, "website");
  const record: NewsletterRecord = {
    email: row.email,
    createdAt: row.createdAt,
    source: "website",
  };
  // Keep JSON mirror for backup compatibility
  const file = path.join(dataDir(), "newsletter-subscribers.json");
  const list = await readJsonArray<NewsletterRecord>(file);
  if (!list.some((r) => r.email === record.email)) {
    list.push(record);
    await writeJsonAtomic(file, list);
  }
  return { created: !before, record };
}

export async function saveContactEnquiry(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactRecord> {
  const { ensureCmsReady } = await import("@/lib/cms/runtime");
  const { insertEnquiry } = await import("@/lib/cms/enquiries");
  ensureCmsReady();
  const row = insertEnquiry(input);
  const record: ContactRecord = {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.createdAt,
  };
  const file = path.join(dataDir(), "contact-enquiries.json");
  const list = await readJsonArray<ContactRecord>(file);
  list.push(record);
  await writeJsonAtomic(file, list);
  return record;
}
