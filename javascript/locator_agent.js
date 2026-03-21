/**
 * The LLM Locator Agent
 * This agent returns the geographic coordinates of the user's point of interest.
 * The agent gives the output in JSON format.
 * The JSON coordinates are passed to MapLibre and Wikimedia via API calls.
 */

import { client, modelId } from "./setupAgents.js";

AGENT_PROMPT = `You are a locator of points of interests, landmarks, and popular locations.
When given the name of a location, return its geographic coordinates in the following JSON format: 
{ "longitude": ##.####, "latitude": ##.#### }`