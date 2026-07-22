import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Test end-to-end : inscription -> connexion -> acces a une route protegee.
// Utilise une base SQLite en memoire, isolee de la base de developpement.
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const utilisateur = {
    email: 'e2e-test@example.com',
    password: 'motdepasse123',
    nom: 'Utilisateur E2E',
  };

  it('POST /auth/register -> cree un compte et retourne un token', async () => {
    const reponse = await request(app.getHttpServer()).post('/auth/register').send(utilisateur);

    expect(reponse.status).toBe(201);
    expect(reponse.body.access_token).toBeDefined();
  });

  it('POST /auth/login -> retourne un token avec les bons identifiants', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: utilisateur.email, password: utilisateur.password });

    expect(reponse.status).toBe(200);
    expect(reponse.body.access_token).toBeDefined();
  });

  it('GET /transactions sans token -> refuse (401)', async () => {
    const reponse = await request(app.getHttpServer()).get('/transactions');
    expect(reponse.status).toBe(401);
  });

  it('POST /transactions puis GET /transactions avec token -> fonctionne', async () => {
    const connexion = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: utilisateur.email, password: utilisateur.password });
    const token = connexion.body.access_token;

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'revenu', nom: 'Salaire', montant: 1000 })
      .expect(201);

    const liste = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(liste.status).toBe(200);
    expect(liste.body.length).toBe(1);
    expect(liste.body[0].nom).toBe('Salaire');
  });
});
