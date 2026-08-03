import { GeminiAIProvider } from "./gemini-provider";
import { MockAIProvider } from "./mock-provider";
import type {
  AIProvider,
  AiLearningPlan,
  AiRecommendation,
  StudentAiContext,
} from "./provider";

class FallbackAIProvider implements AIProvider {
  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider
  ) {}

  async generateRecommendation(
    context: StudentAiContext
  ): Promise<AiRecommendation> {
    try {
      return await this.primary.generateRecommendation(
        context
      );
    } catch (error) {
      console.error(
        "PRIMARY_AI_RECOMMENDATION_ERROR",
        error
      );

      return this.fallback.generateRecommendation(
        context
      );
    }
  }

  async generateLearningPlan(
    context: StudentAiContext
  ): Promise<AiLearningPlan> {
    try {
      return await this.primary.generateLearningPlan(
        context
      );
    } catch (error) {
      console.error(
        "PRIMARY_AI_LEARNING_PLAN_ERROR",
        error
      );

      return this.fallback.generateLearningPlan(
        context
      );
    }
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName =
    process.env.AI_PROVIDER
      ?.trim()
      .toLowerCase() || "mock";

  const mockProvider = new MockAIProvider();

  if (providerName !== "gemini") {
    cachedProvider = mockProvider;
    return cachedProvider;
  }

  const apiKey =
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY_MISSING: سيتم استخدام MockAIProvider."
    );

    cachedProvider = mockProvider;
    return cachedProvider;
  }

  const geminiProvider = new GeminiAIProvider(
    apiKey,
    process.env.GEMINI_MODEL
  );

  cachedProvider = new FallbackAIProvider(
    geminiProvider,
    mockProvider
  );

  return cachedProvider;
}
