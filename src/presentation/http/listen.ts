import { createCompanionHttpServer, readBindAddress } from "./server.js";

const { host, port } = readBindAddress();
const server = createCompanionHttpServer();

server.listen(port, host, () => {
  process.stdout.write(
    [
      `Companion HTTP presentation adapter on http://${host}:${port}`,
      "POST /utterance { text, capturedAt } → { text }. GET /health.",
      `Bind is ${host}. The iPhone must reach this machine on the hotspot or LAN.`,
      "Loopback (127.0.0.1) is wrong for a phone on a hotspot.",
      "Do not expose this listener to the public internet.",
      "Override with COMPANION_HOST and COMPANION_PORT.",
      "",
    ].join("\n"),
  );
});
