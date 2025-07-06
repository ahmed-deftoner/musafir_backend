import 'module-alias/register';
import { UserModule } from './user/user.module';
import { FlagshipModule } from './flagship/flagship.module';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { warn } from 'console';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { RegistrationModule } from './registration/registration.module';
import { FeedbackModule } from './feedback/feedback.module';
import { seed } from './util/seeder';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // await seed();

  // Use Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // disableErrorMessages: true,
    }),
  );

  // Swagger
  const options = new DocumentBuilder()
    .setTitle('Teen-Musafir App')
    .setDescription('APIs for teen musafir web app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [UserModule, FlagshipModule, RegistrationModule, FeedbackModule],
  });
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://main.d1gcdykopg01ak.amplifyapp.com',
        'http://localhost:3000',
        'https://test.3musafir.com',
      ];
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error(
            'The CORS policy for this site does not allow access from the specified Origin.',
          ),
          false,
        );
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // Set up static file serving
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Port
  const PORT = process.env.PORT;
  await app.listen(PORT);
  warn(`APP IS LISTENING TO PORT ${PORT}`);
}
bootstrap();
