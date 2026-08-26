# ضاديوم (Dadyoom) - Software Architecture

## Vision

ضاديوم هو منصة تعليمية ذكية لتعليم اللغة العربية تعتمد على الذكاء الاصطناعي، وتقدم تجربة تعلم شخصية للطلاب والمعلمين والمدارس وأولياء الأمور.

---

# Architecture

```
Next.js (App Router)

        │

        ▼

React Components

        │

        ▼

API Routes

        │

        ▼

Services

        │

        ▼

Supabase + Gemini AI
```

---

# Layers

## app/

Pages, layouts and API Routes.

---

## components/

Reusable UI Components.

Examples:

- Assessment
- Dashboard
- UI
- Admin

---

## services/

Business Logic only.

Examples:

- AI
- Progress
- Dashboard
- Student
- Course

---

## lib/

Infrastructure.

Examples:

- Supabase
- Gemini
- Providers

---

## types/

Shared Types.

---

# AI Flow

Student

↓

Assessment Request

↓

Gemini

↓

Assessment Generator

↓

Supabase

↓

Assessment Page

---

# Progress Flow

Student Answer

↓

Submit API

↓

Progress Engine

↓

XP

↓

Skills

↓

Statistics

↓

Dashboard

---

# Design Principles

- Single Responsibility
- Reusable Components
- Thin API Routes
- Business Logic inside Services
- Strong TypeScript Typing
- AI Provider Isolation
- No duplicated code
- No page reloads
