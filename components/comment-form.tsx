"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  postId: string;
};

export default function CommentForm({ postId }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = comment.trim();
    if (content.length < 2) {
      setError("El comentario es demasiado corto.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, content }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(payload.message || "No se pudo publicar tu comentario.");
        return;
      }

      setComment("");
      router.refresh();
    } catch {
      setError("No se pudo publicar tu comentario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <label className="block text-sm font-medium text-neutral-700">
        Deja tu comentario
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
          placeholder="Escribi algo..."
          disabled={loading}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
      >
        {loading ? "Publicando..." : "Publicar comentario"}
      </button>
    </form>
  );
}

