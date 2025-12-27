export type SafetyVerdict = "SAFE" | "UNSAFE";

export interface SafetyAssessment {
  verdict: SafetyVerdict;
  reasons: string[];
  confidence: number;
  blocked: boolean;
  message?: string;
}

const SAFETY_RULES: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /suizid|suicide|selbstt[oö]tung/i, reason: "Suizidgedanken" },
  { pattern: /selbstverletzung|self-harm|self harm/i, reason: "Selbstverletzung" },
  { pattern: /ich will nicht mehr leben|i want to die/i, reason: "Krisenhinweis" },
  { pattern: /medizinischer rat|medizinische diagnose|diagnose/i, reason: "Medizinische Beratung" },
];

const DEFAULT_MESSAGE =
  "Es tut mir leid, dass du dich so fühlst. Bitte wende dich an eine vertraute Person oder professionelle Hilfe. Wenn du akut in Gefahr bist, rufe den Notruf.";

export const assessSafety = (content: string | undefined | null): SafetyAssessment => {
  if (!content) {
    return {
      verdict: "SAFE",
      reasons: [],
      confidence: 0.99,
      blocked: false,
    };
  }

  const matched = SAFETY_RULES.filter((rule) => rule.pattern.test(content));
  if (matched.length === 0) {
    return {
      verdict: "SAFE",
      reasons: [],
      confidence: 0.9,
      blocked: false,
    };
  }

  return {
    verdict: "UNSAFE",
    reasons: matched.map((rule) => rule.reason),
    confidence: 0.7,
    blocked: true,
    message: DEFAULT_MESSAGE,
  };
};
