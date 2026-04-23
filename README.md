# JSONCraft

A fast, privacy-first JSON toolkit that runs entirely in your browser.

🌐 **Live at [jsoncraft.in](https://jsoncraft.in)**

## Features

- **Format** — Beautify and minify JSON with configurable indent (2, 4, tab) and key sorting
- **Validate** — Instant syntax validation with error location
- **Diff** — Side-by-side JSON diff with a semantic changes summary (added / removed / changed)
- **Tree** — Interactive tree explorer with path copying
- **Share** — Share JSON via compressed URL
- **Analyze** — Deep JSON statistics and structure analysis

## Privacy

All processing happens in your browser. No data is sent to any server.

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deployment

Hosted on [Cloudflare Pages](https://pages.cloudflare.com). Every push to `main` triggers a new deployment.
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },

},
])

````

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
````
