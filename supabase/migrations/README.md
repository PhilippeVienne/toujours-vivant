# Historique (figé)

Ces migrations ont été appliquées manuellement via le CLI Supabase (`supabase db push`) avant la mise en place d'un vrai outil de migration. Elles restent ici pour l'historique, mais ne sont plus rejouées automatiquement et plus aucun fichier ne doit être ajouté dans ce dossier.

Le système de migration actif est [`migrations/`](../../migrations) (node-pg-migrate), qui fonctionne aussi bien contre la base de prod que contre la base locale (`docker-compose.yml`). Voir le README principal, section "Base de données & migrations".
