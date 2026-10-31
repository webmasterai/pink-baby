import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displaySku,
  parseProductDescription,
} from "../lib/product-content.ts";

describe("parseProductDescription", () => {
  it("extracts specs and headings from wall text", () => {
    const raw =
      "Further Details Quantity : 1 GLASS FEEDING BOTTLE Capacity : 240 ml Soft teat. Increased Comfort by Ergonomic Shape The bottle is easy to hold. Easy To Use, Clean and Assemble Wide necks help cleaning.";
    const parsed = parseProductDescription(raw);
    assert.ok(parsed.specs.some((s) => /quantity/i.test(s.label)));
    assert.ok(parsed.specs.some((s) => /capacity/i.test(s.label) && /240/i.test(s.value)));
    assert.ok(parsed.blocks.some((b) => b.type === "heading"));
    assert.ok(parsed.blocks.some((b) => b.type === "paragraph"));
  });

  it("sanitizes entities", () => {
    const parsed = parseProductDescription("Baby&#8217;s bottle &amp; teat");
    assert.match(parsed.plain, /Baby's bottle & teat/);
  });
});

describe("displaySku", () => {
  it("falls back to parenthetical name code", () => {
    assert.equal(displaySku(null, "BOTTLE (SNG-123)"), "SNG-123");
    assert.equal(displaySku("REAL", "BOTTLE (SNG-123)"), "REAL");
  });
});
