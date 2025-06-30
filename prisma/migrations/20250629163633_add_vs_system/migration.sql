-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GUEST');

-- CreateEnum
CREATE TYPE "AllianceRole" AS ENUM ('R5', 'R4', 'MEMBER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ALLIANCE_WAR', 'BOSS_FIGHT', 'SERVER_WAR', 'SEASONAL', 'GUERRE_ALLIANCE', 'EVENT_SPECIAL', 'MAINTENANCE', 'FORMATION', 'REUNION', 'AUTRE');

-- CreateEnum
CREATE TYPE "TrainAction" AS ENUM ('CONDUCTOR_ASSIGNED', 'CONDUCTOR_REMOVED', 'PASSENGER_JOINED', 'PASSENGER_LEFT', 'TIME_CHANGED', 'TRAIN_CREATED', 'TRAIN_DELETED', 'TRAIN_VALIDATED', 'TRAIN_UNVALIDATED');

-- CreateEnum
CREATE TYPE "ReferenceCategory" AS ENUM ('MEMBER_SPECIALTY', 'MEMBER_TAG', 'ALLIANCE_ROLE', 'EVENT_TYPE', 'EVENT_TAG', 'PRIORITY_LEVEL', 'STATUS_TYPE', 'HELP_CATEGORY', 'HELP_STATUS', 'HELP_TAG');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('TRAIN_COVERAGE', 'INACTIVE_MEMBERS', 'MISSING_CONDUCTOR', 'EVENT_REMINDER', 'MEMBER_THRESHOLD', 'POWER_THRESHOLD', 'SYSTEM_ERROR', 'CUSTOM', 'TRAIN_DEPARTURE', 'MANUAL_MESSAGE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('EMAIL', 'DISCORD', 'TELEGRAM', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('DISCORD', 'TELEGRAM', 'EMAIL', 'WEBHOOK', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "HelpCategory" AS ENUM ('GAME_BASICS', 'STRATEGY', 'ALLIANCE', 'TRAINS', 'EVENTS', 'TIPS_TRICKS', 'FAQ', 'TUTORIAL', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TrainStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VSWeekStatus" AS ENUM ('PREPARATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VSResult" AS ENUM ('VICTORY', 'DEFEAT', 'DRAW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pseudo" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "allianceRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "power" BIGINT NOT NULL DEFAULT 0,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "specialty" TEXT,
    "allianceRole" "AllianceRole" NOT NULL DEFAULT 'MEMBER',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[],
    "notes" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainInstance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "realDepartureTime" TEXT NOT NULL,
    "conductorId" TEXT,
    "status" "TrainStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainSlot" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "conductorId" TEXT,
    "isObsolete" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainPassenger" (
    "id" TEXT NOT NULL,
    "trainInstanceId" TEXT,
    "trainSlotId" TEXT,
    "passengerId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainHistory" (
    "id" TEXT NOT NULL,
    "trainInstanceId" TEXT,
    "trainSlotId" TEXT,
    "action" "TrainAction" NOT NULL,
    "actorId" TEXT,
    "actorPseudo" TEXT,
    "targetId" TEXT,
    "targetPseudo" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detailedDescription" TEXT,
    "type" "EventType" NOT NULL,
    "tags" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recurringEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllianceStats" (
    "id" TEXT NOT NULL,
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "totalPower" BIGINT NOT NULL DEFAULT 0,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllianceStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceData" (
    "id" TEXT NOT NULL,
    "category" "ReferenceCategory" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedBy" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AlertType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "channels" "AlertChannel"[],
    "cooldown" INTEGER NOT NULL DEFAULT 3600,
    "lastTriggered" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertNotification" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "testMessage" TEXT,
    "lastTest" TIMESTAMP(3),
    "lastTestStatus" BOOLEAN,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" "HelpCategory" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VSWeek" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "allianceScore" INTEGER NOT NULL DEFAULT 0,
    "enemyScore" INTEGER NOT NULL DEFAULT 0,
    "enemyName" TEXT,
    "status" "VSWeekStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "result" "VSResult",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VSWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VSDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "allianceScore" INTEGER NOT NULL DEFAULT 0,
    "enemyScore" INTEGER NOT NULL DEFAULT 0,
    "result" "VSResult",
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VSDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VSParticipant" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberPseudo" TEXT NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "powerGain" BIGINT NOT NULL DEFAULT 0,
    "powerLoss" BIGINT NOT NULL DEFAULT 0,
    "participation" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "rewards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VSParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_pseudo_key" ON "Member"("pseudo");

-- CreateIndex
CREATE INDEX "TrainInstance_date_idx" ON "TrainInstance"("date");

-- CreateIndex
CREATE INDEX "TrainInstance_status_idx" ON "TrainInstance"("status");

-- CreateIndex
CREATE INDEX "TrainInstance_isArchived_idx" ON "TrainInstance"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "TrainInstance_date_key" ON "TrainInstance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainSlot_day_key" ON "TrainSlot"("day");

-- CreateIndex
CREATE UNIQUE INDEX "TrainPassenger_trainInstanceId_passengerId_key" ON "TrainPassenger"("trainInstanceId", "passengerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainPassenger_trainSlotId_passengerId_key" ON "TrainPassenger"("trainSlotId", "passengerId");

-- CreateIndex
CREATE INDEX "TrainHistory_trainInstanceId_idx" ON "TrainHistory"("trainInstanceId");

-- CreateIndex
CREATE INDEX "TrainHistory_trainSlotId_idx" ON "TrainHistory"("trainSlotId");

-- CreateIndex
CREATE INDEX "TrainHistory_timestamp_idx" ON "TrainHistory"("timestamp");

-- CreateIndex
CREATE INDEX "RolePermission_roleType_idx" ON "RolePermission"("roleType");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleType_permission_key" ON "RolePermission"("roleType", "permission");

-- CreateIndex
CREATE INDEX "ReferenceData_category_isActive_idx" ON "ReferenceData"("category", "isActive");

-- CreateIndex
CREATE INDEX "ReferenceData_category_sortOrder_idx" ON "ReferenceData"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceData_category_key_key" ON "ReferenceData"("category", "key");

-- CreateIndex
CREATE INDEX "ExportLog_userId_idx" ON "ExportLog"("userId");

-- CreateIndex
CREATE INDEX "ExportLog_createdAt_idx" ON "ExportLog"("createdAt");

-- CreateIndex
CREATE INDEX "ExportLog_type_idx" ON "ExportLog"("type");

-- CreateIndex
CREATE INDEX "ImportLog_userId_idx" ON "ImportLog"("userId");

-- CreateIndex
CREATE INDEX "ImportLog_createdAt_idx" ON "ImportLog"("createdAt");

-- CreateIndex
CREATE INDEX "ImportLog_type_idx" ON "ImportLog"("type");

-- CreateIndex
CREATE INDEX "ImportLog_status_idx" ON "ImportLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_token_key" ON "InviteLink"("token");

-- CreateIndex
CREATE INDEX "AlertRule_type_isActive_idx" ON "AlertRule"("type", "isActive");

-- CreateIndex
CREATE INDEX "AlertRule_lastTriggered_idx" ON "AlertRule"("lastTriggered");

-- CreateIndex
CREATE INDEX "Alert_ruleId_idx" ON "Alert"("ruleId");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "Alert_isRead_isResolved_idx" ON "Alert"("isRead", "isResolved");

-- CreateIndex
CREATE INDEX "AlertNotification_alertId_idx" ON "AlertNotification"("alertId");

-- CreateIndex
CREATE INDEX "AlertNotification_status_idx" ON "AlertNotification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConfig_channel_key" ON "NotificationConfig"("channel");

-- CreateIndex
CREATE INDEX "NotificationConfig_channel_isEnabled_idx" ON "NotificationConfig"("channel", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "HelpArticle_slug_key" ON "HelpArticle"("slug");

-- CreateIndex
CREATE INDEX "HelpArticle_category_isPublished_idx" ON "HelpArticle"("category", "isPublished");

-- CreateIndex
CREATE INDEX "HelpArticle_status_idx" ON "HelpArticle"("status");

-- CreateIndex
CREATE INDEX "HelpArticle_publishedAt_idx" ON "HelpArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "HelpArticle_priority_idx" ON "HelpArticle"("priority");

-- CreateIndex
CREATE INDEX "HelpArticle_isFeatured_idx" ON "HelpArticle"("isFeatured");

-- CreateIndex
CREATE INDEX "VSWeek_year_weekNumber_idx" ON "VSWeek"("year", "weekNumber");

-- CreateIndex
CREATE INDEX "VSWeek_status_idx" ON "VSWeek"("status");

-- CreateIndex
CREATE INDEX "VSWeek_isCompleted_idx" ON "VSWeek"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "VSWeek_year_weekNumber_key" ON "VSWeek"("year", "weekNumber");

-- CreateIndex
CREATE INDEX "VSDay_weekId_dayNumber_idx" ON "VSDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "VSDay_date_idx" ON "VSDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VSDay_weekId_dayNumber_key" ON "VSDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "VSParticipant_weekId_idx" ON "VSParticipant"("weekId");

-- CreateIndex
CREATE INDEX "VSParticipant_memberId_idx" ON "VSParticipant"("memberId");

-- CreateIndex
CREATE INDEX "VSParticipant_kills_idx" ON "VSParticipant"("kills");

-- CreateIndex
CREATE INDEX "VSParticipant_participation_idx" ON "VSParticipant"("participation");

-- CreateIndex
CREATE UNIQUE INDEX "VSParticipant_weekId_memberId_key" ON "VSParticipant"("weekId", "memberId");

-- AddForeignKey
ALTER TABLE "TrainInstance" ADD CONSTRAINT "TrainInstance_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainSlot" ADD CONSTRAINT "TrainSlot_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainPassenger" ADD CONSTRAINT "TrainPassenger_trainInstanceId_fkey" FOREIGN KEY ("trainInstanceId") REFERENCES "TrainInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainPassenger" ADD CONSTRAINT "TrainPassenger_trainSlotId_fkey" FOREIGN KEY ("trainSlotId") REFERENCES "TrainSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainPassenger" ADD CONSTRAINT "TrainPassenger_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainHistory" ADD CONSTRAINT "TrainHistory_trainInstanceId_fkey" FOREIGN KEY ("trainInstanceId") REFERENCES "TrainInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainHistory" ADD CONSTRAINT "TrainHistory_trainSlotId_fkey" FOREIGN KEY ("trainSlotId") REFERENCES "TrainSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertNotification" ADD CONSTRAINT "AlertNotification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VSDay" ADD CONSTRAINT "VSDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "VSWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VSParticipant" ADD CONSTRAINT "VSParticipant_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "VSWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
