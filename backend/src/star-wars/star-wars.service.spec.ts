import { Test, TestingModule } from '@nestjs/testing';
import { StarWarsService } from './star-wars.service';

describe('StarWarsService', () => {
  let service: StarWarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StarWarsService],
    }).compile();

    service = module.get<StarWarsService>(StarWarsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
