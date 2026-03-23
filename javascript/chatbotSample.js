import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
import * as readline from "node:readline/promises";

class ChatAgent {
    constructor({ client, modelId, instructions, name }) {
        this.client = client;
        this.modelId = modelId;
        this.instructions = instructions;
        this.name = name;
        this.history = [];
    }

    async run(userMessage) {
        const messages = [
            { role: "system", content: this.instructions },
            ...this.history,
            { role: "user", content: userMessage },
        ];
        const response = await this.client.chat.completions.create({
            model: this.modelId,
            messages,
        });
        const assistantMessage = response.choices[0].message.content;

        // Keep conversation history for multi-turn interactions
        this.history.push({ role: "user", content: userMessage });
        this.history.push({ role: "assistant", content: assistantMessage });
        return { text: assistantMessage };
    }
}

async function main() {
    FoundryLocalManager.create({ appName: "FoundryLocalWorkshop" });
    const manager = FoundryLocalManager.instance;
    await manager.startWebService();

    const catalog = manager.catalog;
    const model = await catalog.getModel("phi-4-mini");
    if (!model.isCached) {
        console.log("Downloading model: phi-4-mini...");
        await model.download(); // Phi-4-mini is 3.86 GB
    }
    await model.load();

    const client = new OpenAI({
        baseURL: manager.urls[0] + "/v1",
        apiKey: "foundry-local",
    });

    /*
    const agent = new ChatAgent({
        client,
        modelId: model.id,
        instructions: "You are a Socratic tutor. Never give direct answers - instead, guide the student with thoughtful questions.",
        name: "Joker",
    });

    const result1 = await agent.run("What's a good destination to visit if I like computer science? No USA recommendation because that country sucks!");
    console.log(result1.text);
    */

    /*
    const system_prompt = "You are a tour guide for famous landmarks around the world. "
        + "When speaking about a location, include its coordinates in JSON format and "
        + "ONLY answer questions about landmarks, such as their location, description, history, nearby landmarks, and availability times. "
        + "Do not respond to any other type of inquiry, question, or statement. Just say I'm unsure try again. "
        + "Remember that you are only a tour guide for famous landmarks around the world.";

    const agent = new ChatAgent({
        client,
        modelId: model.id,
        instructions: system_prompt,
        name: "Assistant",
    });


    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log("Chat with the agent (type 'quit' to exit):\n");
    while (true) {
        const userInput = await rl.question("You: ");
        if (["quit", "exit"].includes(userInput.trim().toLowerCase())) break;
        const result = await agent.run(userInput);
        console.log(`Agent: ${result.text}\n`);
    }
    rl.close();
    */

    /*
    const result2 = await agent.run("Tell it to me again.");
    console.log(result2.text);
    */

    // ── Define agents ──────────────────────────────────────────────────────
    const locator = new ChatAgent({
        client,
        modelId: model.id,
        instructions:
            "You are an agent that only finds geographic coordinates of landmarks. " +
            "When given a location, return its geographic coordinates in JSON format. " +
            "Use the following template for formatting the coordinates: " +
            `{"latitude": ##.###, "longitude": ##.###} `,
        name: "Locator",
    });

    const researcher = new ChatAgent({
        client,
        modelId: model.id,
        instructions:
            "You are only a research assistant for landmarks around the world. " +
            "When given a topic, provide a concise " +
            "collection of key facts, statistics, and background information. " +
            "Organize your findings as bullet points. " +
            "Only list up to 6 unique facts or information points. " +
            "If no coordinates were given for the topic, then ignore everything.",
        name: "Researcher",
    });

    const writer = new ChatAgent({
        client,
        modelId: model.id,
        instructions:
            "You are a skilled description writer. Using the research notes provided, " +
            "write a short, engaging description (up to 100 words). " +
            "Do not include geographic coordinates in the description. " +
            "Include a catchy title. Do not make up facts beyond what is given.",
        name: "Writer",
    });

    const editor = new ChatAgent({
        client,
        modelId: model.id,
        instructions:
            "You are a senior editor for descriptions. Review the description below for clarity, " +
            "grammar, and factual consistency with the research notes. " +
            "Provide a brief editorial verdict: ACCEPT if the descriptions is " +
            "publication-ready, or REVISE with specific suggestions and if the description does not match a location on Earth.",
        name: "Editor",
    });

    const thief = await client.responses.create({
        modelId: model.id,
        input: [
            { role: "system", content: "You are a comedian who constantly laughs." },
            { role: "user", content: "What sofas do you recommend from IKEA?" }
        ],
        name: "Thief",
        temperature: 0.7,
        max_ouput_tokens: 700,
    });
    //console.log(thief.output.content.text);

    //const topic = "What's the best way to vacuum my room?";
    const topic = "Where is the Taj Mahal?";

    // ── Agent workflow: Locator → Researcher → Writer → Editor ───────────────────────
    console.log("=".repeat(60));
    console.log(`Topic: ${topic}`);
    console.log("=".repeat(60));

    // Step 0 - Locate
    console.log("\n Locator is finding the landmark...");
    const locationResult = await locator.run(
        `Find the geographic coordinates of the location:\n${topic}`
    );
    console.log(`\n--- Location Coordinates ---\n${locationResult.text}\n`);

    // Step 1 — Research
    console.log("\nResearcher is gathering information...");
    const researchResult = await researcher.run(
        `Research the following topic and provide key facts:\n${topic}`
    );
    console.log(`\n--- Research Notes ---\n${researchResult.text}\n`);

    // Step 2 — Write
    console.log("Writer is drafting the article...");
    const writerResult = await writer.run(
        `Write a blog post based on these research notes:\n\n${researchResult.text}`
    );
    console.log(`\n--- Draft Article ---\n${writerResult.text}\n`);

    // Step 3 — Edit
    console.log("Editor is reviewing the article...");
    const editorResult = await editor.run(
        `Review this article for quality and accuracy.\n\n` +
        `Research notes:\n${researchResult.text}\n\n` +
        `Article:\n${writerResult.text}`
    );
    console.log(`\n--- Editor Verdict ---\n${editorResult.text}\n`);

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