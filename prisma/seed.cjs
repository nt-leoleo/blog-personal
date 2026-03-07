/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no definido. Configura Vercel Postgres o define DATABASE_URL en .env.",
  );
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });
const defaultInstagramAdmin = "gazetheblackmoon";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@blog.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "cambiar-esta-clave";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Admin creado: ${adminEmail}`);
  } else {
    console.log(`Admin ya existe: ${adminEmail}`);
  }

  await prisma.adminInstagram.upsert({
    where: { username: defaultInstagramAdmin },
    update: {},
    create: { username: defaultInstagramAdmin },
  });

  await prisma.user.updateMany({
    where: { instagramUsername: defaultInstagramAdmin },
    data: { role: "ADMIN" },
  });
  console.log(`Admin de Instagram configurado: ${defaultInstagramAdmin}`);

  const postsCount = await prisma.post.count();
  if (postsCount === 0) {
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    if (adminUser) {
      await prisma.post.create({
        data: {
          title: "Primer post",
          slug: "primer-post",
          content:
            "Este blog ya esta listo. Entra al panel de admin para subir texto, fotos, audios y cualquier archivo.",
          authorId: adminUser.id,
        },
      });
      console.log("Post inicial creado.");
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

