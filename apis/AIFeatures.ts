const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

import OpenAI from "openai";

// Type for AI provider
export type AIProvider = "deepseek" | "openai";

// Default provider
const DEFAULT_AI_PROVIDER: AIProvider = "openai";

const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface WordDefinition {
  word: string;
  meanings: Array<{
    definition: string;
    partOfSpeech: string;
    synonyms: string[];
    antonyms: string[];
  }>;
  phonetics: {
    text: string;
  };
  review_interval: number;
  ease_factor: number;
}

const deepseekClient = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const openaiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Helper function to get the appropriate client

// Helper function to get the appropriate client based on provider
const getAIClient = (provider: AIProvider): OpenAI | null => {
  if (provider === "deepseek") {
    return deepseekClient;
  } else {
    return openaiClient;
  }
};
// Helper function to get the appropriate model
const getAIModel = (provider: AIProvider): string => {
  return provider === "deepseek" ? "deepseek-chat" : "gpt-4.1-2025-04-14";
};

// Helper function to get API key for provider
const getAPIKey = (provider: AIProvider): string | undefined => {
  return provider === "deepseek" ? DEEPSEEK_API_KEY : OPENAI_API_KEY;
};

// Add callback interface
interface FetchDefinitionCallbacks {
  onAIStart?: () => void;
  onAIEnd?: () => void;
  onSourceChange?: (source: "dictionary" | "ai") => void;
}

// Format validation function (same as before)
const checkFormat = (data: any): data is WordDefinition => {
  try {
    if (!data || typeof data !== "object") {
      console.warn("❌ Format check failed: data is not an object");
      return false;
    }

    if (typeof data.word !== "string" || !data.word.trim()) {
      console.warn(
        "❌ Format check failed: missing or invalid 'word' property",
      );
      return false;
    }

    if (!Array.isArray(data.meanings) || data.meanings.length === 0) {
      console.warn(
        "❌ Format check failed: 'meanings' must be a non-empty array",
      );
      return false;
    }

    if (!data.phonetics || typeof data.phonetics !== "object") {
      console.warn(
        "❌ Format check failed: missing or invalid 'phonetics' object",
      );
      return false;
    }

    if (typeof data.phonetics.text !== "string") {
      console.warn("❌ Format check failed: 'phonetics.text' must be a string");
      return false;
    }

    for (let i = 0; i < data.meanings.length; i++) {
      const meaning = data.meanings[i];

      if (
        typeof meaning.definition !== "string" ||
        !meaning.definition.trim()
      ) {
        console.warn(
          `❌ Format check failed: meaning[${i}].definition is missing or invalid`,
        );
        return false;
      }

      if (
        typeof meaning.partOfSpeech !== "string" ||
        !meaning.partOfSpeech.trim()
      ) {
        console.warn(
          `❌ Format check failed: meaning[${i}].partOfSpeech is missing or invalid`,
        );
        return false;
      }

      if (!Array.isArray(meaning.synonyms)) {
        console.warn(
          `❌ Format check failed: meaning[${i}].synonyms must be an array`,
        );
        return false;
      }

      if (!Array.isArray(meaning.antonyms)) {
        console.warn(
          `❌ Format check failed: meaning[${i}].antonyms must be an array`,
        );
        return false;
      }

      if (!meaning.synonyms.every((s: any) => typeof s === "string")) {
        console.warn(
          `❌ Format check failed: meaning[${i}].synonyms must contain only strings`,
        );
        return false;
      }

      if (!meaning.antonyms.every((a: any) => typeof a === "string")) {
        console.warn(
          `❌ Format check failed: meaning[${i}].antonyms must contain only strings`,
        );
        return false;
      }
    }

    console.log("✅ Format check passed");
    return true;
  } catch (error) {
    console.warn("❌ Format check failed with error:", error);
    return false;
  }
};

