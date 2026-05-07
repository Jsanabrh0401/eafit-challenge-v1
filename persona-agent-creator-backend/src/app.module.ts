import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BotsModule } from './bots/bots.module';
import { DataModule } from './data/data.module';
import { AppController } from './app.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DataModule, AuthModule, BotsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
