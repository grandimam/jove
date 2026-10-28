export const agents = [
  {
    id: 'security',
    name: 'Security',
    description: 'Reviews authentication, permissions, and vulnerabilities.',
    match:
      /\b(auth(?:entication|orization)?|security|vulnerabilit\w*|permission\w*|jwt|token\w*|encrypt\w*)\b/i,
    instruction:
      'Review security and trust boundaries. Identify concrete vulnerabilities and cite files. Do not edit files.',
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Investigates failures and checks test coverage.',
    match: /\b(tests?|testing|regressions?|coverage|failing|failures?|bugs?|debug\w*)\b/i,
    instruction:
      'Investigate test coverage, likely failure causes, and useful checks. Do not claim tests ran unless tool output proves it. Do not edit files.',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'Traces structure, dependencies, and design choices.',
    match: /\b(architect\w*|design|refactor\w*|dependencies|structure|data flow|scalab\w*)\b/i,
    instruction:
      'Trace architecture and dependencies. Explain relevant design trade-offs using code evidence. Do not edit files.',
  },
] as const;
export function relevantAgents(request: string) {
  return agents.filter((agent) => agent.match.test(request)).slice(0, 2);
}
