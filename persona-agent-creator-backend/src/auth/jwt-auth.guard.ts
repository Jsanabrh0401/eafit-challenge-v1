import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token faltante.');
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
      });
      request.user = payload as { sub: string; email: string };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido.');
    }
  }
}
