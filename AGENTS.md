# AGENTS.md - Agent Coding Guidelines for vue-guess-painter

## Project Overview
- **Type**: Vue 3 + Vite SPA + Node.js Backend
- **Frontend Node**: ^20.19.0 || >=22.12.0
- **Backend Node**: ^18.0.0 || >=20.0.0
- **Package Manager**: npm

## Project Structure
```
vue-guess-painter/
├── server/              # Backend (Express + Socket.io)
│   ├── config/         # Database config
│   ├── services/       # Business logic
│   ├── socket/         # Socket.io handlers
│   ├── index.js        # Entry point
│   └── package.json
└── src/                # Frontend (Vue 3)
```

## Database
- **Host**: 192.168.31.200:3306
- **Database**: guess-painter
- **Credentials**: guess-painter / p5BZRbB8REs4AxRR

Run `server/database.sql` to create tables.

## Build / Run Commands

### Frontend
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
cd server
npm install
npm start        # Start server on port 3001
```

### Testing
**Currently not configured.** If adding tests, use:
```bash
npm install -D vitest @vue/test-utils jsdom
```

Run single test file:
```bash
npx vitest run src/components/__tests__/MyComponent.test.js
npx vitest run --reporter=verbose src/
```

Run tests in watch mode:
```bash
npx vitest
```

### Linting
**Currently not configured.** If adding linting, use:
```bash
npm install -D eslint @eslint/js eslint-plugin-vue
```

Run lint:
```bash
npx eslint src --ext .vue,.js,.jsx
```

## Code Style Guidelines

### General
- Use ES modules (`import`/`export`)
- Use async/await over raw promises
- Prefer functional patterns and composition API (Vue 3)

### Imports
- Use path alias `@` for src imports (e.g., `import App from '@/App.vue'`)
- Order: external libs → internal aliases → relative paths
- Group: imports → type imports → blank line → exports

```javascript
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import MyComponent from '@/components/MyComponent.vue'
import { myUtil } from '@/utils/myUtil'
import './styles/main.css'
```

### Vue 3 Composition API
- Use `<script setup>` syntax for all components
- Prefer `ref` for primitives, `reactive` for objects
- Destructure props with `defineProps` defaults
- Use `computed` for derived state

```vue
<script setup>
const props = defineProps({
  title: { type: String, default: 'Default' },
  count: { type: Number, required: true }
})

const emit = defineEmits(['update', 'delete'])

const localState = ref(0)
const doubled = computed(() => props.count * 2)
</script>
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.vue`, `BaseButton.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useAuth.js`, `useLocalStorage.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`, `validationUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **Props**: camelCase in definition, kebab-case in template
- **CSS Classes**: kebab-case (e.g., `.user-profile`, `.btn-primary`)

### TypeScript / JSDoc
- Use JSDoc for type hints in .js files
- Prefer TypeScript for new files if possible
- Define prop types explicitly in `defineProps`

```javascript
/** @type {string} */
const message = 'Hello'

/**
 * @param {string} name
 * @returns {string}
 */
function greet(name) {
  return `Hello, ${name}`
}
```

### Error Handling
- Use try/catch with async functions, always handle errors
- Display user-friendly error messages in UI
- Log errors to console with context

```javascript
async function fetchData() {
  try {
    const response = await axios.get('/api/data')
    return response.data
  } catch (error) {
    console.error('[fetchData] Failed:', error)
    throw new Error('Failed to fetch data')
  }
}
```

### Template Best Practices
- Use `v-if`/`v-else` for conditional rendering
- Use `v-for` with `:key` (always required)
- Avoid inline arrow functions in templates
- Use kebab-case for event names, emit with consistent naming

```vue
<template>
  <div v-if="loading">Loading...</div>
  <ul v-else>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
  <MyComponent @item-selected="handleSelect" />
</template>
```

### CSS / Styling
- Use scoped styles (`<style scoped>`)
- Prefer CSS variables for theming
- Use BEM-like naming for global classes
- Consider CSS modules for complex components

### File Organization
```
src/
├── assets/         # Static assets (images, fonts)
├── components/     # Reusable Vue components
│   └── common/     # Base components (Button, Input)
├── composables/    # Vue composables (useXxx)
├── utils/          # Pure utility functions
├── views/          # Page-level components
├── router/         # Vue Router config (if needed)
├── stores/         # Pinia stores (if needed)
├── App.vue
└── main.js
```

### Git Conventions
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep commits atomic and focused
- Run `npm run build` before pushing

### Additional Recommendations
- Add `.vscode/recommended-extensions.json` for team consistency
- Consider adding `vitest.config.js` for test setup
- Add `eslint.config.js` for code quality
- Use Vue DevTools browser extension for debugging
