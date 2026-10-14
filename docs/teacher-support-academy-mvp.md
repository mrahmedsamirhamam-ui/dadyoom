# Dadyoom Teacher Support & Professional Development Academy

Status: product requirements only; not implemented or accredited. 2026-10-14.

## Goal
Offer educators practical pedagogical and technical assistance, live/recorded workshops, and independently verifiable platform-issued completion certificates. Integrate with Dadyoom AI Teaching Studio without changing core brand or enabling payments.

## Teacher support
- Arabic-first support center with searchable reviewed knowledge base and support tickets.
- Categories: lesson planning, classroom management, differentiation/SEN, assessment, educational technology, accessibility and platform support.
- Structured intake: issue, teaching stage, goal, non-sensitive context, urgency; suggest reviewed solutions and allow escalation to a human trainer.
- Never collect student-identifying details by default. AI suggestions are advisory, subject to teacher review.

## Workshops
- Trainer-managed workshops with title, objectives, instructor, schedule/timezone, duration, seat limit, registration, accessibility, resources and feedback.
- Live video integration and recorded lessons are separate milestones; no promise of functioning conferencing until tested.
- Attendance evidence, practical assignment or assessment, completion criteria and certificate eligibility.
- Pilot topics: AI in teaching; standards-aligned assessment; differentiation; interactive Arabic lessons; classroom management.

## Verifiable certificates
- Issue only after objective completion criteria and organizer approval.
- Certificate fields: opaque unique ID, participant display name, workshop title, date, duration, issuer Dadyoom, trainer, optional assessment type, issue date, and verification URL with QR.
- Public verification reveals minimum necessary data and allows participant privacy controls. Prevent enumeration, forgery, duplicate issuance and unauthorized revocation. Store audit trail and support revocation/correction.
- Distinguish "Dadyoom-issued completion certificate" from official government/international accreditation; never imply accreditation without documented authorization.
- Provide bilingual downloadable PDF and mobile-friendly verification page after secure implementation.

## Security / implementation
- RBAC: participant, trainer, support specialist, academy administrator; tenant isolation where school-associated.
- Rate limits, anti-spam, secure attachments, consent, privacy/retention policy, audit log, admin moderation.
- Build in stages: support knowledge base and tickets; workshop registration; attendance and assessment; certificate issuance and verification; trainer marketplace after legal and financial review.
- Synthetic data until access-control tests pass; no real payments, no automatic charges, no changes to Paddle.
- Test identity/role permissions, cross-user access, certificate forgery/revocation, workshop completion, mobile RTL and English.
