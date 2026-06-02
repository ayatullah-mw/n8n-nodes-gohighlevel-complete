/**
 * Tests for Workflow resource operations.
 */

const mockRequest = jest.fn();

jest.mock('../../nodes/GoHighLevel/GenericFunctions', () => ({
  ...jest.requireActual('../../nodes/GoHighLevel/GenericFunctions'),
  gohighlevelApiRequest: mockRequest,
  gohighlevelApiRequestAllItems: mockRequest,
}));

const WORKFLOW = {
  id: 'wf-001',
  name: 'Lead Nurture Sequence',
  status: 'published',
  locationId: 'loc-123',
};

// ─── List Workflows ───────────────────────────────────────────────────────────

describe('Workflow: List', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /workflows with locationId', async () => {
    mockRequest.mockResolvedValue({ workflows: [WORKFLOW] });
    await mockRequest('GET', '/workflows', {}, { locationId: 'loc-123' });
    expect(mockRequest).toHaveBeenCalledWith(
      'GET',
      '/workflows',
      {},
      { locationId: 'loc-123' },
    );
  });

  it('returns an array of workflows', async () => {
    mockRequest.mockResolvedValue({ workflows: [WORKFLOW] });
    const result = await mockRequest('GET', '/workflows', {}, {});
    expect(
      Array.isArray((result as { workflows: typeof WORKFLOW[] }).workflows),
    ).toBe(true);
    expect((result as { workflows: typeof WORKFLOW[] }).workflows[0].name).toBe(
      'Lead Nurture Sequence',
    );
  });

  it('handles empty workflow list', async () => {
    mockRequest.mockResolvedValue({ workflows: [] });
    const result = await mockRequest('GET', '/workflows', {}, {});
    expect((result as { workflows: typeof WORKFLOW[] }).workflows).toHaveLength(0);
  });
});

// ─── Trigger Workflow ─────────────────────────────────────────────────────────

describe('Workflow: Trigger', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /workflows/:id/subscribe with contactId', async () => {
    mockRequest.mockResolvedValue({ succeded: true });
    const body = { contactId: 'cid-001' };

    await mockRequest('POST', `/workflows/${WORKFLOW.id}/subscribe`, body);
    expect(mockRequest).toHaveBeenCalledWith(
      'POST',
      `/workflows/${WORKFLOW.id}/subscribe`,
      body,
    );
  });

  it('includes optional eventStartTime in body if provided', async () => {
    mockRequest.mockResolvedValue({ succeded: true });
    const body = { contactId: 'cid-001', eventStartTime: '2025-02-01T09:00:00Z' };

    await mockRequest('POST', `/workflows/${WORKFLOW.id}/subscribe`, body);
    const callArg = (mockRequest as jest.Mock).mock.calls[0][2] as typeof body;
    expect(callArg.eventStartTime).toBe('2025-02-01T09:00:00Z');
  });

  it('returns the trigger response', async () => {
    mockRequest.mockResolvedValue({ succeded: true });
    const result = await mockRequest('POST', `/workflows/${WORKFLOW.id}/subscribe`, {
      contactId: 'c1',
    });
    expect((result as { succeded: boolean }).succeded).toBe(true);
  });
});
