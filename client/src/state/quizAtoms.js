import { atom } from 'recoil';

export const topicAtom = atom({ key: 'topic', default: '' });
export const questionsAtom = atom({ key: 'questions', default: [] });
export const currentIndexAtom = atom({ key: 'currentIndex', default: 0 });
export const answersAtom = atom({ key: 'answers', default: {} }); // { [questionId]: choiceId }
export const loadingAtom = atom({ key: 'loading', default: false });
export const errorAtom = atom({ key: 'error', default: '' });
export const feedbackAtom = atom({ key: 'feedback', default: '' });
export const showResultsAtom = atom({ key: 'showResults', default: false });
