import { describe, it, expect } from "vitest";
import { generateMailtoLink } from "../generateMailtoLink";

const sampleData = {
  name: "Lisa Schmidt",
  email: "lisa@example.com",
  candidateName: "Tim Wagner",
  refCode: "#SEE-REC-2026-1234",
};

describe("generateMailtoLink", () => {
  it("starts with mailto: and has no recipient", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toMatch(/^mailto:\?/);
  });

  it("includes the encoded subject", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(
      "subject=" +
        encodeURIComponent("Empfehlung – Seehafer Elemente Fachkräfte"),
    );
  });

  it("includes the name in the body", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(encodeURIComponent("Lisa Schmidt"));
  });

  it("includes the email in the body", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(encodeURIComponent("lisa@example.com"));
  });

  it("includes the ref code in the body", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(encodeURIComponent("#SEE-REC-2026-1234"));
  });

  it("includes the candidate name in the body", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(encodeURIComponent("Tim Wagner"));
  });

  it("properly URL-encodes special characters", () => {
    const link = generateMailtoLink({
      name: "Müller-Öß",
      email: "test@test.de",
      candidateName: "René Bélanger",
      refCode: "#SEE-REC-2026-0001",
    });
    expect(link).not.toContain(" ");
    expect(link).toContain(encodeURIComponent("Müller-Öß"));
  });

  it("includes karriere link in the body", () => {
    const link = generateMailtoLink(sampleData);
    expect(link).toContain(
      encodeURIComponent("https://seehafer-elemente.de/karriere"),
    );
  });
});
