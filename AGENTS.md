# AGENTS.md - Agent Coding Guidelines for vue-guess-painter

## Project Overview
- **Type**: Vue 3 + Vite SPA with Node.js/Express + Socket.io Backend
- **Frontend Node**: ^20.19.0 || >=22.12.0
- **Backend Node**: ^18.0.0 || >=20.0.0
- **Package Manager**: npm
- **Module System**: ES Modules (`"type": "module"`)

## Project Structure
```
vue-guess-painter/
├── src/                    # Frontend (Vue 3 + Vite)
│   ├── assets/styles/      # Global CSS
│   ├── components/common/  # Reusable components (Button, Input, Modal, Toast)
│   ├── composables/        # Vue composables (useSocket, useGame)
│   ├── views/              # Page components (HomeView, GameView)
│   ├── App.vue
│   └── main.js
├── server/                 # Backend (Express + Socket.io)
│   ├── config/database.js  # MySQL connection pool
│   ├── services/           # Business logic (RoomService)
│   ├── socket/index.js     # Socket.io event handlers
│   ├── index.js            # Server entry point
│   ├── database.sql        # Schema definitions
│   └── package.json
└── vite.config.js          # Vite config with @ alias
```

## Database
- **Host**: 192.168.31.200:3306
- **Database**: guess_painter (note: underscore, not hyphen)
- **Tables**: rooms, players, votes, game_records

Initialize: `mysql -u root -p < server/database.sql`

## Build / Run Commands

### Frontend
```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
cd server
npm install
npm start        # Start server (port 3001)
npm run dev      # Start with --watch flag
```

### Testing
Not configured. To add tests:
```bash
npm install -D vitest @vue/test-utils jsdom
```

Run single test:
```bash
npx vitest run src/components/__tests__/Button.test.js
npx vitest run --reporter=verbose src/composables/
```

### Linting
Not configured. To add ESLint:
```bash
npm install -D eslint @eslint/js eslint-plugin-vue
npx eslint src --ext .vue,.js,.jsx
```

## Code Style Guidelines

### Imports
- Use path alias `@` for src imports
- Order: Vue core → external libs → internal aliases → relative → styles
- Add `.js` extension for backend imports

```javascript
// Frontend
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import Button from '@/components/common/Button.vue'
import { useSocket } from '@/composables/useSocket'

// Backend
import express from 'express'
import pool from '../config/database.js'
import { RoomService } from '../services/RoomService.js'
```

### Vue 3 Components
- Use `<script setup>` syntax (all components use this)
- Destructure props with `defineProps`, emit with `defineEmits`
- Use `ref` for primitives, `computed` for derived state
- Expose methods via `defineExpose` when parent needs to call them

```vue
<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update', 'submit'])

const localState = ref(0)

defineExpose({ init, reset })
</script>
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GameView.vue`, `BaseButton.vue` |
| Composables | camelCase + use prefix | `useSocket.js`, `useGame.js` |
| Utils | camelCase | `formatDate.js` |
| Constants | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| Props | camelCase definition, kebab-case in template | `maxPlayers` / `max-players` |
| CSS classes | kebab-case, BEM-like | `.ios-button`, `.ios-button--primary` |
| Socket events | kebab-case | `room-created`, `start-game` |

### Error Handling
- Use try/catch with async functions
- Log with context prefix in brackets
- Emit user-friendly errors to clients

```javascript
// Backend
try {
  const room = await RoomService.getRoomByCode(roomCode)
  if (!room) {
    socket.emit('room-error', { message: '房间号不存在' })
    return
  }
} catch (error) {
  socket.emit('room-error', { message: error.message })
}

// Frontend
try {
  await connect(url)
} catch (error) {
  console.error('[Socket] Error:', error)
}
```

### Logging Convention
- Use bracketed prefixes: `[Component]`, `[Socket]`, `[Game]`
- Server logs: `console.log('[Room] Created:', roomCode)`
- Client logs: `console.log('[Canvas] Initialized:', width, 'x', height)`

### CSS / Styling
- Use scoped styles (`<style scoped>`)
- Use CSS custom properties for theming
- iOS-inspired design system

```css
.ios-button {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
}
.ios-button--primary {
  background: var(--accent);
  color: white;
}
```

### Backend Patterns
- Service layer pattern (RoomService handles DB operations)
- Socket handlers in separate file
- In-memory room state with Map for performance
- Async/await for all database operations

```javascript
// Service pattern
export const RoomService = {
  async createRoom(hostId, hostName, targetWord, maxPlayers = 8) {
    const [result] = await pool.query(
      `INSERT INTO rooms (...) VALUES (?, ?, ?, ?)`,
      [hostId, hostName, targetWord, maxPlayers]
    )
    return this.getRoomById(result.insertId)
  }
}

// Socket handler
socket.on('create-room', async (data) => {
  try {
    const room = await RoomService.createRoom(...)
    socket.emit('room-created', { room })
  } catch (error) {
    socket.emit('room-error', { message: error.message })
  }
})
```

### Template Best Practices
- `v-if`/`v-else` for conditional rendering
- `v-for` with `:key` (required)
- Use ref for component access: `ref="gameRef"` → `gameRef.value?.init()`

```vue
<template>
  <div v-if="loading">Loading...</div>
  <ul v-else>
    <li v-for="player in players" :key="player.socket_id">
      {{ player.player_name }}
    </li>
  </ul>
  <GameView ref="gameRef" @leave="handleLeave" />
</template>
```

### Composables Pattern
- Export functions, keep shared state as module-level refs
- Return reactive refs and methods

```javascript
const socket = ref(null)
const connected = ref(false)

export function useSocket() {
  const connect = (url) => { socket.value = io(url) }
  return { socket, connected, connect }
}
```

## Git Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep commits atomic and focused
- Run `npm run build` before pushing

## Security Notes
- Never expose database credentials in client code
- Validate all socket event data on server
- Use parameterized queries (already done with mysql2)
