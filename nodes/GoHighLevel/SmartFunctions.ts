import { IDataObject } from 'n8n-workflow';
import { GhlContext, gohighlevelApiRequest } from './GenericFunctions';

// ─────────────────────────────────────────────────────────────────────────────
// Phone Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a raw phone string to E.164 format.
 *
 * Rules:
 *  - Already E.164 (starts with +) → strip spaces/dashes only
 *  - 10 digits → prepend +<defaultCountryCode> (default: US +1)
 *  - 11 digits starting with 1 → prepend +
 *  - Any other digit count → prepend + and leave as-is
 *
 * @param raw - Raw phone string in any common format
 * @param defaultCountryCode - Numeric country code without + (default '1' for US/CA)
 * @returns E.164-formatted phone string, or original value if blank
 *
 * @example
 * formatPhoneE164('(555) 123-4567')      // '+15551234567'
 * formatPhoneE164('555-123-4567')        // '+15551234567'
 * formatPhoneE164('+44 20 7946 0958')    // '+442079460958'
 * formatPhoneE164('15551234567')         // '+15551234567'
 */
export function formatPhoneE164(raw: string, defaultCountryCode = '1'): string {
  if (!raw || raw.trim() === '') return raw;

  const trimmed = raw.trim();

  // Already E.164 — just clean whitespace/dashes
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/[\s\-().]/g, '');
  }

  // Extract only digits
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 0) return raw;

  // 10-digit: assume defaultCountryCode
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  // 11-digit starting with '1': US/Canada with leading country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Everything else: prefix with + and hope for the best
  return `+${digits}`;
}

/**
 * Returns true if the string looks like a valid E.164 phone number.
 *
 * @param phone - String to validate
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate / Contact Lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to find an existing GoHighLevel contact by email, then by phone.
 *
 * Search priority:
 *  1. If `contactId` is provided, fetch it directly (fastest, most reliable).
 *  2. Search by `email` — exact match in results.
 *  3. Search by formatted `phone` — exact match in results.
 *  4. Return `null` if no match found.
 *
 * @param this - n8n execution context
 * @param locationId - GHL Location ID
 * @param contactId - Optional explicit Contact ID (skips search)
 * @param email - Optional email to search by
 * @param phone - Optional raw phone number to search by (auto-formatted)
 * @returns Found contact IDataObject, or null if not found
 */
export async function findContactByIdentifier(
  this: GhlContext,
  locationId: string,
  contactId?: string,
  email?: string,
  phone?: string,
): Promise<IDataObject | null> {
  // Fast path: direct lookup by ID
  if (contactId && contactId.trim() !== '') {
    try {
      const res = await gohighlevelApiRequest.call(
        this,
        'GET',
        `/contacts/${contactId.trim()}`,
      );
      return (res.contact as IDataObject) ?? null;
    } catch {
      return null;
    }
  }

  // Search by email (most unique identifier)
  if (email && email.trim() !== '') {
    const res = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/contacts/search',
      {},
      { query: email.trim(), locationId, limit: 10 },
    );
    const contacts = (res.contacts as IDataObject[]) ?? [];
    const match = contacts.find(
      (c) => (c.email as string | undefined)?.toLowerCase() === email.trim().toLowerCase(),
    );
    if (match) return match;
  }

  // Fall back: search by formatted phone
  if (phone && phone.trim() !== '') {
    const formattedPhone = formatPhoneE164(phone.trim());
    const res = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/contacts/search',
      {},
      { query: formattedPhone, locationId, limit: 10 },
    );
    const contacts = (res.contacts as IDataObject[]) ?? [];
    const match = contacts.find((c) => {
      const cPhone = formatPhoneE164((c.phone as string | undefined) ?? '');
      return cPhone === formattedPhone;
    });
    if (match) return match;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a raw comma-separated tag string into a trimmed, deduped array.
 *
 * @param raw - Comma-separated tag string, e.g. "Lead, Hot Lead, VIP"
 * @returns Array of unique, non-empty tag strings
 */
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split(',').map((t) => t.trim()).filter(Boolean))];
}

/**
 * Merges new tags into an existing tag array (deduped, case-insensitive).
 *
 * @param existing - Current tags on the contact
 * @param toAdd - Tags to add
 * @returns Merged, deduped array
 */
export function mergeTags(existing: string[], toAdd: string[]): string[] {
  const lower = new Set(existing.map((t) => t.toLowerCase()));
  const result = [...existing];
  for (const tag of toAdd) {
    if (!lower.has(tag.toLowerCase())) {
      result.push(tag);
      lower.add(tag.toLowerCase());
    }
  }
  return result;
}

/**
 * Removes specified tags from an existing tag array (case-insensitive).
 *
 * @param existing - Current tags on the contact
 * @param toRemove - Tags to remove
 * @returns Filtered array with specified tags excluded
 */
export function removeTags(existing: string[], toRemove: string[]): string[] {
  const removeSet = new Set(toRemove.map((t) => t.toLowerCase()));
  return existing.filter((t) => !removeSet.has(t.toLowerCase()));
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline / Opportunity Lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Searches for an existing opportunity for a contact within a specific pipeline.
 *
 * Used by the "Push to Pipeline" operation to avoid creating duplicate deals.
 *
 * @param this - n8n execution context
 * @param contactId - GHL Contact ID
 * @param pipelineId - GHL Pipeline ID to scope the search
 * @returns First matching opportunity, or null if none exist
 */
export async function findExistingOpportunity(
  this: GhlContext,
  contactId: string,
  pipelineId: string,
): Promise<IDataObject | null> {
  const res = await gohighlevelApiRequest.call(
    this,
    'GET',
    '/opportunities/search',
    {},
    { contactId, pipelineId, limit: 10 },
  );
  const opps = (res.opportunities as IDataObject[]) ?? [];
  return opps.length > 0 ? opps[0] : null;
}
