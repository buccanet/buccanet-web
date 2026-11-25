# Contributing to the Buccanet web app

Thank you for helping. Bug reports, fixes and documentation improvements are welcome.

## Before you start

1. Open an issue before a large change, so the design can be discussed first.
2. A change to the protocol or the SDK starts in the core repository (https://github.com/buccanet/buccanet). A change to the relay starts in https://github.com/buccanet/buccanet-relay.
3. Report security issues privately, as described in [SECURITY.md](SECURITY.md).

## Build and lint

Building the WebAssembly SDK needs Rust, `wasm-pack` and `uv`. Running the app needs a Buccanet relay on port 8758.

```sh
git submodule update --init
npm ci
npm run sdk
npm run dev
npm run lint
npm run build
```

The repository has no test suite yet. A pull request passes `npm run lint` and `npm run build`, and the change was tried in the browser against a local relay.

## Code rules

1. Feature code lives in `src/features/<feature>/`. `src/components/ui` holds presentational primitives only.
2. No native browser dialogs or native form inputs that render OS chrome. Use the primitives in `src/components/ui`.
3. No query strings: parameters travel in the path or in a JSON body.
4. Functions stay around 40 lines and files around 400 lines.
5. Copy, docs and comments use plain declarative sentences and no dash as punctuation.

## License of contributions

The web app is licensed under the GNU Affero General Public License 3.0 ([LICENSE](LICENSE)). By opening a pull request, you agree that your contribution is licensed under AGPL 3.0.

## Code of conduct

Everyone taking part in this project follows the [code of conduct](CODE_OF_CONDUCT.md).
