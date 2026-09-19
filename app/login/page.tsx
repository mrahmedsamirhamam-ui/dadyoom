import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <EmailPasswordAuthForm
      mode="login"
      nextPath={safeNext(params.next)}
    />
  );
}
