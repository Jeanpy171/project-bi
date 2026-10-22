import { describe, expect, it } from 'vitest';
import { runPostgresDiagnostic } from '../diagnostic.js';
import type { ConnectionConfig } from '@bi/contracts';

describe('Postgres Diagnostic Assistant', () => {
  it('should flag localhost and provide docker-specific guidance', async () => {
    const config: ConnectionConfig = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Local Test DB',
      engine: 'postgres',
      host: 'localhost',
      port: 54999, // Unused port to trigger reachability failure cleanly
      database: 'test_db',
      user: 'postgres',
      password: 'password',
      ssl: false,
      readOnly: true,
      queryTimeoutMs: 5000,
      maxRows: 1000,
    };

    const report = await runPostgresDiagnostic(config);

    expect(report.isHealthy).toBe(false);
    expect(report.steps.length).toBeGreaterThan(0);

    const dockerWarning = report.steps.find((s) => s.code === 'DOCKER_LOCALHOST_CHECK');
    expect(dockerWarning).toBeDefined();
    expect(dockerWarning?.status).toBe('warning');
    expect(dockerWarning?.suggestedFix).toContain('host.docker.internal');

    const tcpStep = report.steps.find((s) => s.code === 'TCP_PORT_REACHABILITY');
    expect(tcpStep).toBeDefined();
    expect(tcpStep?.status).toBe('failed');
  });
});
