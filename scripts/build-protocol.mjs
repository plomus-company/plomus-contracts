import { readJson, writeJson } from "./read-json.mjs";

const base = readJson("contracts/protocol/base.json");
writeJson("dist/plomus-protocol.json", {
  schemaVersion: "1.0.0",
  name: "plomus-protocol",
  generatedAt: new Date().toISOString(),
  protocolVersion: base.protocolVersion ?? null,
  builtOnCommerce: base.builtOnCommerce ?? "contracts/commerce",
  enums: {
    eventSources: base.eventSources ?? [],
    httpMethods: base.httpMethods ?? [],
    telegramCommandKinds: base.telegramCommandKinds ?? [],
    telegramCommandStatuses: base.telegramCommandStatuses ?? [],
  },
  contracts: {
    endpoints: readJson("contracts/protocol/endpoints.json").endpoints ?? [],
    syncEvent: readJson("contracts/protocol/sync-event.json"),
    payloads: readJson("contracts/protocol/payloads.json").payloads ?? [],
    telegram: readJson("contracts/protocol/telegram.json"),
  },
});
console.log("built dist/plomus-protocol.json");
