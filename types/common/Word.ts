export type Word = {
  id?: string;
  word: string;
  imgUrl?: string;
  status?: string;
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
};

export type Phonetics = {
  text: string;
  audioUrl?: string;
};
