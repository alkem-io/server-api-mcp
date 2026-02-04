# NPM Package Configuration for CLI Tools

A concise guide to configuring Node.js CLI packages for npm distribution.

---

## 1. Bin Entry Point Configuration

The `bin` field in `package.json` maps command names to executable files.

```json
{
  "bin": {
    "server-api-mcp": "./dist/index.js"
  }
}
```

**Key requirements:**

- **Shebang line** must be the first line of the executable file:
  ```javascript
  #!/usr/bin/env node
  ```

- **File permissions**: The file must be executable (`chmod +x index.js`). npm handles this automatically during global install.

- **Path**: Point to compiled output (not source) for TypeScript projects.

**Single command shortcut:**
```json
{
  "bin": "./dist/cli.js"
}
```

**Multiple commands:**
```json
{
  "bin": {
    "server-api-mcp": "./dist/index.js",
    "mcp-tool": "./dist/tools/cli.js"
  }
}
```

---

## 2. Files to Include/Exclude

### The `files` Field (Recommended)

Use `files` to explicitly whitelist what gets published:

```json
{
  "files": [
    "dist",
    "package.json",
    "README.md"
  ]
}
```

### `.npmignore` vs `.gitignore`

| File | Purpose | Example |
|------|---------|---------|
| `.gitignore` | Excludes files from version control | `node_modules/`, `dist/`, `*.log` |
| `.npmignore` | Excludes files from npm package | Source files, tests, docs |

**Important**: `.gitignore` does NOT affect npm publishing. Files ignored by git may still be included in the package unless explicitly excluded with `.npmignore` or the `files` field.

**Typical `.npmignore`:**

```
# Build artifacts
dist/
.tsbuildinfo

# Source code (for compiled packages)
src/

# Development
node_modules/
test/
*.test.js
*.spec.js

# IDE
.vscode/
.idea/

# Misc
.DS_Store
*.log
coverage/
```

**For source maps (TypeScript):**

```json
{
  "files": [
    "dist",
    "dist/**/*.d.ts",
    "package.json",
    "README.md"
  ]
}
```

---

## 3. Publishing to npm Registry

### Pre-publish Checklist

```bash
# 1. Login to npm
npm login

# 2. Test locally
npm install
npm run build
npm test

# 3. Dry run to verify files
npm pack --dry-run

# 4. Publish
npm publish
```

### Version Management

```json
{
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**Key fields:**

| Field | Purpose |
|-------|---------|
| `version` | Semantic version (MAJOR.MINOR.PATCH) |
| `main` | CommonJS entry point |
| `types` | TypeScript definition file |
| `module` | ESM entry point |
| `exports` | Conditional exports (ESM/CJS) |

**Publishing scope:**

```json
{
  "name": "@organization/server-api-mcp",
  "private": false
}
```

---

## 4. ESM Module Support

### Enabling ESM

```json
{
  "type": "module"
}
```

### Conditional Exports (Dual Package)

Support both ESM and CommonJS consumers:

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

**For CLI tools with ESM:**

```json
{
  "type": "module",
  "bin": {
    "server-api-mcp": "./dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Shebang with ESM

```javascript
#!/usr/bin/env node
// ESM code here
import { something } from './module.js';
```

---

## 5. Dependencies vs devDependencies

### Clear Separation

```json
{
  "dependencies": {
    "@alkemio/client-lib": "^0.35.0",
    "dotenv": "^16.5.0",
    "mcp-framework": "^0.2.13",
    "graphql-request": "^6.1.0",
    "graphql": "^16.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "typescript": "^5.3.3"
  }
}
```

### When to Use Each

| `dependencies` | `devDependencies` |
|--------------|-------------------|
| Runtime libraries | Build tools (tsc, webpack) |
| Core functionality | Testing frameworks (jest, mocha) |
| GraphQL clients | Type definitions (@types/*) |
| Auth libraries | Linters (eslint, prettier) |

### Key Distinction

- `dependencies`: Required for production runtime
- `devDependencies`: Only needed during development/build

**Installation behavior:**

```bash
npm install           # installs both
npm install --only=prod   # installs only dependencies
npm install --only=dev    # installs only devDependencies
```

---

## 6. Global Install vs npx

### Global Install

```bash
npm install -g server-api-mcp
```

**Requirements:**

```json
{
  "bin": {
    "server-api-mcp": "./dist/index.js"
  },
  "engines": {
    "node": ">=18.19.0"
  }
}
```

**After global install**, the command is available anywhere via the bin name.

### Using npx

```bash
npx server-api-mcp
```

**How npx works:**

1. Checks local `node_modules/.bin` for the command
2. Falls back to temporary install of the package
3. Runs the executable

**Package.json requirement for npx:**

```json
{
  "bin": {
    "server-api-mcp": "./dist/index.js"
  }
}
```

npx finds the command via the `bin` field.

### Comparison

| Aspect | Global Install | npx |
|--------|---------------|-----|
| Persistence | Stays installed | Temporary |
| Version control | Fixed version | Always latest |
| Use case | Frequent use tools | One-off commands |
| Updates | Manual update | Automatic |

---

## 7. Complete Example

```json
{
  "name": "server-api-mcp",
  "version": "0.0.1",
  "description": "MCP server for Alkemio GraphQL API",
  "type": "module",
  "bin": {
    "server-api-mcp": "./dist/index.js"
  },
  "files": [
    "dist",
    "package.json",
    "README.md"
  ],
  "scripts": {
    "build": "tsc && mcp-build",
    "watch": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@alkemio/client-lib": "^0.35.0",
    "dotenv": "^16.5.0",
    "mcp-framework": "^0.2.13",
    "graphql-request": "^6.1.0",
    "graphql": "^16.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.19.0"
  },
  "keywords": [
    "mcp",
    "alkemio",
    "graphql",
    "cli"
  ],
  "author": "Alkemio",
  "license": "MIT"
}
```

**Source file requirement (`src/index.ts`):**

```typescript
#!/usr/bin/env node
import { MCPServer } from './server';

new MCPServer().start();
```

---

## 8. Verification Commands

```bash
# Check package.json validity
npm pkg validate

# View what files will be published
npm pack --dry-run

# Check for common issues
npm ls

# Verify bin mapping
npm exec -- server-api-mcp -- --help
```

---

## Summary

| Configuration | Key Point |
|--------------|-----------|
| `bin` | Maps command name to executable file |
| `files` | Explicitly whitelist published files |
| `type: "module"` | Enables ESM syntax |
| `dependencies` | Runtime-only packages |
| `devDependencies` | Build/test-only packages |
| `.npmignore` | Separate from `.gitignore` for publishing control |
| `npx` | Run without global install |

---

**Sources:**

- [npm docs: bin field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin)
- [npm: Executable scripts and shebangs](https://npm.github.com/making-symlinked-binaries)
- [npm install documentation](https://docs.npmjs.com/cli/v10/commands/npm-install)
- [About dependencies](https://docs.npmjs.com/about-dependencies#devdependencies)
- [When to use devDependencies vs Dependencies](https://dev.to/grawl/repo-when-to-use-dependencies-and-devdependencies-1p5l)
- [npm install --save vs --save-dev](https://stackoverflow.com/questions/27722495/npm-install-save-vs-save-dev-difference)