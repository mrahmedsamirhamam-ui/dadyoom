import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

const publicRoles = new Set(["student", "child", "teacher", "parent", "school"]);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = typeof params.role === "string" ? params.role : "";
  const initialRole = publicRoles.has(requested) ? requested : "student";
  return <EmailPasswordAuthForm mode="signup" initialRole={initialRole} />;
}
