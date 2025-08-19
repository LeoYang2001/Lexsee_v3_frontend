export type Word = {
  id: string;
  word: string;
  imgUrl: string;
  status?: string;
  meanings: {
    definition: string;
    partOfSpeech: string;
    synonyms: string[];
    antonyms: string[];
  }[];
  phonetics: {
    text: string;
    audioUrl: string;
  };
  timeStamp: string;
};
