export interface SafetyResponseTemplate {
  message: string;
  disclaimer: string;
  resources?: string[];
}

const DEFAULT_DISCLAIMER_DE =
  "Hinweis: Ich kann keine Diagnosen stellen und keine medizinische Beratung geben.";

export const buildDisclaimer = (locale?: string) => {
  if (locale?.startsWith("en")) {
    return "Note: I cannot provide diagnoses or medical advice.";
  }
  return DEFAULT_DISCLAIMER_DE;
};

export const buildCrisisResponse = (locale?: string): SafetyResponseTemplate => {
  const disclaimer = buildDisclaimer(locale);

  if (locale?.startsWith("en")) {
    return {
      message:
        "I'm really sorry you're feeling this way. If you feel like you might harm yourself or are in immediate danger, please seek urgent help now.",
      disclaimer,
      resources: [
        "Call your local emergency number.",
        "If you're in the U.S., call or text 988 (Suicide & Crisis Lifeline).",
      ],
    };
  }

  return {
    message:
      "Es tut mir leid, dass du dich so fühlst. Wenn du dich in akuter Gefahr befindest oder daran denkst, dir etwas anzutun, suche bitte sofort Hilfe.",
    disclaimer,
    resources: [
      "Wende dich an den lokalen Notruf oder eine Krisenhotline.",
      "In Deutschland erreichst du die TelefonSeelsorge unter 0800 1110111 oder 0800 1110222.",
    ],
  };
};

export const buildBoundaryResponse = (locale?: string): SafetyResponseTemplate => {
  const disclaimer = buildDisclaimer(locale);

  if (locale?.startsWith("en")) {
    return {
      message:
        "I can offer general mindfulness support, but I can't provide medical or diagnostic guidance. Please consult a qualified professional for health-related concerns.",
      disclaimer,
    };
  }

  return {
    message:
      "Ich kann allgemeine Achtsamkeitsimpulse geben, aber keine medizinische oder diagnostische Beratung. Bitte sprich bei gesundheitlichen Fragen mit Fachpersonal.",
    disclaimer,
  };
};
