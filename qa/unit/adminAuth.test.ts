import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Hashes made by the real script, checked by the real login code.
const output = execFileSync("node", ["scripts/admin-password.mjs", "Alissa@Bunks.com", "matt@bunks.com"], {
  encoding: "utf8",
});
const passwordOf = (email: string) => output.match(new RegExp(`^  ${email}\\s+(\\S+)$`, "m"))?.[1] ?? "";
const hashesLine = output.split("\n").find((line) => line.startsWith("alissa@bunks.com:scrypt.")) ?? "";
const alissa = passwordOf("alissa@bunks.com");
const matt = passwordOf("matt@bunks.com");

process.env.ADMIN_EMAILS = "ali@bunks.com,matt@bunks.com,alissa@bunks.com";
process.env.ADMIN_SESSION_SECRET = "unit-test-session-secret-0123456789abcdef";
process.env.ADMIN_PASSWORD = "shared-password";
process.env.ADMIN_PASSWORD_HASHES = `${hashesLine},stranger@example.com:${hashesLine.split(":")[1].split(",")[0]}`;
const auth = import("@/lib/adminAuth");

test("script makes one strong password per email and a pasteable value", () => {
  assert.match(alissa, /^([a-zA-Z2-9]{5}-){4}[a-zA-Z2-9]{5}$/);
  assert.notEqual(alissa, matt);
  assert.match(hashesLine, /^alissa@bunks\.com:scrypt\.[\w-]+\.[\w-]+,matt@bunks\.com:scrypt\.[\w-]+\.[\w-]+$/);
});

test("each person signs in with their own password only", async () => {
  const { isValidAdminCredentials } = await auth;
  assert.equal(await isValidAdminCredentials("alissa@bunks.com", alissa), true);
  assert.equal(await isValidAdminCredentials(" Alissa@Bunks.com ", alissa), true);
  assert.equal(await isValidAdminCredentials("matt@bunks.com", matt), true);
  assert.equal(await isValidAdminCredentials("alissa@bunks.com", matt), false);
  assert.equal(await isValidAdminCredentials("alissa@bunks.com", "shared-password"), false);
  assert.equal(await isValidAdminCredentials("alissa@bunks.com", ""), false);
});

test("people without their own entry still use the shared password", async () => {
  const { isValidAdminCredentials } = await auth;
  assert.equal(await isValidAdminCredentials("ali@bunks.com", "shared-password"), true);
  assert.equal(await isValidAdminCredentials("ali@bunks.com", alissa), false);
});

test("a hash entry alone does not make someone an admin", async () => {
  const { isValidAdminCredentials } = await auth;
  assert.equal(await isValidAdminCredentials("stranger@example.com", alissa), false);
});

test("removing the shared password locks out only people without their own", async () => {
  const { isValidAdminCredentials, isAdminAuthConfigured } = await auth;
  const shared = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "";
  try {
    assert.equal(isAdminAuthConfigured(), true);
    assert.equal(await isValidAdminCredentials("alissa@bunks.com", alissa), true);
    // Outside production the dev fallback password applies; production has none.
    assert.equal(await isValidAdminCredentials("ali@bunks.com", "shared-password"), false);
  } finally {
    process.env.ADMIN_PASSWORD = shared;
  }
});

test("a damaged entry locks that person out instead of falling back", async () => {
  const { isValidAdminCredentials } = await auth;
  const hashes = process.env.ADMIN_PASSWORD_HASHES;
  process.env.ADMIN_PASSWORD_HASHES = "alissa@bunks.com:scrypt.bad";
  try {
    assert.equal(await isValidAdminCredentials("alissa@bunks.com", alissa), false);
    assert.equal(await isValidAdminCredentials("alissa@bunks.com", "shared-password"), false);
    assert.equal(await isValidAdminCredentials("ali@bunks.com", "shared-password"), true);
  } finally {
    process.env.ADMIN_PASSWORD_HASHES = hashes;
  }
});
