import { Test, TestingModule } from '@nestjs/testing';
import { PromtService } from './promt.service';

describe('PromtService', () => {
  let service: PromtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromtService],
    }).compile();

    service = module.get<PromtService>(PromtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
