/**
 * The LLM Writer Agent
 * This agent writes the description of the point of interest given by the user
 */

import { client, modelId } from "./setupAgents.js";

const MAX_WORDS = 100;

AGENT_PROMPT = `You are a writer who describes landmarks. 
Write a description that is at most ${MAX_WORDS} words using only the information you are given. `;

export {MAX_WORDS}