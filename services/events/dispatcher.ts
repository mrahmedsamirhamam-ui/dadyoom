import type { StudentEvent } from "./types";

export type StudentEventHandler = (
  event: StudentEvent
) => Promise<void> | void;

const handlers = new Map<
  StudentEvent["type"],
  Set<StudentEventHandler>
>();

export function subscribeToStudentEvent(
  eventType: StudentEvent["type"],
  handler: StudentEventHandler
): () => void {
  const eventHandlers =
    handlers.get(eventType) ?? new Set<StudentEventHandler>();

  eventHandlers.add(handler);
  handlers.set(eventType, eventHandlers);

  return () => {
    const currentHandlers = handlers.get(eventType);

    if (!currentHandlers) {
      return;
    }

    currentHandlers.delete(handler);

    if (currentHandlers.size === 0) {
      handlers.delete(eventType);
    }
  };
}

export async function emitStudentEvent(
  event: StudentEvent
): Promise<void> {
  const eventHandlers = handlers.get(event.type);

  if (!eventHandlers || eventHandlers.size === 0) {
    return;
  }

  await Promise.all(
    Array.from(eventHandlers).map((handler) => handler(event))
  );
}