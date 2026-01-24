



import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

// 1. Simple selector to get the raw data
const selectWordsRaw = (state: RootState) => state.wordsList.words;

// 2. Memoized selector
export const wordsListSelector = createSelector(
  [selectWordsRaw],
  (words) => {
  
const collectedList = words.filter(word => word.status === 'COLLECTED');
const masteredList = words.filter(word => word.status === 'LEARNED');

    return {
      collectedList: collectedList,
      masteredList: masteredList,
    };
  }
);