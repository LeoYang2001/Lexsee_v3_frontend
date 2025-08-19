import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import amplifyOutputs from "../amplify_outputs.json";

// Configure Amplify once
Amplify.configure(amplifyOutputs);

// Generate client once and export it
export const client = generateClient({
  schema: amplifyOutputs.data.url,
  authMode: "userPool" as any,
});

// Optional: Export the type for TypeScript
export type Client = typeof client;
