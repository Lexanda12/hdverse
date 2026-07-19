import { v4 as uuidv4 } from 'uuid';

// ISRC format: CC-XXX-YY-NNNNN
// CC = country code (NG for Nigeria)
// XXX = registrant code (HDV for HD Verse)
// YY = year (2 digits)
// NNNNN = designation code (5 digit sequence)

export function generateISRC(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const designation = Math.floor(10000 + Math.random() * 90000).toString();
  return `NG-HDV-${year}-${designation}`;
}
