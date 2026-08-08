export type LessonChatRole =
  | "user"
  | "assistant";

export type LessonChatMessage = {
  id: string;
  role: LessonChatRole;
  content: string;
  createdAt: string;
};

export type LessonChatHistoryItem = {
  role: LessonChatRole;
  content: string;
};
