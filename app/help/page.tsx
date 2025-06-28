"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  BookOpen,
  Calendar,
  Eye,
  Filter,
  Plus,
  Search,
  Star,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
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

export default function HelpPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const canManageArticles = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedStatus, showFeaturedOnly]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();

      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedStatus) params.append("status", selectedStatus);
      if (showFeaturedOnly) params.append("featured", "true");

      const response = await fetch(`/api/help?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchArticles();
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(`/api/help?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Error searching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (!searchTerm) return true;
    return (
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const featuredArticles = filteredArticles.filter(
    (article) => article.isFeatured && article.isPublished
  );
  const regularArticles = filteredArticles.filter(
    (article) => !article.isFeatured || !article.isPublished
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des articles d'aide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Centre d'Aide Last War
          </h1>
          <p className="text-muted-foreground">
            Guides, astuces et documentation pour optimiser votre expérience
          </p>
        </div>
        {canManageArticles && (
          <Link href="/help/admin">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Article
            </Button>
          </Link>
        )}
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Rechercher dans les articles..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                onKeyPress={(e: React.KeyboardEvent) =>
                  e.key === "Enter" && handleSearch()
                }
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedCategory(e.target.value)
                }
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-48"
              >
                <option value="">Toutes les catégories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {canManageArticles && (
                <select
                  value={selectedStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedStatus(e.target.value)
                  }
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-40"
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              )}

              <Button
                variant={showFeaturedOnly ? "default" : "outline"}
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              >
                <Star className="w-4 h-4 mr-1" />À la une
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles à la une */}
      {featuredArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Articles à la une
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} featured />
            ))}
          </div>
        </div>
      )}

      {/* Articles réguliers */}
      {regularArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {featuredArticles.length > 0 ? "Autres articles" : "Articles"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* Aucun résultat */}
      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun article trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou vos filtres.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  featured = false,
}: {
  article: HelpArticle;
  featured?: boolean;
}) {
  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${
        featured ? "ring-2 ring-yellow-500" : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="line-clamp-2 text-lg">
            <Link
              href={`/help/${article.slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.title}
            </Link>
          </CardTitle>
          {featured && (
            <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {categoryLabels[article.category] || article.category}
          </Badge>
          {article.priority > 0 && (
            <Badge variant="destructive">Priorité {article.priority}</Badge>
          )}
          {!article.isPublished && (
            <Badge variant="outline">{statusLabels[article.status]}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {article.authorEmail.split("@")[0]}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(
                article.publishedAt || article.createdAt
              ).toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
