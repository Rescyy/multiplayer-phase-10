import { Test, TestingModule } from '@nestjs/testing';
import { PlayerServiceController } from './player-service.controller';

describe('PlayerServiceController', () => {
  let controller: PlayerServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerServiceController],
    }).compile();

    controller = module.get<PlayerServiceController>(PlayerServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
