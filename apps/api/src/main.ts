import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  // Global prefix - public redirect routes are handled by PublicController with 'r' prefix
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'r/scan/:id', method: RequestMethod.GET },
      { path: 'r/:slug', method: RequestMethod.GET },
      { path: 'r/:slug/preview', method: RequestMethod.GET },
      { path: 'r/:slug/verify-password', method: RequestMethod.POST },
    ],
  });

  // CORS
  app.enableCors({
    origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger documentation
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WRX Generator API')
      .setDescription("API pour la génération d'URLs raccourcies et de QR codes")
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification')
      .addTag('links', 'Gestion des liens')
      .addTag('qr', 'Génération de QR codes')
      .addTag('public', 'Endpoints publics')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  console.warn(`🚀 API running on http://localhost:${port}`);
  console.warn(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
