import { Test, TestingModule } from '@nestjs/testing';
import { TpccoordinatorService } from './tpccoordinator.service';

describe('TpccoordinatorService', () => {
  let service: TpccoordinatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TpccoordinatorService],
    }).compile();

    service = module.get<TpccoordinatorService>(TpccoordinatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
