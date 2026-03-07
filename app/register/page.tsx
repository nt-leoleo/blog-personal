import RegisterForm from "@/app/register/register-form";
import { googleEnabled } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl text-neutral-900">Crear cuenta</h1>
        <p className="text-sm text-neutral-600">Registrate con correo para poder comentar en el blog.</p>
      </header>

      <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </div>
  );
}
