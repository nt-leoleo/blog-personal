import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { formatBytes } from "@/lib/format";
import { createUniqueSlug } from "@/lib/posts";
import prisma from "@/lib/prisma";
import { persistFile } from "@/lib/upload";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_FILES = 20;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "No autorizado." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();

    if (!title || !content) {
      return NextResponse.json(
        { message: "Titulo y contenido son obligatorios." },
        { status: 400 },
      );
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { message: `Solo se permiten ${MAX_FILES} archivos por publicacion.` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            message: `El archivo ${file.name} supera el limite de ${formatBytes(
              MAX_FILE_SIZE,
            )}.`,
          },
          { status: 400 },
        );
      }
    }

    const media = [] as {
      url: string;
      fileName: string;
      mimeType: string;
      size: number;
    }[];

    for (const file of files) {
      const saved = await persistFile(file);
      if (saved) {
        media.push(saved);
      }
    }

    const slug = await createUniqueSlug(title);

    const post = await prisma.post.create({
      data: {
        slug,
        title,
        content,
        authorId: session.user.id,
        media: {
          create: media,
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    return NextResponse.json(
      { message: "Publicacion creada.", post },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "No se pudo guardar la publicacion." },
      { status: 500 },
    );
  }
}

