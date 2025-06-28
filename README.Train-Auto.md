# Système de Trains Automatique

## 🚀 Nouveau système hybride

Garde l'**affichage classique** que tu préfères + **système automatique** en arrière-plan.

## ✨ Ce qui a changé

### Frontend

- **Affichage identique** : Grille jour/train comme avant
- **Status temps réel** : "Embarquement !", "Train parti", temps restant
- **Couleurs automatiques** : Bleu=programmé, Orange=embarquement, Vert=parti
- **Badge "Aujourd'hui"** : Train du jour mis en évidence

### Backend automatique

- **Génération auto** : 1 train/jour généré 14 jours à l'avance
- **Statuts temps réel** : SCHEDULED → BOARDING → DEPARTED → COMPLETED
- **Rotation auto** : Archivage des anciens trains
- **API v2** : `/api/trains-v2` pour le nouveau système

### Base de données

- **`TrainInstance`** : Trains réels avec dates et statuts
- **Backward compatible** : Ancien système `TrainSlot` toujours présent
- **Migration douce** : Pas de perte de données

## 🎯 Utilisation

1. **Admin** : Clique sur un train → assigne conducteur
2. **Membres** : Voient statuts temps réel et peuvent s'inscrire
3. **Automatique** : Nouveaux trains créés chaque jour à 2h du matin

## 📁 Fichiers modifiés

- `app/trains/page.tsx` - Utilise nouveau composant
- `components/trains/enhanced-train-schedule.tsx` - Affichage hybride
- `app/api/trains-v2/route.ts` - API nouveau système
- `lib/train-scheduler.ts` - Moteur automatique
- `prisma/schema.prisma` - Nouveau schéma TrainInstance

## 🔧 Scheduler automatique

```bash
# Vérifie que le scheduler tourne (en production)
curl /api/admin/train-scheduler

# Force maintenance manuelle
curl -X POST /api/admin/train-scheduler -d '{"action":"trigger_maintenance"}'
```

Le système est **rétrocompatible** - l'ancien système reste accessible pendant la transition.
