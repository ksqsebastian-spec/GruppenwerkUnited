import { describe, it, expect } from "vitest";
import { validateForm } from "../../types";

const base = {
  name: "",
  email: "",
  candidateName: "",
};

describe("validateForm", () => {
  it("accepts valid name, email, and candidateName", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa Schmidt",
      email: "lisa@example.com",
      candidateName: "Tim Wagner",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("accepts names with umlauts and special characters", () => {
    const errors = validateForm({
      ...base,
      name: "Müller-Straße Öztürk",
      email: "test@test.de",
      candidateName: "René Bélanger",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("rejects names with numbers", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa123",
      email: "lisa@example.com",
      candidateName: "Tim Wagner",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects names with special symbols", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa@Schmidt",
      email: "lisa@example.com",
      candidateName: "Tim Wagner",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects names exceeding 80 characters", () => {
    const errors = validateForm({
      ...base,
      name: "A".repeat(81),
      email: "lisa@example.com",
      candidateName: "Tim Wagner",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects empty name", () => {
    const errors = validateForm({
      ...base,
      name: "",
      email: "lisa@example.com",
      candidateName: "Tim Wagner",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects invalid email", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "not-an-email",
      candidateName: "Tim Wagner",
    });
    expect(errors.email).toBeDefined();
  });

  it("rejects email exceeding 120 characters", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "a".repeat(110) + "@example.com",
      candidateName: "Tim Wagner",
    });
    expect(errors.email).toBeDefined();
  });

  it("rejects empty email", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "",
      candidateName: "Tim Wagner",
    });
    expect(errors.email).toBeDefined();
  });

  it("rejects empty candidateName", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      candidateName: "",
    });
    expect(errors.candidateName).toBeDefined();
  });

  it("rejects candidateName with numbers", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      candidateName: "Tim123",
    });
    expect(errors.candidateName).toBeDefined();
  });

  it("rejects candidateName exceeding 80 characters", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      candidateName: "A".repeat(81),
    });
    expect(errors.candidateName).toBeDefined();
  });
});
