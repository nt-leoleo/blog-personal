import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Tenes que iniciar sesion para comentar." },
      { status: 401 },
    );
  }

  try {
    const payload = (await request.json()) as {
      postId?: string;
      content?: string;
    };

    const postId = payload.postId?.trim() || "";
    const content = payload.content?.trim() || "";

    if (!postId || content.length < 2) {
      return NextResponse.json(
        { message: "Comentario demasiado corto." },
        { status: 400 },
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        content,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "No se pudo publicar el comentario." },
      { status: 500 },
    );
  }
}

