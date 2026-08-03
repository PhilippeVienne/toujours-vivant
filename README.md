# 🛡️ Toujours Vivant

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-emerald)](https://supabase.com/)
[![Upstash](https://img.shields.io/badge/Cache-Upstash_Redis-red)](https://upstash.com/)

**Toujours Vivant** est un dispositif d'alerte et de check-in quotidien open-source conçu pour rassurer vos proches. L'application permet de signaler votre présence en 1-tap, de réinitialiser votre chronomètre via la détection passive de mouvements du smartphone (PWA), et d'envoyer des alertes e-mail automatiques à vos contacts de confiance en cas de silence prolongé.

---

## 🚀 Fonctionnalités Clés

- **Check-in 1-Tap & Geolocation** : Réinitialisation instantanée du chronomètre de sécurité avec position GPS optionnelle.
- **Ping Passif (Accéléromètre & Mouvement)** : Réinitialisation automatique du chronomètre lors des mouvements de l'appareil.
- **Alertes Automatiques Proches** : Notification e-mail immédiate transmise à vos contacts d'urgence via Resend si le décompte expire.
- **Liens de Suivi Individuels & Aperçu WhatsApp** : Chaque proche dispose d'un lien dédié avec carte d'aperçu enrichie (Open Graph).
- **Application PWA Instalable** : Support mobile et desktop hors-ligne avec Service Worker et notifications push.

---

## 🛠️ Stack Technique

- **Framework Web** : [Next.js 16](https://nextjs.org/) (App Router, Server Components & API Routes)
- **Base de Données** : [Supabase PostgreSQL](https://supabase.com/) (Auth, RLS & DB Serverless)
- **Gestionnaire de Chronomètres / Cache** : [Upstash Redis](https://upstash.com/) (Storage REST API)
- **Service d'E-mail** : [Resend API](https://resend.com/)
- **Styling** : TailwindCSS, Lucide Icons, Glassmorphism UI
- **Licence** : GNU Affero General Public License v3.0 (AGPL-3.0)

---

## 📦 Guide d'Auto-Hébergement (Self-Hosting)

Suivez ces étapes pour déployer votre propre instance autonome de **Toujours Vivant**.

### 1. Prérequis

- [Node.js](https://nodejs.org/) v20.0+ et `npm`
- Un compte [Supabase](https://supabase.com/) (Gratuit)
- Un compte [Upstash](https://upstash.com/) (Gratuit)
- Un compte [Resend](https://resend.com/) (Gratuit)
- Un compte [Vercel](https://vercel.com/) (ou tout hébergeur compatible Node.js / Docker)

---

### 2. Installation du Projet

```bash
# 1. Cloner le dépôt GitHub
git clone https://github.com/PhilippeVienne/toujours-vivant.git
cd toujours-vivant

# 2. Installer les dépendances
npm install
```

---

### 3. Configuration de la Base de Données (Supabase)

1. Créez un nouveau projet sur **[Supabase](https://supabase.com/)**.
2. Allez dans l'onglet **SQL Editor** de votre console Supabase.
3. Ouvrez et exécutez l'intégralité du script SQL de structure :  
   👉 [`supabase/schema.sql`](./supabase/schema.sql)
4. Activez la sécurité **Row Level Security (RLS)** pour sécuriser l'accès aux données :
   ```sql
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.ping_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users access own profile" ON public.users FOR ALL USING (auth.uid() = id);
   CREATE POLICY "Users manage own contacts" ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);
   CREATE POLICY "Users manage own pings" ON public.ping_logs FOR ALL USING (auth.uid() = user_id);
   ```

---

### 4. Configuration d'Authentification Google (Supabase Auth)

1. Dans le tableau de bord Supabase, allez dans **Authentication** > **Providers** et activez **Google**.
2. Renseignez votre `Client ID` et `Client Secret` obtenus sur la console Google Cloud.
3. Dans **Authentication** > **URL Configuration** :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** :
     - `https://votre-domaine.fr/auth/callback`
     - `http://localhost:3000/auth/callback`

---

### 5. Configuration d'Upstash Redis & Resend

1. **Upstash Redis** : Créez une base de données Redis sur Upstash et récupérez la clé `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
2. **Resend API** : Créez une clé d'API sur Resend (`RESEND_API_KEY`) et validez votre domaine d'envoi d'e-mails.

---

### 6. Variables d'Environnement (`.env.local`)

Créez un fichier `.env.local` à la racine de votre projet avec la structure suivante :

```env
# URL et Clés Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://votre-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...=

# Resend E-mail API
RESEND_API_KEY=re_123456789...

# Clé Secrète pour la tâche Cron d'Alerte (Optionnel mais recommandé)
CRON_SECRET=votre_cle_secrete_ultra_longue

# Notifications Push (Web Push / VAPID) - rappels de pré-alerte & alertes envoyées
# directement sur l'appareil de l'utilisateur, en plus des e-mails aux proches
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ...
VAPID_PRIVATE_KEY=uJ...
VAPID_SUBJECT=mailto:contact@votre-domaine.fr
```

---

### 6bis. Notifications Push (Web Push)

L'application peut envoyer des notifications push directement sur l'appareil de l'utilisateur (et non plus seulement des e-mails à ses proches) :

- **5 minutes avant l'échéance** : rappel "Check-in requis" pour éviter une fausse alerte.
- **Au déclenchement de l'alerte** : confirmation que les proches viennent d'être notifiés.

1. Générez une paire de clés VAPID :
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Renseignez `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` dans `.env.local` (et sur Vercel).
3. Appliquez la migration `supabase/migrations/20260802020000_push_subscriptions.sql` (ou re-exécutez `supabase/schema.sql`) pour créer la table `push_subscriptions`.
4. Dans la page **Réglages** de l'application, activez le toggle "Rappels de pré-alerte (Push & Son)" pour vous abonner depuis l'appareil courant. Sans clé VAPID configurée, le toggle reste désactivé et les envois passent en mode simulation (log serveur uniquement).
5. Ces rappels dépendent du même cron que les alertes e-mail (`/api/check-alerts`, voir section 8) : ils ne peuvent se déclencher que si ce endpoint est appelé plus fréquemment que la fenêtre de pré-alerte de 5 minutes.

---

### 7. Lancement en Développement et Build Production

#### Lancement en mode développement local :
```bash
npm run dev
# L'application sera accessible sur http://localhost:3000
```

#### Compilation et démarrage en production :
```bash
npm run build
npm start
```

---

### 8. Automatisation des Alertes (Tâche Cron)

Pour que les alertes d'urgence soient vérifiées et envoyées automatiquement dès l'expiration d'un chronomètre, configurez un appel récurrent vers l'API `/api/check-alerts`.

#### Option A : Vercel Cron
Le fichier `vercel.json` est pré-configuré pour un déclenchement automatique sur Vercel :
```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/check-alerts",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Option B : Service Cron Externe (ex: [cron-job.org](https://cron-job.org))
- **URL à appeler** : `https://votre-domaine.fr/api/check-alerts`
- **Fréquence** : Toutes les 1 à 5 minutes
- **En-tête HTTP** (si `CRON_SECRET` configuré) :
  ```http
  Authorization: Bearer votre_cle_secrete_ultra_longue
  ```

---

## ⚖️ Licence & Avertissement Légal

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**.  
Consultez le fichier [`LICENSE`](./LICENSE) pour plus de détails.

> [!WARNING]
> **AVERTISSEMENT DE SÉCURITÉ ET DE RESPONSABILITÉ :**  
> Ce logiciel est fourni "EN L'ÉTAT" ("AS IS"), à titre d'outil d'aide personnelle et bénévole, **SANS AUCUNE GARANTIE DE FONCTIONNEMENT OU DE DISPONIBILITÉ (0% SLA)**. Il ne remplace en aucun cas les services officiels de secours (112, 15, 18).
