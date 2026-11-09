import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { Express, Request, Response } from 'express';
import helmet from 'helmet';

let cachedServer: Express;

export async function bootstrap(): Promise<Express> {
  if (!cachedServer) {
    const createExpress = (express as any).default || express;
    const expressApp = createExpress();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Security headers
    app.use(
      helmet({
        crossOriginResourcePolicy: false,
      }),
    );

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Global API Prefix
    app.setGlobalPrefix('api/v1');

    // Global Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    // Swagger Documentation on /api/docs
    const config = new DocumentBuilder()
      .setTitle('RoMenu API — بوفه رُکاد')
      .setDescription('مستندات کامل ای‌پی‌آی سیستم بوفه هوشمند رُکاد')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

// Standalone mode (local or VPS)
if (!process.env.VERCEL) {
  const logger = new Logger('RoMenuBootstrap');
  const port = process.env.PORT || 3001;
  bootstrap().then((server) => {
    server.listen(port, () => {
      logger.log(`🚀 RoMenu Backend running at http://localhost:${port}/api/v1`);
      logger.log(`📚 Swagger Docs available at http://localhost:${port}/api/docs`);
    });
  }).catch((err) => {
    logger.error('Failed to start standalone server', err);
  });
}

// Serverless Handler for Vercel
export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Backend Serverless Error',
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  }
}
