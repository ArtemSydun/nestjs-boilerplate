/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { configServiceKeys } from 'src/common/enums/config.service.enum';

describe('Database Connection Test', () => {
  let testingModule: TestingModule;

  // Increase Jest timeout for this test file
  jest.setTimeout(10000);

  beforeAll(async () => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
              const username = configService.get<string>(
                configServiceKeys.MONGODB_USERNAME,
              );
              const password = configService.get<string>(
                configServiceKeys.MONGODB_PASSWORD,
              );
              const host = configService.get<string>(
                configServiceKeys.MONGODB_HOSTNAME,
              );
              const port = configService.get<string>(
                configServiceKeys.MONGODB_PORT,
              );

              console.log(
                `Connecting to MongoDB at mongodb://${username}:${password}@${host}:${port}/`,
              );

              return {
                uri: `mongodb://${username}:${password}@${host}:${port}/`,
              };
            },
          }),
        ],
      }).compile();

      const mongooseConnection = testingModule.get('DatabaseConnection');
      expect(mongooseConnection).toBeDefined();
    } catch (error) {
      throw new Error('Database connection test failed');
    }
  });

  afterAll(async () => {
    if (testingModule) {
      try {
        await testingModule.close(); // Clean up resources and close connections
      } catch (error) {
        console.error('Error during cleanup:', error.message);
      }
    }
  });

  it('should connect to the database successfully', async () => {
    try {
      const mongooseConnection = testingModule.get('DatabaseConnection');
      const connectionState = mongooseConnection.readyState; // 1 = connected, 0 = disconnected
      expect(connectionState).toBe(1);
    } catch (error) {
      throw new Error('Database connection test failed');
    }
  });
});
