// Everything the page says about Ravi lives here, so content edits never touch layout.
// Values in [brackets] are placeholders waiting for real details.

export const profile = {
  name: 'Ravi',
  role: 'Senior Software Engineer',
  headline: 'I build software that explains itself.',
  intro: 'Senior engineer. Product systems, practical AI.',
  location: '[City], India',
  availability: 'Open to senior roles',
  email: '[you@yourdomain]',
  links: {
    github: 'https://github.com/cypher-ravi',
    linkedin: '[https://linkedin.com/in/...]',
    resume: '/resume.pdf',
  },
};

export const glance = [
  { label: 'Experience', value: '[N] years' },
  { label: 'Backend', value: 'Python, Django, MySQL' },
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
