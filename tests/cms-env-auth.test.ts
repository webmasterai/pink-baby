import assert from "node:assert/strict";
import { describe, it, before, after, beforeEach } from "node:test";
import { hashPassword } from "../lib/auth/password";
import {
  getCmsEnvAuthConfig,
  isBcryptPasswordHash,
  resetCmsEnvAuthLogState,
  verifyCmsEnvCredentials,
} from "../lib/cms/env-auth";
import {
  buildCmsAdminUser,
  createCmsSessionToken,
  verifyCmsSessionToken,
} from "../lib/cms/cms-session";
import { adminLoginSchema } from "../lib/validation";

const PREV = {
  CMS_ADMIN_USERNAME: process.env.CMS_ADMIN_USERNAME,
  CMS_ADMIN_PASSWORD_HASH: process.env.CMS_ADMIN_PASSWORD_HASH,
  CMS_SESSION_SECRET: process.env.CMS_SESSION_SECRET,
};

const USERNAME = "cms-owner@pinkbaby.test";
const PASSWORD = "CorrectPass99!";
let passwordHash = "";

describe("CMS env auth", () => {
  before(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });

  beforeEach(() => {
    resetCmsEnvAuthLogState();
    process.env.CMS_ADMIN_USERNAME = USERNAME;
    process.env.CMS_ADMIN_PASSWORD_HASH = passwordHash;
    process.env.CMS_SESSION_SECRET = "test-cms-session-secret-at-least-32-chars";
  });

  after(() => {
    for (const [key, value] of Object.entries(PREV)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    resetCmsEnvAuthLogState();
  });

  it("accepts bcrypt hashes and rejects plaintext", () => {
    assert.equal(isBcryptPasswordHash(passwordHash), true);
    assert.equal(isBcryptPasswordHash("CorrectPass99!"), false);
    assert.equal(isBcryptPasswordHash("plaintext-looking-but-long-enough"), false);
  });

  it("loads config when all variables are valid", () => {
    const config = getCmsEnvAuthConfig();
    assert.ok(config);
    assert.equal(config.username, USERNAME);
  });

  it("returns null and does not treat plaintext as a hash", () => {
    process.env.CMS_ADMIN_PASSWORD_HASH = PASSWORD;
    resetCmsEnvAuthLogState();
    assert.equal(getCmsEnvAuthConfig(), null);
  });

  it("accepts correct credentials and rejects incorrect ones", async () => {
    assert.equal(await verifyCmsEnvCredentials(USERNAME, PASSWORD), true);
    assert.equal(await verifyCmsEnvCredentials(USERNAME, "WrongPass99!"), false);
    assert.equal(
      await verifyCmsEnvCredentials("other@pinkbaby.test", PASSWORD),
      false,
    );
  });

  it("issues a verifiable CMS session token that persists", async () => {
    const token = await createCmsSessionToken(USERNAME);
    const user = await verifyCmsSessionToken(token);
    assert.ok(user);
    assert.equal(user.role, "owner");
    assert.equal(user.id, "cms-env-admin");
    assert.equal(user.email, USERNAME.toLowerCase());
    const again = await verifyCmsSessionToken(token);
    assert.deepEqual(again, user);
  });

  it("rejects forged or wrong-secret tokens", async () => {
    const token = await createCmsSessionToken(USERNAME);
    process.env.CMS_SESSION_SECRET =
      "different-cms-session-secret-32chars-min!!";
    resetCmsEnvAuthLogState();
    assert.equal(await verifyCmsSessionToken(token), null);
  });

  it("builds a staff SessionUser for capability checks", () => {
    const user = buildCmsAdminUser("ops");
    assert.equal(user.role, "owner");
    assert.equal(user.email, "ops@cms.local");
  });

  it("parses admin login username or email field", () => {
    const byUsername = adminLoginSchema.safeParse({
      username: "admin",
      password: "x",
    });
    assert.equal(byUsername.success, true);
    if (byUsername.success) assert.equal(byUsername.data.username, "admin");

    const byEmail = adminLoginSchema.safeParse({
      email: "a@b.co",
      password: "x",
    });
    assert.equal(byEmail.success, true);
    if (byEmail.success) assert.equal(byEmail.data.username, "a@b.co");

    const missing = adminLoginSchema.safeParse({ password: "x" });
    assert.equal(missing.success, false);
  });

  it("rejects invalid tokens (unauthorized session)", async () => {
    assert.equal(await verifyCmsSessionToken(""), null);
    assert.equal(await verifyCmsSessionToken("not.a.jwt"), null);
  });
});
