import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import pg from 'pg';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

pg.types.setTypeParser(1082, (val) => val);
async function bootstrap() {
  // 1. Remove { cors: true } from here. This was enabling the "wildcard" default 
  // which caused the conflict with credentials: true.
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,   // 🔑 THIS fixes the login crash
      forbidNonWhitelisted: true,
    }),
  );

  // 2. Configure CORS explicitly here
  app.enableCors({
    // origin: [
    //   "http://localhost:5173", 
    //   "http://127.0.0.1:5173", 
    //   "http://localhost:4173", 
    //   "http://127.0.0.1:4173", 
    //   "http://localhost:8081", 
    //   "http://127.0.0.1:8081",
    //   "http://localhost:8080", 
    //   "http://192.168.0.239:8081",
    //   "http://192.168.0.215:8081"
    // ], 
    origin: [
      "http://myapp.local",
      "http://10.73.252.234",
      "http://192.168.0.239",
      "http://10.71.215.234"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", 
    credentials: true, 
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Server running on http://0.0.0.0:${process.env.PORT ?? 3000}`);
  console.log('BOOT DATABASE_URL:', process.env.DATABASE_URL);


}
bootstrap();