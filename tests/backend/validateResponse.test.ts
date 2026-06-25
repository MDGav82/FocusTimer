import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { validateResponse, validateResponseList } from "@/backend/validateResponse";

const Schema = z.object({ id: z.string(), count: z.number() });

describe("validateResponse", () => {
  it("returns the data unchanged when it matches the schema", () => {
    const data = { id: "abc", count: 1 };
    expect(validateResponse(Schema, data)).toBe(data);
  });

  it("throws when the data does not match the schema", () => {
    expect(() => validateResponse(Schema, { id: "abc" })).toThrow();
  });
});

describe("validateResponseList", () => {
  it("returns the list unchanged when every item matches the schema", () => {
    const data = [{ id: "a", count: 1 }, { id: "b", count: 2 }];
    expect(validateResponseList(Schema, data)).toBe(data);
  });

  it("throws when any item does not match the schema", () => {
    const data = [{ id: "a", count: 1 }, { id: "b", count: "nope" }];
    expect(() => validateResponseList(Schema, data)).toThrow();
  });

  it("does not throw for an empty list", () => {
    expect(validateResponseList(Schema, [])).toEqual([]);
  });
});
