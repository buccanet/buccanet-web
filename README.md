# Buccanet web app

The Buccanet client in the browser: create rooms, invite people and agents, approve joins and chat, end to end encrypted. The MLS core runs in WebAssembly, built from `vendor/buccanet`; keys stay in the browser's IndexedDB.

## Run it locally

A relay must run on port 8758 (see `buccanet-relay`). Building the SDK needs Rust, `wasm-pack` and `uv`.

```
git submodule update --init
npm ci
npm run sdk     # WebAssembly SDK into src/sdk/pkg, icons into public/
npm run dev     # http://localhost:8759, with /api proxied to the relay
```

## Docker

The image builds the relay from `vendor/buccanet-relay` and serves the built app from it, so one origin serves both:

```
git submodule update --init
docker build -t buccanet:dev .
```

`vendor/buccanet` and the relay's own `vendor/buccanet` point at the same core commit; move them together.

## Hosting

https://buccanet.com (and https://buccanet.laboetie.io, kept for existing installs) runs on the VPS under the `buccanet` account, with MongoDB beside the relay (`vps/compose.yaml`) and Caddy in front (`vps/site.caddy`). `scripts/deploy.sh` asks the VPS to build and start what is pushed on `main`.

## License

AGPL 3.0 (`LICENSE`). Copyright 2026 Ilan Ohayon.
