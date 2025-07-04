"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
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

interface ReferenceData {
  categories: {
    key: string;
    label: string;
    description?: string;
    color?: string;
    sortOrder: number;
  }[];
  statuses: {
    key: string;
    label: string;
    description?: string;
    color?: string;
    sortOrder: number;
  }[];
  tags: {
    key: string;
    label: string;
    description?: string;
    color?: string;
    sortOrder: number;
  }[];
}

interface HelpClientPageProps {
  canEdit: boolean;
  canCreate: boolean;
}

function ArticleCard({
  article,
  featured = false,
  getCategoryLabel,
  getCategoryColor,
}: {
  article: HelpArticle;
  featured?: boolean;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
}) {
  return (
    <Card
      className={`hover:shadow-lg transition-shadow h-full ${
        featured ? "ring-2 ring-yellow-500" : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">
            <Link
              href={`/help/${article.slug}`}
              className="hover:text-primary transition-colors line-clamp-2 block"
            >
              <Translate>{article.title}</Translate>
            </Link>
          </CardTitle>
          {featured && (
            <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`bg-${getCategoryColor(
              article.category
            )}-100 text-${getCategoryColor(
              article.category
            )}-800 border-${getCategoryColor(article.category)}-200`}
          >
            <Translate>{getCategoryLabel(article.category)}</Translate>
          </Badge>
          {article.priority > 0 && (
            <Badge variant="destructive">
              <Translate>Priorité</Translate> {article.priority}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            <Translate>{article.excerpt}</Translate>
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Translate>{tag}</Translate>
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

export default function HelpClientPage({
  canEdit,
  canCreate,
}: HelpClientPageProps) {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch articles et données de référence en parallèle
      const [articlesResponse, referenceResponse] = await Promise.all([
        fetch("/api/help?published=true"),
        fetch("/api/help/reference"),
      ]);

      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData.articles || []);
      }

      if (referenceResponse.ok) {
        const refData = await referenceResponse.json();
        setReferenceData(refData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    // Filtrer par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(search) ||
          article.excerpt?.toLowerCase().includes(search) ||
          article.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleSearch = () => {
    filterArticles();
  };

  const getCategoryLabel = (categoryKey: string): string => {
    const category = referenceData?.categories.find(
      (c) => c.key === categoryKey
    );
    return category?.label || categoryKey;
  };

  const getCategoryColor = (categoryKey: string): string => {
    const category = referenceData?.categories.find(
      (c) => c.key === categoryKey
    );
    return category?.color || "gray";
  };

  // Grouper les articles par catégorie
  const articlesByCategory = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  // Articles mis en avant
  const featuredArticles = filteredArticles.filter(
    (article) => article.isFeatured && article.isPublished
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>
            <Translate>Chargement...</Translate>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <Translate>Centre d'aide</Translate>
          </h1>
          <p className="text-muted-foreground">
            <Translate>Documentation et guides pour votre alliance</Translate>
          </p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link href="/help/admin">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                <Translate>Administration</Translate>
              </Button>
            </Link>
          )}
          {canCreate && (
            <Link href="/help/admin/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                <Translate>Nouvel Article</Translate>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <Translate>Filtres et Recherche</Translate>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-48"
              >
                <option value="">
                  <Translate>Toutes les catégories</Translate>
                </option>
                {referenceData?.categories
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((category) => (
                    <option key={category.key} value={category.key}>
                      <Translate>{category.label}</Translate>
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <Translate>Total</Translate>
                </p>
                <p className="text-2xl font-bold">{filteredArticles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <Translate>À la une</Translate>
                </p>
                <p className="text-2xl font-bold">{featuredArticles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <Translate>Total vues</Translate>
                </p>
                <p className="text-2xl font-bold">
                  {filteredArticles.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <Translate>Catégories</Translate>
                </p>
                <p className="text-2xl font-bold">
                  {referenceData?.categories.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles mis en avant */}
      {featuredArticles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <Translate>Articles mis en avant</Translate>
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles
              .sort((a, b) => b.priority - a.priority)
              .map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  featured
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                />
              ))}
          </div>
        </div>
      )}

      {/* Tous les articles */}
      {filteredArticles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            <Translate>Tous les articles</Translate>
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles
              .filter((article) => !article.isFeatured) // Exclure les articles déjà mis en avant
              .sort((a, b) => b.priority - a.priority)
              .map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                />
              ))}
          </div>
        </div>
      )}

      {/* Message si aucun article */}
      {filteredArticles.length === 0 && articles.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              <Translate>Aucun résultat trouvé</Translate>
            </h3>
            <p className="text-muted-foreground mb-4">
              <Translate>
                Essayez de modifier vos critères de recherche ou de filtrage.
              </Translate>
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
            >
              <Translate>Réinitialiser les filtres</Translate>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun article en base */}
      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              <Translate>Aucun article disponible</Translate>
            </h3>
            <p className="text-muted-foreground mb-4">
              <Translate>
                Aucun article d'aide n'est actuellement publié.
              </Translate>
            </p>
            {canCreate && (
              <Link href="/help/admin/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <Translate>Créer le premier article</Translate>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
