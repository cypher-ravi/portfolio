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
  { name: 'Ask Ravi', blurb: 'A grounded assistant that answers questions about my work, with a source for every answer.', status: 'planned' },
  { name: 'Eval Gate', blurb: 'A GitHub Action that fails a pull request when prompt quality drops or cost jumps.', status: 'planned' },
  { name: 'Overhead', blurb: 'What satellites are above you right now, with plain-language questions answered by tool calls.', status: 'planned' },
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
