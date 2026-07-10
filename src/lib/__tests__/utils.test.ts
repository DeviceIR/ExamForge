import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDuration,
  toFaDigits,
  clamp,
  shuffle,
  seededRandom,
} from "@/lib/utils";

describe("formatTime", () => {
  it("formats MM:SS", () => {
    expect(formatTime(65)).toBe("01:05");
  });
  it("formats HH:MM:SS when over an hour", () => {
    expect(formatTime(3661)).toBe("01:01:01");
  });
  it("clamps negatives to zero", () => {
    expect(formatTime(-5)).toBe("00:00");
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(4320)).toBe("1h 12m");
  });
  it("formats minutes only", () => {
    expect(formatDuration(2700)).toBe("45m");
  });
  it("formats seconds when under a minute", () => {
    expect(formatDuration(30)).toBe("30s");
  });
});

describe("toFaDigits", () => {
  it("converts latin digits to Persian", () => {
    expect(toFaDigits(1402)).toBe("۱۴۰۲");
  });
});

describe("clamp", () => {
  it("bounds within range", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});

describe("shuffle", () => {
  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, seededRandom(42));
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual(arr);
  });
  it("is deterministic with a seeded rng", () => {
    const a = shuffle([1, 2, 3, 4, 5], seededRandom("seed"));
    const b = shuffle([1, 2, 3, 4, 5], seededRandom("seed"));
    expect(a).toEqual(b);
  });
});
