# Teacher student-list authorization contract

The submitted NestJS endpoint `@Roles('TEACHER') findAllStudents()` must
**not** be ported as an unrestricted `findAll()` query.

## Next.js route design (not enabled yet)

1. Call `requireRole(allowedRoles("TEACHER"))` in the server route.
2. Return 401 for unauthenticated, 403 for forbidden, 503 for unavailable.
3. Resolve teacher identity from the authenticated user ID, not query/body.
4. Join verified teacher-class assignments to active enrollments, scoped by
   school and academic year. Verify the actual schema before writing queries.
5. Apply RLS in the database so teachers cannot bypass the API and read other
   students using the public Supabase key.
6. Select only necessary fields, paginate, and prohibit returning private
   student contact, grades or sensitive records by default.
7. Test teacher own-class, another teacher's class, cross-school access,
   suspended accounts, parent/student role, and missing assignments.

Do not create `GET /api/students` until existing teacher/class/enrollment
tables and RLS policies are inspected. A fabricated table name or unscoped
`students.select("*")` is a security regression.

The existing Next.js/Supabase stack does not use NestJS decorators.
