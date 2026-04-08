import { describe, it, expect } from "vitest";
import { validateForm } from "../../types";

const base = {
  name: "",
  email: "",
  noPaypal: false,
  iban: "",
  kontoinhaber: "",
};

describe("validateForm", () => {
  it("accepts valid name and email", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa Schmidt",
      email: "lisa@example.com",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("accepts names with umlauts and special characters", () => {
    const errors = validateForm({
      ...base,
      name: "Müller-Straße Öztürk",
      email: "test@test.de",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("accepts names with accented characters", () => {
    const errors = validateForm({
      ...base,
      name: "René Bélanger",
      email: "test@test.de",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("rejects names with numbers", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa123",
      email: "lisa@example.com",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects names with special symbols", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa@Schmidt",
      email: "lisa@example.com",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects names exceeding 80 characters", () => {
    const errors = validateForm({
      ...base,
      name: "A".repeat(81),
      email: "lisa@example.com",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects empty name", () => {
    const errors = validateForm({
      ...base,
      name: "",
      email: "lisa@example.com",
    });
    expect(errors.name).toBeDefined();
  });

  it("rejects invalid email", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "not-an-email",
    });
    expect(errors.email).toBeDefined();
  });

  it("rejects email exceeding 120 characters", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "a".repeat(110) + "@example.com",
    });
    expect(errors.email).toBeDefined();
  });

  it("rejects empty email", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "",
    });
    expect(errors.email).toBeDefined();
  });

  // Bank details tests
  it("accepts noPaypal=false without bank details", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      noPaypal: false,
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("accepts noPaypal=true with valid IBAN and Kontoinhaber", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      noPaypal: true,
      iban: "DE89370400440532013000",
      kontoinhaber: "Lisa Schmidt",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("rejects noPaypal=true without IBAN", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      noPaypal: true,
      iban: "",
      kontoinhaber: "Lisa Schmidt",
    });
    expect(errors.iban).toBeDefined();
  });

  it("rejects noPaypal=true without Kontoinhaber", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      noPaypal: true,
      iban: "DE89370400440532013000",
      kontoinhaber: "",
    });
    expect(errors.kontoinhaber).toBeDefined();
  });

  it("rejects invalid IBAN format", () => {
    const errors = validateForm({
      ...base,
      name: "Lisa",
      email: "lisa@example.com",
      noPaypal: true,
      iban: "INVALID",
      kontoinhaber: "Lisa Schmidt",
    });
    expect(errors.iban).toBeDefined();
  });
});
