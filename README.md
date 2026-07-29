# Miro Realtime Showcase

Una pizarra inspirada en Miro, construida con Next.js, TypeScript y una capa de sincronizacion local entre pestañas.

El proyecto funciona como un MVP frontend-first: permite crear, mover, editar, redimensionar y eliminar notas adhesivas mientras sincroniza el estado entre pestañas del mismo navegador usando BroadcastChannel y localStorage.

## Que incluye

- Creacion de notas adhesivas desde la toolbar
- Drag and drop para mover elementos dentro del canvas
- Edicion inline del contenido de cada nota
- Redimensionado manual de notas
- Eliminacion de notas
- Presencia visual de cursores entre pestañas locales
- Persistencia local del board en el navegador

## Stack

- Next.js 16
- React 19
- TypeScript
- TanStack Query
- Tailwind CSS 4
- Vitest

## Como probarlo

### Requisitos

- Node.js 20+

### Instalacion

```bash
npm install
```

### Configuracion opcional

Si quieres separar distintas pizarras locales, crea un archivo `.env.local` desde el ejemplo:

```bash
cp .env.example .env.local
```

Y define un identificador de board:

```env
NEXT_PUBLIC_BOARD_ROOM_ID=showcase-board
```

### Desarrollo

```bash
npm run dev
```

## Interaccion

- `Nueva nota`: crea una sticky note
- `Arrastrar`: mueve una nota
- `Doble clic` o clic sobre el contenido: entra en modo edicion
- `Cmd + Enter` o `Ctrl + Enter`: guarda el texto editado
- `Escape`: cancela la edicion
- `Papelera`: elimina la nota
- `Handle inferior derecho`: redimensiona la nota

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run test:coverage
```

## Notas tecnicas

- La sincronizacion actual es local al navegador: no usa backend ni servicios externos.
- El estado del board se persiste en `localStorage`.
- La presencia y los eventos entre pestañas se propagan con `BroadcastChannel`.
- El build usa Webpack en lugar de Turbopack para evitar problemas de bindings nativos en algunos entornos locales.
