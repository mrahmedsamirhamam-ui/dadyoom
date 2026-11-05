import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

type LoginPageProps = {
  searchParams: Promise<{ password_reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <EmailPasswordAuthForm mode="login" passwordWasReset={params.password_reset === "1"} />;
}
