"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Props = {
  callbackUrl: string;
  googleEnabled: boolean;
};

export default function RegisterForm({ callbackUrl, googleEnabled }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message || "No se pudo crear la cuenta.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        setMessage("Cuenta creada. Ahora ingresa manualmente.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(signInResult.url || callbackUrl);
      router.refresh();
    } catch {
      setMessage("No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMessage("");

    if (!googleEnabled) {
      setMessage("Google todavia no esta configurado en variables de entorno.");
      return;
    }

    await signIn("google", { callbackUrl });
  }

  return (
    <>
      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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
          <span>o registrarte con correo</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-neutral-700">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
              placeholder="Tu nombre"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
              placeholder="Minimo 6 caracteres"
            />
          </div>

          {message && <p className="text-sm text-neutral-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta con correo"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-neutral-600">
        ¿Ya tienes cuenta? <Link href="/login" className="underline">Ingresar</Link>
      </p>
    </>
  );
}
