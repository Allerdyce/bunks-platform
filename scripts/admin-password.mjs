#!/usr/bin/env node
// Makes a strong admin password for each email given, and the ADMIN_PASSWORD_HASHES value for Vercel.
//   node scripts/admin-password.mjs alissa@bunks.com [matt@bunks.com …]
// The passwords appear only on this screen: save each one in 1Password and share it from there.
// The scrypt settings must match getAdminPasswordHashes in src/lib/adminAuth.ts.
import crypto from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
// No 0/O, 1/l/I: easy to read aloud or retype. 5 groups of 5 is about 144 bits.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const emails = process.argv.slice(2).map((email) => email.trim().toLowerCase());
if (!emails.length || emails.some((email) => !/^[^\s@:,]+@[^\s@:,]+$/.test(email))) {
  console.error("Usage: node scripts/admin-password.mjs <email> [<email> …]");
  process.exit(1);
}

const makePassword = () =>
  Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("")
  ).join("-");

const rows = emails.map((email) => {
  const password = makePassword();
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return { email, password, entry: `${email}:scrypt.${salt.toString("base64url")}.${hash.toString("base64url")}` };
});

console.log("\nNew admin passwords (shown once; save each in 1Password, then clear this screen):\n");
for (const { email, password } of rows) console.log(`  ${email.padEnd(24)} ${password}`);
console.log("\nVercel → Settings → Environment Variables → ADMIN_PASSWORD_HASHES (Sensitive, Production).");
console.log("To add someone to an existing value, put a comma and their entry on the end.\n");
console.log(rows.map((row) => row.entry).join(","));
console.log();
