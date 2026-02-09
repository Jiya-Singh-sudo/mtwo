import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import pg from 'pg';

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
    origin: [
      "http://localhost:5173", 
      "http://127.0.0.1:5173", 
      "http://localhost:8081", 
      "http://127.0.0.1:8081"  
    ], 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", 
    credentials: true, 
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log('BOOT DATABASE_URL:', process.env.DATABASE_URL);


}
bootstrap();