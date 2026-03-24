const { OpenAI } = require("openai");
const { FoundryLocalManager } = require("foundry-local-sdk");

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

let agents = {};
let initialized = false;

async function initialize() {
  if (initialized) return;

  try {
    console.log("Initializing Foundry Local Manager...");
    // Step 1: Set up Foundry Local Manager
    FoundryLocalManager.create({ appName: "GlobeTrotter" });
    const manager = FoundryLocalManager.instance;
    await manager.startWebService();

    // Step 2: Get and load model
    console.log("Loading phi-4-mini model...");
    const catalog = manager.catalog;
    const model = await catalog.getModel("phi-4-mini");
    if (!model.isCached) {
      console.log("Downloading model: phi-4-mini... (this may take a while)");
      await model.download(); // Phi-4-mini is 3.86 GB
    }
    await model.load();

    // Step 3: Set up OpenAI client
    const client = new OpenAI({
      baseURL: manager.urls[0] + "/v1",
      apiKey: "foundry-local",
    });

    // Step 4: Create agents with their instructions
    agents.parser = new LLMAgent({
      client: client,
      modelId: model.id,
      instructions: `You are an agent that only replies to a user's message if it is about the following:
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

    agents.locator = new LLMAgent({
      client: client,
      modelId: model.id,
      instructions: `You are an agent that ONLY returns geographic coordinates of points of interest. 
If the message contains the name of a location, 
Then ONLY return its geographic coordinates in JSON format. 
Do not say anything else. 
If the geographic coordinates cannot be found, then say "IDK 🫠"
Use the following template for formatting the coordinates: 
{"longitude": ##.####, "latitude": ##.####}`,
      name: "Locator",
    });

    agents.researcher = new LLMAgent({
      client: client,
      modelId: model.id,
      instructions: `You are only a researcher for points of interest. 
List 6 facts about the point of interest, landmark, or famous location. 
Do not invent facts.`,
      name: "Researcher",
    });

    agents.describer = new LLMAgent({
      client: client,
      modelId: model.id,
      instructions: `You are a writer that writes factual disciplined descriptions 
of points of interest around the world. 
Only write up to 200 words for the description. 
Do not invent facts and do not write in point form.`,
      name: "Describer",
    });

    agents.editor = new LLMAgent({
      client: client,
      modelId: model.id,
      instructions: `You are a senior editor for descriptions. Review the description for clarity, 
grammar, and factual consistency with the research notes. 
Provide a brief editorial verdict: ACCEPT if the description is 
publication-ready, or REVISE with specific suggestions and if the description does not match a location on Earth.`,
      name: "Editor",
    });

    initialized = true;
    console.log("Agents initialized successfully!");
  } catch (error) {
    console.error("Error during agent initialization:", error);
    throw error;
  }
}

async function processUserInput(userInput) {
  if (!initialized) {
    throw new Error("Agents not initialized");
  }

  try {
    // Step 1: Parser validates the input
    const parserResult = await agents.parser.respondTo(userInput);
    const parserText = parserResult.text;

    // Step 2: Locator gets coordinates
    const locatorResult = await agents.locator.respondTo(parserText);
    const locatorText = locatorResult.text;

    let coordinates = null;
    try {
      // Try to parse JSON coordinates
      coordinates = JSON.parse(locatorText);
    } catch {
      coordinates = { error: locatorText };
    }

    // Step 3: Researcher gathers facts
    const researcherResult = await agents.researcher.respondTo(parserText);
    const researcherText = researcherResult.text;

    // Step 4: Describer writes description
    const describerResult = await agents.describer.respondTo(researcherResult);
    const describerText = describerResult.text;

    // Step 5: Editor reviews and gives verdict
    const editorResult = await agents.editor.respondTo(describerResult);
    const editorText = editorResult.text;

    return {
      parser: parserText,
      locator: locatorText,
      coordinates: coordinates,
      researcher: researcherText,
      describer: describerText,
      editor: editorText,
    };
  } catch (error) {
    console.error("Error processing user input:", error);
    throw error;
  }
}

module.exports = {
  initialize,
  processUserInput,
};
