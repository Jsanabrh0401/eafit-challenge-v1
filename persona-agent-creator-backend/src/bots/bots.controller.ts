import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { BotsService } from './bots.service';
import { UpsertBotDto } from './dto/upsert-bot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get('mcp-catalog')
  listMcp() {
    return this.botsService.mcpCatalog();
  }

  @Get()
  list(@Req() request: AuthRequest) {
    return this.botsService.list(request.user!.sub);
  }

  @Post()
  create(@Req() request: AuthRequest, @Body() input: UpsertBotDto) {
    return this.botsService.create(request.user!.sub, input);
  }

  @Get(':id')
  detail(@Req() request: AuthRequest, @Param('id') botId: string) {
    return this.botsService.detail(request.user!.sub, botId);
  }

  @Patch(':id')
  update(@Req() request: AuthRequest, @Param('id') botId: string, @Body() input: UpsertBotDto) {
    return this.botsService.update(request.user!.sub, botId, input);
  }

  @Post(':id/publish')
  publish(@Req() request: AuthRequest, @Param('id') botId: string) {
    return this.botsService.publish(request.user!.sub, botId);
  }

  @Post(':id/unpublish')
  unpublish(@Req() request: AuthRequest, @Param('id') botId: string) {
    return this.botsService.unpublish(request.user!.sub, botId);
  }

  @Delete(':id')
  remove(@Req() request: AuthRequest, @Param('id') botId: string) {
    return this.botsService.remove(request.user!.sub, botId);
  }
}
