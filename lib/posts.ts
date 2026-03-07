import slugify from "slugify";
import prisma from "@/lib/prisma";

export async function createUniqueSlug(title: string) {
  const base =
    slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    }) || `post-${Date.now()}`;

  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

