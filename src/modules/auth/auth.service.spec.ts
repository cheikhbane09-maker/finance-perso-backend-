import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'fake-jwt-token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it("cree un utilisateur et retourne un token si l'email n'existe pas deja", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: Role.USER,
      });

      const resultat = await service.register({
        email: 'test@example.com',
        password: 'motdepasse123',
        nom: 'Test User',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(resultat.access_token).toBe('fake-jwt-token');
      expect(resultat.user.email).toBe('test@example.com');
    });

    it('refuse la creation si un compte existe deja avec cet email', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await expect(
        service.register({ email: 'test@example.com', password: 'motdepasse123', nom: 'Test' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('retourne un token si les identifiants sont corrects', async () => {
      const hash = await bcrypt.hash('motdepasse123', 4);
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: hash,
        role: Role.USER,
      });

      const resultat = await service.login({ email: 'test@example.com', password: 'motdepasse123' });

      expect(resultat.access_token).toBe('fake-jwt-token');
    });

    it("refuse l'acces si le mot de passe est incorrect", async () => {
      const hash = await bcrypt.hash('bonmotdepasse', 4);
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: hash,
        role: Role.USER,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'mauvaismotdepasse' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("refuse l'acces si l'utilisateur n'existe pas", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inconnu@example.com', password: 'motdepasse123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
