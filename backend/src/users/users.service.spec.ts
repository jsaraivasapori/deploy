import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mockamos o Bcrypt para não perder tempo processando hash real nos testes
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let model: any; // Mock do Model Mongoose
  let configService: ConfigService;

  // Mock do Usuário que o banco retornaria
  const mockUser = {
    _id: 'some_id',
    email: 'test@test.com',
    password: 'hashed_password',
    role: 'user',
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: 'some_id',
      email: 'test@test.com',
      role: 'user',
    }),
  };

  // Mock do Construtor do Model (new this.userModel(...))
  // Isso é necessário porque usamos "new this.userModel()" no create
  class MockUserModel {
    constructor(private data: any) {
      Object.assign(this, data);
    }
    save = jest.fn().mockResolvedValue(this);

    // Métodos estáticos do Mongoose
    static findOne = jest.fn();
    static find = jest.fn();
    static findByIdAndDelete = jest.fn();
  }

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'DEFAULT_ADMIN_EMAIL') return 'admin@gdash.com';
      if (key === 'DEFAULT_ADMIN_PASSWORD') return 'admin123';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel, // Injetamos nossa classe Mock
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get(getModelToken(User.name));
    configService = module.get<ConfigService>(ConfigService);

    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um usuário com sucesso', async () => {
      const createUserDto = { email: 'new@test.com', password: '123' };

      // Simula que não existe usuário com esse email
      jest.spyOn(model, 'findOne').mockResolvedValue(null);

      const result = await service.create(createUserDto);

      // Verifica se o bcrypt foi chamado
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 'salt');
      // Verifica se salvou o hash, não a senha plana
      expect(result).toHaveProperty('password', 'hashed_password');
      expect(result.email).toBe('new@test.com');
    });

    it('deve lançar erro se o email já existe', async () => {
      const createUserDto = { email: 'exists@test.com', password: '123' };

      // Simula que JÁ existe usuário
      jest.spyOn(model, 'findOne').mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('onModuleInit (Seed Admin)', () => {
    it('deve criar admin se ele não existir', async () => {
      // Simula que admin NÃO existe
      jest.spyOn(model, 'findOne').mockResolvedValue(null);
      // Espiona o método create do próprio service
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(mockUser as any);

      await service.onModuleInit();

      expect(createSpy).toHaveBeenCalledWith(
        { email: 'admin@gdash.com', password: 'admin123' },
        'admin',
      );
    });

    it('NÃO deve criar admin se ele já existir', async () => {
      // Simula que admin JÁ existe
      jest.spyOn(model, 'findOne').mockResolvedValue(mockUser);
      const createSpy = jest.spyOn(service, 'create');

      await service.onModuleInit();

      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar array de usuários', async () => {
      // Mock do encadeamento .find().exec()
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOneByEmail', () => {
    it('deve retornar usuário com a senha selecionada', async () => {
      // Mock do encadeamento .findOne().select().exec()
      const mockQuery = {
        select: jest.fn().mockReturnThis(), // Retorna o próprio objeto para encadear
        exec: jest.fn().mockResolvedValue(mockUser),
      };
      jest.spyOn(model, 'findOne').mockReturnValue(mockQuery);

      const result = await service.findOneByEmail('test@test.com');

      expect(model.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockQuery.select).toHaveBeenCalledWith('+password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('deve deletar o usuário se existir', async () => {
      // Mock do encadeamento .findByIdAndDelete().exec()
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.remove('some_id');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('bad_id')).rejects.toThrow(NotFoundException);
    });
  });
});
