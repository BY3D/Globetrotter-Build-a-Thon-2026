import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";

const LLM_ALIAS = "phi-4-mini";
const LLM_SIZE = "4 GB"

// Create the Foundry Local service
console.log("Instantiate Foundry Local service")
FoundryLocalManager.create({ appName: "GlobeSpinner" });
const manager = FoundryLocalManager.instance;
await manager.startWebService();

// Download the model if it's not on disk
const catalog = manager.catalog;
const model = await catalog.getModel(LLM_ALIAS);
if (model.isCached) {
    console.log(`${LLM_ALIAS} has already been downloaded.`);
} else{
    console.log(`Download LLM ${LLM_ALIAS}, 
        may take up to ${LLM_SIZE} of disk space.`);
    await model.download();
}

// Load the model
console.log(`Loading ${LLM_ALIAS}...`);
await model.load();
const modelId = model.id;
console.log(`${modelId} is ready.`);

// OpenAI client allows communication with the LLMs.
// It's pointing to the Foundry Local service.
// However, it can point to an Azure service instead for online LLM processing
const client = new OpenAI({
  baseURL: manager.urls[0] + "/v1",
  apiKey: "foundry-local",
});

export { client, modelId, MODEL_ALIAS };