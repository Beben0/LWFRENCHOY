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
  Sword,
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

  type TemplateFormat = "csv" | "json";

  const handleDownloadTemplate = (
    type: string,
    format: TemplateFormat = "csv"
  ) => {
    let content = "";
    let filename = "";

    const makeDownload = (data: string, name: string, mime = "text/plain") => {
      const blob = new Blob([data], { type: mime + ";charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    switch (type) {
      case "membres":
        if (format === "csv") {
          content =
            "pseudo,level,power,kills,specialty,allianceRole,status,notes\n" +
            "ExempleJoueur,50,1000000,500,Sniper,MEMBER,ACTIVE,Notes exemple\n";
          filename = "modele_membres.csv";
        } else {
          content = JSON.stringify(
            [
              {
                pseudo: "ExempleJoueur",
                level: 50,
                power: 1000000,
                kills: 500,
                specialty: "Sniper",
                allianceRole: "MEMBER",
                status: "ACTIVE",
                notes: "Notes exemple",
              },
            ],
            null,
            2
          );
          filename = "modele_membres.json";
        }
        break;
      case "trains":
        if (format === "csv") {
          content =
            "day,timeSlot,memberPseudo\n" + "monday,08:00,ExempleJoueur\n";
          filename = "modele_trains.csv";
        } else {
          content = JSON.stringify(
            [
              {
                day: "monday",
                timeSlot: "08:00",
                memberPseudo: "ExempleJoueur",
              },
              { day: "tuesday", timeSlot: "14:00", memberPseudo: null },
            ],
            null,
            2
          );
          filename = "modele_trains.json";
        }
        break;
      case "evenements":
        if (format === "csv") {
          content =
            "title,description,type,startDate,endDate,isRecurring,recurringDays,recurringEndDate,tags\n" +
            "Guerre Alliance,Description exemple,ALLIANCE_WAR,2025-07-15T20:00:00,2025-07-15T22:00:00,false,, ,combat,alliance\n" +
            "Boss Hebdo,Boss du lundi,BOSS_FIGHT,2025-07-14T19:00:00,2025-07-14T20:00:00,true,monday,2025-08-31,raid,boss\n";
          filename = "modele_evenements.csv";
        } else {
          content = JSON.stringify(
            [
              {
                title: "Guerre Alliance",
                description: "Description exemple",
                type: "ALLIANCE_WAR",
                startDate: "2025-07-15T20:00:00",
                endDate: "2025-07-15T22:00:00",
                isRecurring: false,
                recurringDays: [],
                recurringEndDate: null,
                tags: ["combat", "alliance"],
              },
              {
                title: "Boss Hebdo",
                description: "Boss du lundi",
                type: "BOSS_FIGHT",
                startDate: "2025-07-14T19:00:00",
                endDate: "2025-07-14T20:00:00",
                isRecurring: true,
                recurringDays: ["monday"],
                recurringEndDate: "2025-08-31",
                tags: ["raid", "boss"],
              },
            ],
            null,
            2
          );
          filename = "modele_evenements.json";
        }
        break;
      case "guide":
        content = `Guide d'importation - FROY Frenchoy\n\nFORMAT CSV:\n- Séparez les colonnes par des virgules\n- Utilisez des guillemets pour les valeurs contenant des virgules\n- Première ligne = en-têtes de colonnes\n- Dates au format: YYYY-MM-DDTHH:MM:SS\n\nMEMBRES:\n- pseudo: Nom unique du joueur (requis)\n- level: Niveau du joueur (nombre)\n- power: Puissance totale (nombre)\n- kills: Nombre de kills (nombre)\n- specialty: Sniper, Tank, Farmer, Defense\n- allianceRole: R5, R4, MEMBER\n- status: ACTIVE, INACTIVE\n\nTRAINS:\n- day: monday, tuesday, wednesday, thursday, friday, saturday, sunday\n- timeSlot: Format HH:MM (ex: 08:00, 14:00, 20:00)\n- memberPseudo: Nom du conducteur (doit exister dans les membres)\n\nÉVÉNEMENTS:\n- title: Titre de l'événement (requis)\n- description: Description optionnelle\n- type: ALLIANCE_WAR, BOSS_FIGHT, SERVER_WAR, SEASONAL\n- startDate: Date/heure de début (requis)\n- endDate: Date/heure de fin (optionnel)\n\nConseil: Testez avec quelques lignes avant d'importer en masse !`;
        filename = "guide_importation.txt";
        break;
      case "vs":
        if (format === "csv") {
          content =
            "weekNumber,year,title,enemyName,allianceScore,enemyScore,status,result\n" +
            "27,2025,VS Semaine 27,Alliance Test,100000,95000,ACTIVE,\n";
          filename = "modele_vs.csv";
        } else {
          content = JSON.stringify(
            [
              {
                weekNumber: 27,
                year: 2025,
                title: "VS Semaine 27",
                enemyName: "Alliance Test",
                allianceScore: 100000,
                enemyScore: 95000,
                status: "ACTIVE",
                result: null,
              },
            ],
            null,
            2
          );
          filename = "modele_vs.json";
        }
        break;
      default:
        return;
    }

    const mime = format === "json" ? "application/json" : "text/plain";
    makeDownload(content, filename, mime);
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
    {
      type: "VS",
      icon: Sword,
      description: "Exporter l'historique des VS avec participants",
      fields: "Semaine, Scores, Participants, Jours, Résultat",
      color: "text-yellow-600",
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
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("membres", "json")}
            >
              <Database className="w-4 h-4 mr-2" />
              Modèle JSON Membres
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("trains", "json")}
            >
              <Database className="w-4 h-4 mr-2" />
              Modèle JSON Trains
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("evenements", "json")}
            >
              <Database className="w-4 h-4 mr-2" />
              Modèle JSON Événements
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("vs")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Modèle CSV VS
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleDownloadTemplate("vs", "json")}
            >
              <Database className="w-4 h-4 mr-2" />
              Modèle JSON VS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique réel */}
      <ImportExportLogs />
    </div>
  );
}
