// Everything the page says about Ravi lives here, so content edits never touch layout.
// Source: Ravi's resume (September 2026).

export const profile = {
  name: 'Ravi',
  role: 'Software Engineer',
  headline: ['I build software that', 'explains itself.'],
  intro: 'Software engineer. Hiring platforms, search, practical AI.',
  availability: 'Open to senior roles',
  email: 'ravikdev1999@gmail.com',
  links: {
    github: 'https://github.com/cypher-ravi',
    linkedin: 'https://www.linkedin.com/in/ravi-kumar-219bb11b2/',
    leetcode: 'https://leetcode.com/cypher-ravi/',
    resume: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/resume.pdf`,
  },
};

export const glance = [
  { label: 'Now', value: 'Software Engineer, Instahyre' },
  { label: 'Backend', value: 'Python, Django, Elasticsearch, Redis' },
  { label: 'Frontend', value: 'Angular, React, JavaScript' },
  { label: 'AI', value: 'OpenAI APIs, RAG, Weaviate' },
];

export type Role = { company: string; title: string; period: string; points: string[]; stack?: string[] };

export const experience: Role[] = [
  {
    company: 'Instahyre',
    title: 'Software Engineer',
    period: '2023 – now',
    stack: ['Python', 'Django', 'Elasticsearch', 'Angular'],
    points: [
      'Built around 10 employer-side features on a hiring platform, including custom search modes on Elasticsearch.',
      'Led an impression-based system that lets employers rank candidate pools by relevance.',
      'Shipped "Make Job Live" so employers can publish job listings in real time.',
    ],
  },
  {
    company: 'Maximize AI',
    title: 'Software Developer Intern',
    period: '2023',
    stack: ['GPT-4', 'Weaviate', 'Redis', 'Chrome extensions'],
    points: [
      'Built a website chatbot on GPT-4 with Weaviate embeddings and Redis, answering questions from site content.',
      'Built ThunderClap AI, a Chrome extension that drafts tweets with the OpenAI API.',
      'Built Whisper Live, real-time translation for Google Meet.',
    ],
  },
  {
    company: 'Delhi Skill Development Center',
    title: 'Full-Stack Instructor',
    period: '2023',
    points: ['Taught Python, Django and React to 40+ students over six months.'],
  },
  {
    company: 'Freelance and early roles',
    title: 'Backend Developer',
    period: '2020 – 2022',
    points: ['Django backends for a college events app, a phone retailer (client profit up 30%), a vendor app and a matrimonial platform.'],
  },
];

export type Project = {
  name: string;
  kind: 'Shipped' | 'Lab';
  theme: string;
  year: string;
  tldr: string;
  stack: string[];
  points: string[];
  status?: 'Coming soon' | 'Building' | 'Live';
};

// Shown as a sideways row of cards; each opens a detail popup.
export const projects: Project[] = [
  {
    name: 'Site chatbot',
    kind: 'Shipped',
    theme: 'AI',
    year: '2023',
    tldr: 'Answers visitor questions from a website’s own content.',
    stack: ['GPT-4', 'Weaviate', 'Redis'],
    points: ['Built at Maximize AI.', 'Uses GPT-4 with Weaviate embeddings and Redis.'],
  },
  {
    name: 'ThunderClap AI',
    kind: 'Shipped',
    theme: 'AI',
    year: '2023',
    tldr: 'A Chrome extension that drafts tweets.',
    stack: ['OpenAI API', 'Chrome extensions'],
    points: ['Built at Maximize AI.', 'Drafts tweets with the OpenAI API.'],
  },
  {
    name: 'Whisper Live',
    kind: 'Shipped',
    theme: 'AI',
    year: '2023',
    tldr: 'Real-time translation for Google Meet.',
    stack: ['Real-time', 'Google Meet'],
    points: ['Built at Maximize AI.', 'Translates a Google Meet call as it happens.'],
  },
  { name: 'Overhead', kind: 'Lab', theme: 'Space', year: 'Next', tldr: 'Satellites above you, right now.', stack: [], points: [], status: 'Coming soon' },
  { name: 'Vitals Brief', kind: 'Lab', theme: 'Health', year: 'Next', tldr: 'Your wearable data in plain words.', stack: [], points: [], status: 'Coming soon' },
  { name: 'Breathing Room', kind: 'Lab', theme: 'Mind', year: 'Next', tldr: 'A calm daily check-in.', stack: [], points: [], status: 'Coming soon' },
  { name: 'Ask Ravi', kind: 'Lab', theme: 'AI', year: 'Next', tldr: 'Ask about my work, get sourced answers.', stack: [], points: [], status: 'Coming soon' },
];

// Acts 2-4 of the opening story. Act 1 is the hero. Each act links to a section below.
export const story = [
  { act: 'Mind', title: 'Calm systems people can trust', body: 'Software should lower the stress of the people using it. Tap the mind to start a thought.', href: '#ai', link: 'How I use AI' },
  { act: 'Growth', title: 'Growing since 2020', body: 'Freelance, then Maximize AI, then Instahyre. Keep scrolling to watch it grow.', href: '#projects', link: 'Projects' },
  { act: 'Reply', title: 'Send a signal back', body: 'Hiring for a senior engineer who knows AI? I reply within a day.', href: '#contact', link: 'Contact' },
];

export const principles = [
  { title: 'Rules first, models where rules run out.', body: 'If a rule can do it, it is cheaper, faster and testable.' },
  { title: 'Evals before prompts.', body: 'Every AI feature ships with a test set that says when it gets worse.' },
  { title: 'Budgets are a feature.', body: 'Latency and cost limits are designed in, not discovered on the invoice.' },
];

export const education = 'B.Tech, Computer Science · DCRUST Murthal · 2023';
