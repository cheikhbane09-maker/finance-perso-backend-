import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../users/role.enum';

// Guard RBAC : verifie que req.user.role fait partie des roles autorises
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesAutorises = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesAutorises || rolesAutorises.length === 0) {
      return true; // pas de restriction de role sur cette route
    }

    const { user } = context.switchToHttp().getRequest();
    return rolesAutorises.includes(user?.role);
  }
}
