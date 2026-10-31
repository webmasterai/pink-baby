import { siteConfig } from "@/content/site";

export type WhatsAppOrderLine = {
  name: string;
  sku?: string | null;
  variant?: string | null;
  quantity: number;
  unitPricePkr: number | null;
  productUrl: string;
};

function formatPrice(amount: number | null): string {
  if (amount == null || Number.isNaN(amount)) return "Price TBC";
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

/** Build a wa.me URL with a prefilled message. Never sends automatically. */
export function buildWhatsAppUrl(message: string): string {
  const phone = siteConfig.contact.whatsapp.e164;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildProductWhatsAppMessage(line: WhatsAppOrderLine): string {
  const lines = [
    `Hello Pink Baby, I'd like to order:`,
    ``,
    `Product: ${line.name}`,
    line.sku ? `SKU: ${line.sku}` : null,
    line.variant ? `Option: ${line.variant}` : null,
    `Quantity: ${line.quantity}`,
    `Price: ${formatPrice(line.unitPricePkr)}`,
    `Link: ${line.productUrl}`,
    ``,
    `Please confirm availability and delivery.`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function productWhatsAppHref(line: WhatsAppOrderLine): string {
  return buildWhatsAppUrl(buildProductWhatsAppMessage(line));
}
