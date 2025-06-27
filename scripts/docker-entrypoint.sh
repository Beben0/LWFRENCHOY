#!/bin/sh
# Script d'entrypoint pour Docker
set -e

echo "🚀 Starting Alliance Manager application..."

# Test de la connectivité réseau et migration
echo "🔍 Testing database connectivity..."
if nc -z postgres 5432; then
  echo "✅ Database connection successful!"
  
  echo "🔄 Applying database migrations..."
  if npx prisma db push; then
    echo "✅ Database migrations applied successfully!"
  else
    echo "⚠️ Database migration failed, continuing anyway..."
  fi
  
  echo "🛠️ Generating Prisma client..."
  if npx prisma generate; then
    echo "✅ Prisma client generated successfully!"
  else
    echo "⚠️ Prisma client generation failed, continuing anyway..."
  fi
else
  echo "⚠️ Database connection failed, starting app anyway..."
fi

# Optionnel : Seed de la base de données en dev
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database for development..."
  npx tsx prisma/seed.ts || echo "⚠️ Seeding failed, continuing..."
fi

echo "🎯 Starting Next.js application..."

# Démarrer l'application
exec "$@" 