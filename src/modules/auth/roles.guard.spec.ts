import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../users/role.enum';

function creerContexteFictif(role: Role | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (RBAC)', () => {
  it("laisse passer si la route n'exige aucun role particulier", () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(creerContexteFictif(Role.USER))).toBe(true);
  });

  it("bloque un utilisateur simple sur une route reservee aux admins", () => {
    const reflector = { getAllAndOverride: () => [Role.ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(creerContexteFictif(Role.USER))).toBe(false);
  });

  it('autorise un admin sur une route reservee aux admins', () => {
    const reflector = { getAllAndOverride: () => [Role.ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(creerContexteFictif(Role.ADMIN))).toBe(true);
  });
});
