-- Script d'initialisation de la base de données pour Docker
-- Ce script s'exécute automatiquement lors du premier démarrage de PostgreSQL

-- Créer des extensions si elles n'existent pas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Définir les paramètres par défaut
ALTER DATABASE alliance_manager SET timezone TO 'UTC';

-- Optimisations PostgreSQL pour l'application
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Log des requêtes lentes
ALTER SYSTEM SET log_min_duration_statement = '1000';
ALTER SYSTEM SET log_statement = 'all';

-- Reload configuration
SELECT pg_reload_conf(); 