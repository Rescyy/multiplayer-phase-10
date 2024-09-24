import { Test, TestingModule } from '@nestjs/testing';
import { ServiceDiscoveryController } from './service-discovery.controller';

describe('ServiceDiscoveryController', () => {
  let controller: ServiceDiscoveryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceDiscoveryController],
    }).compile();

    controller = module.get<ServiceDiscoveryController>(ServiceDiscoveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
