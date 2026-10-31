import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertBodySize,
  contactSchema,
  newsletterSchema,
  sanitizeText,
} from "../lib/validation";

describe("newsletterSchema", () => {
  it("accepts a valid email", () => {
    const result = newsletterSchema.safeParse({ email: "Parent@Example.com" });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.email, "parent@example.com");
  });

  it("rejects invalid email", () => {
    const result = newsletterSchema.safeParse({ email: "not-an-email" });
    assert.equal(result.success, false);
  });
});

describe("contactSchema", () => {
  it("accepts a complete message", () => {
    const result = contactSchema.safeParse({
      name: "Aisha Khan",
      email: "aisha@example.com",
      message: "I would like help choosing a feeding bottle.",
    });
    assert.equal(result.success, true);
  });

  it("rejects short messages", () => {
    const result = contactSchema.safeParse({
      name: "Aisha",
      email: "aisha@example.com",
      message: "Hi",
    });
    assert.equal(result.success, false);
  });
});

describe("sanitizeText / body size", () => {
  it("strips control characters", () => {
    assert.equal(sanitizeText("Hello\u0000 there"), "Hello there");
  });

  it("throws when body is too large", () => {
    assert.throws(() => assertBodySize("x".repeat(20), 10));
  });
});
