import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressManager } from "@/components/account/AddressManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account");

  const addresses = getDb()
    .prepare(
      `SELECT id, label, full_name AS fullName, phone, line1, line2, city, province,
              postal_code AS postalCode, is_default AS isDefault
       FROM addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC`,
    )
    .all(user.id) as Array<{
    id: string;
    label: string | null;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    isDefault: number;
  }>;

  return (
    <div className="pb-container py-10 md:py-12">
      <PageHeader title="Saved addresses" description="Used for faster checkout." />
      <AddressManager initial={addresses} />
    </div>
  );
}
