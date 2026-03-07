import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/format";

type HomePostItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  media: {
    mimeType: string;
  }[];
  _count: {
    comments: number;
    media: number;
  };
};

function mediaLabel(mimeType: string) {
  if (mimeType.startsWith("image/")) return "Foto";
  if (mimeType.startsWith("audio/")) return "Audio";
  return "Archivo";
}

export default async function Home() {
  const posts: HomePostItem[] = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      media: {
        take: 1,
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          comments: true,
          media: true,
        },
      },
    },
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-500">wachina gay</p>
        <h1 className="mt-3 max-w-2xl text-4xl leading-tight text-neutral-900 md:text-5xl">
          Aca subo mis virgadas
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
          Para comentar tenes que ingresar con cuenta de Instagram o con correo y clave; wachín.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-neutral-900">Publicaciones recientes</h2>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-neutral-600">
            Aun no hay posts. Cuando el admin publique, van a aparecer aca.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => {
              const firstMedia = post.media[0];

              return (
                <article
                  key={post.id}
                  className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow"
                >
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>{post._count.comments} comentarios</span>
                  </div>

                  <h3 className="text-2xl leading-snug text-neutral-900">
                    <Link href={`/posts/${post.slug}`} className="transition hover:text-neutral-700">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {post.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                      {post._count.media} adjunto{post._count.media === 1 ? "" : "s"}
                    </span>
                    {firstMedia && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                        {mediaLabel(firstMedia.mimeType)}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
