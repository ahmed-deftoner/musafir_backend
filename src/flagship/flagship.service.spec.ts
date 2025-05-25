import { Test, TestingModule } from '@nestjs/testing';
import { FlagshipService } from './flagship.service';

describe('FlagshipService', () => {
  let service: FlagshipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlagshipService],
    }).compile();

    service = module.get<FlagshipService>(FlagshipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
