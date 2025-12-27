import { CRISIS_PATTERNS, MEDICAL_ADVICE_PATTERNS } from "./patterns";
import { SafetyResponseTemplate, buildBoundaryResponse, buildCrisisResponse } from "./responses";

export type SafetyStatus = "allow" | "block";
export type SafetyCategory = "crisis" | "medical" | "none";

export interface SafetyDecision {
  status: SafetyStatus;
  category: SafetyCategory;
  matches: string[];
  response?: SafetyResponseTemplate;
}

const findMatches = (text: string, patterns: RegExp[]) => {
  return patterns
    .map((pattern) => (pattern.test(text) ? pattern.source : null))
    .filter((match): match is string => Boolean(match));
};

export const runInputPrecheck = (text: string, locale?: string): SafetyDecision => {
  const matches = findMatches(text, CRISIS_PATTERNS);
  if (matches.length > 0) {
    return {
      status: "block",
      category: "crisis",
      matches,
      response: buildCrisisResponse(locale),
    };
  }

  return {
    status: "allow",
    category: "none",
    matches: [],
  };
};

export const runOutputFilter = (text: string, locale?: string): SafetyDecision => {
  const crisisMatches = findMatches(text, CRISIS_PATTERNS);
  if (crisisMatches.length > 0) {
    return {
      status: "block",
      category: "crisis",
      matches: crisisMatches,
      response: buildCrisisResponse(locale),
    };
  }

  const medicalMatches = findMatches(text, MEDICAL_ADVICE_PATTERNS);
  if (medicalMatches.length > 0) {
    return {
      status: "block",
      category: "medical",
      matches: medicalMatches,
      response: buildBoundaryResponse(locale),
    };
  }

  return {
    status: "allow",
    category: "none",
    matches: [],
  };
};
