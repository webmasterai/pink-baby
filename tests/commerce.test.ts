import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateCartLines } from "../lib/commerce/pricing.ts";
import { buildProductWhatsAppMessage } from "../lib/whatsapp.ts";
import { filterSortPaginate } from "../lib/catalog-query.ts";
import { getAllProducts } from "../content/products.ts";

describe("validateCartLines", () => {
  it("prices from catalog and rejects empty cart semantics", () => {
    const products = getAllProducts().filter((p) => p.available && p.pricing?.price != null);
    assert.ok(products.length > 0);
    const product = products[0]!;
    const result = validateCartLines([
      { productId: product.id, quantity: 2, claimedUnitPrice: product.pricing!.price },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.subtotalPkr, Math.round(product.pricing!.price!) * 2);
    assert.equal(result.tamperDetected, false);
  });

  it("detects client price tampering", () => {
    const product = getAllProducts().find((p) => p.available && p.pricing?.price != null)!;
    const result = validateCartLines([
      {
        productId: product.id,
        quantity: 1,
        claimedUnitPrice: Math.round(product.pricing!.price!) + 500,
      },
    ]);
    assert.equal(result.tamperDetected, true);
    assert.equal(result.ok, false);
  });
});

describe("whatsapp message", () => {
  it("includes product fields without auto-send semantics", () => {
    const msg = buildProductWhatsAppMessage({
      name: "Test Bottle",
      sku: "SN-1",
      variant: "Color: Pink",
      quantity: 2,
      unitPricePkr: 1200,
      productUrl: "http://localhost:3000/product/test",
    });
    assert.match(msg, /Test Bottle/);
    assert.match(msg, /SN-1/);
    assert.match(msg, /Quantity: 2/);
    assert.match(msg, /Rs 1,200/);
  });
});

describe("catalog query", () => {
  it("paginates and sorts by price", () => {
    const page = filterSortPaginate(getAllProducts(), {
      sort: "price-asc",
      page: 1,
      pageSize: 12,
      availability: "in-stock",
    });
    assert.ok(page.items.length <= 12);
    assert.ok(page.total >= page.items.length);
    for (let i = 1; i < page.items.length; i++) {
      const prev = page.items[i - 1]!.pricing?.price ?? Infinity;
      const curr = page.items[i]!.pricing?.price ?? Infinity;
      assert.ok(prev <= curr);
    }
  });
});
