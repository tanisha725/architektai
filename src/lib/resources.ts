// Curated, hand-verified external resources for learning system design
// further - every URL here was checked against a live web search before
// being added, not recalled from memory, since a broken or wrong link in a
// "further reading" list is worse than no list at all.
export interface Resource {
  title: string;
  url: string;
  author: string;
  description: string;
  format: "Free online book" | "GitHub repo" | "Blog" | "Interactive guides";
}

export const RESOURCES: Resource[] = [
  {
    title: "The System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    author: "Donne Martin",
    description:
      "The most widely-used free system design resource - scalability fundamentals, real interview questions with sample solutions, and flashcards for spaced-repetition review.",
    format: "GitHub repo",
  },
  {
    title: "ByteByteGo",
    url: "https://bytebytego.com/",
    author: "Alex Xu",
    description:
      "Visual, diagram-heavy explanations of how real systems (and the concepts behind them) actually work - a good next step once the basics click.",
    format: "Interactive guides",
  },
  {
    title: "High Scalability",
    url: "https://highscalability.com/",
    author: "Todd Hoff and contributors",
    description:
      "Long-running blog of real-world architecture case studies - how specific companies actually scaled specific systems, warts and all.",
    format: "Blog",
  },
  {
    title: "Designing Data-Intensive Applications",
    url: "https://dataintensive.net/",
    author: "Martin Kleppmann",
    description:
      "The canonical deep-dive book on the theory behind databases, replication, consistency, and distributed systems - denser than the others, worth it once you want the 'why' behind the patterns.",
    format: "Free online book",
  },
  {
    title: "Netflix TechBlog",
    url: "https://netflixtechblog.com/",
    author: "Netflix Engineering",
    description: "Real engineering write-ups from a company operating at genuinely massive scale - grounds the concepts in an actual production system.",
    format: "Blog",
  },
  {
    title: "AWS Architecture Blog",
    url: "https://aws.amazon.com/blogs/architecture/",
    author: "AWS",
    description:
      "Cloud-provider perspective on architecture patterns and trade-offs - useful for connecting system design concepts to the actual managed services that implement them.",
    format: "Blog",
  },
];
