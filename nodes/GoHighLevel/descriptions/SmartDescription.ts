import { INodeProperties } from 'n8n-workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Contact Identifier block (used across multiple operations)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reusable field group for identifying a contact by ID, email, or phone.
 * At least one identifier is required for operations that need to find a contact.
 */
export const contactIdentifierFields: INodeProperties[] = [
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    default: '',
    description:
      'Existing GoHighLevel Contact ID. If provided, skips duplicate search. Leave empty to look up by Email or Phone.',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['addTags', 'removeTags', 'replaceTags'],
      },
    },
  },
  {
    displayName: 'Email',
    name: 'lookupEmail',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    description: 'Used to find an existing contact when Contact ID is not provided.',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['addTags', 'removeTags', 'replaceTags'],
      },
    },
  },
  {
    displayName: 'Phone',
    name: 'lookupPhone',
    type: 'string',
    default: '',
    description:
      'Used as a fallback lookup after email. Also auto-formatted to E.164.',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['addTags', 'removeTags', 'replaceTags'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource: Contact — Operations
// ─────────────────────────────────────────────────────────────────────────────

export const smartContactOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: { resource: ['contact'] },
    },
    options: [
      {
        name: 'Upsert (Find or Create / Update)',
        value: 'upsert',
        description:
          'Search for a contact by email or phone. Creates it if not found; updates it if found. Phone is auto-formatted to E.164.',
        action: 'Upsert a contact',
      },
      {
        name: 'Add Tags',
        value: 'addTags',
        description: 'Append tags to a contact without overwriting existing ones',
        action: 'Add tags to a contact',
      },
      {
        name: 'Remove Tags',
        value: 'removeTags',
        description: 'Remove specific tags from a contact (others are preserved)',
        action: 'Remove tags from a contact',
      },
      {
        name: 'Replace Tags',
        value: 'replaceTags',
        description: 'Overwrite all tags on a contact with a new set',
        action: 'Replace all tags on a contact',
      },
    ],
    default: 'upsert',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource: Contact — Fields
// ─────────────────────────────────────────────────────────────────────────────

export const smartContactFields: INodeProperties[] = [
  // ─── UPSERT ───────────────────────────────────────────────────────────────

  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
    description:
      'GoHighLevel Sub-Account (Location) ID. Leave empty to use the credential default.',
  },
  {
    displayName: 'Email',
    name: 'email',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
    description:
      'Primary duplicate-check key. If a contact with this email exists, it will be updated.',
  },
  {
    displayName: 'Phone',
    name: 'phone',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
    description:
      'Phone number in any common format — automatically converted to E.164 (e.g. +12025551234). Used as fallback for duplicate check if no email match.',
    hint: 'Auto-formatted: (555) 123-4567 → +15551234567',
  },
  {
    displayName: 'First Name',
    name: 'firstName',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Last Name',
    name: 'lastName',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Company Name',
    name: 'companyName',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Tags',
    name: 'tags',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
    description:
      'Comma-separated tags to apply. On update, these are MERGED with existing tags (not replaced).',
    hint: 'Example: Lead, Hot Lead, Webinar 2025',
    placeholder: 'Lead, Hot Lead, VIP',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['contact'], operation: ['upsert'] },
    },
    options: [
      { displayName: 'Address', name: 'address1', type: 'string', default: '' },
      { displayName: 'City', name: 'city', type: 'string', default: '' },
      { displayName: 'State', name: 'state', type: 'string', default: '' },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string',
        default: '',
        description: 'ISO 3166-1 alpha-2 code, e.g. US',
      },
      { displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
      { displayName: 'Website', name: 'website', type: 'string', default: '' },
      { displayName: 'Source', name: 'source', type: 'string', default: '' },
      { displayName: 'Date of Birth', name: 'dateOfBirth', type: 'dateTime', default: '' },
      {
        displayName: 'DND (Do Not Disturb)',
        name: 'dnd',
        type: 'boolean',
        default: false,
        description: 'Whether to mark the contact as Do Not Disturb',
      },
      {
        displayName: 'Phone Country Code',
        name: 'phoneCountryCode',
        type: 'string',
        default: '1',
        description:
          'Country dialling code (digits only, no +) used when formatting a local phone number. Default is 1 (US/Canada).',
        placeholder: '44',
      },
    ],
  },

  // ─── TAGS (shared: add / remove / replace) ────────────────────────────────

  ...contactIdentifierFields,

  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['addTags', 'removeTags', 'replaceTags'] },
    },
    description: 'Leave empty to use the credential default.',
  },
  {
    displayName: 'Tags',
    name: 'tags',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['contact'], operation: ['addTags', 'removeTags', 'replaceTags'] },
    },
    description: 'Comma-separated list of tags.',
    placeholder: 'Lead, Hot Lead, VIP',
    hint: 'Add Tags merges with existing. Remove Tags subtracts. Replace Tags overwrites all.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource: Pipeline — Operations
// ─────────────────────────────────────────────────────────────────────────────

export const smartPipelineOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: { resource: ['pipeline'] },
    },
    options: [
      {
        name: 'Push Contact',
        value: 'push',
        description:
          'Move a contact into a pipeline stage. Checks for a duplicate opportunity first — updates it if found, creates a new one if not.',
        action: 'Push contact into pipeline',
      },
    ],
    default: 'push',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource: Pipeline — Fields
// ─────────────────────────────────────────────────────────────────────────────

export const smartPipelineFields: INodeProperties[] = [
  // ─── Contact Identification ────────────────────────────────────────────────
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description:
      'GoHighLevel Contact ID. Provide this OR Email/Phone below. Direct ID is faster.',
  },
  {
    displayName: 'Email',
    name: 'lookupEmail',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description: 'Used to find the contact when Contact ID is not provided.',
  },
  {
    displayName: 'Phone',
    name: 'lookupPhone',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description: 'Fallback lookup after email.',
  },
  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description: 'Leave empty to use the credential default.',
  },

  // ─── Pipeline & Stage ─────────────────────────────────────────────────────
  {
    displayName: 'Pipeline',
    name: 'pipelineId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getPipelines' },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description: 'The pipeline to push the contact into. Choose from the list.',
  },
  {
    displayName: 'Stage',
    name: 'pipelineStageId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getPipelineStages',
      loadOptionsDependsOn: ['pipelineId'],
    },
    required: true,
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description: 'Pipeline stage to place or move the opportunity into.',
  },

  // ─── Opportunity Details ───────────────────────────────────────────────────
  {
    displayName: 'Opportunity Name',
    name: 'opportunityName',
    type: 'string',
    default: '',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    description:
      'Name for the deal. If left empty, defaults to the contact\'s full name.',
    placeholder: 'New Deal — {{firstName}} {{lastName}}',
  },
  {
    displayName: 'Status',
    name: 'status',
    type: 'options',
    default: 'open',
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    options: [
      { name: 'Open', value: 'open' },
      { name: 'Won', value: 'won' },
      { name: 'Lost', value: 'lost' },
      { name: 'Abandoned', value: 'abandoned' },
    ],
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['pipeline'], operation: ['push'] },
    },
    options: [
      {
        displayName: 'Monetary Value',
        name: 'monetaryValue',
        type: 'number',
        default: 0,
        description: 'Deal value in the account currency',
      },
      {
        displayName: 'Assigned To (User ID)',
        name: 'assignedTo',
        type: 'string',
        default: '',
      },
    ],
  },
];
