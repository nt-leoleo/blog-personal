"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Props = {
  callbackUrl: string;
  googleEnabled: boolean;
};

export default function LoginForm({ callbackUrl, googleEnabled }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Correo o clave incorrectos.");
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  }

  async function handleGoogle() {
    setError("");

    if (!googleEnabled) {
      setError("Google todavia no esta configurado en variables de entorno.");
      return;
    }

    await signIn("google", { callbackUrl });
  }

  return (
    <div className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700"
        >
          continuar con google
        </button>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500"
        >
          continuar con instagram (proximamente)
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span className="h-px flex-1 bg-neutral-200" />
        <span>o ingresar con correo</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleCredentials} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
            placeholder="tu-correo@dominio.com"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Clave
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
            placeholder="********"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar con correo"}
        </button>
      </form>
    </div>
  );
}
