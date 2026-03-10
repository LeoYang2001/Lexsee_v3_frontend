export type DiscoverItem = {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  sourceUrl: string;
  intro?: string;
};

export type DiscoverCategory = {
  id: "watch" | "scene" | "read";
  emoji: string;
  label: string;
  subtitle: string;
  coverThumbnail: string;
  items: DiscoverItem[];
  iconImg?: any;
};

export const DAILY_LEXSEE_PROGRESS = {
  learned: 3,
  goal: 6,
  encouragement: "Nice pace. You're halfway through today's goal.",
};

export const DAILY_LEXSEE_DISCOVER: DiscoverCategory[] = [
  {
    id: "watch",
    emoji: "📺",
    label: "Youtube",
    iconImg: require("../../../../assets/loginIcons/youtube.png"),
    subtitle: "YouTube conversation clips",
    coverThumbnail:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    items: [
      {
        id: "watch-1",
        title: "Coffee shop small-talk",
        duration: "5 min",
        thumbnail:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.youtube.com/watch?v=VYOjWnS4cMY",
      },
      {
        id: "watch-2",
        title: "Asking for directions naturally",
        duration: "4 min",
        thumbnail:
          "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      },
      {
        id: "watch-3",
        title: "Ordering food in English",
        duration: "6 min",
        thumbnail:
          "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.youtube.com/watch?v=CevxZvSJLk8",
      },
    ],
  },
  {
    id: "scene",
    emoji: "🎬",
    label: "Movie",
    iconImg: require("../../../../assets/loginIcons/movies.png"),

    subtitle: "Today's movie suggestion",
    coverThumbnail:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    items: [
      {
        id: "scene-1",
        title: "The Pursuit of Happyness",
        duration: "117 min",
        thumbnail:
          "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80",
        intro:
          "A struggling salesman takes custody of his son while pursuing a life-changing opportunity at a top brokerage firm.",
        sourceUrl: "https://www.imdb.com/title/tt0454921/",
      },
    ],
  },
  {
    id: "read",
    emoji: "📖",
    label: "Read",
    subtitle: "Short reading passages",
    coverThumbnail:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    items: [
      {
        id: "read-1",
        title: "A short mystery paragraph",
        duration: "3 min",
        thumbnail:
          "https://images.unsplash.com/photo-1455885666463-9a4661f44af2?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.gutenberg.org/",
      },
      {
        id: "read-2",
        title: "News-style current events snippet",
        duration: "4 min",
        thumbnail:
          "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.gutenberg.org/",
      },
      {
        id: "read-3",
        title: "Motivational biography extract",
        duration: "3 min",
        thumbnail:
          "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1200&q=80",
        sourceUrl: "https://www.gutenberg.org/",
      },
    ],
  },
];
