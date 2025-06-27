import { runAlertChecks } from "./alert-engine";

class AlertScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRun: Date | null = null;
  private checkIntervalMs = 2 * 60 * 1000; // 2 minutes par défaut

  constructor(intervalMinutes: number = 2) {
    this.checkIntervalMs = intervalMinutes * 60 * 1000;
  }

  start() {
    if (this.isRunning) {
      console.log("Alert scheduler is already running");
      return;
    }

    console.log(
      `🚨 Starting alert scheduler (check every ${
        this.checkIntervalMs / 1000 / 60
      } minutes)`
    );

    // Exécuter immédiatement une première fois
    this.runCheck();

    // Puis programmer les exécutions régulières
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, this.checkIntervalMs);

    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 Alert scheduler stopped");
  }

  private async runCheck() {
    const startTime = Date.now();
    console.log(`🔍 Running alert checks at ${new Date().toISOString()}`);

    try {
      await runAlertChecks();
      this.lastRun = new Date();
      const duration = Date.now() - startTime;
      console.log(`✅ Alert checks completed in ${duration}ms`);
    } catch (error) {
      console.error("❌ Error during alert checks:", error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      intervalMinutes: this.checkIntervalMs / 1000 / 60,
      nextRun: this.lastRun
        ? new Date(this.lastRun.getTime() + this.checkIntervalMs)
        : null,
    };
  }

  setInterval(minutes: number) {
    this.checkIntervalMs = minutes * 60 * 1000;

    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`📅 Alert check interval updated to ${minutes} minutes`);
  }
}

// Instance globale du scheduler
export const alertScheduler = new AlertScheduler();

// Démarrer automatiquement en environnement de production
if (
  process.env.NODE_ENV === "production" ||
  process.env.AUTO_START_ALERTS === "true"
) {
  alertScheduler.start();
}

// Fonction pour démarrer manuellement
export function startAlertScheduler(intervalMinutes?: number) {
  if (intervalMinutes) {
    alertScheduler.setInterval(intervalMinutes);
  }
  alertScheduler.start();
}

// Fonction pour arrêter
export function stopAlertScheduler() {
  alertScheduler.stop();
}

// Fonction pour obtenir le statut
export function getAlertSchedulerStatus() {
  return alertScheduler.getStatus();
}
