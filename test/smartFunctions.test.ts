/**
 * Tests for SmartFunctions utilities.
 *
 * Covers:
 * - formatPhoneE164: various input formats
 * - isValidE164: validation
 * - parseTags / mergeTags / removeTags: tag set operations
 * - findContactByIdentifier: lookup priority (contactId → email → phone)
 * - findExistingOpportunity: returns first match or null
 */

import {
  formatPhoneE164,
  isValidE164,
  parseTags,
  mergeTags,
  removeTags,
  findContactByIdentifier,
  findExistingOpportunity,
} from '../nodes/GoHighLevel/SmartFunctions';

import type { INode } from 'n8n-workflow';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(name = 'GoHighLevel'): INode {
  return {
    id: 'test-node-id',
    name,
    type: 'goHighLevelSmart',
    typeVersion: 1,
    position: [0, 0],
    parameters: {},
  } as INode;
}

function makeContext(requestFn: jest.Mock) {
  return {
    getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-key', locationId: 'loc-123' }),
    getNode: jest.fn().mockReturnValue(makeNode()),
    helpers: { request: requestFn },
  };
}

// ─── formatPhoneE164 ──────────────────────────────────────────────────────────

describe('formatPhoneE164', () => {
  it('converts 10-digit US number to E.164', () => {
    expect(formatPhoneE164('5551234567')).toBe('+15551234567');
  });

  it('handles formatted US number (555) 123-4567', () => {
    expect(formatPhoneE164('(555) 123-4567')).toBe('+15551234567');
  });

  it('handles dashes: 555-123-4567', () => {
    expect(formatPhoneE164('555-123-4567')).toBe('+15551234567');
  });

  it('handles 11-digit number starting with 1', () => {
    expect(formatPhoneE164('15551234567')).toBe('+15551234567');
  });

  it('preserves existing E.164 format', () => {
    expect(formatPhoneE164('+15551234567')).toBe('+15551234567');
  });

  it('strips spaces from E.164 with spaces', () => {
    expect(formatPhoneE164('+44 20 7946 0958')).toBe('+442079460958');
  });

  it('applies custom country code for non-US numbers', () => {
    expect(formatPhoneE164('2079460958', '44')).toBe('+442079460958');
  });

  it('returns original for empty string', () => {
    expect(formatPhoneE164('')).toBe('');
  });

  it('handles number with dots: 555.123.4567', () => {
    expect(formatPhoneE164('555.123.4567')).toBe('+15551234567');
  });
});

// ─── isValidE164 ─────────────────────────────────────────────────────────────

describe('isValidE164', () => {
  it('returns true for valid E.164', () => {
    expect(isValidE164('+15551234567')).toBe(true);
    expect(isValidE164('+442079460958')).toBe(true);
  });

  it('returns false for missing +', () => {
    expect(isValidE164('15551234567')).toBe(false);
  });

  it('returns false for too short number', () => {
    expect(isValidE164('+1234')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidE164('')).toBe(false);
  });
});

// ─── parseTags ────────────────────────────────────────────────────────────────

describe('parseTags', () => {
  it('splits comma-separated tags', () => {
    expect(parseTags('Lead, Hot Lead, VIP')).toEqual(['Lead', 'Hot Lead', 'VIP']);
  });

  it('deduplicates tags', () => {
    expect(parseTags('Lead, Lead, VIP')).toEqual(['Lead', 'VIP']);
  });

  it('trims whitespace', () => {
    expect(parseTags('  Lead  ,  VIP  ')).toEqual(['Lead', 'VIP']);
  });

  it('filters empty segments', () => {
    expect(parseTags('Lead,,VIP')).toEqual(['Lead', 'VIP']);
  });

  it('handles single tag', () => {
    expect(parseTags('Lead')).toEqual(['Lead']);
  });

  it('returns empty array for empty string', () => {
    expect(parseTags('')).toEqual([]);
  });
});

// ─── mergeTags ────────────────────────────────────────────────────────────────

describe('mergeTags', () => {
  it('adds new tags not in existing', () => {
    expect(mergeTags(['Lead'], ['VIP', 'Hot Lead'])).toEqual(['Lead', 'VIP', 'Hot Lead']);
  });

  it('skips tags already present (case-insensitive)', () => {
    expect(mergeTags(['Lead', 'VIP'], ['vip', 'New'])).toEqual(['Lead', 'VIP', 'New']);
  });

  it('returns existing tags when nothing new to add', () => {
    expect(mergeTags(['Lead'], ['lead'])).toEqual(['Lead']);
  });

  it('handles empty existing tags', () => {
    expect(mergeTags([], ['Lead', 'VIP'])).toEqual(['Lead', 'VIP']);
  });

  it('handles empty incoming tags', () => {
    expect(mergeTags(['Lead'], [])).toEqual(['Lead']);
  });
});

