import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BotRecord } from '../data/data.types';

@Injectable()
export class BotPublisherService {
  private readonly baseDomain =
    process.env.BASE_DOMAIN ??
    'agents.team-e.teams.eafit.testnet.verana.network';
  private readonly outputDir = process.env.GENERATED_OUTPUT_DIR ?? 'generated';
  private readonly openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  private readonly openaiBaseUrl =
    process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  publishBot(bot: BotRecord) {
    const botDir = join(this.outputDir, bot.userId, bot.slug);
    if (!existsSync(botDir)) {
      mkdirSync(botDir, { recursive: true });
    }

    const publicUrl = `https://${bot.slug}.${this.baseDomain}`;
    const releaseName = `${bot.slug}-chart`;
    const configMapName = `${releaseName}-agent-pack`;
    const publishTag = Date.now().toString();
    const ragDocsPath = `/app/rag/docs/${bot.slug}-${publishTag}`;
    const vectorIndexName = `${bot.slug}_index_${publishTag}`;
    const agentPack = this.buildAgentPack(bot, releaseName, ragDocsPath);
    const deployment = this.buildDeployment(
      bot,
      releaseName,
      configMapName,
      ragDocsPath,
      vectorIndexName,
    );

    writeFileSync(join(botDir, 'agent-pack.yaml'), agentPack, 'utf-8');
    writeFileSync(join(botDir, 'deployment.yaml'), deployment, 'utf-8');

    return {
      publicUrl,
      generatedPath: botDir,
      releaseName,
    };
  }

  /**
   * Junta persona + servicio + prompt del formulario en instrucciones que el LLM sí consume.
   * Sin esto, los campos solo vivían en YAML decorativo y el modelo no "recordaba" la identidad.
   */
  private buildFullLlmInstructions(bot: BotRecord): string {
    const lines = [
      'IDENTIDAD Y CONTEXTO DEL FORMULARIO (prioridad alta — úsalo cuando pregunten quién eres, tu profesión, tu servicio o datos sobre ti):',
      `- Nombre público / displayName: ${bot.persona.name}`,
      `- Profesión: ${bot.persona.profession}`,
      `- Descripción de la persona: ${bot.persona.description}`,
      `- Nombre del servicio: ${bot.service.name}`,
      `- Categoría del servicio: ${bot.service.category}`,
      `- Descripción del servicio: ${bot.service.description}`,
      bot.persona.photoUrl?.trim()
        ? `- Foto / URL de imagen (solo si encaja en la respuesta): ${bot.persona.photoUrl.trim()}`
        : '',
      '',
      'Reglas:',
      '- Para preguntas de conocimiento/documentación, prioriza siempre la información recuperada por RAG (bloque "Contexto").',
      '- Si el "Contexto" trae contenido relevante, responde con base en ese contenido y no lo contradigas.',
      '- Si el "Contexto" viene vacío o no es suficiente, responde usando tu conocimiento general y estas instrucciones.',
      '- Si preguntan por tu nombre, profesión, qué ofreces o quién eres, responde con la identidad anterior de forma natural y coherente.',
      '- No inventes datos fuera de esta identidad ni del bloque de instrucciones siguientes.',
      '- El RAG es opcional; la identidad anterior siempre aplica aunque no haya documentos.',
      '',
      'Instrucciones de comportamiento y tono (definidas por quien creó el agente):',
      bot.prompt.trim(),
    ].filter(Boolean);
    return lines.join('\n');
  }

