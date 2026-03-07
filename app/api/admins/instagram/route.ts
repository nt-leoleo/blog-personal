import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  isValidInstagramUsername,
  normalizeInstagramUsername,
} from "@/lib/instagram";
import prisma from "@/lib/prisma";

function forbiddenResponse() {
  return NextResponse.json({ message: "No autorizado." }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return forbiddenResponse();
  }

  try {
    const payload = (await request.json()) as { username?: string };
    const username = normalizeInstagramUsername(payload.username || "");

    if (!isValidInstagramUsername(username)) {
      return NextResponse.json(
        { message: "Username de Instagram invalido." },
        { status: 400 },
      );
    }

    const existing = await prisma.adminInstagram.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Ese usuario ya es admin." },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.adminInstagram.create({
        data: { username },
      }),
      prisma.user.updateMany({
        where: { instagramUsername: username },
        data: { role: "ADMIN" },
      }),
    ]);

    return NextResponse.json(
      { message: "Admin agregado correctamente." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "No se pudo agregar el admin." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return forbiddenResponse();
  }

  try {
    const payload = (await request.json()) as { username?: string };
    const username = normalizeInstagramUsername(payload.username || "");

    if (!isValidInstagramUsername(username)) {
      return NextResponse.json(
        { message: "Username de Instagram invalido." },
        { status: 400 },
      );
    }

    const existing = await prisma.adminInstagram.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Ese usuario no esta en la lista de admins." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.adminInstagram.delete({
        where: { username },
      }),
      prisma.user.updateMany({
        where: { instagramUsername: username },
        data: { role: "USER" },
      }),
    ]);

    return NextResponse.json({ message: "Admin removido correctamente." });
  } catch {
    return NextResponse.json(
      { message: "No se pudo remover el admin." },
      { status: 500 },
    );
  }
}
