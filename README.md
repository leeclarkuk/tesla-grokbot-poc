# tesla-grokbot-poc

Voice-first driver companion. First vehicle integration is Tesla. This repository is the engineering foundation, not the product yet.

Talk while driving. Inspect while parked.

## Docs

- Agent operating instructions: [`AGENTS.md`](AGENTS.md)
- Architecture and ADRs: [`docs/architecture/README.md`](docs/architecture/README.md)
- MVP boundary: [`docs/product/mvp.md`](docs/product/mvp.md)
- Driver safety policy: [`docs/product/driver-safety-policy.md`](docs/product/driver-safety-policy.md)
- Threat model: [`docs/product/threat-model.md`](docs/product/threat-model.md)

## Gates

Node 22 or newer.

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```

`src/` holds module-boundary contracts and a data-driven policy catalogue. It does not implement speech, Tesla, OAuth, or a live database.
