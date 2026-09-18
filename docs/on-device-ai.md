# Dadyoom On-Device AI

Dadyoom uses a hybrid AI architecture.

## Default tiny offline helper

The lightweight public model selected for the first mobile prototype is:

- `litert-community/SmolLM-135M-Instruct`
- Apache-2.0
- quantized int8 mobile model
- roughly 159 MB model size according to the published Android benchmark
- intended as an offline helper, not the authoritative Arabic tutor

The model is deliberately small so the phone can do a few useful tasks
without waiting for a network round-trip:

- classify a student's local intent;
- rewrite a very short note;
- suggest the next app action;
- explain UI controls;
- build a tiny offline checklist;
- help with reminders and cached study material.

## What it must NOT do alone

A 135M model is too small to be trusted as Dadyoom's main Arabic
teacher. It must not independently grade important work, invent
curriculum facts, or replace the cloud/provider router for high-quality
Arabic teaching.

For lesson explanations, assessments, rich PowerPoint generation,
games, and difficult Arabic questions, Dadyoom should use the normal
AI router and only use the local model as a fast/offline fallback.

## Runtime path

The developer copy is stored outside the app bundle:

`.dadyoom-ai/mobile-models/smollm-135m/`

The production mobile app should download the model only when the user
enables "Offline AI" and the device passes storage/RAM checks. This
keeps the Play Store/App Store package smaller.

Android:
- use Google AI Edge / LiteRT stack;
- CPU fallback is mandatory;
- prefer acceleration when supported.

iOS:
- use the LiteRT-LM Swift stack or a compatible LiteRT mobile bridge;
- do not require Metal-only devices;
- keep a cloud fallback.

## Upgrade option

On stronger phones, Dadyoom can later offer a larger optional model such
as Gemma 3 270M. The public LiteRT conversion is gated by Gemma terms,
so it should not be silently downloaded until the required license/access
flow is satisfied.

## Hybrid routing

Recommended order:

1. cached answer / deterministic app logic;
2. on-device tiny model for lightweight offline tasks;
3. fast free cloud provider;
4. stronger cloud provider;
5. local desktop Ollama when available.

This gives the user immediate help while preserving Arabic quality.
