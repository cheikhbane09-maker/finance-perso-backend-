# Finance Perso — Backend (NestJS)

API REST du projet Finance Personnelle, développée avec NestJS + TypeORM, dans le cadre de l'examen final "API REST" (M. SOUMARE, Licence 2 GI).

## Stack

- NestJS (TypeScript)
- TypeORM, avec 2 options de base de données (voir section "Base de données" ci-dessous) :
  - SQLite (fichier `db.sqlite`, par défaut, aucune installation nécessaire)
  - MySQL via **XAMPP** (si vous préférez travailler avec phpMyAdmin)
- JWT (`@nestjs/jwt`, `passport-jwt`) pour l'authentification
- RBAC (rôles `user` / `admin`) pour l'autorisation
- `class-validator` / `class-transformer` pour la validation des DTO
- API externe gratuite : **ExchangeRate** (`open.er-api.com`, sans clé) pour la conversion de devises de l'épargne
- Redis (cache), Prometheus/Grafana (monitoring), Docker, GitHub Actions (CI/CD), Jest (tests) — voir section **Bonus** ci-dessous

## Bonus livrés (voir énoncé de l'examen)

| Bonus | Où le trouver |
|---|---|
| Intégration de Redis | `src/common/redis.service.ts` — cache les taux de change (`ExchangeRateService`), avec repli automatique sur un cache mémoire si Redis est indisponible |
| Monitoring Prometheus + Grafana | `GET /metrics` (`src/common/metrics.*`), `monitoring/prometheus.yml`, `monitoring/grafana/provisioning/` (datasource + dashboard préconfigurés) |
| Pipeline CI/CD | `.github/workflows/ci.yml` (build, typecheck, tests unitaires + e2e à chaque push/PR) |
| Tests unitaires et E2E | `src/**/*.spec.ts` (Jest) + `test/app.e2e-spec.ts` (supertest) — voir section **Tests** |
| Dockerisation | `Dockerfile`, `.dockerignore`, `docker-compose.yml` (api + mysql + redis + prometheus + grafana) |
| Déploiement cloud gratuit | `render.yaml` (Blueprint Render) — voir section **Déploiement** |

## Installation

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`.

## Base de données : SQLite ou MySQL (XAMPP)

Par défaut (`DB_TYPE=sqlite` dans `.env`), le backend utilise un simple fichier `db.sqlite` : rien à installer, rien à configurer, ça marche directement après `npm install`.

Si vous préférez utiliser **XAMPP** (MySQL + phpMyAdmin) :

1. Lancez le panneau de contrôle XAMPP et démarrez le module **MySQL** (pas besoin d'Apache, NestJS a son propre serveur).
2. Ouvrez phpMyAdmin (`http://localhost/phpmyadmin`) et créez une base de données vide nommée `finance_perso` (bouton "Nouvelle base de données").
3. Dans `backend/.env`, changez :

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=finance_perso
```

(Avec XAMPP, l'utilisateur `root` n'a en général pas de mot de passe — laissez `DB_PASSWORD` vide sauf si vous en avez défini un.)

4. Relancez `npm run start:dev`. TypeORM (`synchronize: true`) crée automatiquement toutes les tables dans `finance_perso` au démarrage — vous les verrez apparaître dans phpMyAdmin.

Aucun changement de code n'est nécessaire pour basculer entre les deux : tout se règle dans `.env`.

## Tout lancer avec Docker (API + MySQL + Redis + Prometheus + Grafana)

```bash
cd backend
docker compose up --build
```

Ça démarre tout d'un coup :

- API : `http://localhost:3000`
- Métriques Prometheus (brutes) : `http://localhost:3000/metrics`
- Prometheus (interface) : `http://localhost:9090`
- Grafana : `http://localhost:3001` (identifiants `admin` / `admin`, ou accès anonyme activé) — le datasource Prometheus et un dashboard "Finance Perso - Backend" sont préconfigurés automatiquement
- MySQL : `localhost:3306` (root / root, base `finance_perso`)
- Redis : `localhost:6379`

Pas besoin de XAMPP ni d'installer quoi que ce soit d'autre que Docker.

## Tests

```bash
npm test        # tests unitaires (services : auth, transactions, epargne, RolesGuard)
npm run test:e2e  # test end-to-end (inscription -> connexion -> CRUD transactions), base SQLite en memoire
npm run test:cov  # avec couverture de code
```

## Structure du projet — répartition en 3 sous-dossiers (1 par membre)

```
src/
  main.ts
  app.module.ts
  modules/
    auth/          -> Cheikh Ahmed Tidiane BANE (chef)
    users/          -> Cheikh Ahmed Tidiane BANE (chef)
    transactions/   -> Maguette THIAW
    epargne/        -> Ndeye Khady SECK
```

### Cheikh Ahmed Tidiane BANE (chef) — `modules/auth` + `modules/users`

- Authentification JWT (`POST /auth/register`, `POST /auth/login`)
- Hash des mots de passe (bcryptjs)
- Autorisation RBAC (`RolesGuard`, décorateur `@Roles()`)
- Entité `User` (relation `OneToMany` vers `Transaction` et `Epargne`)
- Configuration globale du projet (`app.module.ts`, `main.ts`, TypeORM, ValidationPipe, CORS)
- Bonus infra : Redis (`src/common/redis.service.ts`), monitoring Prometheus/Grafana (`src/common/metrics.*`, `monitoring/`), Docker (`Dockerfile`, `docker-compose.yml`), CI/CD (`.github/workflows/ci.yml`), déploiement (`render.yaml`)
- Tests : `auth.service.spec.ts`, `roles.guard.spec.ts`, `test/app.e2e-spec.ts`
- Déploiement final

