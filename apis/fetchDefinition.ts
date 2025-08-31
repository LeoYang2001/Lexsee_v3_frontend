const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

import OpenAI from "openai";
const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

const client = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

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
}

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
        "❌ Format check failed: missing or invalid 'word' property"
      );
      return false;
    }

    if (!Array.isArray(data.meanings) || data.meanings.length === 0) {
      console.warn(
        "❌ Format check failed: 'meanings' must be a non-empty array"
      );
      return false;
    }

    if (!data.phonetics || typeof data.phonetics !== "object") {
      console.warn(
        "❌ Format check failed: missing or invalid 'phonetics' object"
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
          `❌ Format check failed: meaning[${i}].definition is missing or invalid`
        );
        return false;
      }

      if (
        typeof meaning.partOfSpeech !== "string" ||
        !meaning.partOfSpeech.trim()
      ) {
        console.warn(
          `❌ Format check failed: meaning[${i}].partOfSpeech is missing or invalid`
        );
        return false;
      }

      if (!Array.isArray(meaning.synonyms)) {
        console.warn(
          `❌ Format check failed: meaning[${i}].synonyms must be an array`
        );
        return false;
      }

      if (!Array.isArray(meaning.antonyms)) {
        console.warn(
          `❌ Format check failed: meaning[${i}].antonyms must be an array`
        );
        return false;
      }

      if (!meaning.synonyms.every((s: any) => typeof s === "string")) {
        console.warn(
          `❌ Format check failed: meaning[${i}].synonyms must contain only strings`
        );
        return false;
      }

      if (!meaning.antonyms.every((a: any) => typeof a === "string")) {
        console.warn(
          `❌ Format check failed: meaning[${i}].antonyms must contain only strings`
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
  callbacks?: FetchDefinitionCallbacks
): Promise<WordDefinition | null> {
  try {
    console.log("fetching definition for:", word);
    const response = await fetch(
      `${DICTIONARY_API_URL}${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      // Don't throw error for 404, just log and try AI fallback
      if (response.status === 404) {
        console.log(
          `📝 Word "${word}" not found in dictionary (404), trying AI fallback...`
        );
      } else {
        console.warn(
          `⚠️ Dictionary API failed with status: ${response.status}, trying AI fallback...`
        );
      }

      // Try AI fallback for any non-ok response
      if (DEEPSEEK_API_KEY) {
        console.log("📡 Trying AI generation due to API failure...");
        callbacks?.onAIStart?.();
        callbacks?.onSourceChange?.("ai");

        const result = await generateDefinition(word);

        callbacks?.onAIEnd?.();
        return result;
      }

      // Return null instead of throwing error
      console.warn(
        `❌ No AI fallback available and API failed with status: ${response.status}`
      );
      return null;
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(
        `📝 No data received for word "${word}", trying AI fallback...`
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
    };

    // Check if the transformed data matches our required format
    if (checkFormat(transformedData)) {
      console.log("✅ Dictionary API response format is valid");
      callbacks?.onSourceChange?.("dictionary");
      return transformedData;
    } else {
      console.log(
        "⚠️ Dictionary API response format is invalid, trying AI generation..."
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
  word: string
): Promise<WordDefinition | null> => {
  if (!DEEPSEEK_API_KEY) {
    console.warn("❌ DEEPSEEK_API_KEY not available for AI generation");
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

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
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
