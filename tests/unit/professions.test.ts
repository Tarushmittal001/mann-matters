import { describe, expect, it } from "vitest";
import { canPrescribe, guessProfession, requiresPrescriber } from "@/lib/professions";
import { emptyExpertDraft, validateExpert, type ExpertDraft } from "@/lib/expert-admin";

describe("guessProfession — only pre-fills old listings", () => {
  it.each([
    ["MBBS, MD (Psychiatry)", "PSYCHIATRIST"],
    ["M.D. (Psychiatry)", "PSYCHIATRIST"], // the old guess missed this one
    ["M.D. Psychiatry, NIMHANS", "PSYCHIATRIST"],
    ["MD(Psych)", "PSYCHIATRIST"],
    ["DNB Psychiatry", "PSYCHIATRIST"],
    ["DPM", "PSYCHIATRIST"],
    ["MRCPsych", "PSYCHIATRIST"],
    ["M.D.Sc Neuroscience", "PSYCHOLOGIST"], // not a medical degree
    ["MDS", "PSYCHOLOGIST"], // dental
    ["Ph.D. Counselling Psychology", "COUNSELLING_PSYCHOLOGIST"], // "Dr." by doctorate, cannot prescribe
    ["M.Phil. Clinical Psychology", "CLINICAL_PSYCHOLOGIST"],
    ["M.A. Clinical Psychology", "CLINICAL_PSYCHOLOGIST"],
    ["M.Sc. Psychology, Dip. CBT", "PSYCHOLOGIST"],
    ["", "PSYCHOLOGIST"],
  ])("%s → %s", (credentials, expected) => {
    expect(guessProfession(credentials)).toBe(expected);
  });
});

describe("who may prescribe", () => {
  it("is a psychiatrist and nobody else", () => {
    expect(canPrescribe("PSYCHIATRIST")).toBe(true);
    expect(canPrescribe("CLINICAL_PSYCHOLOGIST")).toBe(false);
    expect(canPrescribe("")).toBe(false);
  });

  it("gates the medication service only", () => {
    expect(requiresPrescriber("psychiatry-medication")).toBe(true);
    expect(requiresPrescriber("individual-therapy")).toBe(false);
  });
});

describe("validateExpert — profession and registration", () => {
  const valid: ExpertDraft = {
    ...emptyExpertDraft,
    name: "Test Practitioner",
    credentials: "M.Phil. Clinical Psychology",
    profession: "CLINICAL_PSYCHOLOGIST",
    registrationNo: "A12345",
    experienceYears: "5",
    languages: ["English"],
    specialties: ["Anxiety"],
    services: ["individual-therapy"],
    photo: "/experts/test.jpg",
    status: "ACTIVE",
  };

  it("accepts a complete listing", () => {
    const f = validateExpert(valid);
    expect(f.profession).toBeUndefined();
    expect(f.registrationNo).toBeUndefined();
    expect(f.services).toBeUndefined();
  });

  it("requires a profession", () => {
    expect(validateExpert({ ...valid, profession: "" }).profession).toBeTruthy();
    expect(validateExpert({ ...valid, profession: "DOCTOR" }).profession).toBeTruthy();
  });

  it("requires a medical council number for a live psychiatrist, not to stay hidden", () => {
    const psychiatrist = { ...valid, profession: "PSYCHIATRIST" };
    expect(validateExpert({ ...psychiatrist, registrationNo: "" }).registrationNo).toBeTruthy();
    expect(validateExpert({ ...psychiatrist, registrationNo: "  " }).registrationNo).toBeTruthy();
    expect(validateExpert({ ...psychiatrist, registrationNo: "", status: "HIDDEN" }).registrationNo).toBeUndefined();
  });

  it("lists a psychologist or counsellor without a registration number", () => {
    expect(validateExpert({ ...valid, registrationNo: "" }).registrationNo).toBeUndefined();
    expect(
      validateExpert({ ...valid, profession: "COUNSELLING_PSYCHOLOGIST", registrationNo: "" }).registrationNo
    ).toBeUndefined();
  });

  it("rejects a malformed registration number", () => {
    expect(validateExpert({ ...valid, registrationNo: "<script>" }).registrationNo).toBeTruthy();
    expect(validateExpert({ ...valid, registrationNo: "DMC/R/12345" }).registrationNo).toBeUndefined();
  });

  it("refuses the medication service to anyone who is not a psychiatrist", () => {
    const services = ["individual-therapy", "psychiatry-medication"];
    expect(validateExpert({ ...valid, services }).services).toBeTruthy();
    expect(validateExpert({ ...valid, services, profession: "PSYCHIATRIST" }).services).toBeUndefined();
  });
});
