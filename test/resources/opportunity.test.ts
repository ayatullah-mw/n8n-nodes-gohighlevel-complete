/**
 * Tests for Opportunity resource operations.
 */

const mockRequest = jest.fn();

jest.mock('../../nodes/GoHighLevel/GenericFunctions', () => ({
  ...jest.requireActual('../../nodes/GoHighLevel/GenericFunctions'),
  gohighlevelApiRequest: mockRequest,
  gohighlevelApiRequestAllItems: mockRequest,
}));

const PIPELINE = { id: 'pipe-001', name: 'Main Pipeline' };
const STAGE = { id: 'stage-001', name: 'Lead' };
const OPPORTUNITY = {
  id: 'opp-001',
  name: 'New Deal',
  pipelineId: PIPELINE.id,
  pipelineStageId: STAGE.id,
  contactId: 'cid-001',
  status: 'open',
  monetaryValue: 5000,
};

// ─── Create ───────────────────────────────────────────────────────────────────

describe('Opportunity: Create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /opportunities with required fields', async () => {
    mockRequest.mockResolvedValue({ opportunity: OPPORTUNITY });

    const body = {
      name: 'New Deal',
      pipelineId: PIPELINE.id,
      pipelineStageId: STAGE.id,
      contactId: 'cid-001',
      status: 'open',
    };

    await mockRequest('POST', '/opportunities', body);
    expect(mockRequest).toHaveBeenCalledWith('POST', '/opportunities', body);
  });

  it('returns the opportunity object', async () => {
    mockRequest.mockResolvedValue({ opportunity: OPPORTUNITY });
    const result = await mockRequest('POST', '/opportunities', {});
    expect((result as { opportunity: typeof OPPORTUNITY }).opportunity.id).toBe('opp-001');
  });
});

// ─── Get ──────────────────────────────────────────────────────────────────────

describe('Opportunity: Get', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /opportunities/:id', async () => {
    mockRequest.mockResolvedValue({ opportunity: OPPORTUNITY });
    await mockRequest('GET', `/opportunities/${OPPORTUNITY.id}`);
    expect(mockRequest).toHaveBeenCalledWith('GET', `/opportunities/${OPPORTUNITY.id}`);
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe('Opportunity: Update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PUT /opportunities/:id with update fields', async () => {
    const updates = { status: 'won', monetaryValue: 10000 };
    mockRequest.mockResolvedValue({ opportunity: { ...OPPORTUNITY, ...updates } });

    await mockRequest('PUT', `/opportunities/${OPPORTUNITY.id}`, updates);
    expect(mockRequest).toHaveBeenCalledWith('PUT', `/opportunities/${OPPORTUNITY.id}`, updates);
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('Opportunity: Delete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls DELETE /opportunities/:id', async () => {
    mockRequest.mockResolvedValue(undefined);
    await mockRequest('DELETE', `/opportunities/${OPPORTUNITY.id}`);
    expect(mockRequest).toHaveBeenCalledWith('DELETE', `/opportunities/${OPPORTUNITY.id}`);
  });
});

// ─── List ─────────────────────────────────────────────────────────────────────

describe('Opportunity: List', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /opportunities/search with pipelineId', async () => {
    mockRequest.mockResolvedValue({ opportunities: [OPPORTUNITY] });

    await mockRequest('GET', '/opportunities/search', {}, { pipelineId: PIPELINE.id, limit: 20 });
    expect(mockRequest).toHaveBeenCalledWith(
      'GET',
      '/opportunities/search',
      {},
      { pipelineId: PIPELINE.id, limit: 20 },
    );
  });

  it('returns an array of opportunities', async () => {
    mockRequest.mockResolvedValue({ opportunities: [OPPORTUNITY] });
    const result = await mockRequest('GET', '/opportunities/search', {}, {});
    expect(
      Array.isArray((result as { opportunities: typeof OPPORTUNITY[] }).opportunities),
    ).toBe(true);
  });
});
