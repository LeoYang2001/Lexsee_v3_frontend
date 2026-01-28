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
  ifPastDue?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
  
};

export type Phonetics = {
  text: string;
  audioUrl?: string;
};
