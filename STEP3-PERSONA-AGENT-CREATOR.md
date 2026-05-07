# Step 3+ - Persona AI Agent Creator (Nest + Next)

Implementación creada fuera de `eafit-challenge-agent-example`:

- `persona-agent-creator-backend` (NestJS)
- `persona-agent-creator-frontend` (Next.js)

## Flujo funcional actual

1. Usuario se registra / inicia sesión
2. Crea bot con:
   - Persona
   - Servicio
   - Prompt
   - MCP (Google Calendar, Wikipedia, Weather)
   - URLs RAG
3. Guarda/edita bot
4. Publica bot:
   - se marca como publicado
   - se genera URL pública basada en `BASE_DOMAIN`
   - se generan archivos:
     - `agent-pack.yaml`
     - `deployment.yaml`
5. Despublica bot

## Cómo ejecutar local para pruebas

### 1) Backend

```bash
cd persona-agent-creator-backend
cp .env.example .env
pnpm install
pnpm run start:dev
```

### 2) Frontend

En otra terminal:

```bash
cd persona-agent-creator-frontend
cp .env.example .env.local
pnpm install
pnpm dev --port 3001
```

Abrir `http://localhost:3001`.

## Probar end-to-end

1. Crear cuenta desde la UI
2. Crear bot con al menos 1 MCP seleccionado
3. Guardar bot y verificar que aparece en "Mis bots"
4. Publicar bot
5. Verificar archivos generados en:

```txt
persona-agent-creator-backend/generated/<userId>/<slug>/
```

## Siguiente paso para despliegue real en k8s

Integrar en backend un `KubernetesService` que ejecute:

- `kubectl apply -f deployment.yaml`
- configuración de secrets/env por bot
- rollout status por namespace del equipo

La base ya está preparada con generación de artefactos por bot.
