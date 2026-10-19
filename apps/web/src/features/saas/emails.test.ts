import { describe, expect, it } from "vitest";
import { parseEmails } from "./emails.ts";

describe("parseEmails", () => {
  it("reads one address per line, lower-cased and trimmed", () => {
    expect(parseEmails("  Anita@Acme.com \nravi@acme.com\r\n\n")).toEqual({ emails: ["anita@acme.com", "ravi@acme.com"], errors: [] });
  });
  it("also accepts commas and semicolons", () => {
    expect(parseEmails("a@x.co, b@x.co; c@x.co").emails).toEqual(["a@x.co", "b@x.co", "c@x.co"]);
  });
  it("names the line of a bad address and of a repeat", () => {
    const result = parseEmails("good@x.co\nnot-an-email\nGOOD@x.co");
    expect(result.emails).toEqual(["good@x.co"]);
    expect(result.errors).toEqual(['Line 2: "not-an-email" is not an email address.', "Line 3: good@x.co is listed more than once."]);
  });
  it("is empty for nothing", () => {
    expect(parseEmails("  \n ")).toEqual({ emails: [], errors: [] });
  });
});
