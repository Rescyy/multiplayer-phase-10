import { Test, TestingModule } from '@nestjs/testing';
import { BaseServiceService } from './base-service.service';

describe('BaseServiceService', () => {
  let service: BaseServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaseServiceService],
    }).compile();

    service = module.get<BaseServiceService>(BaseServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
