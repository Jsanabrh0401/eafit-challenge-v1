import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { AuthModule } from '../auth/auth.module';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotPublisherService } from './bot-publisher.service';
import { K8sDeployerService } from './k8s-deployer.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [DataModule, AuthModule],
  controllers: [BotsController],
  providers: [BotsService, BotPublisherService, K8sDeployerService, VerificationService],
})
export class BotsModule {}
