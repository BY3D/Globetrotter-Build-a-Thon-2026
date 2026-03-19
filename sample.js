import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
console.log("SDK installed successfully");

const alias = "phi-4-mini";

// 1. Create a manager and start the service
console.log("Start Local Foundry service")
FoundryLocalManager.create({ appName: "SampleJS" });
const manager = FoundryLocalManager.instance;
await manager.startWebService();

// 2. Browse the catalog
const catalog = manager.catalog;
const model = await catalog.getModel(alias);
console.log(`Model alias: ${model.alias}`);
console.log(`Model ID:    ${model.id}`);
console.log(`Cached:      ${model.isCached}`);

// 3. Download model if needed
if (!model.isCached) {
  console.log(`Downloading ${alias}...`);
  await model.download();
} else {
  console.log(`Model ${alias} is already downloaded`)
}

// 4. Load it
console.log(`\nLoading ${alias}...`);
await model.load();
console.log(`Loaded: ${model.id}`);
console.log(`Endpoint: ${manager.urls[0]}/v1`);

// Create an OpenAI client pointing to the LOCAL Foundry service
const client = new OpenAI({
  baseURL: manager.urls[0] + "/v1",   // Dynamic port - never hardcode!
  apiKey: "foundry-local",
});

// 5. Get Info
console.log(`Device Type: ${model.device_type}`);
console.log(`Execution Provider: ${model.execution_provider}`);
console.log(`Cached Size: ${model.file_size_mb}`);

// 6. Unload it
console.log(`\nUnloading ${alias}...`);
await model.unload();
console.log("Unloaded");