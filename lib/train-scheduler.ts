import {
  archiveOldTrains,
  generateTrainInstances,
  updateTrainStatuses,
} from "../scripts/generate-train-instances";

class TrainScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private dailyIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastStatusUpdate: Date | null = null;
  private lastDailyMaintenance: Date | null = null;
  private statusCheckIntervalMs = 60 * 60 * 1000; // 1 heure pour mise à jour statuts
  private dailyMaintenanceHour = 2; // 2h du matin pour maintenance complète

  constructor(statusCheckHours: number = 1, maintenanceHour: number = 2) {
    this.statusCheckIntervalMs = statusCheckHours * 60 * 60 * 1000;
    this.dailyMaintenanceHour = maintenanceHour;
  }

  start() {
    if (this.isRunning) {
      console.log("Train scheduler is already running");
      return;
    }

    console.log(
      `🚂 Starting train scheduler (status checks every ${
        this.statusCheckIntervalMs / 1000 / 60 / 60
      } hours, daily maintenance at ${this.dailyMaintenanceHour}:00)`
    );

    // Exécuter immédiatement une première mise à jour des statuts
    this.runStatusUpdate();

    // Programmer les mises à jour de statuts régulières
    this.intervalId = setInterval(() => {
      this.runStatusUpdate();
    }, this.statusCheckIntervalMs);

    // Programmer la maintenance quotidienne
    this.scheduleDailyMaintenance();

    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.dailyIntervalId) {
      clearInterval(this.dailyIntervalId);
      this.dailyIntervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 Train scheduler stopped");
  }

  private async runStatusUpdate() {
    const startTime = Date.now();
    console.log(
      `🔄 Running train status update at ${new Date().toISOString()}`
    );

    try {
      const updated = await updateTrainStatuses();
      this.lastStatusUpdate = new Date();
      const duration = Date.now() - startTime;
      console.log(
        `✅ Train status update completed in ${duration}ms (${updated} trains updated)`
      );
    } catch (error) {
      console.error("❌ Error during train status update:", error);
    }
  }

  private async runDailyMaintenance() {
    const startTime = Date.now();
    console.log(
      `🚂 Running daily train maintenance at ${new Date().toISOString()}`
    );

    try {
      // 1. Archiver les trains passés
      const archivedCount = await archiveOldTrains();

      // 2. Générer les nouveaux trains pour les 14 prochains jours
      const { generated } = await generateTrainInstances(14);

      // 3. Mettre à jour les statuts
      const updatedCount = await updateTrainStatuses();

      this.lastDailyMaintenance = new Date();
      const duration = Date.now() - startTime;

      console.log(
        `✅ Daily train maintenance completed in ${duration}ms:
         - ${archivedCount} trains archived
         - ${generated.length} new trains generated  
         - ${updatedCount} train statuses updated`
      );
    } catch (error) {
      console.error("❌ Error during daily train maintenance:", error);
    }
  }

  private scheduleDailyMaintenance() {
    // Calculer le temps jusqu'à la prochaine exécution
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(this.dailyMaintenanceHour, 0, 0, 0);

    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const msUntilNextRun = nextRun.getTime() - now.getTime();

    console.log(
      `📅 Next daily maintenance scheduled for ${nextRun.toLocaleString(
        "fr-FR"
      )}`
    );

    // Premier déclenchement
    setTimeout(() => {
      this.runDailyMaintenance();

      // Puis répéter toutes les 24h
      this.dailyIntervalId = setInterval(() => {
        this.runDailyMaintenance();
      }, 24 * 60 * 60 * 1000);
    }, msUntilNextRun);
  }

  // Force une maintenance immédiate (pour tests/admin)
  async runMaintenanceNow() {
    console.log("🔧 Running forced train maintenance...");
    await this.runDailyMaintenance();
  }

  // Force une mise à jour des statuts immédiate
  async runStatusUpdateNow() {
    console.log("🔄 Running forced status update...");
    await this.runStatusUpdate();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastStatusUpdate: this.lastStatusUpdate,
      lastDailyMaintenance: this.lastDailyMaintenance,
      statusCheckIntervalHours: this.statusCheckIntervalMs / 1000 / 60 / 60,
      dailyMaintenanceHour: this.dailyMaintenanceHour,
      nextStatusCheck: this.lastStatusUpdate
        ? new Date(this.lastStatusUpdate.getTime() + this.statusCheckIntervalMs)
        : null,
      nextDailyMaintenance: this.getNextMaintenanceTime(),
    };
  }

  private getNextMaintenanceTime(): Date {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(this.dailyMaintenanceHour, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  setStatusCheckInterval(hours: number) {
    this.statusCheckIntervalMs = hours * 60 * 60 * 1000;

    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`📅 Train status check interval updated to ${hours} hours`);
  }

  setMaintenanceHour(hour: number) {
    this.dailyMaintenanceHour = hour;

    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`🕐 Daily maintenance hour updated to ${hour}:00`);
  }
}

// Instance globale du scheduler de trains
export const trainScheduler = new TrainScheduler();

// Démarrer automatiquement en environnement de production
if (
  process.env.NODE_ENV === "production" ||
  process.env.AUTO_START_TRAINS === "true"
) {
  console.log("🚂 Auto-starting train scheduler...");
  trainScheduler.start();
}

// Fonctions pour contrôle externe
export function startTrainScheduler(
  statusCheckHours?: number,
  maintenanceHour?: number
) {
  if (statusCheckHours) {
    trainScheduler.setStatusCheckInterval(statusCheckHours);
  }
  if (maintenanceHour) {
    trainScheduler.setMaintenanceHour(maintenanceHour);
  }
  trainScheduler.start();
}

export function stopTrainScheduler() {
  trainScheduler.stop();
}

export function getTrainSchedulerStatus() {
  return trainScheduler.getStatus();
}

export async function runTrainMaintenanceNow() {
  return await trainScheduler.runMaintenanceNow();
}

export async function runTrainStatusUpdateNow() {
  return await trainScheduler.runStatusUpdateNow();
}
