import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // We will configure body parsers manually
  });
  const configService = app.get(ConfigService);

  // ── Body size limits (must be before routes) ─────────────────────────────
  // NestJS wraps Express — increase limits so large GLB multipart uploads
  // (up to 50 MB) are not silently rejected at the HTTP layer.
  const express = await import('express');
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('frontendUrl'),
    credentials: true,
  });

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global filters & interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tunisia Car Rental API')
    .setDescription(
      `## 🚗 Tunisia Car Rental — REST API\n\n` +
      `Full-stack car rental management system built with **NestJS**, **MongoDB**, and **Cloudinary**.\n\n` +
      `### Authentication\n` +
      `Most endpoints require a valid **JWT Bearer token**.\n` +
      `Obtain a token via \`POST /api/auth/login\` or \`POST /api/auth/register\`, ` +
      `then click **Authorize** and paste: \`Bearer <your_token>\`\n\n` +
      `### Roles\n` +
      `- **admin** — full access to all resources\n` +
      `- **customer** — can browse vehicles and manage own reservations`,
    )
    .setVersion('1.0')
    .setContact('Tunisia Car Rental', 'https://tunisiacarrental.com', 'contact@tunisiacarrental.com')
    .setLicense('Proprietary', '')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter: Bearer <JWT>' },
      'JWT',
    )
    .addTag('Auth', 'Registration, login and current-user endpoints')
    .addTag('Users', 'User profile management (admin or owner only)')
    .addTag('Vehicles', 'Vehicle catalogue — public reads, admin writes')
    .addTag('Reservations', 'Booking creation and management')
    .addTag('Upload', 'Cloudinary image upload (admin only)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'Tunisia Car Rental — API Docs',
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`🚀 Tunisia Car Rental API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();

