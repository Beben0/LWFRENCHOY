import { ALERT_TEMPLATES, replaceVariables } from "./alert-templates";
import { prisma } from "./prisma";

interface AlertCondition {
  threshold: number;
  comparison: "less_than" | "greater_than" | "equals";
  timeframe?: number; // en heures
}

interface AlertData {
  value: number;
  description: string;
  context?: any;
}

export interface AlertEvaluationResult {
  triggered: boolean;
  message?: string;
  variables?: Record<string, any>;
  data?: any;
}

// Moteur principal d'évaluation des alertes
export class AlertEngine {
  private discordWebhooks: Map<string, string> = new Map();
  private telegramBots: Map<string, { token: string; chatId: string }> =
    new Map();

  async initialize() {
    // Charger les configurations de notification
    const configs = await prisma.notificationConfig.findMany({
      where: { isEnabled: true },
    });

    for (const config of configs) {
      const configData = config.config as any;
      if (config.channel === "DISCORD" && configData?.webhookUrl) {
        this.discordWebhooks.set(`discord-${config.id}`, configData.webhookUrl);
      } else if (
        config.channel === "TELEGRAM" &&
        configData?.botToken &&
        configData?.chatId
      ) {
        this.telegramBots.set(`telegram-${config.id}`, {
          token: configData.botToken,
          chatId: configData.chatId,
        });
      }
    }
  }

  // Vérifier toutes les règles actives
  async checkAllRules(): Promise<void> {
    try {
      const rules = await prisma.alertRule.findMany({
        where: { isActive: true },
      });

      for (const rule of rules) {
        await this.checkRule(rule);
      }
    } catch (error) {
      console.error("Error checking alert rules:", error);
    }
  }

  // Vérifier une règle spécifique
  private async checkRule(rule: any): Promise<void> {
    try {
      console.log(`🔍 Checking rule: "${rule.name}" (${rule.type})`);

      // Vérifier le cooldown
      if (await this.isInCooldown(rule)) {
        return;
      }

      const result = await this.evaluateRule(rule);

      if (result.triggered) {
        console.log(`🚨 Rule triggered: "${rule.name}" - Creating alert`);
        await this.createAlert(rule, result);
      } else {
        console.log(`✅ Rule "${rule.name}" - No alert needed`);
      }
    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
      // Créer une alerte d'erreur système
      await this.createSystemError(
        `Erreur lors de l'évaluation de la règle ${rule.name}`,
        error as Error
      );
    }
  }

  // Tester une règle spécifique (public pour l'API)
  async testRule(rule: any): Promise<AlertEvaluationResult> {
    return await this.evaluateRule(rule);
  }

  // Envoyer les notifications de test (sans créer d'alerte en base)
  async sendTestNotifications(
    rule: any,
    result: AlertEvaluationResult
  ): Promise<void> {
    const channels = Array.isArray(rule.channels)
      ? rule.channels
      : JSON.parse(rule.channels || "[]");

    const fakeAlert = {
      id: `test-${Date.now()}`,
      ruleId: rule.id,
      title: rule.name,
      message: result.message || "Test d'alerte",
      severity: rule.severity,
    };

    for (const channel of channels) {
      try {
        switch (channel) {
          case "DISCORD":
            await this.sendDiscordNotification(
              fakeAlert,
              result.message || fakeAlert.message
            );
            break;
          case "TELEGRAM":
            await this.sendTelegramNotification(
              fakeAlert,
              result.message || fakeAlert.message
            );
            break;
          case "IN_APP":
            // Pour IN_APP, créer une vraie alerte mais la marquer comme test
            await prisma.alert.create({
              data: {
                ruleId: rule.id,
                title: `[TEST] ${rule.name}`,
                message: result.message || "Test d'alerte",
                severity: rule.severity,
                data: JSON.stringify(result.data || {}),
                isRead: false,
                isResolved: false,
              },
            });
            break;
        }
      } catch (error) {
        console.error(`Error sending test notification via ${channel}:`, error);
        throw error;
      }
    }
  }

  private async evaluateRule(rule: any): Promise<AlertEvaluationResult> {
    const template = ALERT_TEMPLATES[rule.type];
    if (!template) {
      throw new Error(`Template non trouvé pour le type ${rule.type}`);
    }

    // Récupérer les données selon le type d'alerte
    const data = await this.collectData(rule.type, rule.conditions);

    // Évaluer la condition
    const triggered = this.evaluateCondition(data.value, rule.conditions);

    if (triggered) {
      // Utiliser la description custom si fournie, sinon le template par défaut
      const messageTemplate = rule.description || template.messageTemplate;

      // Générer le message avec les variables
      const message = replaceVariables(
        messageTemplate,
        data.variables,
        rule.conditions
      );

      return {
        triggered: true,
        message,
        variables: data.variables,
        data: data.raw,
      };
    }

    return { triggered: false };
  }

