export type Word = {
  id: number;
  word: string;
  imgUrl: string;
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
