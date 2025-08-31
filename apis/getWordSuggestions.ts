interface Suggestion {
  word: string;
  score: number;
}

export async function getWordSuggestions(query: string): Promise<string[]> {
  if (query.trim().length === 0) return [];

  try {
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${query.trim()}&max=15`
    );
    const data: Suggestion[] = await response.json();
    return data.map((item) => item.word);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}
