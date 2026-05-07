# Persona AI Agent Creator - Backend (NestJS)

API para autenticación, gestión de bots y publicación de artefactos (`agent-pack.yaml` + `deployment.yaml`) para agentes verificables en Hologram.

## Qué incluye

- Registro/Login con JWT
- CRUD de bots por usuario
- Configuración de Persona, Service, Prompt, MCP y RAG
- Publicar/Despublicar bot (genera archivos en `generated/`)
- Catálogo MCP inicial con 3 integraciones (incluye 2 funcionales mínimas exigidas)

## Variables de entorno

1. Copia `.env.example` a `.env`
2. Ajusta valores:

```env
PORT=3000
JWT_SECRET=change-me-in-production
DB_PATH=data/db.json
BASE_DOMAIN=agents.team-e.teams.eafit.testnet.verana.network
GENERATED_OUTPUT_DIR=generated
K8S_NAMESPACE=team-e
KUBECONFIG_PATH=C:\Users\Usuario\Desktop\kubernets\team_e_kubeconfig
AGENT_CHART_SOURCE=oci://registry-1.docker.io/io2060/hologram-generic-ai-agent-chart
AGENT_CHART_VERSION=v1.11.2
CREDENTIAL_DEFINITION_ID=<cred def de avatar eafit>
GROQ_API_KEY=<tu api key groq>
EXAMPLE_AGENT_POSTGRES_PASSWORD=<password db chatbot>
EXAMPLE_AGENT_MCP_CONFIG_ENCRYPTION_KEY=<openssl rand -hex 32>
EXAMPLE_AGENT_WALLET_KEY=<openssl rand -base64 32>
EXAMPLE_AGENT_VSAGENT_DB_PASSWORD=<password db vs-agent>
ORG_VS_ADMIN_URL=https://admin.organization.eafit.testnet.verana.network
ECS_TR_PUBLIC_URL=https://ecs-trust-registry.testnet.verana.network
```

## Ejecutar local

```bash
pnpm install
pnpm run start:dev
```

API disponible en `http://localhost:3000`.

## Requisitos para desplegar al cluster desde la API

- `kubectl` instalado y funcionando
- `helm` instalado y funcionando
- acceso al namespace `team-e` con el kubeconfig indicado
- variables secretas completadas en `.env`

Cuando llamas `POST /bots/:id/publish`:

1. Se genera `agent-pack.yaml` y `deployment.yaml` del bot creado en UI
2. Se crea/actualiza ConfigMap con ese `agent-pack.yaml`
3. Se ejecuta `helm upgrade --install` al chart oficial de Hologram
4. Se espera rollout del chatbot
5. Se hace verificación automática:
   - descubre `service-jsc-vp` en ECS TR,
   - hace `port-forward` al VS Agent del bot,
   - emite Service Credential desde organización,
   - la enlaza en `linked-credentials` del agente

Cuando llamas `POST /bots/:id/unpublish`:

- Se ejecuta `helm uninstall` del release del bot

## Endpoints principales

- `POST /auth/register`
- `POST /auth/login`
- `GET /bots`
- `POST /bots`
- `PATCH /bots/:id`
- `POST /bots/:id/publish`
- `POST /bots/:id/unpublish`
- `DELETE /bots/:id`

Todos los endpoints de `/bots` requieren `Authorization: Bearer <token>`.

## Build de validación

```bash
pnpm run build
```
