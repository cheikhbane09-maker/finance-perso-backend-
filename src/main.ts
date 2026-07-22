import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MetricsService } from './common/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale des DTO (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Autorise le frontend (React/Vite) a consommer l'API
  app.enableCors();

  // Bonus monitoring : compte chaque requete HTTP pour Prometheus (GET /metrics)
  const metricsService = app.get(MetricsService);
  app.use((req: any, res: any, next: () => void) => {
    res.on('finish', () => {
      metricsService.enregistrerRequete(req.method, req.baseUrl + req.path, res.statusCode);
    });
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend Finance Perso demarre sur http://localhost:${port}`);
}
bootstrap();
