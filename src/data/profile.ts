// Everything the page says about Ravi lives here, so content edits never touch layout.
// Values in [brackets] are placeholders waiting for real details.

export const profile = {
  name: 'Ravi',
  role: 'Senior Software Engineer',
  headline: 'I build product systems that explain themselves, and use AI where it earns its place.',
  location: '[City], India',
  availability: 'Open to senior engineering roles',
  email: '[you@yourdomain]',
  links: {
    github: 'https://github.com/cypher-ravi',
    linkedin: '[https://linkedin.com/in/...]',
    resume: '/resume.pdf',
  },
};

export const glance = [
  { label: 'Experience', value: '[N] years' },
  { label: 'Domains', value: 'Marketplaces, matching, payments' },
  { label: 'Backend', value: 'Python, Django, REST, MySQL' },
  { label: 'Frontend', value: 'TypeScript, React, Next.js' },
];

export type Work = {
  name: string;
  tldr: string;
  stack: string[];
  points: string[];
  href?: string;
};

export const work: Work[] = [
  {
    name: 'KalaWorks',
    tldr: 'A careers platform for performing artists: jobs, mentors, auditions and payments.',
    stack: ['Django', 'DRF', 'MySQL', 'Next.js', 'TypeScript'],
    points: [
      'Matching engine scores every artist-to-job fit from 0 to 100 and always says why, with reasons and gaps in plain language.',
      'Shortlist autopilot suggests candidates and chases replies, while recruiters make every decision.',
      '360 automated tests running against MySQL in CI.',
    ],
  },
];

export type Experiment = { name: string; blurb: string; status: 'planned' | 'building' | 'live' };

export const lab: Experiment[] = [
  { name: 'Overhead', blurb: 'Space tech. Which satellites are above you right now, with plain-language questions answered by tool calls.', status: 'planned' },
  { name: 'Vitals Brief', blurb: 'Healthcare. A plain-language weekly summary of your wearable data, parsed in the browser. It never diagnoses.', status: 'planned' },
  { name: 'Breathing Room', blurb: 'Mental health. A calm daily check-in with a one-minute breathing exercise. Entries stay on your device.', status: 'planned' },
  { name: 'Eval Gate', blurb: 'A GitHub Action that fails a pull request when AI quality or safety drops. It guards the other projects.', status: 'planned' },
  { name: 'Ask Ravi', blurb: 'A grounded assistant that answers questions about my work, with a source for every answer.', status: 'planned' },
];

// Acts 2-5 of the opening story. Act 1 is the hero. Each act links to the full section below.
export const story = [
  {
    act: 'Pulse', motivation: 'healthcare',
    title: 'Out of the silence, a heartbeat',
    body: 'Technology matters most when it keeps someone alive and well. I build systems people can rely on.',
    href: '#glance', link: 'At a glance',
  },
  {
    act: 'Mind', motivation: 'psychology',
    title: 'Calm systems people can trust',
    body: 'I care how software makes people feel. My AI work is careful: measured, explainable, and honest about its limits.',
    href: '#protocol', link: 'How I use AI',
  },
  {
    act: 'Growth', motivation: 'nature',
    title: 'Life finds a way to grow',
    body: 'Seeds spiral out at the golden angle, 137.5°. Each bloom is a project: space, health, mind, and the tools that keep them safe.',
    href: '#lab', link: 'The projects',
  },
  {
    act: 'Reply', motivation: 'connection',
    title: 'Send a signal back',
    body: 'Hiring for a senior engineer who knows AI? I reply within a day.',
    href: '#reply', link: 'Contact',
  },
];

export const aiNotes = [
  {
    title: 'Rules first, models where rules run out',
    body: 'A weighted score is testable and explainable. An LLM goes where language is fuzzy, such as matching "Kathak" to "Indian classical", and never where a rule would do.',
  },
  {
    title: 'Evals before prompts',
    body: 'Every AI feature ships with a small labelled test set. If I cannot measure it, I do not ship it.',
  },
  {
    title: 'Budgets are a feature',
    body: 'Latency, token cost and a hard spend cap are designed in from day one, not discovered on the invoice.',
  },
];
