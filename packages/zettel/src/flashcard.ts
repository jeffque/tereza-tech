import * as dateFns from 'date-fns';

export const INTERVAL = 7;

export const MAX_P_NUMBER = 1000;

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export const getRandomInt = (args: { min: number; max: number }) => {
  const min = Math.ceil(args.min);
  const max = Math.floor(args.max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getWeightedRandomInt = (weights: number[]) => {
  const sum = weights.reduce((acc, cur) => {
    return acc + cur;
  }, 0);
  const random = Math.random() * sum;

  const match = weights.reduce<{ sum: number; index?: number }>(
    (acc, cur, index) => {
      /**
       * Index already chosen.
       */
      if (acc.index !== undefined) {
        return acc;
      }

      const newSum = acc.sum + cur;

      if (newSum >= random) {
        return { sum: newSum, index };
      }

      return { sum: newSum, index: undefined };
    },
    { sum: 0, index: undefined }
  );

  /**
   * If no index was found, return the first index.
   */
  return match.index || 0;
};

/**
 * https://www.wolframalpha.com/input/?i=y+%3D+exp%28-x%2F%282**5+*+7%29%29*cos%28%28log2%28x%2F7%29*pi%29%29%5E10+%2C+from++6+%3C+x+%3C+2**6+*+7
 * @param x difference in days
 * @returns pNumber
 */
export const getPNumber = (x: number) => {
  return Math.round(
    MAX_P_NUMBER *
      Math.exp(-(x / (2 ** 5 * INTERVAL))) *
      Math.cos((Math.log(x / INTERVAL) / Math.log(2)) * Math.PI) ** 10
  );
};

export type Flashcard = {
  date: string;
  diffDays: number;
  pNumber: number;
  diffWeeks: { weeks: number; days: number };
};

export const getFlashcards = async <Post extends { date: string }>(
  posts: Post[]
) => {
  const today = new Date();

  return posts
    .map((post) => {
      const diffDays = dateFns.differenceInDays(today, new Date(post.date));

      const diffWeeks = (() => {
        const weeks = Math.floor(diffDays / 7);
        const days = diffDays % 7;
        return { weeks, days };
      })();

      return {
        ...post,
        diffDays,
        pNumber: getPNumber(diffDays),
        diffWeeks,
      };
    })
    .filter(({ diffDays }) => {
      return diffDays >= INTERVAL - 1;
    });
};

export const getFlashcardByProbability = <Post>(
  flashcards: (Flashcard & Post)[]
): Flashcard & Post => {
  const sortedFlashcards = flashcards.sort((fa, fb) => {
    return fa.diffDays - fb.diffDays;
  });

  const weights = sortedFlashcards.map(({ pNumber }) => {
    return pNumber;
  });

  return sortedFlashcards[getWeightedRandomInt(weights)];
};

export const getFlashcard = async <Post extends { date: string }>(
  posts: Post[]
) => {
  const flashcards = await getFlashcards(posts);
  return getFlashcardByProbability<Post>(flashcards);
};
