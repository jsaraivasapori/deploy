import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Mock do Bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  // Mock do Usuário
  const mockUser = {
    _id: 'id_123',
    email: 'teste@gdash.com',
    password: 'hash_senha',
    role: 'user',
    toObject: jest.fn().mockReturnValue({
      _id: 'id_123',
      email: 'teste@gdash.com',
      role: 'user',
    }),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token_gerado_abc'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('deve retornar os dados do usuário (sem senha) se as credenciais forem válidas', async () => {
      jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('teste@gdash.com', '123456');

      expect(result).toEqual({
        _id: 'id_123',
        email: 'teste@gdash.com',
        role: 'user',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('deve retornar null se o usuário não for encontrado', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      const result = await service.validateUser('errado@gdash.com', '123');

      expect(result).toBeNull();
    });

    it('deve retornar null se a senha estiver incorreta', async () => {
      jest
        .spyOn(usersService, 'findOneByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'teste@gdash.com',
        'senha_errada',
      );

      expect(result).toBeNull();
    });
  }); // <--- FALTAVA FECHAR ESSE BLOCO CORRETAMENTE NO SEU CÓDIGO ANTERIOR

  describe('login', () => {
    it('deve retornar um objeto com access_token', async () => {
      const userPayload = { email: 'teste@a.com', _id: '1', role: 'user' };

      const result = await service.login(userPayload);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: userPayload.email,
        sub: userPayload._id,
        role: userPayload.role,
      });
      expect(result).toEqual({ access_token: 'token_gerado_abc' });
    });
  });
});
