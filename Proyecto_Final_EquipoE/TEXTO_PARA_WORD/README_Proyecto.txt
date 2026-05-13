================================================================================
README DEL PROYECTO — Persona AI Agent Creator
================================================================================
Autor: Juan Pablo Sanabria Hoyos
Programa: Beca IA Ser ANDI — Verana Foundation × NODO EAFIT
Fecha: mayo 2026
================================================================================

NOMBRE DEL PROYECTO
-------------------
Persona AI Agent Creator — plataforma web para crear, configurar y publicar agentes de IA personales en el ecosistema del reto (Verana / Hologram / Kubernetes).

INTEGRANTE
----------
Juan Pablo Sanabria Hoyos

DESCRIPCIÓN DEL PROBLEMA ABORDADO
---------------------------------
Los agentes de IA "verificables" requieren configuración técnica (YAML, Helm, secretos, dominios) y conocimiento de Kubernetes, lo que excluye a usuarios de negocio o sin perfil de infraestructura. Además, en Hologram el usuario debe poder confiar en la identidad del agente. La plataforma reduce esa brecha con un formulario guiado y publicación automatizada desde un backend seguro.

OBJETIVO GENERAL DE LA SOLUCIÓN
-------------------------------
Ofrecer un servicio en línea donde se defina la persona y el servicio del agente, las instrucciones de comportamiento, documentos para RAG y herramientas MCP, y desde ahí se genere el empaquetado y el despliegue en el clúster del laboratorio, dejando trazabilidad y una URL pública según el entorno del curso.

TECNOLOGÍAS UTILIZADAS
----------------------
• Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS.
• Backend: NestJS, TypeScript, JWT, OAuth (Google/GitHub según configuración).
• IA del producto: API compatible con OpenAI (modelo configurable) para el chat del agente publicado; RAG según chart.
• Infraestructura: Docker, Docker Compose, Kubernetes, Helm, chart del agente genérico del reto.
• Control de versiones: Git.

ARQUITECTURA GENERAL
--------------------
El usuario interactúa con Next.js. Las peticiones van al API NestJS, que persiste agentes y usuarios, genera agent-pack.yaml y deployment.yaml, y ejecuta kubectl/helm contra el clúster. En Kubernetes corren los componentes del chart (p. ej. chatbot, vs-agent, Postgres, Redis). El usuario final puede usar Hologram o la URL pública según la configuración del laboratorio.

FLUJO DE FUNCIONAMIENTO
-----------------------
1. Registro o inicio de sesión (correo u OAuth).
2. Creación o edición del agente en pasos: Persona → Servicio → Comportamiento → Resumen.
3. Guardado en la base de datos de la plataforma (p. ej. JSON local o motor relacional según el fork).
4. Publicación opcional: Helm instala/actualiza el release del agente.
5. Uso del agente publicado mediante Hologram o enlace público.

CÓMO EJECUTAR EL PROYECTO
-------------------------
Backend (desde la carpeta persona-agent-creator-backend):
  pnpm install
  pnpm run start:dev

Frontend (desde persona-agent-creator-frontend):
  pnpm install
  pnpm run dev

Variables: copiar .env.example a .env en backend y frontend; completar JWT, OPENAI_API_KEY, OAuth y variables de Kubernetes solo en la máquina que publica. No subir .env con secretos al repositorio.

Opcional: en la raíz del monorepo, docker compose up --build si existe docker-compose.yml.

CAPTURAS O EVIDENCIAS VISUALES
------------------------------
Incluir en la carpeta 06_Evidencias/capturas del paquete de entrega: login, dashboard, formulario de agente, lista con publicar, y si aplica pantalla de Hologram o kubectl get pods. Si no están en el ZIP, añadir enlace a Drive en el correo de entrega.

ESTADO ACTUAL DEL DESARROLLO
-----------------------------
Versión estable para demostración académica: CRUD de agentes, autenticación, publicación y despublicación en namespace de laboratorio, formulario con RAG y MCP, documentación de despliegue local.

LIMITACIONES CONOCIDAS
-----------------------
• La publicación requiere kubeconfig válido y permisos en el namespace.
• Documentos RAG muy grandes alargan el primer arranque del agente.
• Imágenes de invitación muy pesadas pueden provocar errores en vs-agent (límites de claims).
• La demo depende de la disponibilidad del clúster y de las credenciales del entorno.

POSIBLES MEJORAS FUTURAS
------------------------
• CI/CD con build y lint automáticos.
• Base de datos relacional con migraciones versionadas.
• Pruebas end-to-end del flujo de publicación.
• Panel de administración y observabilidad (logs centralizados).
