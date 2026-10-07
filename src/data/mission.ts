// Mission Ravi-1: the career told as one rocket flight. Each leg is a scroll chapter on the page,
// and the 3D flight reads the same order to decide when each part separates.
import { experience, education, projects } from './profile';

const role = (company: string) => experience.find((r) => r.company === company)!;

export type Leg = {
  id: 'stage1' | 'separation' | 'fairing' | 'stage2' | 'payload' | 'arrays' | 'trajectory';
  phase: string; // the flight event, shown as the small label
  title: string;
  period?: string;
  points: string[];
  kept?: string[]; // what the ship keeps after this part lets go
};

const freelance = role('Freelance and early roles');
const maximize = role('Maximize AI');
const dsdc = role('Delhi Skill Development Center');
const instahyre = role('Instahyre');
const shipped = projects.filter((p) => p.kind === 'Shipped').slice(0, 3);

export const legs: Leg[] = [
  { id: 'stage1', phase: 'Stage 1 burn', title: `${freelance.title}, freelance`, period: freelance.period, points: freelance.points, kept: ['Python', 'Django', 'REST APIs'] },
  { id: 'separation', phase: 'Stage 1 separation', title: 'The stage falls away. The speed stays.', points: ['The spent first stage drifts off and tumbles in vacuum. What it gave the ship keeps going.'], kept: ['Python', 'Django', 'REST APIs'] },
  { id: 'fairing', phase: 'Fairing jettison', title: education.split(' · ')[0], period: education.split(' · ').slice(1).join(' · '), points: ['It protected the payload through the thick air, then split open once it was no longer needed.'], kept: ['CS fundamentals', 'Systems'] },
  { id: 'stage2', phase: 'Stage 2 burn', title: `${maximize.title} at ${maximize.company}, then ${dsdc.title}`, period: maximize.period, points: [...maximize.points, ...dsdc.points], kept: ['LLMs', 'RAG', 'Teaching'] },
  { id: 'payload', phase: 'Payload free', title: `${instahyre.title} at ${instahyre.company}`, period: instahyre.period, points: instahyre.points, kept: instahyre.stack },
  { id: 'arrays', phase: 'Solar arrays deployed', title: 'Projects unfold and power the ship.', points: shipped.map((p) => `${p.name}: ${p.tldr}`), kept: shipped.map((p) => p.name) },
  { id: 'trajectory', phase: 'Transfer orbit', title: 'Next destination: a senior role.', points: ['Coasting toward a team that values AI and engineers who explain their systems.'] },
];

// Labels pinned to the 3D parts, in the same words as the chapters.
export const partLabels = {
  stage1: `Stage 1 · ${freelance.period.replace(' – ', '–')} freelance`,
  fairing: 'Fairing · B.Tech CS',
  stage2: `Stage 2 · ${maximize.company} + teaching`,
  payload: `Payload · ${instahyre.company}`,
  arrays: shipped.map((p) => p.name),
  destination: 'Next · Senior role',
};
