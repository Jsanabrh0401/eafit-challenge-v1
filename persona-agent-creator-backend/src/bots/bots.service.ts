import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataService } from '../data/data.service';
import { BotRecord } from '../data/data.types';
import { UpsertBotDto } from './dto/upsert-bot.dto';
import { BotPublisherService } from './bot-publisher.service';
import { K8sDeployerService } from './k8s-deployer.service';
import { VerificationService } from './verification.service';

@Injectable()
export class BotsService {
  constructor(
    private readonly dataService: DataService,
    private readonly publisher: BotPublisherService,
    private readonly k8sDeployer: K8sDeployerService,
    private readonly verificationService: VerificationService,
  ) {}

  list(userId: string) {
    return this.dataService.listBotsByUser(userId);
  }

  mcpCatalog() {
    return [
      { key: 'google-calendar', name: 'Google Calendar' },
      { key: 'wikipedia', name: 'Wikipedia' },
      { key: 'weather', name: 'Weather API' },
    ];
  }

  create(userId: string, input: UpsertBotDto) {
    const now = new Date().toISOString();
    const bot: BotRecord = {
      id: randomUUID(),
      userId,
      slug: this.toSlug(input.persona.name),
      persona: input.persona,
      service: input.service,
      temperature: input.temperature,
      prompt: input.prompt,
      mcpServers: input.mcpServers,
      ragUrls: input.ragUrls ?? [],
      createdAt: now,
      updatedAt: now,
      isPublished: false,
    };
    return this.dataService.upsertBot(bot);
  }

  detail(userId: string, botId: string) {
    const bot = this.getOwnedBot(userId, botId);
    return bot;
  }

  update(userId: string, botId: string, input: UpsertBotDto) {
    const bot = this.getOwnedBot(userId, botId);
    const updated: BotRecord = {
      ...bot,
      persona: input.persona,
      service: input.service,
      temperature: input.temperature,
      prompt: input.prompt,
      mcpServers: input.mcpServers,
      ragUrls: input.ragUrls ?? [],
      updatedAt: new Date().toISOString(),
    };
    return this.dataService.upsertBot(updated);
  }

  async publish(userId: string, botId: string) {
    const bot = this.getOwnedBot(userId, botId);
    const publication = this.publisher.publishBot(bot);
    this.k8sDeployer.deploy({
      bot,
      generatedPath: publication.generatedPath,
      releaseName: publication.releaseName,
    });
    await this.verificationService.verifyServiceCredential({
      ...bot,
      k8sReleaseName: publication.releaseName,
    });
    return this.dataService.upsertBot({
      ...bot,
      isPublished: true,
      isVerified: true,
      publishedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      publicUrl: publication.publicUrl,
      generatedPath: publication.generatedPath,
      k8sReleaseName: publication.releaseName,
      k8sNamespace: process.env.K8S_NAMESPACE ?? 'team-e',
      updatedAt: new Date().toISOString(),
    });
  }

  unpublish(userId: string, botId: string) {
    const bot = this.getOwnedBot(userId, botId);
    if (bot.k8sReleaseName) {
      this.k8sDeployer.undeploy(bot.k8sReleaseName);
    }
    return this.dataService.upsertBot({
      ...bot,
      isPublished: false,
      isVerified: false,
      publicUrl: undefined,
      publishedAt: undefined,
      verifiedAt: undefined,
      k8sReleaseName: undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  remove(userId: string, botId: string) {
    this.getOwnedBot(userId, botId);
    this.dataService.deleteBot(botId);
    return { ok: true };
  }

  private getOwnedBot(userId: string, botId: string) {
    const bot = this.dataService.findBotById(botId);
    if (!bot) {
      throw new NotFoundException('Bot no encontrado.');
    }
    if (bot.userId !== userId) {
      throw new ForbiddenException('No puedes acceder a este bot.');
    }
    return bot;
  }

  private toSlug(input: string) {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }
}
