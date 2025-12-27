import { ChatResponseInput } from "../llm/types";

export const buildChatPrompt = ({ message, history, locale }: ChatResponseInput) => {
  const historyText = history
    ? history.map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`).join("\n")
    : "";

  return [
    "You are a mindful meditation assistant.",
    locale ? `Locale: ${locale}.` : "Locale: de-DE.",
    historyText ? `Conversation so far:\n${historyText}` : "No prior conversation.",
    `User message: ${message}`,
    "Respond with empathy, short actionable guidance, and avoid medical claims.",
  ].join("\n\n");
};
