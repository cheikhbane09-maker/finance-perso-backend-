# Finance Perso — Backend (NestJS)

API REST du projet Finance Personnelle, développée avec NestJS + TypeORM, dans le cadre de l'examen final "API REST" (M. SOUMARE, Licence 2 GI).

## Stack

- NestJS (TypeScript)
- TypeORM + SQLite (fichier `db.sqlite`, aucune installation de serveur de base de données nécessaire)
- JWT (`@nestjs/jwt`, `passport-jwt`) pour l'authentification
- RBAC (rôles `user` / `admin`) pour l'autorisation
- `class-validator` / `class-transformer` pour la validation des DTO
- API externe gratuite : **ExchangeRate** (`open.er-api.com`, sans clé) pour la conversion de devises de l'épargne

## Installation

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`.

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
- Déploiement final

### Maguette THIAW — `modules/transactions`

- Entité `Transaction` (`ManyToOne` vers `User`, clé étrangère `userId`)
- CRUD complet des revenus/dépenses : `POST /transactions`, `GET /transactions`, `GET /transactions/all` (admin), `PATCH /transactions/:id`, `DELETE /transactions/:id`
- DTO + validation (`CreateTransactionDto`, `UpdateTransactionDto`)

### Ndeye Khady SECK — `modules/epargne`

- Entité `Epargne` (compte bloqué, `ManyToOne` vers `User`)
- CRUD : `POST /epargne`, `GET /epargne`, `DELETE /epargne/:id` (refuse le retrait avant la date de déblocage)
- Intégration de l'API externe **ExchangeRate** (`ExchangeRateService`) : `GET /epargne/taux`, conversion du montant épargné via `?devise=USD`

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

## Notes

- `synchronize: true` (TypeORM) crée automatiquement les tables au démarrage — pratique pour un projet pédagogique, à désactiver en production au profit de migrations.
- Le frontend (React) consomme cette API via `fetch`/`axios` en utilisant les endpoints ci-dessus.
