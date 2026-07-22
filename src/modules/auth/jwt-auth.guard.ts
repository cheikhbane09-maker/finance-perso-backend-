import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard qui protege les routes : necessite un token JWT valide
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
