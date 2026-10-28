import type { CandidateRevision, Message } from './types.js';

export const candidateInstruction = `When enough information exists to propose or revise an implementation, include a fenced jove-candidate JSON block with title, objective, approach (strings), affectedFiles, proposedChanges, assumptions, evaluation (string arrays). Only include relevant repository-relative paths. Separate assumptions from observed behavior. Do not invent an exact diff. Do not emit a revision if no engineering decision changed. Optional goals, nonGoals, architecture, security, and tradeOffs fields are string arrays. Only include proposedDiff (a unified diff string) when an exact patch is already supplied as grounded evidence; otherwise omit it. This is a proposal, never a filesystem edit.`;

export function candidateFields(
  input: any,
): Pick<
  CandidateRevision,
  | 'title'
  | 'objective'
  | 'approach'
  | 'affectedFiles'
  | 'proposedChanges'
  | 'assumptions'
  | 'evaluation'
  | 'goals'
  | 'nonGoals'
  | 'architecture'
  | 'security'
  | 'tradeOffs'
  | 'proposedDiff'
> {
  const text = (key: string, max = 12000) => {
    if (typeof input?.[key] !== 'string' || !input[key].trim() || input[key].length > max)
      throw new Error(`Candidate ${key} is required (maximum ${max} characters).`);
    return input[key].trim();
  };
  const list = (key: string) => {
    if (
      !Array.isArray(input?.[key]) ||
      input[key].length > 50 ||
      input[key].some((v: unknown) => typeof v !== 'string' || v.length > 4000)
    )
      throw new Error(`Candidate ${key} must be a string array (up to 50 entries).`);
    return input[key].map((v: string) => v.trim()).filter(Boolean) as string[];
  };
  const affectedFiles = list('affectedFiles');
  if (
    affectedFiles.some(
      (p) =>
        p.startsWith('/') ||
        p.includes('\\') ||
        p.split('/').some((v) => v === '..' || v === '.git') ||
        /^[a-z]+:/i.test(p),
    )
  )
    throw new Error('Candidate paths must stay inside the repository.');
  const optional: Partial<CandidateRevision> = {};
  for (const key of ['goals', 'nonGoals', 'architecture', 'security', 'tradeOffs'] as const)
    if (input[key] !== undefined) optional[key] = list(key);
  if (input.proposedDiff !== undefined) {
    if (typeof input.proposedDiff !== 'string' || input.proposedDiff.length > 200000)
      throw new Error('Candidate proposedDiff must be text (maximum 200000 characters).');
    optional.proposedDiff = input.proposedDiff;
  }
  return {
    ...optional,
    title: text('title', 150),
    objective: text('objective'),
    approach: text('approach'),
    affectedFiles,
    proposedChanges: list('proposedChanges'),
    assumptions: list('assumptions'),
    evaluation: list('evaluation'),
  };
}
export function candidateFromMessage(message: Message) {
  const match = message.content.match(/```jove-candidate\s*\n([\s\S]*?)```/);
  if (!match) return null;
  try {
    return candidateFields(JSON.parse(match[1]));
  } catch {
    return null;
  }
}
export function sameCandidate(a: CandidateRevision, b: ReturnType<typeof candidateFields>) {
  return [
    ...new Set([
      ...Object.keys(b),
      'goals',
      'nonGoals',
      'architecture',
      'security',
      'tradeOffs',
      'proposedDiff',
    ]),
  ].every(
    (key) =>
      JSON.stringify(a[key as keyof CandidateRevision]) ===
      JSON.stringify(b[key as keyof typeof b]),
  );
}

/** Diff records are cumulative; a line reference establishes scope, not causal proof. */
export function diffHasLine(diff: string, file: string, line: number) {
  let current = '',
    position = 0;
  for (const row of diff.split('\n')) {
    if (row.startsWith('+++ b/')) current = row.slice(6);
    const hunk = row.match(/^@@ .* \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      position = Number(hunk[1]);
      continue;
    }
    if (current !== file || row.startsWith('---') || row.startsWith('+++')) continue;
    if (row.startsWith('+') && position === line) return true;
    if (row.startsWith('+') || row.startsWith(' ')) position++;
  }
  return false;
}
