"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  usernames: string[];
};

export default function InstagramAdminsManager({ usernames }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = username.trim();

    if (!value) {
      setMessage("Escribe un user de Instagram.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admins/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });

      const payload = (await response.json()) as { message?: string };
      setMessage(payload.message || (response.ok ? "Admin agregado." : "Error al agregar admin."));

      if (response.ok) {
        setUsername("");
        router.refresh();
      }
    } catch {
      setMessage("Error al agregar admin.");
    } finally {
      setLoading(false);
    }
  }

  async function removeAdmin(targetUsername: string) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admins/instagram", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });

      const payload = (await response.json()) as { message?: string };
      setMessage(payload.message || (response.ok ? "Admin removido." : "Error al remover admin."));

      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("Error al remover admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl text-neutral-900">Configuracion de admins Instagram</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Los users listados aqui obtienen acceso admin cuando inician sesion con Instagram.
        </p>
      </div>

      <form onSubmit={addAdmin} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
          placeholder="@usuario o usuario"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
        >
          Agregar admin
        </button>
      </form>

      {message && <p className="text-sm text-neutral-700">{message}</p>}

      <div className="space-y-2">
        {usernames.length === 0 ? (
          <p className="text-sm text-neutral-600">No hay admins de Instagram configurados.</p>
        ) : (
          usernames.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
            >
              <span className="text-sm text-neutral-800">@{item}</span>
              <button
                type="button"
                onClick={() => removeAdmin(item)}
                disabled={loading}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
