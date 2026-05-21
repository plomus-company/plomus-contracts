import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/protocol/v1/base.json");
writeJson("dist/plomus-protocol.json", {
  schemaVersion: "1.0.0",
  name: "plomus-protocol",
  generatedAt: new Date().toISOString(),
  protocolVersion: base.protocolVersion ?? null,
  builtOnCommerce: base.builtOnCommerce ?? "contracts/v1",
  enums: {
    eventSources: base.eventSources ?? [],
    httpMethods: base.httpMethods ?? [],
    telegramCommandKinds: base.telegramCommandKinds ?? [],
    telegramCommandStatuses: base.telegramCommandStatuses ?? [],
  },
  contracts: {
    endpoints: readJson("contracts/protocol/v1/endpoints.json").endpoints ?? [],
    syncEvent: readJson("contracts/protocol/v1/sync-event.json"),
    payloads: readJson("contracts/protocol/v1/payloads.json").payloads ?? [],
    telegram: readJson("contracts/protocol/v1/telegram.json"),
  },
});
console.log("built dist/plomus-protocol.json");
