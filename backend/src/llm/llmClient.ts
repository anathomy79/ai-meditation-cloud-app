import { buildChatPrompt } from "../prompts/chat";
import { buildMeditationPrompt } from "../prompts/meditation";
import { buildSafetyPrompt } from "../prompts/safety";
import { loadConfig } from "./config";
import { chooseProvider } from "./router";
import {
  ChatResponseInput,
  LlmConfig,
  LlmProvider,
  LlmResponse,
  MeditationScriptInput,
  RouterContext,
  SafetyAnalysisInput,
  TaskType,
} from "./types";

interface LlmClientOptions {
  config?: LlmConfig;
  providers: Record<string, LlmProvider>;
}

export class LlmClient {
  private config: LlmConfig;
  private providers: Record<string, LlmProvider>;

  constructor(options: LlmClientOptions) {
    this.config = loadConfig(options.config);
    this.providers = options.providers;
  }

  async generateMeditationScript(
    input: MeditationScriptInput,
    context: RouterContext = {},
  ): Promise<LlmResponse> {
    return this.runTask("meditationScript", buildMeditationPrompt(input), context);
  }

  async generateChatResponse(
    input: ChatResponseInput,
    context: RouterContext = {},
  ): Promise<LlmResponse> {
    return this.runTask("chatResponse", buildChatPrompt(input), context);
  }

  async analyzeSafety(input: SafetyAnalysisInput, context: RouterContext = {}): Promise<LlmResponse> {
    return this.runTask("safetyAnalysis", buildSafetyPrompt(input), context, {
      temperature: 0,
      maxTokens: 400,
    });
  }

  private async runTask(
    task: TaskType,
    prompt: string,
    context: RouterContext,
    overrides?: { temperature?: number; maxTokens?: number },
  ): Promise<LlmResponse> {
    const providerName = chooseProvider(task, context, this.config);
    const provider = this.providers[providerName];

    if (!provider) {
      throw new Error(`Provider ${providerName} not registered.`);
    }

    return provider.generateText({
      prompt,
      temperature: overrides?.temperature,
      maxTokens: overrides?.maxTokens,
    });
  }
}
