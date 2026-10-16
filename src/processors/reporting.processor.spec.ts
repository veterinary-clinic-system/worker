import { DataSource } from 'typeorm';
import { JOB } from '../shared/contracts';
import { ReportingProcessor } from './reporting.processor';

describe('ReportingProcessor', () => {
  const query = jest.fn();
  const processor = new ReportingProcessor({ query } as unknown as DataSource);

  beforeEach(() => query.mockReset());

  it('refreshes only materialized views from the allowlist', async () => {
    query.mockResolvedValue(undefined);

    await processor.process({
      name: JOB.REFRESH_MATERIALIZED_VIEWS,
      data: { viewNames: ['mv_revenue_daily', 'unsafe_view', 'mv_ai_accuracy_daily'] },
    } as never);

    expect(query.mock.calls.map(([sql]) => sql)).toEqual([
      'REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_revenue_daily"',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_ai_accuracy_daily"',
    ]);
  });

  it('ignores jobs belonging to another worker contract', async () => {
    await processor.process({ name: 'other-job', data: {} } as never);
    expect(query).not.toHaveBeenCalled();
  });
});
