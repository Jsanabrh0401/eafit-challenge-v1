import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GithubAuthDto } from './dto/github-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post('login')
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @Post('google')
  google(@Body() input: GoogleAuthDto) {
    return this.authService.googleAuth(input);
  }

  @Post('github')
  github(@Body() input: GithubAuthDto) {
    return this.authService.githubAuth(input);
  }
}
