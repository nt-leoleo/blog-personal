/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Role } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcrypt");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

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
        role: Role.ADMIN,
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
    data: { role: Role.ADMIN },
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

