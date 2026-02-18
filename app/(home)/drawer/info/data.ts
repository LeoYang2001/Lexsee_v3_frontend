import { ImageSourcePropType } from "react-native";

interface LEXSEE_SCIENCE_TAB {
  id: number;
  title: string;

  imagePath: ImageSourcePropType;
  backgroundColor: string;
  quote?: string;
  content: {
    title: string;
    content: string;
    takeaway?: string;
    reference_link?: string;
    embedded_img?: string;
  }[];
}

export const LEXSEE_SCIENCE_TABS: LEXSEE_SCIENCE_TAB[] = [
  {
    id: 1,
    title: "What LexSee Is",
    imagePath: require("../../../../assets/lexseeScience/tab_1.png"),
    quote:
      "Built for how memory actually works: focusing on durable retrieval over passive recognition.",
    backgroundColor: "#f57300",
    content: [
      {
        title: "Foundation",
        content:
          "LexSee is built around how human memory actually works rather than how we wish it worked. Vocabulary becomes useful only when it can be reliably retrieved, not merely recognized during review. Research in cognitive science shows that retrieval strengthens memory more effectively than passive exposure. For this reason, LexSee is designed to encourage structured recall and timed spacing instead of constant repetition or content accumulation.",
      },
      {
        title: "Retention",
        content:
          "LexSee focuses on long-term retention rather than short-term productivity. It respects cognitive load and avoids encouraging unsustainable study intensity. Words are reinforced at carefully structured intervals so that memory traces strengthen gradually over time. The goal is durability: fewer words remembered well rather than many words forgotten quickly.",
      },
      {
        title: "Exposure",
        content:
          "LexSee does not replace reading, listening, speaking, or immersion. Fluency develops through meaningful exposure, interaction, and real communication. LexSee supports this process by stabilizing vocabulary so that exposure becomes more effective and less overwhelming. When words are remembered reliably, real-world English becomes easier to process and more rewarding.",
      },
      {
        title: "Limits",
        content:
          "LexSee is not a complete language solution, and it does not eliminate effort from learning. Memory strengthens through active retrieval, and difficulty during recall is a normal and necessary part of growth. No system can produce fluency without engagement, context, and time. LexSee organizes effort so that it leads to durable retention rather than temporary familiarity.",
      },
    ],
  },
  {
    id: 2,
    title: "How Memory Works",
    imagePath: require("../../../../assets/lexseeScience/tab_2.png"),
    backgroundColor: "#1f7f5d",
    quote:
      "True learning happens in the effort of recall, where forgetting creates the space for strengthening.",
    content: [
      {
        title: "Difficulty",
        takeaway:
          "Most people don’t struggle to learn new words. They struggle to keep them.",
        content:
          "Vocabulary learning feels difficult not because words are impossible to understand, but because memory fades quickly without reinforcement. Research in cognitive psychology shows that newly learned information weakens rapidly in the first days after exposure. A word is also more complex than it appears, it includes spelling, pronunciation, meaning, usage, and context. Without structured recall, much of what feels learned gradually disappears.",
        reference_link: "https://en.wikipedia.org/wiki/Forgetting_curve",
      },
      {
        title: "The Act of Learning",
        takeaway:
          "Memory does not grow from repetition alone. It grows when you try to remember",
        content:
          "Seeing a word repeatedly can create a strong sense of familiarity. However, familiarity is not equivalent to recall. When the answer is visible, the brain does not need to retrieve it. True learning occurs when a word can be remembered without cues. Passive exposure often creates the illusion of mastery while memory remains fragile.",
        reference_link:
          "https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf",
      },
      {
        title: "Forgetting",
        takeaway:
          "Forgetting is not the enemy of learning; it creates the opportunity for strengthening.",
        content:
          "The brain is designed to forget information that is not reinforced. This process is adaptive; it prevents overload and prioritizes relevance. When something is revisited after partial forgetting, the memory trace can become stronger than it was initially. Forgetting creates the conditions under which durable learning becomes possible.",
        reference_link: "https://bjorklab.psych.ucla.edu/",
      },
    ],
  },
  {
    id: 3,
    title: "How LexSee Helps Memory",
    imagePath: require("../../../../assets/lexseeScience/tab_3.png"),
    backgroundColor: "#FF511B",
    quote:
      "Stabilizing vocabulary through context, active retrieval, and scientifically timed spacing.",
    content: [
      {
        title: "Context",
        takeaway:
          "Words are remembered better when they are connected to meaning, not stored as isolated labels.",
        content:
          "LexSee presents vocabulary within images and real usage rather than as isolated definitions. When a word is paired with context, the brain forms associations instead of storing a detached translation. Research in cognitive psychology suggests that combining verbal and visual information strengthens encoding by creating multiple pathways for recall. Context turns vocabulary into experience, which makes memory more stable.",
        reference_link: "https://en.wikipedia.org/wiki/Dual-coding_theory",
      },
      {
        title: "Retrieval",
        takeaway: "LexSee helps you to remember, not just recognize.",
        content:
          "Instead of repeatedly showing answers, LexSee prompts active recall. When you attempt to retrieve a word without cues, the neural pathway associated with that word strengthens. This aligns with findings in retrieval practice research showing that effortful recall produces more durable memory than passive review.",
        reference_link: "https://www.retrievalpractice.org/",
      },
      {
        title: "Spacing",
        takeaway: "Timing matters more than repetition.",
        content:
          "LexSee schedules reviews based on memory strength rather than simple repetition. When recall is successful, the interval increases. When recall is difficult, the word returns sooner. This structure reflects research on the spacing effect, which suggests that learning spread across time produces stronger long-term retention than massed practice.",
        reference_link: "https://en.wikipedia.org/wiki/Spacing_effect",
      },
      {
        title: "Feedback",
        takeaway: "Difficulty is a signal of growth, not failure.",
        content:
          "Moments of hesitation during recall indicate that memory is being strengthened. LexSee does not treat uncertainty as failure but as part of the learning process. By adjusting review timing based on performance, the system works with how memory stabilizes over time rather than relying on intensity alone.",
        reference_link: "https://bjorklab.psych.ucla.edu/",
      },
    ],
  },
  {
    id: 4,
    title: "How to Use LexSee Well",
    backgroundColor: "#a65117",
    imagePath: require("../../../../assets/lexseeScience/tab_4.png"),
    content: [
      {
        title: "Integration",
        content:
          "LexSee works best when paired with real English exposure. Watching films, reading books, listening to conversations, and speaking with others create meaningful encounters with language. LexSee stabilizes the vocabulary from those experiences so that exposure becomes easier over time.",
      },
      {
        title: "Consistency",
        content:
          "Learning fewer words consistently is more effective than learning many words occasionally. Memory strengthens through repeated retrieval across time, not through intensity in a single session. Small, sustainable effort compounds into durable retention.",
      },
      {
        title: "Trust",
        content:
          "The review system is designed to align with how memory naturally fades and strengthens. Words reappear based on memory strength, not simple recency. Forgetting is a natural part of reinforcement. Allowing time between reviews creates the conditions for stronger recall. Trust the process, including the forgetting.",
      },
    ],
  },
];
