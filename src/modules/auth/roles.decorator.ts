import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/role.enum';

export const ROLES_KEY = 'roles';

// Utilisation : @Roles(Role.ADMIN) au-dessus d'une route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
