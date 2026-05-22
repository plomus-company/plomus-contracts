import { readContract, readDoc } from "./group.mjs";
import { readJson, writeJson } from "./read-json.mjs";

const base = readDoc("protocol-base");
writeJson("dist/plomus-protocol.json", {
  schemaVersion: "1.0.0",
  name: "plomus-protocol",
  generatedAt: new Date().toISOString(),
  protocolVersion: base.protocolVersion ?? null,
  builtOnCommerce: base.builtOnCommerce ?? "commerce",
  enums: {
    eventSources: base.eventSources ?? [],
    httpMethods: base.httpMethods ?? [],
    telegramCommandKinds: base.telegramCommandKinds ?? [],
    telegramCommandStatuses: base.telegramCommandStatuses ?? [],
  },
  contracts: {
    endpoints: readContract("protocol-endpoints", "endpoints"),
    syncEvent: readDoc("protocol-sync-event"),
    payloads: readContract("protocol-payloads", "payloads"),
    telegram: readDoc("protocol-telegram"),
  },
});
console.log("built dist/plomus-protocol.json");
