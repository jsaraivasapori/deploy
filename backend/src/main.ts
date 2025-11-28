import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // --- CONFIGURAÇÃO DO SWAGGER ---
  const config = new DocumentBuilder()
    .setTitle('GDASH API')
    .setDescription('Documentação da API do Desafio Full Stack')
    .setVersion('1.0')
    .addBearerAuth() // Adiciona botão de cadeado para colar o Token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);
  // -------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
