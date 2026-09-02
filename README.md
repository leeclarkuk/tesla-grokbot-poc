# tesla-grokbot-poc

Voice-first driver companion. First vehicle integration is Tesla.

Talk while driving. Inspect while parked.

The first implementation slice proves one loop: text stand-in for voice, policy with motion unknown, in-memory agent adapter, bounded task or a short refusal, spoken or text response. It does not implement speech, Tesla, OAuth, or a live database.

Programmatic entry is `createInMemoryCompanion()` in `src/application`. There is no UI.

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