  private async collectData(
    type: string,
    conditions: any
  ): Promise<{
    value: any;
    variables: Record<string, any>;
    raw: any;
  }> {
    switch (type) {
      case "TRAIN_COVERAGE":
        return await this.getTrainCoverageData();

      case "INACTIVE_MEMBERS":
        return await this.getInactiveMembersData(conditions.timeframe || 7);

      case "MISSING_CONDUCTOR":
        return await this.getMissingConductorData();

      case "MEMBER_THRESHOLD":
        return await this.getMemberThresholdData();

      case "POWER_THRESHOLD":
        return await this.getPowerThresholdData();

      case "EVENT_REMINDER":
        return await this.getEventReminderData(conditions.timeframe || 24);

      case "TRAIN_DEPARTURE":
        return await this.getTrainDepartureData(conditions.minutesBefore || 30);

      case "MANUAL_MESSAGE":
        return await this.getManualMessageData(conditions);

      default:
        throw new Error(`Type d'alerte non supporté: ${type}`);
    }
  }

  private async getTrainCoverageData() {
    // Utiliser les instances de train à venir (non archivées) sur les 14 prochains jours
    const today = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);

    const trainInstances = await prisma.trainInstance.findMany({
      where: {
        isArchived: false,
        date: { gte: today, lte: horizon },
      },
    });

    const totalSlots = trainInstances.length;
    const assignedSlots = trainInstances.filter((t) => t.conductorId).length;
    const missingSlots = totalSlots - assignedSlots;
    const coveragePercent =
      totalSlots > 0 ? (assignedSlots / totalSlots) * 100 : 100;

