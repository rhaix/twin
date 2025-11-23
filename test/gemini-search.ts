
import { generateStructuredSearch } from "../src/services/gemini";
import { z } from "zod";

const matchSchema = z.object({
    winner: z.string().describe("The name of the winner."),
    score: z.string().optional().describe("The final score."),
    final_match_score: z.string().optional().describe("The final score."),
    goals: z.array(z.string().nullable()).optional().describe("The goals scored."),
    scorers: z.array(z.string().nullable()).optional().describe("The name of the scorer.")
});

async function run() {
    console.log("Testing generateStructuredSearch...");
    const result = await generateStructuredSearch(
        "Search for all details for the latest Euro final match.",
        matchSchema
    );
    console.log("Result:", JSON.stringify(result, null, 2));
}

run();
