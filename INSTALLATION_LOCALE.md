# Installation Supabase Self-Hosted - MAC ASSURANCE

## Prérequis

- Docker Desktop installé ([télécharger ici](https://www.docker.com/products/docker-desktop/))
- Git installé
- 4 Go de RAM minimum disponible

## Étape 1 : Installer Supabase en local

```bash
# Cloner le dépôt Supabase
git clone --depth 1 https://github.com/supabase/supabase

# Aller dans le dossier docker
cd supabase/docker

# Copier le fichier d'environnement
cp .env.example .env
```

## Étape 2 : Configurer l'authentification (CRITIQUE)

**⚠️ IMPORTANT : Cette étape est requise pour pouvoir créer des comptes !**

Éditez le fichier `.env` dans le dossier `supabase/docker` :

```bash
# Cherchez et modifiez ces lignes :

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true    # ← IMPORTANT : mettre true pour désactiver la confirmation email
```

Ou éditez le fichier `volumes/api/kong.yml` et ajoutez `enable_confirmations: false` dans la section auth si disponible.

**Alternative : utiliser Inbucket pour les emails de confirmation**
- Inbucket capture tous les emails envoyés par Supabase
- URL : http://localhost:54324
- Vous y trouverez les emails de confirmation

## Étape 3 : Démarrer Supabase

```bash
# Depuis le dossier supabase/docker
docker compose up -d
```

Attendez quelques minutes le temps que tous les services démarrent.

## Étape 4 : Accéder aux interfaces

| Service | URL | Description |
|---------|-----|-------------|
| Supabase Studio | http://localhost:54323 | Interface d'administration |
| API REST | http://localhost:54321 | API Supabase |
| Inbucket (Emails) | http://localhost:54324 | Capture des emails |
| PostgreSQL | localhost:54322 | Base de données |

Identifiants Studio par défaut :
- Email : `supabase`
- Password : `this_password_is_insecure_and_should_be_updated`

## Étape 5 : Récupérer les clés API

Dans le fichier `.env` de Supabase (`supabase/docker/.env`), notez :
- `ANON_KEY` : Clé publique (ligne `ANON_KEY=...`)
- `SERVICE_ROLE_KEY` : Clé service admin

## Étape 6 : Configurer l'application MAC ASSURANCE

Modifiez le fichier `.env` **à la racine du projet MAC ASSURANCE** :

```env
VITE_SUPABASE_PROJECT_ID="local"
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="VOTRE_ANON_KEY_ICI"
```

**Remplacez `VOTRE_ANON_KEY_ICI` par la clé ANON_KEY du fichier `.env` de Supabase.**

## Étape 7 : Migrer les données du Cloud vers le Local

### Option A : Via Supabase Studio (Export CSV)

1. **Sur Supabase Cloud** (https://supabase.com/dashboard) :
   - Allez dans **Table Editor**
   - Pour chaque table, cliquez sur **Export to CSV**
   - Téléchargez tous les fichiers CSV

2. **Sur Supabase Local** (http://localhost:54323) :
   - Allez dans **Table Editor**
   - Pour chaque table, cliquez sur **Import data from CSV**
   - Importez les fichiers CSV correspondants

### Option B : Via pg_dump/pg_restore (Recommandé pour beaucoup de données)

```bash
# 1. Exporter depuis Supabase Cloud
# Récupérez l'URL de connexion depuis : Dashboard > Settings > Database > Connection string

pg_dump "postgresql://postgres:[MOT_DE_PASSE]@db.albtlsmipwjqnducydpy.supabase.co:5432/postgres" \
  --data-only \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  -f export_data.sql

# 2. Importer dans Supabase Local
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f export_data.sql
```

### Option C : Script SQL direct

Dans Supabase Studio Cloud, exécutez ce SQL pour générer les INSERT :

```sql
-- Générer les commandes INSERT pour chaque table
-- Copiez le résultat et exécutez-le en local

-- Exemple pour la table contracts
SELECT 'INSERT INTO contracts VALUES (' || 
  quote_literal(id) || ',' ||
  quote_literal(contract_number) || ',' ||
  -- ... autres colonnes
  ');'
FROM contracts;
```

## Étape 8 : Importer le schéma de base de données

1. Ouvrez Supabase Studio : http://localhost:54323
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu du fichier `supabase/schema_complet.sql`

Ce fichier contient tout le schéma de la base de données :
- Types énumérés
- Tables
- Fonctions
- Triggers
- Politiques RLS
- Bucket de stockage

## Étape 8 : Créer un compte utilisateur

### Option A : Via l'interface (RECOMMANDÉ)

1. Lancez l'application : `npm run dev`
2. Ouvrez http://localhost:5173/auth
3. Cliquez sur **Inscription**
4. Remplissez le formulaire

**Si `ENABLE_EMAIL_AUTOCONFIRM=true`** : Le compte est créé immédiatement.

**Si confirmation email requise** : 
- Allez sur http://localhost:54324 (Inbucket)
- Cliquez sur l'email reçu
- Cliquez sur le lien de confirmation

### Option B : Créer un utilisateur directement en base

Dans Supabase Studio > SQL Editor :

```sql
-- Cette méthode crée un utilisateur avec mot de passe "Admin123!"
-- IMPORTANT : Le mot de passe doit respecter les règles de sécurité

-- 1. Vérifier si l'utilisateur existe déjà
SELECT * FROM auth.users WHERE email = 'admin@mac-assurance.km';

-- 2. Si non, le créer manuellement
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mac-assurance.km',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "MAC"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);
```

## Étape 9 : Attribuer le rôle Admin

Dans SQL Editor :

```sql
-- Récupérer l'ID de l'utilisateur
SELECT id, email FROM auth.users;

-- Attribuer le rôle admin (REMPLACEZ l'ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('VOTRE_USER_ID_ICI', 'admin');
```

## Dépannage

### ❌ Erreur "Invalid authentication credentials"

**Causes et solutions :**

1. **Confirmation email activée**
   - Vérifiez `ENABLE_EMAIL_AUTOCONFIRM=true` dans `.env`
   - Ou consultez Inbucket (http://localhost:54324) pour confirmer l'email

2. **Mauvaise clé ANON_KEY**
   - Vérifiez que la clé dans `.env` du projet correspond à celle de Supabase

3. **Services non démarrés**
   - Vérifiez avec `docker ps` que tous les conteneurs sont up
   - Relancez avec `docker compose restart`

4. **Cache navigateur**
   - Videz le cache : Ctrl+Shift+R

### ❌ L'application pointe vers le cloud

Vérifiez que :
1. Le fichier `.env` du projet est modifié avec l'URL locale
2. Vous avez redémarré le serveur de dev (`npm run dev`)

### ❌ Erreur de connexion à la base

```bash
# Vérifier les logs
docker compose logs auth
docker compose logs rest
```

## Commandes utiles

```bash
# Arrêter Supabase
docker compose stop

# Redémarrer Supabase
docker compose start

# Voir les logs
docker compose logs -f

# Réinitialiser complètement
docker compose down -v
docker compose up -d

# Voir l'état des conteneurs
docker ps
```

## Architecture finale

```
┌─────────────────────────────────────────────────────────┐
│                    Serveur Local                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Docker (Supabase)                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │PostgreSQL│  │  GoTrue  │  │   PostgREST  │  │    │
│  │  │  :54322  │  │  (Auth)  │  │   (API)      │  │    │
│  │  └──────────┘  └──────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                           ↑                              │
│                    http://localhost:54321                │
│                           ↑                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Application MAC ASSURANCE              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │  React   │  │ IndexedDB│  │   SyncService │  │    │
│  │  │  (UI)    │  │ (Offline)│  │   (Sync)     │  │    │
│  │  └──────────┘  └──────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Mode Offline

L'application fonctionne même si Docker/Supabase est arrêté grâce à IndexedDB :
- Les données sont stockées localement
- Synchronisation automatique au redémarrage de Supabase

## Support

Pour toute question, contactez l'équipe technique MAC ASSURANCE.