  private buildAgentPack(
    bot: BotRecord,
    releaseName: string,
    ragDocsPath: string,
  ) {
    const normalizedRagUrls = this.normalizeRagUrls(bot.ragUrls);
    const ragLines = normalizedRagUrls.length
      ? normalizedRagUrls.map((url) => `    - ${url}`).join('\n')
      : '    - https://raw.githubusercontent.com/verana-labs/eafit-challenge-agent-example/main/docs/README.md';
    const displayName = this.yamlQuote(bot.persona.name);
    const description = this.yamlQuote(bot.persona.description);
    const fullInstructions = this.yamlQuote(this.buildFullLlmInstructions(bot));
    const serviceName = this.yamlQuote(bot.service.name);
    const serviceDescription = this.yamlQuote(bot.service.description);
    const serviceCategory = this.yamlQuote(bot.service.category);
    const profession = this.yamlQuote(bot.persona.profession);
    const temperature =
      typeof bot.temperature === 'number' ? bot.temperature : 0.4;
    const greetingEs = this.yamlQuote(
      `Hola, soy ${bot.persona.name}. Para comenzar, autentícate con tu credencial EAFIT.`,
    );
    const greetingEn = this.yamlQuote(
      `Hi, I am ${bot.persona.name}. Please authenticate with your EAFIT credential.`,
    );

    return `metadata:
  id: ${bot.slug}
  displayName: ${displayName}
  description: ${description}
  defaultLanguage: es

languages:
  es:
    greetingMessage: ${greetingEs}
    systemPrompt: ${fullInstructions}
    strings:
      ROOT_TITLE: ${displayName}
      LOGOUT: "Cerrar sesión"
      CREDENTIAL: "Autenticar"
      WELCOME: "Bienvenido."
      AUTH_REQUIRED: "Necesitas autenticarte para continuar."
      AUTH_SUCCESS: "Autenticación completada."
      AUTH_SUCCESS_NAME: "Hola, {name}. Ya estás autenticado."
      WAITING_CREDENTIAL: "Esperando credencial..."
      AUTH_PROCESS_STARTED: "Proceso de autenticación iniciado."
      ERROR_MESSAGES: "Servicio temporalmente no disponible."
      LOGOUT_CONFIRMATION: "Sesión cerrada."
  en:
    greetingMessage: ${greetingEn}
    systemPrompt: ${fullInstructions}
    strings:
      ROOT_TITLE: ${displayName}
      LOGOUT: "Logout"
      CREDENTIAL: "Authenticate"
      WELCOME: "Welcome."
      AUTH_REQUIRED: "Authentication is required."
      AUTH_SUCCESS: "Authentication completed."
      AUTH_SUCCESS_NAME: "Hi, {name}. You are authenticated."
      WAITING_CREDENTIAL: "Waiting for credential..."
      AUTH_PROCESS_STARTED: "Authentication started."
      ERROR_MESSAGES: "Service temporarily unavailable."
      LOGOUT_CONFIRMATION: "Session closed."

llm:
  provider: openai
  model: ${this.openaiModel}
  baseUrl: ${this.openaiBaseUrl}
  temperature: ${temperature}
  agentPrompt: ${fullInstructions}

rag:
  provider: langchain
  docsPath: ${ragDocsPath}
  remoteUrls:
${ragLines}

persona:
  profession: ${profession}
  photoUrl: ${this.yamlQuote(bot.persona.photoUrl || '')}

service:
  name: ${serviceName}
  description: ${serviceDescription}
  category: ${serviceCategory}

memory:
  backend: redis
  window: 20
  redisUrl: redis://${releaseName}-redis:6379

flows:
  welcome:
    enabled: true
    sendOnProfile: true
    templateKey: greetingMessage
  authentication:
    enabled: true
    credentialDefinitionId: \${CREDENTIAL_DEFINITION_ID}
    adminAvatars: []
  menu:
    items:
      - id: authenticate
        labelKey: CREDENTIAL
        action: authenticate
        visibleWhen: unauthenticated
      - id: logout
        labelKey: LOGOUT
        action: logout
        visibleWhen: authenticated

integrations:
  vsAgent:
    adminUrl: http://${bot.slug}:3000
  postgres:
    host: ${releaseName}-postgres
    user: example-db-user
    password: changeme
    dbName: example-db-name
`;
  }

