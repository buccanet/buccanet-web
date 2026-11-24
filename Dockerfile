# The hosted Buccanet: the relay and the web app it serves from the same origin, built from the
# vendor/buccanet (core) and vendor/buccanet-relay submodules. Both submodules point at the same
# core commit as the relay's own vendor/buccanet, so the relay is built against this repository's
# copy of the core.

FROM rust:1.94-trixie AS sdk
RUN cargo install wasm-pack --locked
WORKDIR /src
COPY vendor/buccanet ./vendor/buccanet
RUN cd vendor/buccanet && wasm-pack build core/buccanet-wasm --target web --release --out-dir /out/pkg --out-name buccanet

FROM rust:1.94-trixie AS relay
WORKDIR /src
COPY vendor/buccanet-relay/Cargo.toml vendor/buccanet-relay/Cargo.lock ./
COPY vendor/buccanet-relay/src ./src
COPY vendor/buccanet ./vendor/buccanet
RUN cargo build --release --locked && cp target/release/buccanet-relay /usr/local/bin/buccanet-relay

FROM node:24-trixie-slim AS web
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pil && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
COPY --from=sdk /out/pkg ./src/sdk/pkg
RUN python3 vendor/buccanet/design/logo/build-icons.py web . && npx vite build

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home --uid 10001 relay
COPY --from=relay /usr/local/bin/buccanet-relay /usr/local/bin/buccanet-relay
COPY --from=web /src/dist /srv/web
ENV BIND_HOST=0.0.0.0 PORT=8758 MESSAGE_TTL_DAYS=30 STATIC_DIR=/srv/web
EXPOSE 8758
USER relay
CMD ["buccanet-relay"]
