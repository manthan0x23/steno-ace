import { RegisterForm } from "./_components/register-form";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <RegisterForm token={token} />
    </div>
  );
}
