export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ: readonly FaqItem[] = [
  {
    id: "what",
    question: "What is Tinity?",
    answer:
      "Tinity is a harness-of-harnesses for AI testing and evaluation. It exists to work alongside other harnesses, not to replace them. Not a firm. Not a chatbot. The engineer that builds the harness.",
  },
  {
    id: "replace",
    question: "Is Tinity a harness? Does it replace Cursor or Claude Code?",
    answer:
      "No. Tinity befriends harnesses. The landing catalogs 17 of them. The product does not drive any other harness out of the market.",
  },
  {
    id: "today",
    question: "What runs today?",
    answer:
      "v0.1.0 ships the marketing landing and cursor-gateway, a localhost wrap around cursor-agent. The connector library is in-tree as mocks. Layer 8 is not a runtime yet.",
  },
  {
    id: "license",
    question: "How do I contribute?",
    answer:
      "MIT license. Read CONTRIBUTING.md and the Code of Conduct, then open a GitHub issue. The project is early.",
  },
  {
    id: "vercel",
    question: "Are you on the Vercel OSS program?",
    answer:
      "The landing is hosted under jseramn.tech/tinity and the repo carries a Vercel OSS badge. We are applying to the Vercel open source program. Membership is not claimed.",
  },
];
