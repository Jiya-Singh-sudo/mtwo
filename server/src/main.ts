import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Remove { cors: true } from here. This was enabling the "wildcard" default 
  // which caused the conflict with credentials: true.
  const app = await NestFactory.create(AppModule);

  // 2. Configure CORS explicitly here
  app.enableCors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Allow your frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Added PATCH (crucial for your Edit form)
    credentials: true, // Allow cookies/headers
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();