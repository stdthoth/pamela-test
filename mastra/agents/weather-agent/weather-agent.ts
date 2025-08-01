// This serves as an example, can be deleted later.

import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../weather-agent/weather-tool";
import { vertex } from "@ai-sdk/google-vertex";


const name = "Weather Agent";
const instructions = `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn’t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`;

export const weatherAgent = new Agent({
	name,
	instructions,
	model: vertex('gemini-1.5-pro'),
	tools: { weatherTool },
});
