import { writeJson } from "./read-json.mjs";
import { bundle, transactionRegistry } from "./registries.mjs";

// Payment / transaction contracts: machine spending budgets (x402-style) and
// settlement/commission/refund terms. EXPERIMENTAL.
writeJson("dist/plomus-transaction.json", bundle("transaction", {
  transaction: transactionRegistry(),
}));
console.log("built dist/plomus-transaction.json");
