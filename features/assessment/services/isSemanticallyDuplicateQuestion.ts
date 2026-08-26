import {
  createQueryEmbedding,
} from "@/features/semantic-search/services/createQueryEmbedding";

type SemanticDuplicateParams = {
  candidateQuestion: string;
  previousQuestions: string[];
  threshold?: number;
};

type SemanticDuplicateResult = {
  duplicate: boolean;
  similarity: number;
  matchedQuestion: string | null;
};

function cosineSimilarity(
  first: number[],
  second: number[]
): number {
  if (
    first.length === 0 ||
    second.length === 0 ||
    first.length !== second.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (
    let index = 0;
    index < first.length;
    index += 1
  ) {
    const firstValue =
      first[index] ?? 0;

    const secondValue =
      second[index] ?? 0;

    dotProduct +=
      firstValue * secondValue;

    firstMagnitude +=
      firstValue * firstValue;

    secondMagnitude +=
      secondValue * secondValue;
  }

  if (
    firstMagnitude === 0 ||
    secondMagnitude === 0
  ) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(firstMagnitude) *
      Math.sqrt(secondMagnitude)
    )
  );
}

export async function isSemanticallyDuplicateQuestion({
  candidateQuestion,
  previousQuestions,
  threshold = 0.88,
}: SemanticDuplicateParams): Promise<SemanticDuplicateResult> {
  const uniquePreviousQuestions =
    Array.from(
      new Set(
        previousQuestions
          .map((question) =>
            question.trim()
          )
          .filter(Boolean)
      )
    )
      .slice(0, 20);

  if (
    uniquePreviousQuestions.length === 0
  ) {
    return {
      duplicate: false,
      similarity: 0,
      matchedQuestion: null,
    };
  }

  const candidateEmbedding =
    await createQueryEmbedding(
      candidateQuestion
    );

  let highestSimilarity = 0;
  let matchedQuestion:
    string | null = null;

  for (
    const previousQuestion of
    uniquePreviousQuestions
  ) {
    const previousEmbedding =
      await createQueryEmbedding(
        previousQuestion
      );

    const similarity =
      cosineSimilarity(
        candidateEmbedding,
        previousEmbedding
      );

    if (
      similarity >
      highestSimilarity
    ) {
      highestSimilarity =
        similarity;

      matchedQuestion =
        previousQuestion;
    }
  }

  return {
    duplicate:
      highestSimilarity >= threshold,

    similarity:
      highestSimilarity,

    matchedQuestion,
  };
}
