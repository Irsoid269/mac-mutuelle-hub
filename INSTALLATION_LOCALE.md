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

# Démarrer Supabase
docker compose up -d
```

## Étape 2 : Accéder à Supabase Studio

Une fois démarré, accédez à :
- **Supabase Studio** : http://localhost:54323
- **API REST** : http://localhost:54321
- **PostgreSQL direct** : localhost:54322

Identifiants par défaut :
- Email : `supabase`
- Password : `this_password_is_insecure_and_should_be_updated`

## Étape 3 : Récupérer les clés

Dans le fichier `.env` de Supabase, notez :
- `ANON_KEY` : Clé publique (anon)
- `SERVICE_ROLE_KEY` : Clé service (admin)

## Étape 4 : Configurer l'application MAC ASSURANCE

Modifiez le fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_ANON_KEY_locale"
```

## Étape 5 : Importer le schéma de base de données

1. Ouvrez Supabase Studio : http://localhost:54323
2. Allez dans **SQL Editor**
3. Exécutez les migrations présentes dans `supabase/migrations/`

## Étape 6 : Créer un utilisateur admin

Dans SQL Editor, exécutez :

```sql
-- Créer un utilisateur de test
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@mac-assurance.km',
  crypt('MotDePasse123!', gen_salt('bf')),
  now(),
  '{"first_name": "Admin", "last_name": "MAC"}'::jsonb
);

-- Récupérer l'ID de l'utilisateur créé
SELECT id FROM auth.users WHERE email = 'admin@mac-assurance.km';

-- Ajouter le rôle admin (remplacez USER_ID par l'ID récupéré)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID', 'admin');
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
