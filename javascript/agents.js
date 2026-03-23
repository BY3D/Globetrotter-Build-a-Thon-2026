import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
// import * as readline from "node:readline/promises";

class LLMAgent {
    constructor({ client, modelId, instructions, name }) {
        this.client = client;
        this.modelId = modelId;
        this.instructions = instructions;
        this.name = name;
        this.history = [];
    }

    async respondTo(userPrompt) {
        const messages = [
            { role: "system", content: this.instructions },
            ...this.history,
            { role: "user", content: userPrompt },
        ];
        const response = await this.client.chat.completions.create({
            model: this.modelId,
            messages,
        });
        const assistantMessage = response.choices[0].message.content;

        // Keep conversation history for multi-turn interactions
        this.history.push({ role: "user", content: userPrompt });
        this.history.push({ role: "assistant", content: assistantMessage });
        return { text: assistantMessage };
    }
}

async function main() {
    // Step 1
    FoundryLocalManager.create({ appName: "GlobeTrotter" });
    const manager = FoundryLocalManager.instance;
    await manager.startWebService();

    // Step 2
    const catalog = manager.catalog;
    const model = await catalog.getModel("phi-4-mini");
    if (!model.isCached) {
        console.log("Downloading model: phi-4-mini...");
        await model.download(); // Phi-4-mini is 3.86 GB
    }
    await model.load();

    // Step 3
    const client = new OpenAI({
        baseURL: manager.urls[0] + "/v1",
        apiKey: "foundry-local",
    });

    /**
     * Step 5
     * Define the LLM Agents:
     * - Parser
     * - Locator
     * - Researcher
     * - Describer
     * - Editor
     */
    const parser = new ChatAgent({
        client: client,
        modelId: model.id,
        instructions:
            "You are an agent that parses a user's message. " +
            "If you find in the user's message " +
            "a point of interest, famous location, or landmark, " +
            "then capitalise the name of that place.",
        name: "Parser",
    });

    const locator = new ChatAgent({
        client: client,
        modelId: model.id,
        instructions:
            "You are an agent that only finds geographic coordinates of points of interest. " +
            "When given the name of a location, return its geographic coordinates in JSON format. " +
            "Use the following template for formatting the coordinates: " +
            `{"latitude": ##.####, "longitude": ##.####} `,
        name: "Locator",
    });

    const researcher = new ChatAgent({
        client: client,
        modelId: model.id,
        instructions:
            "You are an agent that only finds geographic coordinates of points of interest. " +
            "When given the name of a location, return its geographic coordinates in JSON format. " +
            "Use the following template for formatting the coordinates: " +
            `{"latitude": ##.####, "longitude": ##.####} `,
        name: "Researcher",
    });

    const describer = new ChatAgent({
        client: client,
        modelId: model.id,
        instructions:
            "You are a writer that writes factual disciplined descriptions " +
            "of points of interest around the world. " +
            "Only write up to 150 words for the description",
        name: "Describer",
    });

    const editor = new ChatAgent({
        client: client,
        modelId: model.id,
        instructions:
            "You are a senior editor for descriptions. Review the description below for clarity, " +
            "grammar, and factual consistency with the research notes. " +
            "Provide a brief editorial verdict: ACCEPT if the descriptions is " +
            "publication-ready, or REVISE with specific suggestions and if the description does not match a location on Earth.",
        name: "Editor",
    });

    // Step 6
    // Run the LLMs following a user's response.
    

}

main();