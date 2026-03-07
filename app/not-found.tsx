import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-4xl text-neutral-900">404</h1>
      <p className="mt-3 text-sm text-neutral-600">La publicacion que buscas no existe o fue eliminada.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

