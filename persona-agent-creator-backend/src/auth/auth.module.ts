import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DataModule } from '../data/data.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [DataModule, JwtModule.register({})],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
