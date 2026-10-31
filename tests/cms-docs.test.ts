import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureCmsReady } from "../lib/cms/runtime.ts";
import { getDocument, saveDraft, publishDocument } from "../lib/cms/documents.ts";
import { listCmsProducts } from "../lib/cms/products.ts";
import { listCmsCategories, productCountForCategory } from "../lib/cms/categories.ts";

describe("cms foundation", () => {
  it("seeds documents and catalog without wiping", () => {
    ensureCmsReady();
    const home = getDocument("home");
    assert.ok(home);
    assert.equal(home!.docKey, "home");
    assert.ok(home!.published);
    const products = listCmsProducts({ includeArchived: true });
    assert.ok(products.length > 50);
    const cats = listCmsCategories();
    assert.ok(cats.length > 0);
    const feeding = cats.find((c) => c.slug === "feeding-bottles");
    if (feeding) {
      assert.ok(productCountForCategory(feeding.slug) >= 0);
    }
  });

  it("draft publish conflict token flow", () => {
    ensureCmsReady();
    const before = getDocument("home")!;
    const draft = saveDraft({
      docKey: "home",
      payload: before.draft ?? before.published,
      actorId: "test-actor",
      conflictToken: before.conflictToken,
    });
    assert.notEqual(draft.conflictToken, before.conflictToken);
    const published = publishDocument({
      docKey: "home",
      actorId: "test-actor",
      conflictToken: draft.conflictToken,
    });
    assert.ok(published.publishedRevision >= 1);
  });
});
