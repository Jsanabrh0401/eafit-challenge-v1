import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BotRecord, DatabaseSchema, UserRecord } from './data.types';

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  bots: [],
};

@Injectable()
export class DataService implements OnModuleInit {
  private readonly dbPath = process.env.DB_PATH ?? 'data/db.json';
  private db: DatabaseSchema = DEFAULT_DB;

  onModuleInit(): void {
    this.ensureDbLoaded();
  }

  private ensureDbLoaded() {
    const folder = dirname(this.dbPath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }

    if (!existsSync(this.dbPath)) {
      writeFileSync(this.dbPath, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      this.db = { ...DEFAULT_DB };
      return;
    }

    const content = readFileSync(this.dbPath, 'utf-8');
    this.db = content ? (JSON.parse(content) as DatabaseSchema) : { ...DEFAULT_DB };
  }

  private persist() {
    writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
  }

  listUsers() {
    return this.db.users;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    return this.db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(userId: string): UserRecord | undefined {
    return this.db.users.find((user) => user.id === userId);
  }

  createUser(user: UserRecord): UserRecord {
    this.db.users.push(user);
    this.persist();
    return user;
  }

  listBotsByUser(userId: string): BotRecord[] {
    return this.db.bots.filter((bot) => bot.userId === userId);
  }

  findBotById(botId: string): BotRecord | undefined {
    return this.db.bots.find((bot) => bot.id === botId);
  }

  upsertBot(bot: BotRecord): BotRecord {
    const index = this.db.bots.findIndex((item) => item.id === bot.id);
    if (index === -1) {
      this.db.bots.push(bot);
    } else {
      this.db.bots[index] = bot;
    }
    this.persist();
    return bot;
  }

  deleteBot(botId: string): void {
    this.db.bots = this.db.bots.filter((bot) => bot.id !== botId);
    this.persist();
  }
}
