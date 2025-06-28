"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Edit, Eye, Star, Tag, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  status: string;
  priority: number;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  authorEmail: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  GAME_BASICS: "Bases du jeu",
  STRATEGY: "Stratégies",
  ALLIANCE: "Alliance",
  TRAINS: "Trains",
  EVENTS: "Événements",
  TIPS_TRICKS: "Astuces",
  FAQ: "Questions fréquentes",
  TUTORIAL: "Tutoriels",
  ADVANCED: "Avancé",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  REVIEW: "En révision",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

// Simple markdown renderer (basic version)
function renderMarkdown(content: string): string {
  return (
    content
      // Headers
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>'
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>'
      )
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')

      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
      )

      // Code blocks
      .replace(
        /```([^`]+)```/g,
        '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>'
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>'
      )

      // Lists
      .replace(/^\* (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-1 my-4">$1</ul>')

      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br>")
  );
}

export default function HelpArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const canEditArticles = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!slug) return;

    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/help/${slug}`);

      if (response.status === 404) {
        setError("Article non trouvé");
        return;
      }

      if (!response.ok) {
        setError("Erreur lors du chargement de l'article");
        return;
      }

      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error("Error fetching article:", error);
      setError("Erreur lors du chargement de l'article");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Cet article n'existe pas ou n'est plus disponible."}
            </p>
            <Link href="/help">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux articles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/help">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux articles
          </Button>
        </Link>
        {canEditArticles && (
          <Link href={`/help/admin/${article.slug}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>
        )}
      </div>

      {/* Article */}
      <Card>
        <CardHeader className="space-y-4">
          {/* Titre et badges */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold flex-1">{article.title}</h1>
              {article.isFeatured && (
                <Star className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {categoryLabels[article.category] || article.category}
              </Badge>

              {article.priority > 0 && (
                <Badge variant="destructive">Priorité {article.priority}</Badge>
              )}

              {!article.isPublished && (
                <Badge variant="outline">{statusLabels[article.status]}</Badge>
              )}

              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Par {article.authorEmail.split("@")[0]}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date(article.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.views} vue{article.views !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Extrait */}
          {article.excerpt && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-muted-foreground italic">{article.excerpt}</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Contenu de l'article */}
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-4">${renderMarkdown(
                  article.content
                )}</p>`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires pour les admins */}
      {canEditArticles && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Informations administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID:</span> {article.id}
              </div>
              <div>
                <span className="font-medium">Slug:</span> {article.slug}
              </div>
              <div>
                <span className="font-medium">Statut:</span>{" "}
                {statusLabels[article.status]}
              </div>
              <div>
                <span className="font-medium">Créé le:</span>{" "}
                {new Date(article.createdAt).toLocaleString("fr-FR")}
              </div>
              <div>
                <span className="font-medium">Modifié le:</span>{" "}
                {new Date(article.updatedAt).toLocaleString("fr-FR")}
              </div>
              {article.publishedAt && (
                <div>
                  <span className="font-medium">Publié le:</span>{" "}
                  {new Date(article.publishedAt).toLocaleString("fr-FR")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