// ─── removeTags ───────────────────────────────────────────────────────────────

describe('removeTags', () => {
  it('removes specified tags', () => {
    expect(removeTags(['Lead', 'VIP', 'Hot Lead'], ['VIP'])).toEqual(['Lead', 'Hot Lead']);
  });

  it('is case-insensitive', () => {
    expect(removeTags(['Lead', 'VIP'], ['vip'])).toEqual(['Lead']);
  });

  it('removes all tags if all specified', () => {
    expect(removeTags(['Lead', 'VIP'], ['Lead', 'VIP'])).toEqual([]);
  });

  it('returns existing if none match', () => {
    expect(removeTags(['Lead'], ['Unrelated'])).toEqual(['Lead']);
  });

  it('handles empty existing', () => {
    expect(removeTags([], ['Lead'])).toEqual([]);
  });
});

// ─── findContactByIdentifier ─────────────────────────────────────────────────

describe('findContactByIdentifier', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches by contactId directly when provided', async () => {
    const contact = { id: 'c1', email: 'a@b.com' };
    const requestFn = jest.fn().mockResolvedValue({ contact });
    const ctx = makeContext(requestFn);

    const result = await findContactByIdentifier.call(ctx, 'loc1', 'c1');
    expect(requestFn).toHaveBeenCalledWith(
      expect.objectContaining({ uri: expect.stringContaining('/contacts/c1') }),
    );
    expect(result).toEqual(contact);
  });

  it('returns null when contactId fetch throws', async () => {
    const requestFn = jest.fn().mockRejectedValue(new Error('404'));
    const ctx = makeContext(requestFn);

    const result = await findContactByIdentifier.call(ctx, 'loc1', 'bad-id');
    expect(result).toBeNull();
  });

  it('searches by email when no contactId', async () => {
    const contact = { id: 'c2', email: 'found@test.com' };
    const requestFn = jest.fn().mockResolvedValue({ contacts: [contact] });
    const ctx = makeContext(requestFn);

    const result = await findContactByIdentifier.call(
      ctx,
      'loc1',
      undefined,
      'found@test.com',
    );
    expect(result).toEqual(contact);
  });

  it('returns null when email search yields no exact match', async () => {
    const requestFn = jest.fn().mockResolvedValue({ contacts: [] });
    const ctx = makeContext(requestFn);

    const result = await findContactByIdentifier.call(
      ctx,
      'loc1',
      undefined,
      'notfound@test.com',
    );
    expect(result).toBeNull();
  });

  it('falls back to phone search when email not provided', async () => {
    const contact = { id: 'c3', phone: '+15551234567' };
    const requestFn = jest.fn().mockResolvedValue({ contacts: [contact] });
    const ctx = makeContext(requestFn);

    const result = await findContactByIdentifier.call(
      ctx,
      'loc1',
      undefined,
      undefined,
      '5551234567',
    );
    expect(result).toEqual(contact);
  });
});

// ─── findExistingOpportunity ─────────────────────────────────────────────────

describe('findExistingOpportunity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns first opportunity when found', async () => {
    const opp = { id: 'opp-001', contactId: 'c1', pipelineId: 'pipe-001' };
    const requestFn = jest.fn().mockResolvedValue({ opportunities: [opp] });
    const ctx = makeContext(requestFn);

    const result = await findExistingOpportunity.call(ctx, 'c1', 'pipe-001');
    expect(result).toEqual(opp);
  });

  it('returns null when no opportunities found', async () => {
    const requestFn = jest.fn().mockResolvedValue({ opportunities: [] });
    const ctx = makeContext(requestFn);

    const result = await findExistingOpportunity.call(ctx, 'c1', 'pipe-001');
    expect(result).toBeNull();
  });

  it('passes contactId and pipelineId as query params', async () => {
    const requestFn = jest.fn().mockResolvedValue({ opportunities: [] });
    const ctx = makeContext(requestFn);

    await findExistingOpportunity.call(ctx, 'contact-abc', 'pipeline-xyz');
    expect(requestFn).toHaveBeenCalledWith(
      expect.objectContaining({
        qs: expect.objectContaining({
          contactId: 'contact-abc',
          pipelineId: 'pipeline-xyz',
        }),
      }),
    );
  });
});
