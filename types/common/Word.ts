export type WordStatus = "COLLECTED" | "LEARNED";

export type Word = {
  id?: string;
  word: string;
  imgUrl?: string;
  status?: WordStatus;
  meanings: {
    definition: string;
    partOfSpeech: string;
    synonyms: string[];
    antonyms: string[];
  }[];
  phonetics: Phonetics | undefined;
  exampleSentences?: string;
  timeStamp?: string;
  review_interval: number;
  ease_factor: number;
  scheduleWords?: string[];
  createdAt?: string;
  updatedAt?: string;
  reviewedTimeline?: string; // a JSON string from the DB
  translatedMeanings?: {
    definition: string;
    partOfSpeech: string;
  }[];
  nextReviewDate?: string;
  owner?: string;
};

export type Phonetics = {
  text: string;
  audioUrl?: string;
};
