"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  Plus,
  Search,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface ReferenceItem {
  key: string;
  label: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
}

interface ReferenceData {
  categories: ReferenceItem[];
  statuses: ReferenceItem[];
  tags: ReferenceItem[];
}

export default function HelpAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Vérifier les permissions
  const canManageArticles = hasPermission(session, "manage_help_categories");

  useEffect(() => {
    if (!canManageArticles) {
      router.push("/help");
      return;
    }

    fetchData();
  }, [canManageArticles, router, selectedCategory, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch articles et données de référence en parallèle
      const [articlesResponse, referenceResponse] = await Promise.all([
        fetchArticles(),
        fetch("/api/help/reference"),
      ]);

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

  const fetchArticles = async () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedStatus) params.append("status", selectedStatus);
    if (searchTerm) params.append("search", searchTerm);

    const response = await fetch(`/api/help?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setArticles(data.articles);
    }
  };

  const handleSearch = () => {
    fetchArticles();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/help/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArticles(articles.filter((article) => article.slug !== slug));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const getCategoryLabel = (key: string) => {
    return (
      referenceData?.categories.find((cat) => cat.key === key)?.label || key
    );
  };

  const getStatusLabel = (key: string) => {
    return (
      referenceData?.statuses.find((status) => status.key === key)?.label || key
    );
  };

  const getStatusColor = (key: string) => {
    return (
      referenceData?.statuses.find((status) => status.key === key)?.color ||
      "#6B7280"
    );
  };

  if (!canManageArticles) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/help">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'aide
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Gestion des Articles d'Aide
            </h1>
            <p className="text-muted-foreground">
              Créer, modifier et gérer les articles d'aide
            </p>
          </div>
        </div>
        <Link href="/help/admin/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Article
          </Button>
        </Link>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedCategory(e.target.value)
                }
                className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-48"
              >
                <option value="">Toutes les catégories</option>
                {referenceData?.categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedStatus(e.target.value)
                }
                className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-40"
              >
                <option value="">Tous les statuts</option>
                {referenceData?.statuses.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
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
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{articles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Publiés</p>
                <p className="text-2xl font-bold">
                  {articles.filter((a) => a.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">À la une</p>
                <p className="text-2xl font-bold">
                  {articles.filter((a) => a.isFeatured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total vues</p>
                <p className="text-2xl font-bold">
                  {articles.reduce((sum, a) => sum + a.views, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des articles */}
      <div className="grid grid-cols-1 gap-4">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  {/* Titre et badges */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold flex-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {article.isFeatured && (
                        <Star className="w-5 h-5 text-yellow-500" />
                      )}
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor:
                            getStatusColor(article.status) + "20",
                          color: getStatusColor(article.status),
                        }}
                      >
                        {getStatusLabel(article.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {getCategoryLabel(article.category)}
                    </Badge>
                    {article.priority > 0 && (
                      <Badge variant="destructive">
                        Priorité {article.priority}
                      </Badge>
                    )}
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

                  {/* Extrait */}
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {article.authorEmail.split("@")[0]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views} vues
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        article.publishedAt || article.createdAt
                      ).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/help/${article.slug}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/help/admin/${article.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.slug)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aucun résultat */}
      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun article trouvé</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre premier article d'aide ou modifiez vos filtres.
            </p>
            <Link href="/help/admin/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer un article
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
