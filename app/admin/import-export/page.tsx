"use client";

import ImportExportLogs from "@/components/admin/import-export-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Database,
  Download,
  FileText,
  RefreshCw,
  Train,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = async (type: string, format: string = "csv") => {
    setLoading(true);
    setExportStatus(`Préparation de l'export ${type}...`);

    try {
      const response = await fetch(
        `/api/admin/export?type=${encodeURIComponent(type)}&format=${format}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      // Créer le blob et télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `export_${type.toLowerCase()}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus(`Export ${type} terminé: ${filename}`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus(`Erreur lors de l'export ${type}`);
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (type: string) => {
    setImportStatus(`Import ${type} prêt`);
    // Créer un input file invisible
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json,.xlsx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportStatus(`Import de ${file.name} en cours...`);
        setLoading(true);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", type);

          const response = await fetch("/api/admin/import", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur lors de l'import");
          }

          const result = await response.json();

          // Affichage détaillé des résultats
          if (result.summary) {
            const { recordCount, successCount, errorCount, duration } =
              result.summary;
            const successRate = Math.round((successCount / recordCount) * 100);

            let statusMessage = `Import terminé: ${successCount}/${recordCount} enregistrements`;
            if (errorCount > 0) {
              statusMessage += ` (${errorCount} erreurs)`;
            }
            statusMessage += ` - ${successRate}% de réussite`;
            statusMessage += ` - Durée: ${
              duration < 1000
                ? duration + "ms"
                : Math.round(duration / 1000) + "s"
            }`;

            setImportStatus(statusMessage);

            // Afficher quelques erreurs si présentes
            if (result.errors && result.errors.length > 0) {
              console.group("Détails des erreurs d'import:");
              result.errors.forEach((error: any) => {
                console.log(`Ligne ${error.line}: ${error.error}`, error.data);
              });
              console.groupEnd();
            }
          } else {
            // Fallback pour l'ancien format
            setImportStatus(
              `Import terminé: ${result.imported || 0} enregistrements importés`
            );
          }

          // Rafraîchir les logs après import réussi
          setTimeout(() => {
            // Le composant ImportExportLogs se rafraîchira automatiquement
            setImportStatus(null);
          }, 7000);
        } catch (error) {
          console.error("Import error:", error);
          setImportStatus(
            `Erreur lors de l'import: ${
              error instanceof Error ? error.message : "Erreur inconnue"
            }`
          );
          setTimeout(() => setImportStatus(null), 7000);
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const handleDownloadTemplate = (type: string) => {
    let csvContent = "";
    let filename = "";

    switch (type) {
      case "membres":
        csvContent =
          "pseudo,level,power,kills,specialty,allianceRole,status,notes\n";
        csvContent +=
          "ExempleJoueur,50,1000000,500,Sniper,MEMBER,ACTIVE,Notes exemple\n";
        filename = "modele_membres.csv";
        break;
      case "trains":
        csvContent = "day,timeSlot,memberPseudo\n";
        csvContent += "monday,08:00,ExempleJoueur\n";
        csvContent += "tuesday,14:00,\n";
        filename = "modele_trains.csv";
        break;
      case "evenements":
        csvContent = "title,description,type,startDate,endDate\n";
        csvContent +=
          "Guerre Alliance,Description exemple,ALLIANCE_WAR,2024-02-01T20:00:00,2024-02-01T22:00:00\n";
        filename = "modele_evenements.csv";
        break;
      case "guide":
        // Créer un petit guide PDF/texte
        csvContent = `Guide d'importation - FROY Frenchoy

FORMAT CSV:
- Séparez les colonnes par des virgules
- Utilisez des guillemets pour les valeurs contenant des virgules
- Première ligne = en-têtes de colonnes
- Dates au format: YYYY-MM-DDTHH:MM:SS

MEMBRES:
- pseudo: Nom unique du joueur (requis)
- level: Niveau du joueur (nombre)
- power: Puissance totale (nombre)
- kills: Nombre de kills (nombre)
- specialty: Sniper, Tank, Farmer, Defense
- allianceRole: R5, R4, MEMBER
- status: ACTIVE, INACTIVE

TRAINS:
- day: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- timeSlot: Format HH:MM (ex: 08:00, 14:00, 20:00)
- memberPseudo: Nom du conducteur (doit exister dans les membres)

ÉVÉNEMENTS:
- title: Titre de l'événement (requis)
- description: Description optionnelle
- type: ALLIANCE_WAR, BOSS_FIGHT, SERVER_WAR, SEASONAL
- startDate: Date/heure de début (requis)
- endDate: Date/heure de fin (optionnel)

Conseil: Testez avec quelques lignes avant d'importer en masse !`;
        filename = "guide_importation.txt";
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportOptions = [
    {
      type: "Membres",
      icon: Users,
      description: "Exporter tous les membres avec leurs données complètes",
      fields:
        "Pseudo, Level, Power, Kills, Spécialité, Rôle, Statut, Notes, Dates",
      color: "text-blue-600",
    },
    {
      type: "Trains",
      icon: Train,
      description: "Exporter le planning des trains et assignations",
      fields: "Jour, Heure, Conducteur assigné, Créé le, Modifié le",
      color: "text-green-600",
    },
    {
      type: "Événements",
      icon: Calendar,
      description: "Exporter tous les événements planifiés",
      fields: "Titre, Type, Description, Date début, Date fin, Créé le",
      color: "text-purple-600",
    },
    {
      type: "Utilisateurs",
      icon: Database,
      description: "Exporter les comptes utilisateurs (sans mots de passe)",
      fields: "Email, Rôle, Statut, Dernière connexion, Créé le",
      color: "text-red-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-8 h-8 text-lastwar-orange" />
          Import / Export des Données
        </h1>
        <p className="text-muted-foreground">
          Gérer la sauvegarde et l'importation des données de l'alliance
        </p>
      </div>

      {/* Status */}
      {(exportStatus || importStatus) && (
        <Card className="border-blue-500/20 bg-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <span className="text-sm text-foreground">
                {exportStatus || importStatus}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export des Données
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Télécharger les données de l'alliance en différents formats
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.type}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${option.color}`} />
                    <h3 className="font-semibold">{option.type}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>

                  <div className="text-xs text-muted-foreground">
                    <strong>Champs inclus:</strong> {option.fields}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(option.type, "csv")}
                      disabled={loading}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(option.type, "json")}
                      disabled={loading}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-4">
              <Button
                className="lastwar-gradient text-black"
                onClick={() => handleExport("Complet", "json")}
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Complet (Tout)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("Complet", "json")}
                disabled={loading}
              >
                <Database className="w-4 h-4 mr-2" />
                Sauvegarde Système
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import des Données
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Importer des données depuis des fichiers externes
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.type}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => handleImport(option.type)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <div className="text-left">
                        <div className="font-medium">
                          Importer {option.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Formats: CSV, JSON, Excel
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-300">
                      Attention - Import de données
                    </h4>
                    <ul className="text-sm text-yellow-200 space-y-1">
                      <li>• Les imports remplacent les données existantes</li>
                      <li>
                        • Effectuez toujours une sauvegarde avant un import
                      </li>
                      <li>
                        • Vérifiez le format des fichiers (CSV avec headers,
                        JSON valide)
                      </li>
                      <li>
                        • Les utilisateurs connectés peuvent être déconnectés
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles de Fichiers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Téléchargez des modèles vides pour faciliter l'import
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("membres")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Modèle CSV Membres
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("trains")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Modèle CSV Trains
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("evenements")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Modèle CSV Événements
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("guide")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Guide d'importation (TXT)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique réel */}
      <ImportExportLogs />
    </div>
  );
}