    return {
      value: coveragePercent,
      variables: {
        coveragePercent: coveragePercent.toFixed(1),
        assignedSlots,
        totalSlots,
        missingSlots,
      },
      raw: {
        trainInstances,
        totalSlots,
        assignedSlots,
        missingSlots,
        coveragePercent,
      },
    };
  }

  private async getInactiveMembersData(inactiveDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const totalActiveMembers = await prisma.member.count({
      where: { status: "ACTIVE" },
    });

    const inactiveMembers = await prisma.member.findMany({
      where: {
        status: "ACTIVE",
        lastActive: {
          lt: cutoffDate,
        },
      },
    });

    const inactiveCount = inactiveMembers.length;
    const inactivePercent =
      totalActiveMembers > 0 ? (inactiveCount / totalActiveMembers) * 100 : 0;

    return {
      value: inactiveCount,
      variables: {
        inactiveCount,
        inactiveDays,
        totalActiveMembers,
        inactivePercent: inactivePercent.toFixed(1),
      },
      raw: { inactiveMembers, totalActiveMembers, cutoffDate },
    };
  }

  private async getMissingConductorData() {
    // Récupérer les créneaux sans conducteur
    const missingConductorSlots = await prisma.trainSlot.findMany({
      where: {
        conductorId: null,
      },
    });

    const totalSlots = await prisma.trainSlot.count();

    const missingConductors = missingConductorSlots.length;

    // Grouper par jour
    const dayGroups = missingConductorSlots.reduce(
      (acc: Record<string, number>, slot: any) => {
        const day = slot.day;
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {}
    );

    const missingDays = Object.entries(dayGroups)
      .map(([day, count]) => `${day} (${count})`)
      .join(", ");

    return {
      value: missingConductors,
      variables: {
        missingConductors,
        totalSlots,
        missingDays: missingDays || "Aucun",
      },
      raw: { missingConductorSlots, totalSlots, dayGroups },
    };
  }

  private async getMemberThresholdData() {
    const activeMembers = await prisma.member.count({
      where: { status: "ACTIVE" },
    });

    // Limite typique d'une alliance (peut être configuré)
    const maxMembers = 100; // À adapter selon votre jeu
    const memberPercent = (activeMembers / maxMembers) * 100;

    return {
      value: activeMembers,
      variables: {
        activeMembers,
        maxMembers,
        memberPercent: memberPercent.toFixed(1),
      },
      raw: { activeMembers, maxMembers },
    };
  }

  private async getPowerThresholdData() {
    const members = await prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: { power: true },
    });

    const activeMembers = members.length;
    const totalPower = members.reduce(
      (sum, member) => sum + Number(member.power || 0),
      0
    );
    const averagePower = activeMembers > 0 ? totalPower / activeMembers : 0;

    return {
      value: totalPower,
      variables: {
        totalPower,
        averagePower: Math.round(averagePower),
        activeMembers,
        powerGrowth: "N/A", // Peut être calculé si on a un historique
      },
      raw: { members, totalPower, averagePower, activeMembers },
    };
  }

  private async getEventReminderData(timeframeHours: number) {
    const now = new Date();
    const endTime = new Date(now.getTime() + timeframeHours * 60 * 60 * 1000);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: now,
          lte: endTime,
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Pour les rappels, on vérifie chaque événement individuellement
    if (upcomingEvents.length === 0) {
      return {
        value: 0,
        variables: {},
        raw: { upcomingEvents },
      };
    }

    // Prendre le prochain événement
    const nextEvent = upcomingEvents[0];
    const timeUntilEvent = this.formatTimeUntil(nextEvent.startDate);

    return {
      value: upcomingEvents.length,
      variables: {
        eventTitle: nextEvent.title,
        eventType: nextEvent.type || "Événement",
        timeUntilEvent,
        eventDate: nextEvent.startDate,
      },
      raw: { upcomingEvents, nextEvent },
    };
  }

  private async getTrainDepartureData(minutesBefore: number) {
    const now = new Date();

    // Nouveau système : utiliser les instances de train encore programmées ou en boarding
    const upcomingInstances = await prisma.trainInstance.findMany({
      where: {
        isArchived: false,
        status: { in: ["SCHEDULED", "BOARDING"] },
        conductorId: { not: null },
      },
      include: {
        conductor: true,
      },
    });

    const departingTrains: any[] = [];

    for (const train of upcomingInstances) {
      // Date du train (UTC) + heure réelle de départ
      const [realH, realM] = train.realDepartureTime
        .split(":" as any)
        .map(Number);
      const departureDate = new Date(train.date);
      departureDate.setUTCHours(realH, realM, 0, 0);

      // Ajustement si l'heure réelle franchit minuit (par ex 20:00 -> 00:00 lendemain)
      const [regH, regM] = train.departureTime.split(":" as any).map(Number);
      const regDate = new Date(train.date);
      regDate.setUTCHours(regH, regM, 0, 0);
      if (departureDate < regDate) {
        departureDate.setDate(departureDate.getDate() + 1);
      }

      const minutesUntil = Math.floor(
        (departureDate.getTime() - now.getTime()) / 60000
      );

      if (minutesUntil > 0 && minutesUntil <= minutesBefore) {
        departingTrains.push({
          date: train.date,
          time: train.realDepartureTime,
          conductor: train.conductor?.pseudo,
          minutesUntil,
          departureDate,
        });
      }
    }

    const trainCount = departingTrains.length;
    const trainsList = departingTrains
      .map(
        (t) =>
          `${t.conductor || "?"} (${new Date(t.date).toLocaleDateString(
            "fr-FR"
          )} ${t.time} - dans ${t.minutesUntil}min)`
      )
      .join(", ");

    return {
      value: trainCount,
      variables: {
        trainCount,
        minutesBefore,
        trainsList: trainsList || "Aucun",
        nextTrains: departingTrains
          .map(
            (t) => `${new Date(t.date).toLocaleDateString("fr-FR")} ${t.time}`
          )
          .join(", "),
      },
      raw: { departingTrains, minutesBefore },
    };
  }

  private async getManualMessageData(conditions: any) {
    return {
      value: true,
      variables: {
        message: conditions.message || "Message manuel",
        title: conditions.title || "Notification",
      },
      raw: { conditions },
    };
  }

  // Évaluer une condition numérique
  private evaluateCondition(value: any, conditions: any): boolean {
    const { threshold, comparison } = conditions;

    switch (comparison) {
      case "less_than":
        return value < threshold;
      case "greater_than":
        return value > threshold;
      case "equals":
        return value === threshold;
      case "less_than_or_equal":
        return value <= threshold;
      case "greater_than_or_equal":
        return value >= threshold;
      default:
        return false;
    }
  }

  // Déclencher une alerte
  private async createAlert(
    rule: any,
    result: AlertEvaluationResult
  ): Promise<void> {
    try {
      // Créer l'alerte en base
      const alert = await prisma.alert.create({
        data: {
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.name,
          message: result.message || "Alerte déclenchée",
          data: JSON.stringify(result.data || {}),
          isRead: false,
          isResolved: false,
        },
      });

      // Envoyer les notifications
      await this.sendNotifications(rule, alert, result);

      // Mettre à jour le lastTriggered
      await prisma.alertRule.update({
        where: { id: rule.id },
        data: { lastTriggered: new Date() },
      });

      console.log(`Alerte créée: ${rule.name} (ID: ${alert.id})`);
    } catch (error) {
      console.error("Error creating alert:", error);
    }
  }

  // Envoyer les notifications
  private async sendNotifications(
    rule: any,
    alert: any,
    result: AlertEvaluationResult
  ): Promise<void> {
    const channels = Array.isArray(rule.channels)
      ? rule.channels
      : JSON.parse(rule.channels || "[]");

    for (const channel of channels) {
      try {
        switch (channel) {
          case "DISCORD":
            await this.sendDiscordNotification(
              alert,
              result.message || alert.message
            );
            break;
          case "TELEGRAM":
            await this.sendTelegramNotification(
              alert,
              result.message || alert.message
            );
            break;
          case "IN_APP":
            // Déjà créé en base, pas d'action supplémentaire
            break;
        }

        // Enregistrer la notification
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: channel,
            status: "SENT",
            sentAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Error sending notification via ${channel}:`, error);

        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: channel,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
            sentAt: new Date(),
          },
        });
      }
    }
  }

  // Envoyer notification Discord
  private async sendDiscordNotification(
    alert: any,
    message: string
  ): Promise<void> {
    const webhookUrl = this.discordWebhooks.values().next().value;
    if (!webhookUrl) {
      throw new Error("Aucun webhook Discord configuré");
    }

    const color = this.getSeverityColor(alert.severity);
    const embed = {
      title: `🚨 ${alert.title}`,
      description: message,
      color: color,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Alerte ${alert.severity} • FRENCHOY`,
      },
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  // Envoyer notification Telegram
  private async sendTelegramNotification(
    alert: any,
    message: string
  ): Promise<void> {
    const botInfo = this.telegramBots.values().next().value;
    if (!botInfo) {
      throw new Error("Aucun bot Telegram configuré");
    }

    const formattedMessage = `🚨 *${alert.title}*\n\n${message}\n\n_Alerte ${alert.severity} • FRENCHOY_`;

    const response = await fetch(
      `https://api.telegram.org/bot${botInfo.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: botInfo.chatId,
          text: formattedMessage,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API failed: ${JSON.stringify(errorData)}`);
    }
  }

  private async createSystemError(
    message: string,
    error: Error
  ): Promise<void> {
    try {
      // Créer ou récupérer une règle système par défaut
      let systemRule = await prisma.alertRule.findFirst({
        where: {
          type: "SYSTEM_ERROR",
          name: "Erreurs Système",
        },
      });

      if (!systemRule) {
        systemRule = await prisma.alertRule.create({
          data: {
            name: "Erreurs Système",
            description: "Règle automatique pour les erreurs système",
            type: "SYSTEM_ERROR",
            isActive: true,
            conditions: {},
            severity: "HIGH",
            channels: ["IN_APP"],
            cooldown: 300, // 5 minutes
            createdBy: "system",
          },
        });
      }

      await prisma.alert.create({
        data: {
          ruleId: systemRule.id,
          severity: "HIGH",
          title: "Erreur Système",
          message: `${message}\n\nErreur: ${error.message}`,
          data: JSON.stringify({ error: error.stack }),
          isRead: false,
          isResolved: false,
        },
      });
    } catch (createError) {
      console.error("Failed to create system error alert:", createError);
    }
  }

  private async isInCooldown(rule: any): Promise<boolean> {
    if (!rule.lastTriggered || !rule.cooldown) {
      return false;
    }

    const cooldownMs = rule.cooldown * 1000; // cooldown est déjà en secondes
    const lastTriggeredTime = new Date(rule.lastTriggered).getTime();
    const timeSinceLastTrigger = Date.now() - lastTriggeredTime;

    const inCooldown = timeSinceLastTrigger < cooldownMs;

    if (inCooldown) {
      const remainingMs = cooldownMs - timeSinceLastTrigger;
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      console.log(
        `⏳ Rule "${rule.name}" in cooldown for ${remainingMinutes} more minutes`
      );
    }

    return inCooldown;
  }

  // Obtenir la couleur selon la sévérité (Discord)
  private getSeverityColor(severity: string): number {
    switch (severity) {
      case "LOW":
        return 0x00ff00; // Vert
      case "MEDIUM":
        return 0xffff00; // Jaune
      case "HIGH":
        return 0xff8000; // Orange
      case "CRITICAL":
        return 0xff0000; // Rouge
      default:
        return 0x808080; // Gris
    }
  }

  private formatTimeUntil(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`;
    } else {
      return `${minutes}min`;
    }
  }
}

// Helper function pour l'API
export async function runAlertChecks(): Promise<void> {
  const engine = new AlertEngine();
  await engine.initialize();
  await engine.checkAllRules();
}
