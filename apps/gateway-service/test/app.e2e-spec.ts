import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { GatewayServiceModule } from '../src/gateway-service.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('GatewayService (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GatewayServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
    });
    const config = new DocumentBuilder()
      .setTitle('Gateway Service')
      .setDescription('Gateway Service API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/docs (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect((res) => {
        expect([200, 301, 302]).toContain(res.status);
      });
  });

  it('/docs-json (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect((res) => {
        expect(res.body.openapi).toMatch(/^3\./);
        expect(res.body.info.title).toBe('Gateway Service');
      });
  });
});
