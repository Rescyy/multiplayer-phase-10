import { Test, TestingModule } from '@nestjs/testing';
import { TpccoordinatorController } from './tpccoordinator.controller';

describe('TpccoordinatorController', () => {
  let controller: TpccoordinatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TpccoordinatorController],
    }).compile();

    controller = module.get<TpccoordinatorController>(TpccoordinatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
