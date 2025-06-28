"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { ArrowLeft, BookOpen, Eye, Save, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
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

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  priority: number;
  isFeatured: boolean;
}

export default function EditHelpArticlePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [form, setForm] = useState<ArticleForm>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    status: "DRAFT",
    priority: 0,
    isFeatured: false,
  });

  // Vérifier les permissions
  const canEditArticles = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!canEditArticles) {
      router.push("/help");
      return;
    }

    if (slug) {
      fetchData();
    }
  }, [canEditArticles, router, slug]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch article et données de référence en parallèle
      const [articleResponse, referenceResponse] = await Promise.all([
        fetch(`/api/help/${slug}`),
        fetch("/api/help/reference"),
      ]);

      if (articleResponse.ok) {
        const articleData = await articleResponse.json();
        setArticle(articleData);
        setForm({
          title: articleData.title,
          excerpt: articleData.excerpt || "",
          content: articleData.content,
          category: articleData.category,
          tags: articleData.tags,
          status: articleData.status,
          priority: articleData.priority,
          isFeatured: articleData.isFeatured,
        });
      } else {
        router.push("/help/admin");
        return;
      }

      if (referenceResponse.ok) {
        const refData = await referenceResponse.json();
        setReferenceData(refData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      router.push("/help/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ArticleForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      form.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleSelectReferenceTag = (tagKey: string) => {
    const tag = referenceData?.tags.find((t) => t.key === tagKey);
    if (tag && !form.tags.includes(tag.label)) {
      handleInputChange("tags", [...form.tags, tag.label]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim() || !form.category) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/help/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const { slug: newSlug } = await response.json();
        router.push(`/help/${newSlug}`);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating article:", error);
      alert("Erreur lors de la mise à jour de l'article");
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdownPreview = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-blue-600 underline">$1</a>'
      )
      .replace(/\n/g, "<br>");
  };

  if (!canEditArticles) {
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

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Article non trouvé
          </h1>
          <Link href="/help/admin">
            <Button>Retour à la gestion</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/help/admin">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la gestion
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Modifier l'Article
          </h1>
          <p className="text-muted-foreground">
            Modification de "{article.title}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Titre de l'article"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Extrait
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) =>
                      handleInputChange("excerpt", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Bref résumé de l'article"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {referenceData?.categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Contenu */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu *</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  value={form.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder="Contenu de l'article en Markdown..."
                  height={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Vous pouvez utiliser Markdown: **gras**, *italique*, `code`,
                  [lien](url), # Titre
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags actuels */}
                {form.tags.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Tags sélectionnés
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="pr-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ajouter un tag personnalisé */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ajouter un tag personnalisé
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nom du tag"
                    />
                    <Button type="button" onClick={handleAddTag}>
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Tags de référence */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags prédéfinis
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {referenceData?.tags.map((tag) => (
                      <Badge
                        key={tag.key}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        style={{ borderColor: tag.color || undefined }}
                        onClick={() => handleSelectReferenceTag(tag.key)}
                      >
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panneau de configuration */}
          <div className="space-y-6">
            {/* Métadonnées de l'article */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vues:</span>
                  <span>{article.views}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auteur:</span>
                  <span>{article.authorEmail.split("@")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créé:</span>
                  <span>
                    {new Date(article.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Modifié:</span>
                  <span>
                    {new Date(article.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {article.publishedAt && (
                  <div className="flex justify-between">
                    <span>Publié:</span>
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(
                        "fr-FR"
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paramètres de publication */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {referenceData?.statuses.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Priorité
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      handleInputChange("priority", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={0}>Normale</option>
                    <option value={1}>Importante</option>
                    <option value={2}>Critique</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      handleInputChange("isFeatured", e.target.checked)
                    }
                    className="rounded"
                  />
                  <label htmlFor="featured" className="text-sm">
                    Article à la une
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Aperçu */}
            {form.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Aperçu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownPreview(
                        form.content.slice(0, 500) +
                          (form.content.length > 500 ? "..." : "")
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                  <Link href={`/help/${article.slug}`} className="block">
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Voir l'article
                    </Button>
                  </Link>
                  <Link href="/help/admin" className="block">
                    <Button variant="outline" className="w-full">
                      Annuler
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
