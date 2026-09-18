import { AccessToken } from "livekit-server-sdk";

export function livekitConfigured() {
  return Boolean(
    process.env.LIVEKIT_URL?.trim() &&
      process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim(),
  );
}

export async function createDadyoomLiveToken(input: {
  room: string;
  identity: string;
  name: string;
  isTeacher: boolean;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret =
    process.env.LIVEKIT_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_NOT_CONFIGURED");
  }

  const token = new AccessToken(
    apiKey,
    apiSecret,
    {
      identity: input.identity,
      name: input.name,
      ttl: "2h",
      metadata: JSON.stringify({
        role: input.isTeacher ? "teacher" : "student",
      }),
    },
  );

  token.addGrant({
    roomJoin: true,
    room: input.room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await token.toJwt();
}
