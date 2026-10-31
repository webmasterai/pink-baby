import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkRateLimit } from "../lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const opts = { limit: 2, windowMs: 60_000 };
    assert.equal(checkRateLimit(key, opts).ok, true);
    assert.equal(checkRateLimit(key, opts).ok, true);
    const blocked = checkRateLimit(key, opts);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });
});
