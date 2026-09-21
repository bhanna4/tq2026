import { randomInt } from 'node:crypto';
import type { NewAccount } from '../pages/register.page';

const WORDS = [
  'harbor',
  'ember',
  'willow',
  'quartz',
  'breeze',
  'granite',
  'meadow',
  'falcon',
  'otter',
  'comet',
  'thicket',
  'lantern',
  'maple',
  'ridge',
  'pebble',
  'juniper',
  'canyon',
  'cinder',
  'sparrow',
  'tundra',
];

function randomUsername(): string {
  const first = WORDS[randomInt(WORDS.length)];
  const second = WORDS[randomInt(WORDS.length)];
  const suffix = randomInt(1000, 999999);
  return `${first}${second}${suffix}`;
}

export function generateSeedAccount(workerIndex: number): NewAccount {
  const username = randomUsername();
  return {
    firstName: 'TQ2026',
    lastName: `Worker${workerIndex}`,
    email: `${username}@example.com`,
    username,
    password: `${randomUsername()}!Aa1`,
  };
}
