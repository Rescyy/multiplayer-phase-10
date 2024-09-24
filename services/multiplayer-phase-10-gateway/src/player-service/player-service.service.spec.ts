import { Test, TestingModule } from '@nestjs/testing';
import { PlayerServiceService } from './player-service.service';

describe('PlayerServiceService', () => {
  let service: PlayerServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerServiceService],
    }).compile();

    service = module.get<PlayerServiceService>(PlayerServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
