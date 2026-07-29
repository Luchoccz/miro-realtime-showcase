# Miro Realtime Showcase

MVP colaborativo tipo Miro construido con Next.js, TypeScript, TanStack Query y una capa casera de sincronizacion local.

## Requisitos

- Node.js 20+

## Configuracion

1. Instala dependencias:

	npm install

2. Opcional: crea tu entorno local a partir del ejemplo:

	cp .env.example .env.local

3. Si quieres separar varias pizarras locales, define un room id:

	NEXT_PUBLIC_BOARD_ROOM_ID=showcase-board

4. Inicia el servidor:

	npm run dev

La colaboracion ya no depende de Liveblocks. La sincronizacion usa BroadcastChannel entre pestañas del mismo navegador y persiste elementos en localStorage.

## Scripts

- npm run dev: desarrollo
- npm run build: build de produccion
- npm run start: ejecutar build
- npm run lint: linting
- npm run test: unit tests
