import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";

const LLM_ALIAS = "phi-4-mini";
const LLM_SIZE = "4 GB"

console.log("Instantiate Foundry Local service")
FoundryLocalManager.create({ appName: "GlobeSpinner" });
const manager = FoundryLocalManager.instance;
await manager.startWebService();

const catalog = manager.catalog;
const model = await catalog.getModel(LLM_ALIAS);
if (model.isCached) {
    console.log(`${LLM_ALIAS} has already been downloaded.`);
} else{
    console.log(`Download LLM ${LLM_ALIAS}, 
        may take up to ${LLM_SIZE} of disk space`);
    await model.download();
}
if (!model.isCached) {
    console.log("Downloading model: phi-4-mini...");
    await model.download(); // Phi-4-mini is 3.86 GB
}
await model.load();