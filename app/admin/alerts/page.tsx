"use client";

import { AlertSchedulerControl } from "@/components/admin/alert-scheduler-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ALERT_TEMPLATES,
  getAvailableComparisons,
} from "@/lib/alert-templates";
import {
  Bell,
  CheckCircle,
  Edit,
  Eye,
  Info,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  conditions: any;
  severity: string;
  channels: string[];
  cooldown: number;
  lastTriggered?: string;
  createdAt: string;
}

interface NotificationConfig {
  id: string;
  channel: string;
  isEnabled: boolean;
  config: any;
  lastTest?: string;
  lastTestStatus?: boolean;
  lastTestError?: string;
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<
    "rules" | "notifications" | "scheduler"
  >("scheduler");
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateDoc, setShowTemplateDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(
    null
  );
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showTestModal, setShowTestModal] = useState<{
    rule: AlertRule;
    result?: any;
  } | null>(null);

  // États locaux pour les configurations
  const [discordConfig, setDiscordConfig] = useState({ webhookUrl: "" });
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: "",
    chatId: "",
  });

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "TRAIN_COVERAGE",
    severity: "MEDIUM",
    channels: ["IN_APP"],
    cooldown: 3600,
    conditions: {
      threshold: 80,
      comparison: "less_than",
      timeframe: null as number | null,
      minutesBefore: 30,
      title: "",
      message: "",
    } as any,
  });

  const [notificationForm, setNotificationForm] = useState({
    channel: "DISCORD",
    config: {
      webhookUrl: "",
      botToken: "",
      chatId: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Mettre à jour les conditions par défaut quand le type change
    const template = ALERT_TEMPLATES[formData.type];
    if (template) {
      setFormData((prev) => ({
        ...prev,
        conditions: { ...template.defaultConditions },
      }));
    }
  }, [formData.type]);

  const fetchData = async () => {
    try {
      const [rulesResponse, configsResponse] = await Promise.all([
        fetch("/api/admin/alerts"),
        fetch("/api/admin/notifications"),
      ]);

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData.rules || []);
      }

      if (configsResponse.ok) {
        const configsData = await configsResponse.json();
        console.log("Configs received:", configsData);
        const receivedConfigs = configsData.configs || configsData || [];
        setConfigs(receivedConfigs);

        // Mettre à jour les états locaux avec les données de la base
        const discordConf = receivedConfigs.find(
          (c: any) => c.channel === "DISCORD"
        );
        const telegramConf = receivedConfigs.find(
          (c: any) => c.channel === "TELEGRAM"
        );

        console.log("Discord config found:", discordConf);
        console.log("Telegram config found:", telegramConf);

        if (discordConf?.config) {
          setDiscordConfig(discordConf.config);
        }

        if (telegramConf?.config) {
          setTelegramConfig(telegramConf.config);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRule
        ? `/api/admin/alerts/${editingRule.id}`
        : "/api/admin/alerts";
      const method = editingRule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setShowCreateForm(false);
        setEditingRule(null);
        resetForm();

        const action = editingRule ? "modifiée" : "créée";
        setNotificationStatus(
          `✅ Règle "${formData.name}" ${action} avec succès`
        );
      } else {
        const error = await response.json();
        setNotificationStatus(`❌ Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving rule:", error);
      setNotificationStatus("❌ Erreur réseau");
    } finally {
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const handleTestNotification = async (configId: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", configId }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error testing notification:", error);
    }
  };

  const handleSaveNotificationConfig = async (channel: string, config: any) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, config }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error saving notification config:", error);
    }
  };

  const handleToggleNotification = async (
    channel: string,
    isEnabled: boolean
  ) => {
    try {
      console.log(`Toggling ${channel} to ${isEnabled}`);

      // Mettre à jour immédiatement l'état local pour un feedback visuel instantané
      setConfigs((prevConfigs) => {
        const existingConfig = prevConfigs.find((c) => c.channel === channel);
        if (existingConfig) {
          return prevConfigs.map((config) =>
            config.channel === channel ? { ...config, isEnabled } : config
          );
        } else {
          // Créer une nouvelle entrée si elle n'existe pas
          return [
            ...prevConfigs,
            {
              id: `temp-${channel}`,
              channel,
              isEnabled,
              config: {},
            },
          ];
        }
      });

      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, isEnabled }),
      });

      if (response.ok) {
        console.log(`${channel} toggled successfully`);
        // Re-fetch pour s'assurer que les données sont à jour
        await fetchData();
      } else {
        console.error(`Failed to toggle ${channel}:`, response.status);
        // En cas d'erreur, revenir à l'état précédent
        setConfigs((prevConfigs) =>
          prevConfigs.map((config) =>
            config.channel === channel
              ? { ...config, isEnabled: !isEnabled }
              : config
          )
        );
      }
    } catch (error) {
      console.error("Error toggling notification:", error);
      // En cas d'erreur, revenir à l'état précédent
      setConfigs((prevConfigs) =>
        prevConfigs.map((config) =>
          config.channel === channel
            ? { ...config, isEnabled: !isEnabled }
            : config
        )
      );
    }
  };

  const handleTestNotificationChannel = async (channel: string) => {
    try {
      setNotificationStatus(`Test ${channel} en cours...`);
      setLoading(true);

      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", channel }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotificationStatus(`✅ Test ${channel} réussi ! Message envoyé.`);
        } else {
          setNotificationStatus(`❌ Test ${channel} échoué : ${result.error}`);
        }
        setTimeout(() => setNotificationStatus(null), 3000);
        await fetchData();
      } else {
        setNotificationStatus(`❌ Erreur lors du test ${channel}`);
        setTimeout(() => setNotificationStatus(null), 3000);
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      setNotificationStatus(`❌ Erreur réseau lors du test ${channel}`);
      setTimeout(() => setNotificationStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramConfig = async () => {
    try {
      const { botToken, chatId } = telegramConfig;

      if (!botToken || !chatId) {
        setNotificationStatus("⚠️ Veuillez remplir tous les champs");
        setTimeout(() => setNotificationStatus(null), 3000);
        return;
      }

      console.log("Saving Telegram config:", {
        botToken: botToken ? "***" : "empty",
        chatId,
      });

      await handleSaveNotificationConfig("TELEGRAM", {
        botToken,
        chatId,
      });

      setNotificationStatus("✅ Configuration Telegram sauvegardée !");
      setTimeout(() => setNotificationStatus(null), 3000);
    } catch (error) {
      console.error("Error saving Telegram config:", error);
      setNotificationStatus("❌ Erreur lors de la sauvegarde");
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const saveDiscordConfig = async () => {
    try {
      const { webhookUrl } = discordConfig;

      if (!webhookUrl) {
        setNotificationStatus("⚠️ Veuillez saisir l'URL du webhook");
        setTimeout(() => setNotificationStatus(null), 3000);
        return;
      }

      await handleSaveNotificationConfig("DISCORD", { webhookUrl });

      setNotificationStatus("✅ Configuration Discord sauvegardée !");
      setTimeout(() => setNotificationStatus(null), 3000);
    } catch (error) {
      console.error("Error saving Discord config:", error);
      setNotificationStatus("❌ Erreur lors de la sauvegarde");
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const handleManualCheck = async () => {
    try {
      setNotificationStatus("Vérification manuelle en cours...");
      setLoading(true);

      const response = await fetch("/api/admin/alerts/check", {
        method: "POST",
      });

      if (response.ok) {
        setNotificationStatus("✅ Vérification manuelle terminée");
        await fetchData();
      } else {
        setNotificationStatus("❌ Erreur lors de la vérification");
      }
    } catch (error) {
      console.error("Error running manual check:", error);
      setNotificationStatus("❌ Erreur réseau");
    } finally {
      setLoading(false);
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      type: rule.type,
      severity: rule.severity,
      channels: Array.isArray(rule.channels)
        ? rule.channels
        : JSON.parse(rule.channels || "[]"),
      cooldown: rule.cooldown,
      conditions: rule.conditions,
    });
    setShowCreateForm(true);
  };

  const handleTestRule = async (
    rule: AlertRule,
    sendRealNotifications = false
  ) => {
    try {
      const action = sendRealNotifications ? "envoi de notifications" : "test";
      setNotificationStatus(`${action} de la règle "${rule.name}" en cours...`);
      setLoading(true);

      const response = await fetch(`/api/admin/alerts/${rule.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNotifications: sendRealNotifications }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowTestModal({ rule, result });

        let statusMessage = `✅ Test de la règle "${rule.name}" terminé`;
        if (sendRealNotifications && result.notificationsSent) {
          statusMessage += " - Notifications envoyées !";
        } else if (sendRealNotifications && !result.result.triggered) {
          statusMessage +=
            " - Aucune notification envoyée (conditions non remplies)";
        }
        setNotificationStatus(statusMessage);
      } else {
        const error = await response.json();
        setNotificationStatus(
          `❌ Erreur lors du test: ${error.details || error.error}`
        );
      }
    } catch (error) {
      console.error("Error testing rule:", error);
      setNotificationStatus(`❌ Erreur réseau lors du test`);
    } finally {
      setLoading(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const handleDeleteRule = async (rule: AlertRule) => {
    if (
      !confirm(`Êtes-vous sûr de vouloir supprimer la règle "${rule.name}" ?`)
    ) {
      return;
    }

    try {
      setNotificationStatus(`Suppression de la règle "${rule.name}"...`);

      const response = await fetch(`/api/admin/alerts/${rule.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
        setNotificationStatus(`✅ Règle "${rule.name}" supprimée`);
      } else {
        const error = await response.json();
        setNotificationStatus(
          `❌ Erreur lors de la suppression: ${error.error}`
        );
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      setNotificationStatus(`❌ Erreur réseau lors de la suppression`);
    } finally {
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "TRAIN_COVERAGE",
      severity: "MEDIUM",
      channels: ["IN_APP"],
      cooldown: 3600,
      conditions: {
        threshold: 80,
        comparison: "less_than",
        timeframe: null,
      },
    });
    setEditingRule(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "CRITICAL":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const renderConditionForm = () => {
    const template = ALERT_TEMPLATES[formData.type];
    if (!template) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Conditions</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateDoc(formData.type)}
          >
            <Info className="h-4 w-4 mr-1" />
            Documentation
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Seuil</label>
            <input
              type="number"
              value={formData.conditions.threshold}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conditions: {
                    ...prev.conditions,
                    threshold: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="Valeur de déclenchement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Comparaison
            </label>
            <select
              value={formData.conditions.comparison}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conditions: {
                    ...prev.conditions,
                    comparison: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              {getAvailableComparisons()
                .filter((comp) =>
                  template.availableComparisons.includes(comp.value)
                )
                .map((comp) => (
                  <option key={comp.value} value={comp.value}>
                    {comp.label}
                  </option>
                ))}
            </select>
          </div>

          {(formData.type === "INACTIVE_MEMBERS" ||
            formData.type === "EVENT_REMINDER") && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.type === "INACTIVE_MEMBERS"
                  ? "Jours d'inactivité"
                  : "Période (heures)"}
              </label>
              <input
                type="number"
                value={formData.conditions.timeframe || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conditions: {
                      ...prev.conditions,
                      timeframe: e.target.value ? Number(e.target.value) : null,
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder={
                  formData.type === "INACTIVE_MEMBERS" ? "Ex: 7" : "Ex: 24"
                }
              />
            </div>
          )}

          {formData.type === "TRAIN_DEPARTURE" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Minutes avant départ
              </label>
              <input
                type="number"
                value={formData.conditions.minutesBefore || 30}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conditions: {
                      ...prev.conditions,
                      minutesBefore: Number(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder="Ex: 30"
                min="1"
                max="1440"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alerte X minutes avant le départ des trains
              </p>
            </div>
          )}

          {formData.type === "MANUAL_MESSAGE" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Titre du message
                </label>
                <input
                  type="text"
                  value={formData.conditions.title || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        title: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Ex: Maintenance serveur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message personnalisé
                </label>
                <textarea
                  value={formData.conditions.message || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        message: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Votre message personnalisé..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            <strong>Exemple:</strong> {template.examples[0]?.description}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {template.examples[0]?.messagePreview}
          </p>
        </div>
      </div>
    );
  };

  const renderTemplateDocumentation = () => {
    if (!showTemplateDoc) return null;

    const template = ALERT_TEMPLATES[showTemplateDoc];
    if (!template) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">{template.icon}</span>
              {template.name}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateDoc(null)}
            >
              Fermer
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">
                Variables disponibles
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="grid gap-2">
                  {template.variables.map((variable) => (
                    <div key={variable.key} className="text-sm">
                      <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                        {`{${variable.key}}`}
                      </code>
                      <span className="ml-2 font-medium">{variable.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-16">
                        {variable.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Template de message</h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <pre className="text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {template.messageTemplate}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Exemples</h4>
              <div className="space-y-2">
                {template.examples.map((example, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <p className="text-sm font-medium">{example.description}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {example.messagePreview}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Système d'Alertes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des règles d'alertes et des notifications
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleManualCheck} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Test Manuel
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Règle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("rules")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "rules"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Règles d'Alertes ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Notifications ({configs.length})
          </button>
          <button
            onClick={() => setActiveTab("scheduler")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "scheduler"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Planification
          </button>
        </nav>
      </div>

      {/* Status */}
      {notificationStatus && (
        <Card className="border-blue-500/20 bg-blue-500/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <span className="text-sm text-foreground">
                {notificationStatus}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglet Règles */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {ALERT_TEMPLATES[rule.type]?.icon || "🔔"}
                    </span>
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Type:</strong>{" "}
                    {ALERT_TEMPLATES[rule.type]?.name || rule.type}
                  </p>
                  <p className="text-sm">
                    <strong>Condition:</strong>{" "}
                    {rule.conditions.comparison === "less_than" &&
                      "Inférieur à"}
                    {rule.conditions.comparison === "greater_than" &&
                      "Supérieur à"}
                    {rule.conditions.comparison === "equals" && "Égal à"}{" "}
                    {rule.conditions.threshold}
                    {rule.conditions.timeframe &&
                      ` (${rule.conditions.timeframe} ${
                        rule.type === "INACTIVE_MEMBERS" ? "jours" : "heures"
                      })`}
                  </p>
                  <p className="text-sm">
                    <strong>Canaux:</strong> {rule.channels.join(", ")}
                  </p>
                  <p className="text-sm">
                    <strong>Cooldown:</strong> {Math.floor(rule.cooldown / 60)}{" "}
                    minutes
                  </p>
                  {rule.lastTriggered && (
                    <p className="text-sm">
                      <strong>Dernier déclenchement:</strong>{" "}
                      {new Date(rule.lastTriggered).toLocaleString("fr-FR")}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestRule(rule, false)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Aperçu
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleTestRule(rule, true)}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-3 h-3" />
                      Test Réel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRule(rule)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRule(rule)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Onglet Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Discord Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🟣</span>
                <span>Discord</span>
              </CardTitle>
              <CardDescription>
                Configuration du webhook Discord pour recevoir les alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL du Webhook Discord
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    value={discordConfig.webhookUrl}
                    onChange={(e) =>
                      setDiscordConfig({
                        ...discordConfig,
                        webhookUrl: e.target.value,
                      })
                    }
                  />
                  <div className="mt-2">
                    <Button
                      onClick={saveDiscordConfig}
                      size="sm"
                      variant="outline"
                    >
                      Sauver Configuration
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pour créer un webhook: Serveur → Paramètres → Intégrations →
                    Webhooks
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        configs.find((c) => c.channel === "DISCORD")
                          ?.isEnabled || false
                      }
                      onChange={(e) => {
                        handleToggleNotification("DISCORD", e.target.checked);
                      }}
                    />
                    <span className="text-sm">Activé</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotificationChannel("DISCORD")}
                  >
                    Tester
                  </Button>
                </div>
                {configs.find((c) => c.channel === "DISCORD")?.lastTest && (
                  <div className="text-sm">
                    <p>
                      Dernier test:{" "}
                      {new Date(
                        configs.find((c) => c.channel === "DISCORD")!.lastTest!
                      ).toLocaleString("fr-FR")}
                    </p>
                    <Badge
                      variant={
                        configs.find((c) => c.channel === "DISCORD")
                          ?.lastTestStatus
                          ? "default"
                          : "destructive"
                      }
                    >
                      {configs.find((c) => c.channel === "DISCORD")
                        ?.lastTestStatus
                        ? "Succès"
                        : "Échec"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Telegram Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📱</span>
                <span>Telegram</span>
              </CardTitle>
              <CardDescription>
                Configuration du bot Telegram pour recevoir les alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Token du Bot
                  </label>
                  <input
                    type="password"
                    placeholder="123456789:ABCdefGhIjklMnoPqrStUvwXyz"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    value={telegramConfig.botToken}
                    onChange={(e) =>
                      setTelegramConfig({
                        ...telegramConfig,
                        botToken: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Créer un bot avec @BotFather sur Telegram
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    placeholder="-1001234567890"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    value={telegramConfig.chatId}
                    onChange={(e) =>
                      setTelegramConfig({
                        ...telegramConfig,
                        chatId: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID du groupe/canal où envoyer les messages
                  </p>
                </div>
                <div className="mb-4">
                  <Button
                    onClick={saveTelegramConfig}
                    size="sm"
                    variant="outline"
                  >
                    Sauver Configuration
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        configs.find((c) => c.channel === "TELEGRAM")
                          ?.isEnabled || false
                      }
                      onChange={(e) => {
                        handleToggleNotification("TELEGRAM", e.target.checked);
                      }}
                    />
                    <span className="text-sm">Activé</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotificationChannel("TELEGRAM")}
                  >
                    Tester
                  </Button>
                </div>
                {configs.find((c) => c.channel === "TELEGRAM")?.lastTest && (
                  <div className="text-sm">
                    <p>
                      Dernier test:{" "}
                      {new Date(
                        configs.find((c) => c.channel === "TELEGRAM")!.lastTest!
                      ).toLocaleString("fr-FR")}
                    </p>
                    <Badge
                      variant={
                        configs.find((c) => c.channel === "TELEGRAM")
                          ?.lastTestStatus
                          ? "default"
                          : "destructive"
                      }
                    >
                      {configs.find((c) => c.channel === "TELEGRAM")
                        ?.lastTestStatus
                        ? "Succès"
                        : "Échec"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Scheduler */}
      {activeTab === "scheduler" && (
        <div className="space-y-6">
          <AlertSchedulerControl />
        </div>
      )}

      {/* Form de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? "Modifier la règle" : "Créer une nouvelle règle"}
            </h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type d'alerte
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                >
                  {Object.values(ALERT_TEMPLATES).map((template) => (
                    <option key={template.type} value={template.type}>
                      {template.icon} {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Ex: Alerte couverture trains"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Description de la règle d'alerte..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sévérité
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        severity: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="LOW">🟢 Faible</option>
                    <option value="MEDIUM">🟡 Moyenne</option>
                    <option value="HIGH">🟠 Élevée</option>
                    <option value="CRITICAL">🔴 Critique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cooldown (minutes)
                  </label>
                  <input
                    type="number"
                    value={Math.floor(formData.cooldown / 60)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cooldown: Number(e.target.value) * 60,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    min="5"
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Canaux de notification
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["IN_APP", "DISCORD", "TELEGRAM", "EMAIL"].map((channel) => (
                    <label
                      key={channel}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              channels: [...prev.channels, channel],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              channels: prev.channels.filter(
                                (c) => c !== channel
                              ),
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {renderConditionForm()}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.name || formData.channels.length === 0}
                >
                  {editingRule ? "Modifier la Règle" : "Créer la Règle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderTemplateDocumentation()}

      {/* Modal de Test et Aperçu */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Test de la règle: {showTestModal.rule.name}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTestModal(null)}
              >
                Fermer
              </Button>
            </div>

            {showTestModal.result && (
              <div className="space-y-4">
                {/* Statut des notifications */}
                {showTestModal.result.sentNotifications && (
                  <Card className="border-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        📡
                        {showTestModal.result.notificationsSent
                          ? "Notifications envoyées avec succès !"
                          : "Test réel effectué"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {showTestModal.result.notificationsSent ? (
                        <p className="text-green-600 dark:text-green-400">
                          Les notifications ont été envoyées sur les canaux
                          configurés.
                        </p>
                      ) : (
                        <p className="text-orange-600 dark:text-orange-400">
                          Aucune notification envoyée car les conditions ne sont
                          pas remplies.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Résultat du test */}
                <Card
                  className={
                    showTestModal.result.result.triggered
                      ? "border-red-500"
                      : "border-green-500"
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {showTestModal.result.result.triggered ? "🚨" : "✅"}
                      {showTestModal.result.result.triggered
                        ? "Alerte déclenchée"
                        : "Aucune alerte"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showTestModal.result.result.triggered ? (
                      <div className="space-y-2">
                        <p>
                          <strong>Message:</strong>{" "}
                          {showTestModal.result.result.message}
                        </p>
                        <p>
                          <strong>Données:</strong>{" "}
                          {JSON.stringify(
                            showTestModal.result.result.variables,
                            null,
                            2
                          )}
                        </p>
                      </div>
                    ) : (
                      <p>
                        Les conditions ne sont pas remplies pour déclencher
                        cette alerte.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Aperçus des canaux */}
                {showTestModal.result.result.triggered && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Aperçu des notifications:</h4>

                    {Object.entries(showTestModal.result.previews || {}).map(
                      ([channel, preview]: [string, any]) => (
                        <Card key={channel}>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              {channel === "DISCORD" && "🟣 Discord"}
                              {channel === "TELEGRAM" && "🔵 Telegram"}
                              {channel === "IN_APP" && "🔔 In-App"}
                              {channel === "EMAIL" && "📧 Email"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {channel === "DISCORD" && (
                              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-3">
                                  <h5 className="font-semibold text-blue-600">
                                    {preview.content.title}
                                  </h5>
                                  <p className="text-sm">
                                    {preview.content.description}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {preview.content.footer.text}
                                  </p>
                                </div>
                              </div>
                            )}
                            {channel === "TELEGRAM" && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {preview.content}
                                </pre>
                              </div>
                            )}
                            {channel === "IN_APP" && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                <h5 className="font-semibold">
                                  {preview.content.title}
                                </h5>
                                <p className="text-sm">
                                  {preview.content.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Sévérité: {preview.content.severity}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
