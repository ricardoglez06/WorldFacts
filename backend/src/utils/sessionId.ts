import { v4 as uuidv4 } from 'uuid';

export function getOrCreateSessionId(existing?: string): string {
  if (existing && existing.length > 0) {
    return existing;
  }
  return uuidv4();
}
