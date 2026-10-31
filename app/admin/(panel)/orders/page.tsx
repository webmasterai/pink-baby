import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import { listAllOrders } from "@/lib/commerce/orders";

export default function AdminOrdersPage() {
  const orders = listAllOrders(200).map((o) => ({
    reference: o.reference,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    totalPkr: o.totalPkr,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    createdAt: o.createdAt,
    itemCount: o.items.length,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Controlled status transitions. Line prices on placed orders are never rewritten.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AdminOrdersClient initial={orders} />
      </div>
    </div>
  );
}
