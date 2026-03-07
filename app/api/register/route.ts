import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = payload.name?.trim() || "";
    const email = payload.email?.trim().toLowerCase() || "";
    const password = payload.password || "";

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Correo invalido." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La clave debe tener al menos 6 caracteres." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Ese correo ya esta registrado." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: passwordHash,
      },
    });

    return NextResponse.json({ message: "Cuenta creada." }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "No se pudo crear la cuenta." },
      { status: 500 },
    );
  }
}

