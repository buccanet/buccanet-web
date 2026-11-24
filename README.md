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

The image adds the built app to the relay image, so one origin serves both:

```
docker build -t buccanet-web:dev .
```

## License

AGPL 3.0 (`LICENSE`). Copyright 2026 Ilan Ohayon.
