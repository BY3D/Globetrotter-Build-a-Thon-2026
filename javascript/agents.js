import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as readline from "node:readline/promises";

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
    const parser = new LLMAgent({
        client: client,
        modelId: model.id,
        instructions:
            `You are an agent that only replies to a user's message if it is about the following:
            1. points of interest
            2. landmarks
            3. famous locations
            Limit your response to 250 words.
            If you do not find in the user's message 
            a point of interest, famous location, or landmark,
            then ask the user to clarify what he or she said.
            Do not answer any other message.
            Never apologise.`,
        name: "Parser",
    });

    const locator = new LLMAgent({
        client: client,
        modelId: model.id,
        instructions:
            `You are an agent that ONLY returns geographic coordinates of points of interest. 
            If the message contains the name of a location, 
            Then ONLY return its geographic coordinates in JSON format. 
            Do not say anything else. 
            If the geographic coordinates cannot be found, then say "IDK 🫠"
            Use the following template for formatting the coordinates: " 
            {"longitude": ##.####, "latitude": ##.####}` ,
        name: "Locator",
    });

    const researcher = new LLMAgent({
        client: client,
        modelId: model.id,
        instructions:
            `You are only a researcher for points of interest. 
            List 6 facts about the point of interest, landmark, or famous location. 
            Do not invent facts.`,
        name: "Researcher",
    });

    const describer = new LLMAgent({
        client: client,
        modelId: model.id,
        instructions:
            `You are a writer that writes factual disciplined descriptions 
            of points of interest around the world. 
            Only write up to 200 words for the description. 
            Do not invent facts and do not write in point form.`,
        name: "Describer",
    });

    const editor = new LLMAgent({
        client: client,
        modelId: model.id,
        instructions:
            `You are a senior editor for descriptions. Review the description for clarity, 
            grammar, and factual consistency with the research notes. 
            Provide a brief editorial verdict: ACCEPT if the descriptions is 
            publication-ready, or REVISE with specific suggestions and if the description does not match a location on Earth.`,
        name: "Editor",
    });

    // Step 6
    // Run the LLMs following a user's response.
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Step 6.1 - Load MapLibre GL
    const mapElement = document.getElementById("MapLibre")
    const map = new maplibregl.Map({
        container: 'MapLibre',
        style: 'https://demotiles.maplibre.org/style.json', // stylesheet location
        center: [0, 0], // starting position [longitude, latitude]
        zoom: 2 // starting zoom
    });
    map.on('style.load', () => {
        map.setProjection({
            type: 'globe', // Set projection to globe
        });
    });
    const marker = new maplibregl.Marker()
        .setLngLat([0, 0]) // [longitude, latitude]
        .addTo(map);
    mapElement.append(map);

    console.log("Chat with the agent (type 'quit' to exit):\n");
    while (true) {
        const userInput = await rl.question("You: ");
        if (["quit", "exit"].includes(userInput.trim().toLowerCase())) break;

        const parserResult = await parser.respondTo(userInput);
        console.log(`Parser Agent: ${parserResult.text}\n`);

        const locatorResult = await locator.respondTo(parserResult);
        console.log(`Locator Agent: ${locatorResult.text}\n`);
        let poi = JSON.parse(locatorResult.text);
        map.flyTo({ 
            center: [poi.longitude, poi.latitude],
            essential: true
        });

        const researcherResult = await researcher.respondTo(parserResult);
        console.log(`Researcher Agent: \n${researcherResult.text}\n`);

        const describerResult = await describer.respondTo(researcherResult);
        console.log(`Describer Agent: ${describerResult.text}\n`);

        const editorResult = await editor.respondTo(describerResult);
        console.log(`Editor Agent: ${editorResult.text}\n`);
    }
    rl.close();

    console.log("=".repeat(60));
    console.log("Multi-agent workflow complete!");

    console.log(`\nUnloading ${model.alias}...`);
    await model.unload();
    console.log("Unloaded");

    console.log("Ending the service");
    manager.stopWebService();
    console.log("Service has ended");

}

main();