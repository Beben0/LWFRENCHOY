import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer un article d'aide par slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const session = await auth();

    const canViewDrafts = hasPermission(session, "edit_help_article");

    const where: any = { slug };

    // Les non-admins ne voient que les articles publiés
    if (!canViewDrafts) {
      where.isPublished = true;
    }

    const article = await prisma.helpArticle.findFirst({
      where,
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Incrémenter le compteur de vues (seulement pour les articles publiés)
    if (article.isPublished) {
      await prisma.helpArticle.update({
        where: { id: article.id },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching help article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un article d'aide
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "edit_help_article")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      priority,
      isFeatured,
      status,
      isPublished,
    } = body;

    // Vérifier que l'article existe
    const existingArticle = await prisma.helpArticle.findUnique({
      where: { slug },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (priority !== undefined) updateData.priority = priority;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (status !== undefined) updateData.status = status;

    // Gestion de la publication
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existingArticle.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    // Générer un nouveau slug si le titre change
    if (title && title !== existingArticle.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

      let newSlug = baseSlug;
      let counter = 1;

      // Vérifier l'unicité du slug (exclure l'article actuel)
      while (
        await prisma.helpArticle.findFirst({
          where: { slug: newSlug, id: { not: existingArticle.id } },
        })
      ) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData.slug = newSlug;
    }

    const article = await prisma.helpArticle.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating help article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un article d'aide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "delete_help_article")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Vérifier que l'article existe
    const existingArticle = await prisma.helpArticle.findUnique({
      where: { slug },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await prisma.helpArticle.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting help article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
