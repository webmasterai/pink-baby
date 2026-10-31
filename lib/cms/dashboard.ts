import { getDb } from "@/lib/db";
import { listEnquiries, listSubscribers } from "@/lib/cms/enquiries";
import { listCmsProducts } from "@/lib/cms/products";
import { listCmsCategories } from "@/lib/cms/categories";
import { listMedia } from "@/lib/cms/media";
import { listAllOrders } from "@/lib/commerce/orders";
import { ensureCmsReady } from "@/lib/cms/runtime";

export function getDashboardStats() {
  ensureCmsReady();
  const db = getDb();
  const products = listCmsProducts({ includeArchived: true });
  const categories = listCmsCategories();
  const orders = listAllOrders(8);
  const enquiries = listEnquiries();
  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const subscribers = listSubscribers({ status: "subscribed" });
  const media = listMedia();
  const pendingReviews = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM reviews WHERE status = 'pending'`)
      .get() as { c: number }
  ).c;
  const customers = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer'`)
      .get() as { c: number }
  ).c;
  const pages = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM cms_documents WHERE doc_key LIKE 'page:%'`,
      )
      .get() as { c: number }
  ).c;

  const recentProducts = products.slice(0, 6).map((p) => ({
    name: p.name,
    category: p.primaryCategorySlug || "—",
    status: p.status.toUpperCase(),
  }));

  const recentEnquiries = enquiries.slice(0, 6).map((e) => ({
    name: e.name,
    type: e.source,
    subject: e.message.slice(0, 80),
  }));

  return {
    cards: [
      { label: "Total Products", value: products.filter((p) => p.status !== "archived").length },
      { label: "Categories", value: categories.length },
      { label: "Pages", value: pages },
      { label: "Contact Inquiries", value: enquiries.length },
      { label: "Customers", value: customers },
      { label: "Media Files", value: media.length },
      { label: "Subscribers", value: subscribers.length },
      { label: "New Inquiries", value: newEnquiries.length },
      { label: "Pending Reviews", value: pendingReviews },
      { label: "Orders", value: listAllOrders(500).length },
    ],
    recentEnquiries,
    recentProducts,
    recentOrders: orders.map((o) => ({
      reference: o.reference,
      customer: o.customerName,
      status: o.status,
      totalPkr: o.totalPkr,
    })),
  };
}