export async function fetchDefinition(
  word: string,
  callbacks?: FetchDefinitionCallbacks,
  provider: AIProvider = DEFAULT_AI_PROVIDER,
): Promise<WordDefinition | null> {
  try {
    const response = await fetch(
      `${DICTIONARY_API_URL}${encodeURIComponent(word)}`,
    );

    if (!response.ok) {
      // Don't throw error for 404, just log and try AI fallback
      if (response.status === 404) {
        console.log(
          `📝 Word "${word}" not found in dictionary (404), trying AI fallback...`,
        );
      } else {
        console.warn(
          `⚠️ Dictionary API failed with status: ${response.status}, trying AI fallback...`,
        );
      }

      // Try AI fallback for any non-ok response
      if (DEEPSEEK_API_KEY) {
        console.log("📡 Trying AI generation due to API failure...");
        callbacks?.onAIStart?.();
        callbacks?.onSourceChange?.("ai");

        const result = await generateDefinition(word, provider);

        callbacks?.onAIEnd?.();
        return result;
      }

      // Return null instead of throwing error
      console.warn(
        `❌ No AI fallback available and API failed with status: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(
        `📝 No data received for word "${word}", trying AI fallback...`,
      );

      // Try AI fallback
      if (DEEPSEEK_API_KEY) {
        console.log("📡 Trying AI generation due to empty response...");
        callbacks?.onAIStart?.();
        callbacks?.onSourceChange?.("ai");

        const result = await generateDefinition(word);

        callbacks?.onAIEnd?.();
        return result;
      }

      console.warn("❌ No AI fallback available and no data received");
      return null;
    }

    const firstEntry = data[0];

    // Extract phonetics
    const phoneticText =
      firstEntry.phonetic ||
      firstEntry.phonetics?.find((p: any) => p.text)?.text ||
      "";

    // Extract and transform meanings
    const meanings =
      firstEntry.meanings?.map((meaning: any) => ({
        definition: meaning.definitions?.[0]?.definition || "",
        partOfSpeech: meaning.partOfSpeech || "",
        synonyms: meaning.synonyms || meaning.definitions?.[0]?.synonyms || [],
        antonyms: meaning.antonyms || meaning.definitions?.[0]?.antonyms || [],
      })) || [];

    const transformedData = {
      word: firstEntry.word,
      meanings,
      phonetics: {
        text: phoneticText,
      },
      review_interval: 1,
      ease_factor: 2.5,
    };

    // Check if the transformed data matches our required format
    if (checkFormat(transformedData)) {
      console.log("✅ Dictionary API response format is valid");
      callbacks?.onSourceChange?.("dictionary");
      return transformedData;
    } else {
      console.log(
        "⚠️ Dictionary API response format is invalid, trying AI generation...",
      );

      // Try AI fallback due to format issues
      if (DEEPSEEK_API_KEY) {
        console.log("📡 Generating definition with AI due to format issues...");
        callbacks?.onAIStart?.();
        callbacks?.onSourceChange?.("ai");

        const result = await generateDefinition(word);

        callbacks?.onAIEnd?.();
        return result;
      }

      console.warn("❌ No AI fallback available and format is invalid");
      return null;
    }
  } catch (error) {
    // Catch any network or parsing errors
    console.log(`⚠️ Network error fetching definition for "${word}":`, error);

    // Try AI fallback due to error
    if (DEEPSEEK_API_KEY) {
      console.log("📡 Trying AI generation due to network error...");
      callbacks?.onAIStart?.();
      callbacks?.onSourceChange?.("ai");

      const result = await generateDefinition(word);

      callbacks?.onAIEnd?.();
      return result;
    }

    console.warn("❌ No AI fallback available and network error occurred");
    return null;
  }
}

export const generateDefinition = async (
  word: string,
  provider: AIProvider = DEFAULT_AI_PROVIDER,
): Promise<WordDefinition | null> => {
  const apiKey = getAPIKey(provider);

  if (!apiKey) {
    console.warn(
      `❌ ${provider.toUpperCase()}_API_KEY not available for AI generation`,
    );
    return null;
  }
  try {
    const systemPrompt = `
      You are a dictionary API.  
      The user will provide a word, and you must return its definition strictly in JSON format.  
      Follow this schema exactly:

      {
        "word": "<the word>",
        "meanings": [
          {
            "definition": "<definition text>",
            "partOfSpeech": "<part of speech>",
            "synonyms": ["<optional synonyms>"],
            "antonyms": ["<optional antonyms>"]
          }
        ],
        "phonetics": {
          "text": "<IPA phonetic transcription>"
        }
      }

      Rules:
      - Always include "word", "meanings", and "phonetics".
      - Meanings must be an array, even if there is only one.
      - Synonyms and antonyms must be arrays (can be empty).
      - Respond with **only JSON**, no extra text.
    `;

    const client = getAIClient(provider);

    if (!client) {
      console.error("❌ AI client is not available. API key is missing.");
      return null;
    }

    const model = getAIModel(provider);

    console.log(
      `🤖 Using ${provider === "deepseek" ? "DeepSeek" : "OpenAI"} for definition generation`,
    );
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: word },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) {
      console.error("❌ AI response content is null or empty");
      return null;
    }

    const data = JSON.parse(raw);

    // Validate AI response format
    if (checkFormat(data)) {
      console.log("✅ AI generated definition format is valid");
      return data;
    } else {
      console.error("❌ AI generated definition has invalid format");
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating definition with AI:", error);
    return null;
  }
};

// Add these interfaces after the existing WordDefinition interface
interface ConversationItem {
  speaker: string;
  message: string;
  tokens: string[];
}

export interface ConversationResponse {
  word: string;
  conversation: ConversationItem[];
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  scenario?: string;
  vocabulary_focus?: string[];
}

// Add conversation format validation function
const checkConversationFormat = (data: any): data is ConversationResponse => {
  try {
    if (!data || typeof data !== "object") {
      console.warn(
        "❌ Conversation format check failed: data is not an object",
      );
      return false;
    }

    if (typeof data.word !== "string" || !data.word.trim()) {
      console.warn(
        "❌ Conversation format check failed: missing or invalid 'word' property",
      );
      return false;
    }

    if (!Array.isArray(data.conversation) || data.conversation.length === 0) {
      console.warn(
        "❌ Conversation format check failed: 'conversation' must be a non-empty array",
      );
      return false;
    }

    if (typeof data.context !== "string" || !data.context.trim()) {
      console.warn(
        "❌ Conversation format check failed: missing or invalid 'context' property",
      );
      return false;
    }

    if (!["beginner", "intermediate", "advanced"].includes(data.difficulty)) {
      console.warn(
        "❌ Conversation format check failed: invalid 'difficulty' value",
      );
      return false;
    }

    // Validate each conversation item
    for (let i = 0; i < data.conversation.length; i++) {
      const item = data.conversation[i];

      if (typeof item.speaker !== "string" || !item.speaker.trim()) {
        console.warn(
          `❌ Conversation format check failed: conversation[${i}].speaker is missing or invalid`,
        );
        return false;
      }

      if (typeof item.message !== "string" || !item.message.trim()) {
        console.warn(
          `❌ Conversation format check failed: conversation[${i}].message is missing or invalid`,
        );
        return false;
      }

      if (!Array.isArray(item.tokens)) {
        console.warn(
          `❌ Conversation format check failed: conversation[${i}].tokens must be an array`,
        );
        return false;
      }

      if (!item.tokens.every((token: any) => typeof token === "string")) {
        console.warn(
          `❌ Conversation format check failed: conversation[${i}].tokens must contain only strings`,
        );
        return false;
      }
    }

    console.log("✅ Conversation format check passed");
    return true;
  } catch (error) {
    console.warn("❌ Conversation format check failed with error:", error);
    return false;
  }
};

// Tokenization function
function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text.match(/<[^>]+>|[\w'-]+|[.,\s]/g) || [];
}

// Main conversation fetching function
export const fetchConversation = async (
  word: string,
  context: string = "general conversation",
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
  definition?: string,
  partOfSpeech?: string,
  provider: AIProvider = DEFAULT_AI_PROVIDER,
): Promise<ConversationResponse | null> => {
  const apiKey = getAPIKey(provider);

  if (!apiKey) {
    console.warn(
      `❌ ${provider.toUpperCase()}_API_KEY not available for conversation generation`,
    );
    return null;
  }

  if (!word) {
    console.warn("❌ No word provided for conversation generation");
    return null;
  }

  try {
    console.log(
      `📱 Generating conversation for word: "${word}" with context: "${context}"${
        definition ? `, definition: "${definition}"` : ""
      }${partOfSpeech ? `, part of speech: "${partOfSpeech}"` : ""}`,
    );

    // Build contextual information for the prompt
    const wordContext = [];
    if (definition) {
      wordContext.push(`Definition: ${definition}`);
    }
    if (partOfSpeech) {
      wordContext.push(`Part of speech: ${partOfSpeech}`);
    }
    const wordContextString =
      wordContext.length > 0
        ? `\n\nWord context:\n${wordContext.join("\n")}`
        : "";

    const systemPrompt = `
      You are a language teacher creating educational conversation examples.
      The user will provide a word and context, and you must return a natural conversation strictly in JSON format.
      Follow this schema exactly:

      {
        "word": "<the word>",
        "conversation": [
          {
            "speaker": "Person A",
            "message": "<natural sentence using the word>",
            "tokens": ["<tokenized>", "version", "of", "the", "message"]
          },
          {
            "speaker": "Person B", 
            "message": "<natural response>",
            "tokens": ["<tokenized>", "version", "of", "the", "response"]
          }
        ],
        "context": "<description of the conversation setting>",
        "difficulty": "beginner|intermediate|advanced",
        "scenario": "<optional: specific scenario description>",
        "vocabulary_focus": ["<optional>", "related", "vocabulary"]
      }

      Rules:
      - Create 4-6 natural conversation exchanges
      - Use the target word at least twice in different contexts
      - If definition and/or part of speech are provided, ensure the word usage matches exactly
      - Make the conversation realistic and educational
      - Tokenize messages by splitting on words, punctuation, and spaces
      - Include context-appropriate vocabulary
      - Match the requested difficulty level
      - Respond with **only JSON**, no extra text
    `;

    const userPrompt = `
      Create a conversation using the word "${word}" in the context of "${context}" at ${difficulty} level.
      Make it natural and educational, showing different uses of the word.${wordContextString}
      
      ${
        definition && partOfSpeech
          ? `Important: Use "${word}" specifically as a ${partOfSpeech} with the meaning: ${definition}`
          : definition
            ? `Important: Use "${word}" with the meaning: ${definition}`
            : partOfSpeech
              ? `Important: Use "${word}" as a ${partOfSpeech}`
              : ""
      }
    `;

    const client = getAIClient(provider);

    if (!client) {
      console.error("❌ AI client is not available. API key is missing.");
      return null;
    }

    const model = getAIModel(provider);

    console.log(
      `🤖 Using ${provider === "deepseek" ? "DeepSeek" : "OpenAI"}: ${model} for conversation generation`,
    );

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) {
      console.error("❌ AI conversation response content is null or empty");
      return null;
    }

    const data = JSON.parse(raw);

    // Post-process to ensure tokens are properly generated if missing
    if (data && data.conversation) {
      data.conversation = data.conversation.map((item: any) => ({
        ...item,
        tokens:
          item.tokens && item.tokens.length > 0
            ? item.tokens
            : tokenizeText(item.message),
      }));
    }

    // Validate AI response format
    if (checkConversationFormat(data)) {
      console.log("✅ AI generated conversation format is valid");
      return data;
    } else {
      console.error("❌ AI generated conversation has invalid format");
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating conversation with AI:", error);
    return null;
  }
};

// Specialized conversation functions
export const fetchCasualConversation = async (
  word: string,
  definition?: string,
  partOfSpeech?: string,
): Promise<ConversationResponse | null> => {
  return fetchConversation(
    word,
    "casual daily conversation",
    "intermediate",
    definition,
    partOfSpeech,
  );
};

export const fetchBusinessConversation = async (
  word: string,
  definition?: string,
  partOfSpeech?: string,
): Promise<ConversationResponse | null> => {
  return fetchConversation(
    word,
    "business meeting",
    "advanced",
    definition,
    partOfSpeech,
  );
};

export const fetchAcademicConversation = async (
  word: string,
  definition?: string,
  partOfSpeech?: string,
): Promise<ConversationResponse | null> => {
  return fetchConversation(
    word,
    "academic discussion",
    "advanced",
    definition,
    partOfSpeech,
  );
};

export const fetchSocialConversation = async (
  word: string,
  definition?: string,
  partOfSpeech?: string,
): Promise<ConversationResponse | null> => {
  return fetchConversation(
    word,
    "social gathering",
    "intermediate",
    definition,
    partOfSpeech,
  );
};

// Quick conversation fetch with simplified prompt
export const fetchQuickConversation = async (
  word: string,
  definition?: string,
  partOfSpeech?: string,
  provider: AIProvider = DEFAULT_AI_PROVIDER,
): Promise<ConversationResponse | null> => {
  const apiKey = getAPIKey(provider);

  if (!apiKey) {
    console.warn(
      `❌ ${provider.toUpperCase()}_API_KEY not available for quick conversation generation`,
    );
    return null;
  }

  if (!word) {
    console.warn("❌ No word provided for quick conversation generation");
    return null;
  }

  try {
    console.log(
      `⚡ Quick generating conversation for word: "${word}"${
        definition ? `, definition: "${definition}"` : ""
      }${partOfSpeech ? `, part of speech: "${partOfSpeech}"` : ""}`,
    );

    // Build contextual information for the prompt
    const wordContext = [];
    if (definition) {
      wordContext.push(`Definition: ${definition}`);
    }
    if (partOfSpeech) {
      wordContext.push(`Part of speech: ${partOfSpeech}`);
    }
    const wordContextString =
      wordContext.length > 0
        ? `\n\nWord context:\n${wordContext.join("\n")}`
        : "";

    const systemPrompt = `
      Create a simple conversation example using a specific word.
      Return only JSON in this exact format:

      {
        "word": "<the word>",
        "conversation": [
          {
            "speaker": "Person A",
            "message": "<sentence with the word>",
            "tokens": ["split", "message", "into", "tokens"]
          },
          {
            "speaker": "Person B",
            "message": "<response sentence>", 
            "tokens": ["split", "response", "into", "tokens"]
          },
          {
            "speaker": "Person A",
            "message": "<another sentence with the word>",
            "tokens": ["split", "sentence", "into", "tokens"]
          }
        ],
        "context": "everyday conversation",
        "difficulty": "intermediate"
      }

      Rules:
      - Make 4-6 natural exchanges
      - Use the target word at least twice
      - If definition and/or part of speech are provided, ensure the word usage matches exactly
      - Keep it simple and clear
      - Split each message into word/punctuation tokens
      - Only return JSON, no extra text
    `;

    const userPrompt = `Create a simple conversation using the word "${word}"${wordContextString}
    
    ${
      definition && partOfSpeech
        ? `Important: Use "${word}" specifically as a ${partOfSpeech} with the meaning: ${definition}`
        : definition
          ? `Important: Use "${word}" with the meaning: ${definition}`
          : partOfSpeech
            ? `Important: Use "${word}" as a ${partOfSpeech}`
            : ""
    }`;

    const client = getAIClient(provider);

    if (!client) {
      console.error("❌ AI client is not available. API key is missing.");
      return null;
    }

    const model = getAIModel(provider);

    console.log(
      `🤖 Using ${provider === "deepseek" ? "DeepSeek" : "OpenAI"} for quick conversation generation`,
    );

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) {
      console.error(
        "❌ AI quick conversation response content is null or empty",
      );
      return null;
    }

    const data = JSON.parse(raw);

    // Ensure tokens are properly generated if missing
    if (data && data.conversation) {
      data.conversation = data.conversation.map((item: any) => ({
        ...item,
        tokens:
          item.tokens && item.tokens.length > 0
            ? item.tokens
            : tokenizeText(item.message),
      }));
    }

    // Validate format
    if (checkConversationFormat(data)) {
      console.log("✅ Quick conversation format is valid");
      return data;
    } else {
      console.error("❌ Quick conversation has invalid format");
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating quick conversation:", error);
    return null;
  }
};

// Batch conversation generation
export const fetchMultipleConversations = async (
  word: string,
  contexts: string[] = ["casual", "business", "academic"],
  definition?: string,
  partOfSpeech?: string,
): Promise<ConversationResponse[]> => {
  const results = await Promise.allSettled(
    contexts.map((context) =>
      fetchConversation(
        word,
        context,
        "intermediate",
        definition,
        partOfSpeech,
      ),
    ),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<ConversationResponse> =>
        result.status === "fulfilled" && result.value !== null,
    )
    .map((result) => result.value);
};

import { SQLiteDatabase } from "expo-sqlite";

/**
 * Fetches the phonetic spelling for a specific word.
 * @param db The SQLite database instance from useSQLiteContext()
 * @param word The exact word to look up
 * @returns The phonetic string or null if not found
 */
// export const fetchPhoneticTextFromDb = async (
//   db: SQLiteDatabase,
//   word: string,
// ): Promise<string | null> => {
//   try {
//     // We use a simple equal sign (=) here instead of MATCH
//     // because we want the exact phonetic for a specific word.
//     const result = await db.getFirstAsync<{ phonetic: string }>(
//       "SELECT phonetic FROM dictionary WHERE word = ? LIMIT 1",
//       [word.toLowerCase().trim()],
//     );

//     return result ? result.phonetic : null;
//   } catch (error) {
//     console.error("Error fetching phonetic:", error);
//     return null;
//   }
// };

export const generatePhoneticText = async (
  word: string,
  provider: AIProvider = DEFAULT_AI_PROVIDER,
): Promise<string> => {
  const apiKey = getAPIKey(provider);

  if (!apiKey || !word) {
    console.warn(
      `❌ Missing ${!apiKey ? "API Key" : "Word"} for phonetic generation`,
    );
    return "";
  }

  const systemPrompt = `
    You are a linguistic expert. 
    The user will provide a word, and you must return its International Phonetic Alphabet (IPA) pronunciation.
    Return the result strictly in JSON format with a single key "phonetic".
    Example: { "phonetic": "/səˈleɪ.ʃəs/" }
  `;

  const client = getAIClient(provider);
  if (!client) {
    console.error("❌ AI client is not available. API key is missing.");

    return "";
  }

  const model = getAIModel(provider);

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: word },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) return "";

    const data = JSON.parse(raw);

    // Return only the string value of the phonetic key
    return data.phonetic || "";
  } catch (error) {
    console.error("❌ Error generating phonetic text:", error);
    return "";
  }
};

export async function translateMeanings(
  meanings: { definition: string; partOfSpeech: string }[],
  provider: AIProvider = DEFAULT_AI_PROVIDER,
  targetLang: string = "Chinese",
): Promise<{ definition: string; partOfSpeech: string }[]> {
  if (!meanings.length) return [];

  console.log(
    "calling translateMeanings with parameters :",
    JSON.stringify({ meanings, provider, targetLang }),
  );

  const systemPrompt = `You are a professional translator. Translate these word definitions to ${targetLang}.
  
Return ONLY a JSON object in this exact format:
{
  "translations": [
    {
      "definition": "<translated definition>",
      "partOfSpeech": "<part of speech in ${targetLang}>"
    }
  ]
}

Rules:
- Translate each definition accurately and naturally
- Preserve the part of speech in ${targetLang}
- Return valid JSON only, no additional text
- Each translation object must have "definition" and "partOfSpeech" keys
- Return exactly as many translations as provided in the input`;

  const client = getAIClient(provider);

  if (!client) {
    console.error("❌ AI client is not available. API key is missing.");
    return [];
  }

  const model = getAIModel(provider);
  if (!model) {
    console.error("❌ AI model is not available.");
    return [];
  }
  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(meanings) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) return [];

    const data = JSON.parse(raw);
    console.log("get translation data:", JSON.stringify(data));

    return data.translations || [];
  } catch (error) {
    console.error("❌ Error generating phonetic text:", error);
    return [];
  }
}
