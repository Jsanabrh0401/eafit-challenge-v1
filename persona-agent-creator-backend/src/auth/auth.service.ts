import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { hash, compare } from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { DataService } from '../data/data.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GithubAuthDto } from './dto/github-auth.dto';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly dataService: DataService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto) {
    const existing = this.dataService.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const user = this.dataService.createUser({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 10),
      createdAt: new Date().toISOString(),
    });

    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async login(input: LoginDto) {
    const user = this.dataService.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isValid = await compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async googleAuth(input: GoogleAuthDto) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new UnauthorizedException('GOOGLE_CLIENT_ID no está configurado en el backend.');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: input.credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.trim().toLowerCase();
    const name = payload?.name?.trim();

    if (!email || !name) {
      throw new UnauthorizedException('No fue posible validar la cuenta de Google.');
    }

    const existing = this.dataService.findUserByEmail(email);
    if (existing) {
      return this.buildAuthResponse(existing.id, existing.email, existing.name);
    }

    const randomPassword = randomUUID();
    const user = this.dataService.createUser({
      id: randomUUID(),
      name,
      email,
      passwordHash: await hash(randomPassword, 10),
      createdAt: new Date().toISOString(),
    });
    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  async githubAuth(input: GithubAuthDto) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Falta configurar GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET.');
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenData.access_token) {
      throw new UnauthorizedException(
        tokenData.error_description || tokenData.error || 'No se pudo obtener token de GitHub.',
      );
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'persona-agent-creator',
      },
    });
    if (!userRes.ok) {
      throw new UnauthorizedException('No se pudo obtener el perfil de GitHub.');
    }
    const ghUser = (await userRes.json()) as {
      login?: string;
      name?: string;
      email?: string | null;
    };

    let email = ghUser.email?.trim().toLowerCase();
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'persona-agent-creator',
        },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        email =
          emails.find((item) => item.primary && item.verified)?.email?.toLowerCase() ??
          emails.find((item) => item.verified)?.email?.toLowerCase();
      }
    }

    const login = ghUser.login?.trim();
    const name = ghUser.name?.trim() || login;
    if (!email || !name) {
      throw new UnauthorizedException(
        'No fue posible leer correo/nombre de GitHub. Verifica scope user:email.',
      );
    }

    const existing = this.dataService.findUserByEmail(email);
    if (existing) {
      return this.buildAuthResponse(existing.id, existing.email, existing.name);
    }

    const randomPassword = randomUUID();
    const user = this.dataService.createUser({
      id: randomUUID(),
      name,
      email,
      passwordHash: await hash(randomPassword, 10),
      createdAt: new Date().toISOString(),
    });
    return this.buildAuthResponse(user.id, user.email, user.name);
  }

  private buildAuthResponse(userId: string, email: string, name: string) {
    const token = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
        expiresIn: '7d',
      },
    );

    return {
      accessToken: token,
      user: {
        id: userId,
        email,
        name,
      },
    };
  }
}
