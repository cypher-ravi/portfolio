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
    resume: '/resume.pdf',
  },
};

export const glance = [
  { label: 'Now', value: 'Software Engineer, Instahyre' },
  { label: 'Backend', value: 'Python, Django, Elasticsearch, Redis' },
  { label: 'Frontend', value: 'Angular, React, JavaScript' },
  { label: 'AI', value: 'OpenAI APIs, RAG, Weaviate' },
];

export type Role = { company: string; title: string; period: string; points: string[] };

export const experience: Role[] = [
  {
    company: 'Instahyre',
    title: 'Software Engineer',
    period: '2023 – now',
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

export type Work = { name: string; tldr: string; stack: string[]; points: string[]; href?: string };

export const work: Work[] = [
  {
    name: 'KalaWorks',
    tldr: 'A careers platform for performing artists.',
    stack: ['Django', 'Next.js', 'MySQL'],
    points: [
      'Matching engine that scores every fit and says why.',
      '360 automated tests in CI.',
    ],
  },
];

export type Experiment = { name: string; blurb: string; status: 'planned' | 'building' | 'live' };

export const lab: Experiment[] = [
  { name: 'Overhead', blurb: 'Satellites above you, right now.', status: 'planned' },
  { name: 'Vitals Brief', blurb: 'Your wearable data in plain words.', status: 'planned' },
  { name: 'Breathing Room', blurb: 'A calm daily check-in.', status: 'planned' },
  { name: 'Ask Ravi', blurb: 'Ask about my work, get sourced answers.', status: 'planned' },
];

// Acts 2-4 of the opening story. Act 1 is the hero. Each act links to a section below.
export const story = [
  { act: 'Mind', title: 'Calm systems people can trust', href: '#ai', link: 'How I use AI' },
  { act: 'Growth', title: 'Small projects, growing', href: '#lab', link: 'Projects' },
  { act: 'Reply', title: 'Send a signal back', href: '#reply', link: 'Contact' },
];

export const principles = [
  'Rules first, models where rules run out.',
  'Evals before prompts.',
  'Budgets are a feature.',
];

export const education = 'B.Tech, Computer Science · DCRUST Murthal · 2023';
