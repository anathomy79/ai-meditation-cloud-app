import { MeditationScriptInput } from "../llm/types";

export const buildMeditationPrompt = ({ theme, durationMinutes, tone, locale }: MeditationScriptInput) => {
  return [
    `You are a meditation script writer.`,
    `Theme: ${theme}.`,
    `Target duration: ${durationMinutes} minutes.`,
    tone ? `Tone: ${tone}.` : "Tone: calm, supportive, grounded.",
    locale ? `Locale: ${locale}.` : "Locale: de-DE.",
    "Structure the script with a gentle opening, breathing guidance, body scan, visualization, and a closing.",
    "Use clear, soothing language and short paragraphs.",
  ].join("\n");
};
