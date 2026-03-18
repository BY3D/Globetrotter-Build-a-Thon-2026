import { FoundryLocalManager } from "foundry-local-sdk";
console.log("SDK installed successfully");

const alias = "phi-4-mini";

// Create a manager and start the service
FoundryLocalManager.create({ appName: "SDKDemo" });
const manager = FoundryLocalManager.instance;
await manager.startWebService();

// Browse the catalog
const catalog = manager.catalog;
const model = await catalog.getModel(alias);
console.log(`Model alias: ${model.alias}`);
console.log(`Model ID:    ${model.id}`);
console.log(`Cached:      ${model.isCached}`);

if (!model.isCached) {
  console.log(`Downloading ${alias}...`);
  await model.download();
}

console.log(`Loading ${alias}...`);
await model.load();
console.log(`Loaded: ${model.id}`);
console.log(`Endpoint: ${manager.urls[0]}/v1`);
console.log(`Unload: ${model.id}`);
await model.unload();