### Maguette THIAW — `modules/transactions`

- Entité `Transaction` (`ManyToOne` vers `User`, clé étrangère `userId`)
- CRUD complet des revenus/dépenses : `POST /transactions`, `GET /transactions`, `GET /transactions/all` (admin), `PATCH /transactions/:id`, `DELETE /transactions/:id`
- DTO + validation (`CreateTransactionDto`, `UpdateTransactionDto`)
- Tests : `transactions.service.spec.ts`

### Ndeye Khady SECK — `modules/epargne`

- Entité `Epargne` (compte bloqué, `ManyToOne` vers `User`)
- CRUD : `POST /epargne`, `GET /epargne`, `DELETE /epargne/:id` (refuse le retrait avant la date de déblocage)
- Intégration de l'API externe **ExchangeRate** (`ExchangeRateService`) : `GET /epargne/taux`, conversion du montant épargné via `?devise=USD`, avec cache Redis
- Tests : `epargne.service.spec.ts`

## Endpoints principaux

| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/auth/register` | Créer un compte | Public |
| POST | `/auth/login` | Se connecter (retourne un JWT) | Public |
| POST | `/transactions` | Ajouter un revenu/dépense | Utilisateur connecté |
| GET | `/transactions` | Lister mes transactions (`?type=revenu\|depense`) | Utilisateur connecté |
| GET | `/transactions/all` | Lister toutes les transactions | Admin uniquement |
| PATCH | `/transactions/:id` | Modifier une transaction | Propriétaire / Admin |
| DELETE | `/transactions/:id` | Supprimer une transaction | Propriétaire / Admin |
| POST | `/epargne` | Créer un compte épargne bloqué | Utilisateur connecté |
| GET | `/epargne` | Lister mes épargnes (`?devise=USD` pour conversion) | Utilisateur connecté |
| GET | `/epargne/taux` | Taux de change actuels (API externe) | Utilisateur connecté |
| DELETE | `/epargne/:id` | Retirer une épargne (si débloquée) | Propriétaire / Admin |

Toutes les routes (sauf `/auth/*`) nécessitent un header `Authorization: Bearer <token>`.

## Git flow

- `main` : version stable
- `dev` : intégration
- `feature/auth-cheikh` : module auth + users
- `feature/transactions-maguette` : module transactions
- `feature/epargne-ndeyekhady` : module épargne + API externe

Chaque membre travaille sur sa branche `feature/*`, fusionne dans `dev`, puis `dev` est fusionné dans `main` une fois le projet validé.

## Pousser votre branche sur GitHub (après réception du zip)

1. Le chef crée un dépôt GitHub **vide** (ex: `finance-perso-backend`) et partage son URL.
2. Chaque membre, après avoir dézippé le projet :

```bash
cd backend
git remote add origin <URL_DU_DEPOT_GITHUB>   # une seule fois
git checkout feature/auth-cheikh              # ou votre branche : feature/transactions-maguette / feature/epargne-ndeyekhady
git push -u origin feature/auth-cheikh         # pousse uniquement votre branche
```

3. Une fois toutes les branches poussées, ouvrez des Pull Requests `feature/* -> dev`, puis `dev -> main` sur GitHub (ou fusionnez directement si vous préférez).

## Déploiement — attention, GitHub Pages ne suffit pas pour le backend

**GitHub Pages héberge uniquement des fichiers statiques (HTML/CSS/JS).** Il ne peut pas exécuter de serveur Node.js/NestJS ni de base de données. C'est pour ça que le script `npm run deploy` du frontend (`gh-pages -d dist`) fonctionne pour la partie React, mais ne fera jamais tourner ce backend.

Le projet étant présenté en présentiel, le plus simple est de lancer les deux projets en local le jour de la présentation (`npm run start:dev` ici + `npm run dev` côté frontend) — c'est largement suffisant, le déploiement cloud n'est qu'un bonus dans le sujet.

Si vous voulez quand même déployer le backend en ligne (bonus), le plus simple est **Render**, avec le `render.yaml` déjà fourni :

1. Poussez le dépôt `backend` sur GitHub (public).
2. Sur [render.com](https://render.com) : "New +" -> "Blueprint" -> sélectionnez le dépôt GitHub.
3. Render lit `render.yaml`, construit l'image avec le `Dockerfile` et déploie automatiquement. `JWT_SECRET` est généré automatiquement, `DB_TYPE=sqlite` (aucune base externe à configurer).
4. L'URL publique fournie (ex: `https://finance-perso-backend.onrender.com`) peut être utilisée par le frontend déployé sur GitHub Pages.

Alternatives équivalentes : [Railway](https://railway.app), [Fly.io](https://fly.io) (ils lisent aussi directement le `Dockerfile`).

XAMPP, lui, ne fonctionne qu'en local sur votre machine — il ne peut pas être utilisé par un backend déployé sur internet (utilisez `DB_TYPE=sqlite` pour le déploiement, comme dans `render.yaml`).

## Notes

- `synchronize: true` (TypeORM) crée automatiquement les tables au démarrage — pratique pour un projet pédagogique, à désactiver en production au profit de migrations.
- Le frontend (React) consomme cette API via `fetch`/`axios` en utilisant les endpoints ci-dessus.
