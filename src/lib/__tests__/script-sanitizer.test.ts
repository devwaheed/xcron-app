import { describe, it, expect } from "vitest";
import { sanitizeScript } from "@/lib/script-sanitizer";

describe("script-sanitizer", () => {
  it("accepts valid scripts", () => {
    const result = sanitizeScript('console.log("hello");');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty scripts", () => {
    const result = sanitizeScript("");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("required");
  });

  it("rejects scripts with eval()", () => {
    const result = sanitizeScript('eval("alert(1)")');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("eval");
  });

  it("rejects scripts with child_process", () => {
    const result = sanitizeScript('const cp = require("child_process");');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("child_process"))).toBe(true);
  });

  it("rejects scripts referencing server secrets", () => {
    const result = sanitizeScript('const key = process.env.GITHUB_PAT;');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("secrets");
  });

  it("rejects Function constructor", () => {
    const result = sanitizeScript('new Function("return 1")()');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Function constructor");
  });

  it("rejects scripts over 50KB", () => {
    const bigScript = "x".repeat(51_000);
    const result = sanitizeScript(bigScript);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("maximum size");
  });

  it("passes through content unchanged (validation only)", () => {
    const input = 'console.log("ok");\n\tindented();';
    const result = sanitizeScript(input);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(input);
  });

  it("allows fetch and async/await", () => {
    const result = sanitizeScript('const res = await fetch("https://api.example.com"); console.log(res.status);');
    expect(result.valid).toBe(true);
  });

  it("allows process.env for non-secret vars", () => {
    const result = sanitizeScript('const url = process.env.API_URL;');
    expect(result.valid).toBe(true);
  });
});
