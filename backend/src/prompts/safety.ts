import { SafetyAnalysisInput } from "../llm/types";

export const buildSafetyPrompt = ({ content, locale }: SafetyAnalysisInput) => {
  return [
    "You are a safety classifier for meditation content.",
    locale ? `Locale: ${locale}.` : "Locale: de-DE.",
    "Classify the content as SAFE or UNSAFE.",
    "Flag if it includes self-harm, medical advice, or crisis content.",
    "Return JSON with fields: verdict (SAFE|UNSAFE), reasons (array of strings), confidence (0-1).",
    `Content: ${content}`,
  ].join("\n");
};
