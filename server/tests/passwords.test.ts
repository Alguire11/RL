import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../passwords";

// These tests give us fast feedback that the shared password helpers behave as expected.
describe("password helpers", () => {
  test("verifyPassword returns true for matching hashes", async () => {
    const hashed = await hashPassword("super-secret");
    const matches = await verifyPassword("super-secret", hashed);
    assert.equal(matches, true);
  });

  test("verifyPassword rejects mismatched passwords", async () => {
    const hashed = await hashPassword("correct-horse");
    const matches = await verifyPassword("battery-staple", hashed);
    assert.equal(matches, false);
  });

  test("hashPassword generates unique salts", async () => {
    const first = await hashPassword("repeatable");
    const second = await hashPassword("repeatable");
    assert.notEqual(first, second, "expected unique salt per hash");
  });

  test("verifyPassword throws for malformed hashes", async () => {
    await assert.rejects(() => verifyPassword("whatever", "totally-invalid-hash"));
  });
});
