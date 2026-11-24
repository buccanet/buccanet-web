# The relay image with the web app served from the same origin. Build the relay image first
# (buccanet-relay: `docker build -t buccanet-relay:dev .`), or pass another one as RELAY_IMAGE.
ARG RELAY_IMAGE=buccanet-relay:dev

FROM rust:1.94-trixie AS sdk
RUN cargo install wasm-pack --locked
WORKDIR /src
COPY vendor/buccanet ./vendor/buccanet
RUN cd vendor/buccanet && wasm-pack build core/buccanet-wasm --target web --release --out-dir /out/pkg --out-name buccanet

FROM node:24-trixie-slim AS web
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pil && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
COPY --from=sdk /out/pkg ./src/sdk/pkg
RUN python3 vendor/buccanet/design/logo/build-icons.py web . && npx vite build

FROM ${RELAY_IMAGE}
COPY --from=web /src/dist /srv/web
ENV STATIC_DIR=/srv/web
