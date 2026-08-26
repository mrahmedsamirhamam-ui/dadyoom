import { processLessonCompleted } from "@/services/progress/progress-engine";

import { subscribeToStudentEvent } from "../dispatcher";
import { StudentEventType } from "../types";

subscribeToStudentEvent(
  StudentEventType.LESSON_COMPLETED,
  async (event) => {
    await processLessonCompleted(event);
  }
);
