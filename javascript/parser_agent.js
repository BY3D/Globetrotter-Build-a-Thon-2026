/**
 * The LLM Parser Agent
 * This agent parses the user's input to make it more legible for other agents
 * This agent also checks if the user's input is relevant to points of interest
 * If not relevant, ask the user for a relevant input
 */

import { client, modelId } from "./setupAgents.js";

const AGENT_PROMPT = `Your role is to parse the user's text input.
Users are only allowed to either write about the following two things:
1. Ask questions about landmarks, points of interest, and popular locations.
2. Statements about landmarks, points of interest, and popular locations.
For any other question or statement, tell the user "I cannot answer your query. Ask me about landmarks."
If the user's input text is valid, then capitalise the name of the landmark, point of interest, or popular location.`;

