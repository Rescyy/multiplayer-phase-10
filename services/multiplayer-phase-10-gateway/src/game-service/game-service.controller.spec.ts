import { Test, TestingModule } from '@nestjs/testing';
import { GameServiceController } from './game-service.controller';

describe('GameServiceController', () => {
  let controller: GameServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameServiceController],
    }).compile();

    controller = module.get<GameServiceController>(GameServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
