import { getCatalogProductById } from "@/content/catalog";

export type CartLineInput = {
  productId: string;
  quantity: number;
  variantKey?: string;
  /** Client-claimed unit price — ignored for totals; used only to detect tampering. */
  claimedUnitPrice?: number | null;
};

export type PricedLine = {
  productId: string;
  productSlug: string;
  productName: string;
  sku: string | null;
  variantKey: string;
  variantLabel: string | null;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
  available: boolean;
  image: string;
};

export type CartValidationResult = {
  ok: boolean;
  lines: PricedLine[];
  subtotalPkr: number;
  errors: string[];
  tamperDetected: boolean;
};

function parseVariantLabel(variantKey: string): string | null {
  if (!variantKey) return null;
  try {
    const parsed = JSON.parse(variantKey) as Record<string, string>;
    const parts = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join(", ") : null;
  } catch {
    return variantKey;
  }
}

/** Authoritative cart pricing from catalog. Never trusts client prices. */
export function validateCartLines(inputs: CartLineInput[]): CartValidationResult {
  const errors: string[] = [];
  let tamperDetected = false;
  const lines: PricedLine[] = [];

  for (const input of inputs) {
    const qty = Math.floor(Number(input.quantity));
    if (!input.productId || !Number.isFinite(qty) || qty < 1) {
      errors.push("Invalid cart line.");
      continue;
    }
    if (qty > 99) {
      errors.push(`Quantity for ${input.productId} exceeds the limit of 99.`);
      continue;
    }

    const product = getCatalogProductById(input.productId);
    if (!product) {
      errors.push(`Product ${input.productId} is no longer available.`);
      continue;
    }

    const unit = product.pricing?.price;
    if (unit == null || !Number.isFinite(unit)) {
      errors.push(`${product.name} has no catalog price and cannot be checked out.`);
      continue;
    }

    if (
      input.claimedUnitPrice != null &&
      Number.isFinite(input.claimedUnitPrice) &&
      Math.round(input.claimedUnitPrice) !== Math.round(unit)
    ) {
      tamperDetected = true;
      errors.push(`Price mismatch detected for ${product.name}.`);
    }

    if (!product.available) {
      errors.push(`${product.name} is currently out of stock.`);
    }

    const variantKey = input.variantKey || "";
    lines.push({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      sku: product.sku,
      variantKey,
      variantLabel: parseVariantLabel(variantKey),
      quantity: qty,
      unitPricePkr: Math.round(unit),
      lineTotalPkr: Math.round(unit) * qty,
      available: product.available,
      image: product.image,
    });
  }

  // Merge identical product+variant
  const merged = new Map<string, PricedLine>();
  for (const line of lines) {
    const key = `${line.productId}::${line.variantKey}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + line.quantity);
      existing.lineTotalPkr = existing.unitPricePkr * existing.quantity;
    } else {
      merged.set(key, { ...line });
    }
  }

  const finalLines = [...merged.values()];
  const subtotalPkr = finalLines.reduce((s, l) => s + l.lineTotalPkr, 0);
  const ok = errors.length === 0 && finalLines.length > 0;

  return { ok, lines: finalLines, subtotalPkr, errors, tamperDetected };
}
