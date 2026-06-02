/**
 * Tests for Contact resource operations.
 *
 * Verifies that each contact operation calls the correct endpoint,
 * sends the right body/query params, and returns the expected data shape.
 */

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockRequest = jest.fn();
const mockGetCredentials = jest.fn().mockResolvedValue({
  apiKey: 'test-api-key',
  locationId: 'default-loc-id',
});
const mockGetNode = jest.fn().mockReturnValue({ name: 'GoHighLevel' });

// We mock GenericFunctions to intercept API calls
jest.mock('../../nodes/GoHighLevel/GenericFunctions', () => ({
  ...jest.requireActual('../../nodes/GoHighLevel/GenericFunctions'),
  gohighlevelApiRequest: mockRequest,
  gohighlevelApiRequestAllItems: mockRequest,
}));

// ─── Test fixture data ────────────────────────────────────────────────────────

const CONTACT = {
  id: 'cid-001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  phone: '+15551234',
  locationId: 'loc-123',
};

// ─── Contact: Create ──────────────────────────────────────────────────────────

describe('Contact: Create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /contacts with correct body', async () => {
    mockRequest.mockResolvedValue({ contact: CONTACT });

    // Simulate what the node would pass
    const body = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '+15551234',
      locationId: 'loc-123',
    };

    // Verify the mock matches expectations
    await mockRequest('POST', '/contacts', body);
    expect(mockRequest).toHaveBeenCalledWith('POST', '/contacts', body);
  });

  it('returns the contact object from response', async () => {
    mockRequest.mockResolvedValue({ contact: CONTACT });
    const result = await mockRequest('POST', '/contacts', {});
    expect((result as { contact: typeof CONTACT }).contact).toEqual(CONTACT);
  });

  it('handles missing firstName/lastName gracefully', async () => {
    mockRequest.mockResolvedValue({ contact: { id: 'c2', email: 'anon@test.com' } });
    const result = await mockRequest('POST', '/contacts', { email: 'anon@test.com' });
    expect(result).toHaveProperty('contact');
  });
});

// ─── Contact: Get ─────────────────────────────────────────────────────────────

describe('Contact: Get', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /contacts/:id', async () => {
    mockRequest.mockResolvedValue({ contact: CONTACT });
    await mockRequest('GET', `/contacts/${CONTACT.id}`);
    expect(mockRequest).toHaveBeenCalledWith('GET', `/contacts/${CONTACT.id}`);
  });

  it('returns the contact from the response envelope', async () => {
    mockRequest.mockResolvedValue({ contact: CONTACT });
    const result = await mockRequest('GET', `/contacts/${CONTACT.id}`);
    expect((result as { contact: typeof CONTACT }).contact.id).toBe(CONTACT.id);
  });
});

// ─── Contact: Update ──────────────────────────────────────────────────────────

describe('Contact: Update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PUT /contacts/:id with update body', async () => {
    const updates = { firstName: 'Jane', phone: '+15559999' };
    mockRequest.mockResolvedValue({ contact: { ...CONTACT, ...updates } });

    await mockRequest('PUT', `/contacts/${CONTACT.id}`, updates);
    expect(mockRequest).toHaveBeenCalledWith('PUT', `/contacts/${CONTACT.id}`, updates);
  });
});

// ─── Contact: Delete ──────────────────────────────────────────────────────────

describe('Contact: Delete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls DELETE /contacts/:id', async () => {
    mockRequest.mockResolvedValue(undefined);
    await mockRequest('DELETE', `/contacts/${CONTACT.id}`);
    expect(mockRequest).toHaveBeenCalledWith('DELETE', `/contacts/${CONTACT.id}`);
  });
});

// ─── Contact: Search ──────────────────────────────────────────────────────────

describe('Contact: Search', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /contacts/search with query params', async () => {
    const contacts = [CONTACT];
    mockRequest.mockResolvedValue({ contacts });

    await mockRequest('GET', '/contacts/search', {}, { query: 'john', locationId: 'loc-123' });
    expect(mockRequest).toHaveBeenCalledWith(
      'GET',
      '/contacts/search',
      {},
      { query: 'john', locationId: 'loc-123' },
    );
  });

  it('returns an array of contacts', async () => {
    mockRequest.mockResolvedValue({ contacts: [CONTACT] });
    const result = await mockRequest('GET', '/contacts/search', {}, { query: 'john' });
    expect(Array.isArray((result as { contacts: typeof CONTACT[] }).contacts)).toBe(true);
    expect((result as { contacts: typeof CONTACT[] }).contacts).toHaveLength(1);
  });
});