  private buildDeployment(
    bot: BotRecord,
    releaseName: string,
    configMapName: string,
    ragDocsPath: string,
    vectorIndexName: string,
  ) {
    const temperature =
      typeof bot.temperature === 'number' ? bot.temperature : 0.4;
    return `chartSource: oci://registry-1.docker.io/io2060/hologram-generic-ai-agent-chart
chartVersion: v1.11.2

global:
  domain: ${this.baseDomain}

nameOverride: '${releaseName}'

credentialDefinitionId: '${process.env.CREDENTIAL_DEFINITION_ID ?? ''}'

chatbot:
  ingress:
    enabled: false
  env:
    - name: APP_PORT
      value: '3003'
    - name: LOG_LEVEL
      value: '3'
    - name: LLM_PROVIDER
      value: 'openai'
    - name: OPENAI_MODEL
      value: '${this.openaiModel}'
    - name: OPENAI_BASE_URL
      value: '${this.openaiBaseUrl}'
    - name: OPENAI_TEMPERATURE
      value: '${temperature}'
    - name: VECTOR_STORE
      value: 'redis'
    - name: VECTOR_INDEX_NAME
      value: '${vectorIndexName}'
    - name: RAG_PROVIDER
      value: 'langchain'
    - name: RAG_DOCS_PATH
      value: '${ragDocsPath}'
    - name: AGENT_MEMORY_BACKEND
      value: 'redis'
    - name: AGENT_MEMORY_WINDOW
      value: '20'
    - name: REDIS_URL
      value: 'redis://${releaseName}-redis.{{ .Release.Namespace }}:6379'
    - name: VS_AGENT_ADMIN_URL
      value: 'http://${bot.slug}.{{ .Release.Namespace }}:3000'
    - name: POSTGRES_HOST
      value: '${releaseName}-postgres.{{ .Release.Namespace }}'
    - name: CREDENTIAL_DEFINITION_ID
      value: '${process.env.CREDENTIAL_DEFINITION_ID ?? ''}'
  agentPack:
    enabled: true
    name: ${bot.slug}
    mountPath: /app/agent-packs/${bot.slug}
    fileName: agent-pack.yaml
    existingConfigMap: '${configMapName}'

stats:
  enabled: false

artemis:
  enabled: false

vs-agent-chart:
  name: ${bot.slug}
  didcommLabel: '${bot.persona.name}'
  didcommInvitationImageUrl: '${bot.persona.photoUrl || 'https://hologram.zone/images/github.svg'}'
  eventsBaseUrl: http://${releaseName}-chatbot:3003
  ingress:
    host: "${bot.slug}.{{ .Values.global.domain }}"
    tlsSecret: "${bot.slug}.{{ .Values.global.domain }}-cert"
  extraEnv:
    - name: AGENT_WALLET_ID
      value: "${bot.persona.name}"
    - name: AGENT_WALLET_KEY
      value: ""
    - name: USE_CORS
      value: "true"
    - name: REDIS_HOST
      value: "${releaseName}-redis"
    - name: AGENT_LOG_LEVEL
      value: "3"
`;
  }

  private yamlQuote(input: string) {
    return JSON.stringify(input ?? '');
  }

  private normalizeRagUrls(urls: string[]): string[] {
    const normalized = urls
      .map((value) => value.trim())
      .filter(Boolean)
      .map((rawUrl) => {
        try {
          const url = new URL(rawUrl);
          const host = url.hostname.toLowerCase();
          const path = url.pathname;

          // Google Drive share links often return heavy HTML pages (/file/d/.../view or /edit),
          // which slows indexing and can delay chatbot readiness. Convert to direct download.
          if (host.includes('drive.google.com')) {
            const fileMatch = path.match(/\/file\/d\/([^/]+)/);
            const openId = url.searchParams.get('id');
            const fileId = fileMatch?.[1] ?? openId;
            if (fileId) {
              return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
          }

          // Google Docs document links can be exported as plain text.
          if (host.includes('docs.google.com')) {
            const docMatch = path.match(/\/document\/d\/([^/]+)/);
            const docId = docMatch?.[1];
            if (docId) {
              return `https://docs.google.com/document/d/${docId}/export?format=txt`;
            }
          }

          return rawUrl;
        } catch {
          return rawUrl;
        }
      });

    return [...new Set(normalized)];
  }
}
