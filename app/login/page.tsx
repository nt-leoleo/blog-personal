import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import LoginForm from "@/app/login/login-form";
import { authOptions, googleEnabled } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl text-neutral-900">Ingresar</h1>
        <p className="text-sm text-neutral-600">Necesitas una cuenta para comentar publicaciones.</p>
      </header>

      <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />

      <p className="text-center text-sm text-neutral-600">
        ¿No tenes cuenta? <Link href="/register" className="underline">Registrate con correo</Link>
      </p>
    </div>
  );
}
