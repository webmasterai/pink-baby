import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catalogProducts,
  getCatalogProductsByCategory,
} from "../content/catalog";
import {
  getFeaturedProducts,
  getProductBySlug,
  searchProducts,
} from "../content/products";

describe("product content layer", () => {
  it("imports the public catalog snapshot", () => {
    assert.equal(catalogProducts.length, 118);
    assert.ok(getCatalogProductsByCategory("accessories").length === 16);
    assert.ok(getCatalogProductsByCategory("feeding-bottles").length === 54);
  });

  it("exposes featured products for the homepage", () => {
    const featured = getFeaturedProducts();
    assert.ok(featured.length >= 4);
  });

  it("finds products by slug and search", () => {
    const sample = catalogProducts[0];
    assert.ok(sample);
    const product = getProductBySlug(sample.slug);
    assert.ok(product);
    const results = searchProducts("bottle");
    assert.ok(results.length >= 1);
  });

  it("keeps PKR pricing from the source catalog when present", () => {
    const priced = catalogProducts.filter((p) => p.pricing?.price != null);
    assert.ok(priced.length > 0);
    assert.equal(priced[0]?.pricing?.currency, "PKR");
  });
});
