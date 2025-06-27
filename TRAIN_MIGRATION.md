# Migration du Système de Trains

## 🎯 Nouveau Système

Le système de trains a été refactorisé pour implémenter le concept : **"Un conducteur par jour spécifie un créneau, le train part 4h après, les autres ont 4h pour s'inscrire comme passagers"**.

### Principales Améliorations

- ✅ **Un conducteur par jour** (au lieu de multiples créneaux)
- ✅ **Système de passagers** avec inscriptions dynamiques
- ✅ **Période d'inscription de 4h** avec compte à rebours
- ✅ **Fermeture automatique** des inscriptions
- ✅ **Interface intuitive** avec statuts visuels

## 🔧 Migration Required

### Étape 1 : Configuration Database

```bash
# 1. Créer le fichier .env avec DATABASE_URL
cp env.example .env
# Éditer .env et configurer DATABASE_URL

# 2. Générer le client Prisma
npx prisma generate

# 3. Appliquer le nouveau schéma
npx prisma db push
```

### Étape 2 : Migration des Données

```bash
# Exécuter le script de migration
node scripts/migrate-train-system.js
```

### Étape 3 : Vérification

- Accéder à `/trains` pour voir le nouveau système
- Consulter `/trains-info` pour le guide complet
- Tester l'inscription/désinscription des passagers

## 📋 Changements de Schéma

### Ancien Modèle

```prisma
model TrainSlot {
  id       String  @id @default(cuid())
  day      String
  timeSlot String
  memberId String?
  member   Member? @relation(fields: [memberId], references: [id])

  @@unique([day, timeSlot])
}
```

### Nouveau Modèle

```prisma
model TrainSlot {
  id            String           @id @default(cuid())
  day           String
  departureTime String
  conductorId   String?
  conductor     Member?          @relation("TrainConductor", fields: [conductorId], references: [id])
  passengers    TrainPassenger[]

  @@unique([day]) // Un seul train par jour
}

model TrainPassenger {
  id          String    @id @default(cuid())
  trainSlotId String
  trainSlot   TrainSlot @relation(fields: [trainSlotId], references: [id], onDelete: Cascade)
  passengerId String
  passenger   Member    @relation("TrainPassengers", fields: [passengerId], references: [id])
  joinedAt    DateTime  @default(now())

  @@unique([trainSlotId, passengerId])
}
```

## 🚀 Nouvelles Fonctionnalités

### Pour les Admins

- Assigner un conducteur par jour
- Choisir le créneau de départ (08:00, 12:00, 16:00, 20:00)
- Voir la liste complète des passagers
- Gérer les inscriptions

### Pour les Membres

- S'inscrire comme passager pendant les 4h
- Voir le temps restant pour s'inscrire
- Se désinscrire si nécessaire
- Voir les autres participants

### Interface

- Compte à rebours en temps réel
- Statuts visuels (Ouvert/Fermé)
- Heures de départ claires (créneau → départ réel)
- Guide complet intégré

## 🐛 Problèmes Connus

Si vous voyez l'erreur "Unknown field conductor":

1. Le client Prisma n'est pas à jour : `npx prisma generate`
2. La DB n'est pas migrée : `npx prisma db push`
3. Variables d'environnement manquantes : vérifier `.env`

## 📞 Support

Pour toute question sur la migration :

1. Consulter `/trains-info` pour le guide utilisateur
2. Vérifier les logs du serveur pour les erreurs
3. Exécuter le script de migration si nécessaire

---

**Note :** L'ancien système reste fonctionnel en mode dégradé si la migration n'est pas encore effectuée.
