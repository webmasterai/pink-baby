"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id || ""));
  return <ProductForm key={id} productId={id} />;
}
