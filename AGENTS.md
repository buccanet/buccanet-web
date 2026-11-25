# Instructions for coding agents

This file tells coding agents how to work in `buccanet-web`. `CLAUDE.md` holds the same project rules for Claude Code.

## What this repository is

The Buccanet web app: React 19, React Router 7, Vite 7, Tailwind CSS 4 and TypeScript. The MLS core runs in the page as WebAssembly, built from the `vendor/buccanet` submodule. The app talks to the Buccanet relay on its own origin, and the relay serves the built app in production.

## Layout

1. `src/app/App.tsx`: routes (`/`, `/chat/:roomId`, `/join/:token`) and the device gate.
2. `src/features/<feature>/{api,components,hooks,pages,utils}`: feature code. The features are `onboarding`, `join` and `chat`.
3. `src/components/ui/`: presentational primitives only (`Button`, `Modal`, `TextField`, `Toggle`, `Avatar`).
4. `src/sdk/`: the session over the WebAssembly SDK and its IndexedDB storage. `npm run sdk` builds the SDK into `src/sdk/pkg`, which git ignores.
5. `vendor/buccanet`: the core submodule. `vendor/buccanet-relay`: the relay submodule, used by the Docker image. Both point at the same core commit. Do not edit them from this repository.
6. `vps/` and `scripts/deploy.sh`: the production setup of https://app.buccanet.com.

## Commands

```sh
git submodule update --init
npm ci
npm run sdk       # WebAssembly SDK and icons; needs Rust, wasm-pack and uv
npm run dev       # http://localhost:8759, /api proxied to a relay on 8758
npm run lint      # tsc -b
npm run build     # tsc -b, then vite build
docker build -t buccanet:dev .
```

`npm run lint` and `npm run build` need `src/sdk/pkg`, so run `npm run sdk` first. The repository has no test suite. Run `npm run lint` before proposing a change.

## Rules

1. No query strings anywhere: links, redirects and API inputs carry their parameters in the path or in a JSON body. Tokens appear in a URL only in their dedicated path, such as invite tokens in `/join/<token>`.
2. No native browser chrome: no `alert`, `confirm` or `prompt`, no native `<select>`, no native date, file, range or color inputs. Use the primitives in `src/components/ui`.
3. Pages compose features. Domain logic stays in `src/features/<feature>/`, and `src/components/ui` holds presentational primitives only.
4. Assets are never inlined as data URLs (`assetsInlineLimit: 0`), because the relay's Content Security Policy allows fonts and images from the origin only.
5. Functions stay around 40 lines and files around 400 lines.
6. Scratch work goes in `.tmp/`, which git ignores.
7. Copy, docs, comments and commit messages use plain declarative sentences and no dash as punctuation.

## License

AGPL 3.0. Contributions are licensed under AGPL 3.0.
