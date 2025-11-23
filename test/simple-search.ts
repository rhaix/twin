
import { generateWithGoogleSearch } from "../src/services/gemini";

async function run() {
    console.log("Testing basic Google Search...\n");

    const result = await generateWithGoogleSearch(
        "What is the current price of Tesla stock?"
    );

    console.log("\nResult:", result);
}

run();
