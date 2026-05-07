export type McpServerKey = 'google-calendar' | 'wikipedia' | 'weather';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PersonaConfig {
  name: string;
  profession: string;
  description: string;
  photoUrl?: string;
}

export interface ServiceConfig {
  name: string;
  description: string;
  category: string;
}

export interface BotRecord {
  id: string;
  userId: string;
  slug: string;
  persona: PersonaConfig;
  service: ServiceConfig;
  temperature: number;
  prompt: string;
  mcpServers: McpServerKey[];
  ragUrls: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isPublished: boolean;
  publicUrl?: string;
  generatedPath?: string;
  k8sReleaseName?: string;
  k8sNamespace?: string;
  isVerified?: boolean;
  verifiedAt?: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  bots: BotRecord[];
}
