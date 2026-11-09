import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const createExpress = (express as any).default || express;
    const expressApp = createExpress();

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    app.use(
      helmet({
        crossOriginResourcePolicy: false,
      }),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );

    // Root handler
    expressApp.get('/', (_req: Request, res: Response) => {
      res.json({
        status: 'online',
        service: 'RoMenu API — بوفه رُکاد',
        endpoints: {
          products: '/api/v1/products',
          auth: '/api/v1/auth',
          wallet: '/api/v1/wallet',
        },
      });
    });

    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  try {
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-original-url']) as string;
    if (matchedPath && (req.url === '/api' || req.url === '/api/')) {
      req.url = matchedPath;
    }
    const server = await bootstrap();
    return server(req, res);
  } catch (err: any) {
    console.error('NestJS Vercel Serverless Error:', err);
    return res.status(500).json({
      error: 'Vercel Serverless Function Error',
      message: err?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
    });
  }
}
