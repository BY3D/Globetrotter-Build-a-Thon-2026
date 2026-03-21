/**
 * The LLM Editor Agent
 * This agent analyses the writer agent's output.
 * The output is accepted if it follows the criteria.
 * Otherwise, the editor agent asks the writer agent to rewrite the description.
 */

import { client, modelId } from "./setupAgents.js";
import { MAX_WORDS } from "./writer_agent.js";

AGENT_PROMPT = `You are a description editor.
You must ensure the description meets the following critera: 
1. The description is within ${MAX_WORDS} words. 
2. The description contains the landmark's name. 
3. The description does not have inappropriate language. 
If the description meets the critera, then explain why and print out ACCEPT.
If the description does not meet the criteria, then explain why and print out REVISE`