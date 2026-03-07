import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";

export default async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
            Blog personal
          </Link>
          <nav className="hidden gap-4 text-sm text-neutral-600 md:flex">
            <Link href="/" className="transition hover:text-neutral-900">
              Inicio
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" className="transition hover:text-neutral-900">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-neutral-600 md:inline">
                {session.user.name || session.user.email || "Usuario"}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-950"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

