# Persona AI Agent Creator - Frontend (Next.js)

Interfaz web para usuarios no técnicos que permite:

- registrarse/iniciar sesión,
- crear y editar bots,
- configurar Persona, Servicio, Prompt, MCP y RAG,
- publicar/despublicar bots y abrir su URL de Hologram.

## Variables de entorno

1. Copia `.env.example` a `.env.local`
2. Configura la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Ejecutar local

```bash
pnpm install
pnpm dev
```

Frontend disponible en `http://localhost:3001` (o el puerto que indique Next).

## Build de validación

```bash
pnpm run build
```
