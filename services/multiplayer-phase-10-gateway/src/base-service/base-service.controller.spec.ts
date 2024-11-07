import { Test, TestingModule } from '@nestjs/testing';
import { BaseServiceController } from './base-service.controller';

describe('BaseServiceController', () => {
  let controller: BaseServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaseServiceController],
    }).compile();

    controller = module.get<BaseServiceController>(BaseServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
