import test from 'node:test';
import assert from 'node:assert/strict';
import { agents, relevantAgents } from '../server/agents';
test('predefined specialists activate for relevant requests with bounded fan-out', () => {
  assert.deepEqual(
    agents.map((agent) => agent.id),
    ['security', 'testing', 'architecture'],
  );
  assert.deepEqual(
    relevantAgents('Check JWT token authentication').map((agent) => agent.id),
    ['security'],
  );
  assert.deepEqual(
    relevantAgents('Investigate failing tests and coverage').map((agent) => agent.id),
    ['testing'],
  );
  assert.deepEqual(
    relevantAgents('Trace architecture and dependencies').map((agent) => agent.id),
    ['architecture'],
  );
  assert.equal(relevantAgents('Hello there').length, 0);
  assert.equal(relevantAgents('Test security and architecture').length, 2);
});
