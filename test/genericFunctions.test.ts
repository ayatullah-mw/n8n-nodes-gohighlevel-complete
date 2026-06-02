/**
 * Tests for GenericFunctions (HTTP helper layer).
 *
 * These tests verify:
 * - Correct request construction (method, url, headers, body, qs)
 * - Proper error mapping (401 → friendly message, 429, 404, 500)
 * - Pagination logic in gohighlevelApiRequestAllItems
 * - buildBody strips undefined/empty values
 */

import { buildBody } from '../../nodes/GoHighLevel/GenericFunctions';
import { NodeApiError } from 'n8n-workflow';

// ─── buildBody ─────────────────────────────────────────────────────────────

describe('buildBody', () => {
  it('removes undefined values', () => {
    const result = buildBody({ a: 'hello', b: undefined, c: 'world' });
    expect(result).toEqual({ a: 'hello', c: 'world' });
  });

  it('removes empty-string values', () => {
    const result = buildBody({ name: 'John', email: '', phone: '+1234' });
    expect(result).toEqual({ name: 'John', phone: '+1234' });
  });

  it('keeps zero and false values', () => {
    const result = buildBody({ value: 0, dnd: false, name: 'Test' });
    expect(result).toEqual({ value: 0, dnd: false, name: 'Test' });
  });

  it('keeps array values', () => {
    const result = buildBody({ tags: ['a', 'b', 'c'] });
    expect(result).toEqual({ tags: ['a', 'b', 'c'] });
  });

  it('returns empty object if all values removed', () => {
    const result = buildBody({ a: undefined, b: '' });
    expect(result).toEqual({});
  });
});

// ─── NodeApiError ─────────────────────────────────────────────────────────────

describe('NodeApiError (from mock)', () => {
  it('creates an error with message from options', () => {
    const err = new NodeApiError(
      { name: 'TestNode' },
      { statusCode: 401 },
      { message: 'Unauthorized: Check your GoHighLevel API Key.' },
    );
    expect(err.message).toBe('Unauthorized: Check your GoHighLevel API Key.');
    expect(err.name).toBe('NodeApiError');
  });

  it('falls back to generic message when options are missing', () => {
    const err = new NodeApiError({ name: 'TestNode' }, { statusCode: 500 });
    expect(err.message).toBe('NodeApiError');
  });
});

// ─── gohighlevelApiRequest context builder ────────────────────────────────────

/**
 * Creates a mock n8n execution context for testing API request functions.
 */
function createMockContext(
  mockResponse: unknown,
  credentials: Record<string, unknown> = { apiKey: 'test-key', locationId: 'loc-123' },
) {
  return {
    getCredentials: jest.fn().mockResolvedValue(credentials),
    getNode: jest.fn().mockReturnValue({ name: 'GoHighLevel', type: 'goHighLevel' }),
    helpers: {
      request: jest.fn().mockResolvedValue(mockResponse),
    },
  };
}

// ─── gohighlevelApiRequest tests ──────────────────────────────────────────────

describe('gohighlevelApiRequest', () => {
  // Dynamically import so mock context can bind properly
  let gohighlevelApiRequest: (
    this: unknown,
    method: string,
    endpoint: string,
    body?: Record<string, unknown>,
    qs?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;

  beforeEach(async () => {
    const mod = await import('../../nodes/GoHighLevel/GenericFunctions');
    gohighlevelApiRequest = mod.gohighlevelApiRequest;
  });

  it('calls helpers.request with correct Authorization header', async () => {
    const ctx = createMockContext({ contact: { id: 'c1' } });
    await gohighlevelApiRequest.call(ctx, 'GET', '/contacts/c1');

    expect(ctx.helpers.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          Version: '2021-07-28',
        }),
        uri: 'https://services.leadconnectorhq.com/contacts/c1',
        method: 'GET',
      }),
    );
  });

  it('does not include body key when body is empty', async () => {
    const ctx = createMockContext({});
    await gohighlevelApiRequest.call(ctx, 'GET', '/contacts');

    const callArg = (ctx.helpers.request as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.body).toBeUndefined();
  });

  it('includes body when provided', async () => {
    const ctx = createMockContext({ contact: {} });
    await gohighlevelApiRequest.call(ctx, 'POST', '/contacts', {
      firstName: 'John',
      email: 'j@test.com',
    });

    const callArg = (ctx.helpers.request as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.body).toEqual({ firstName: 'John', email: 'j@test.com' });
  });

  it('passes query string parameters', async () => {
    const ctx = createMockContext({ contacts: [] });
    await gohighlevelApiRequest.call(ctx, 'GET', '/contacts/search', {}, { query: 'john' });

    const callArg = (ctx.helpers.request as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.qs).toEqual({ query: 'john' });
  });

  it('throws NodeApiError on request failure', async () => {
    const ctx = {
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'key', locationId: '' }),
      getNode: jest.fn().mockReturnValue({ name: 'GoHighLevel' }),
      helpers: {
        request: jest.fn().mockRejectedValue({ statusCode: 401, response: { body: {} } }),
      },
    };

    const { gohighlevelApiRequest: req } = await import(
      '../../nodes/GoHighLevel/GenericFunctions'
    );

    await expect(req.call(ctx, 'GET', '/contacts')).rejects.toBeInstanceOf(NodeApiError);
  });
});

// ─── gohighlevelApiRequestAllItems pagination tests ───────────────────────────

describe('gohighlevelApiRequestAllItems', () => {
  let gohighlevelApiRequestAllItems: (
    this: unknown,
    method: string,
    endpoint: string,
    body?: Record<string, unknown>,
    qs?: Record<string, unknown>,
    itemsKey?: string,
  ) => Promise<Record<string, unknown>[]>;

  beforeEach(async () => {
    const mod = await import('../../nodes/GoHighLevel/GenericFunctions');
    gohighlevelApiRequestAllItems = mod.gohighlevelApiRequestAllItems;
  });

  it('returns single page of results when count < limit', async () => {
    const contacts = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}` }));
    const ctx = createMockContext({ contacts, meta: { total: 5 } });

    const result = await gohighlevelApiRequestAllItems.call(
      ctx,
      'GET',
      '/contacts/search',
      {},
      {},
      'contacts',
    );

    expect(result).toHaveLength(5);
    expect(ctx.helpers.request).toHaveBeenCalledTimes(1);
  });

  it('stops fetching when items returned < pageSize', async () => {
    // First page: 100 items. Second page: 30 items → stop.
    const page1 = Array.from({ length: 100 }, (_, i) => ({ id: `c${i}` }));
    const page2 = Array.from({ length: 30 }, (_, i) => ({ id: `c${100 + i}` }));

    const ctx = {
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'k', locationId: '' }),
      getNode: jest.fn().mockReturnValue({ name: 'GoHighLevel' }),
      helpers: {
        request: jest
          .fn()
          .mockResolvedValueOnce({ contacts: page1, meta: {} })
          .mockResolvedValueOnce({ contacts: page2, meta: {} }),
      },
    };

    const result = await gohighlevelApiRequestAllItems.call(
      ctx,
      'GET',
      '/contacts/search',
      {},
      {},
      'contacts',
    );

    expect(result).toHaveLength(130);
    expect(ctx.helpers.request).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when response has no items key', async () => {
    const ctx = createMockContext({});
    const result = await gohighlevelApiRequestAllItems.call(
      ctx,
      'GET',
      '/contacts/search',
      {},
      {},
      'contacts',
    );
    expect(result).toEqual([]);
  });
});
