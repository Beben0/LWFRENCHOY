import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer les articles d'aide
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const published = searchParams.get("published");
    const featured = searchParams.get("featured");

    const session = await auth();

    // Les utilisateurs non connectés ne voient que les articles publiés
    const canViewDrafts = hasPermission(session, "edit_help_article");

    const where: any = {};

    // Filtrer par catégorie
    if (category) {
      where.category = category;
    }

    // Filtrer par statut (seulement pour les admins)
    if (status && canViewDrafts) {
      where.status = status;
    }

    // Filtrer par publié
    if (published !== null && published !== undefined) {
      where.isPublished = published === "true";
    } else if (!canViewDrafts) {
      // Les non-admins ne voient que les articles publiés
      where.isPublished = true;
    }

    // Filtrer par mis en avant
    if (featured) {
      where.isFeatured = featured === "true";
    }

    // Recherche par titre et contenu
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const articles = await prisma.helpArticle.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { isFeatured: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        tags: true,
        status: true,
        priority: true,
        isPublished: true,
        isFeatured: true,
        views: true,
        authorEmail: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        // Ne pas retourner le contenu complet dans la liste
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching help articles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel article d'aide
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "create_help_article")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, category, tags, priority, isFeatured } =
      body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    // Générer un slug unique basé sur le titre
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    let slug = baseSlug;
    let counter = 1;

    // Vérifier l'unicité du slug
    while (await prisma.helpArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = await prisma.helpArticle.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        category,
        tags: tags || [],
        priority: priority || 0,
        isFeatured: isFeatured || false,
        authorId: session.user.id,
        authorEmail: session.user.email,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error creating help article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
