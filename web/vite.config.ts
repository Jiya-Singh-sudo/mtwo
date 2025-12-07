import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import path from "path"

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
    })

// This code configures Vite to use React and sets up an alias `@` pointing to the `./src` directory. This aligns with the `tsconfig.json` paths configuration you likely set up earlier (`"@/*": ["./src/*"]`).

// If you are just asking about this file because of the `tsconfig` errors, the file itself is fine, but it is included in `tsconfig.node.json`.

// If you need to install `@types/node` for `path` to work (as mentioned in a previous turn), make sure you have run:
// `pnpm add -D @types/node` in the `web` directory.

// The content of `web/vite.config.ts` looks correct for the alias setup.

// ### Summary of Fixes

// 1.  **Update `web/tsconfig.node.json`**: Add `"composite": true`.
// 2.  **Verify `@types/node`**: Ensure it is installed for `path` in `vite.config.ts` to work without type errors.

// If you continue to get the `noEmit` error, modify `web/tsconfig.node.json` to allow emit (e.g., remove `noEmit` or set it to `false`), as referenced projects are expected to produce outputs (like `.d.ts` files) for the referencing project to use.

// Here is the safer version of `web/tsconfig.node.json` to resolves both errors:


// http://googleusercontent.com/immersive_entry_chip/1