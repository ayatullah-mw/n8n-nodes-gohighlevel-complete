import { INodeProperties } from 'n8n-workflow';

/** Selector shown in the node UI to choose a Contact operation. */
export const contactOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['contact'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new contact',
        action: 'Create a contact',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a contact by ID',
        action: 'Delete a contact',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve a contact by ID',
        action: 'Get a contact',
      },
      {
        name: 'Search',
        value: 'search',
        description: 'Search contacts by keyword or email',
        action: 'Search contacts',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update an existing contact',
        action: 'Update a contact',
      },
    ],
    default: 'create',
  },
];

/** Fields rendered in the UI for Contact operations. */
export const contactFields: INodeProperties[] = [
  // ─── GET / DELETE / UPDATE ────────────────────────────────────────────────
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['get', 'update', 'delete'],
      },
    },
    description: 'The unique ID of the GoHighLevel contact',
  },

  // ─── CREATE / UPDATE shared fields ────────────────────────────────────────
  {
    displayName: 'First Name',
    name: 'firstName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
    description: "Contact's first name",
  },
  {
    displayName: 'Last Name',
    name: 'lastName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
    description: "Contact's last name",
  },
  {
    displayName: 'Email',
    name: 'email',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
    description: "Contact's email address",
  },
  {
    displayName: 'Phone',
    name: 'phone',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
    description: "Contact's phone number (E.164 format recommended, e.g. +12025551234)",
  },
  {
    displayName: 'Company Name',
    name: 'companyName',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
  },
  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update', 'search'],
      },
    },
    description:
      'Override the default Location ID from credentials. Leave empty to use the credential default.',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['create', 'update'],
      },
    },
    options: [
      {
        displayName: 'Address',
        name: 'address1',
        type: 'string',
        default: '',
        description: 'Street address',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string',
        default: '',
        description: 'ISO 3166-1 alpha-2 country code (e.g. US)',
      },
      {
        displayName: 'Date of Birth',
        name: 'dateOfBirth',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'DND (Do Not Disturb)',
        name: 'dnd',
        type: 'boolean',
        default: false,
        description: 'Whether to mark the contact as Do Not Disturb',
      },
      {
        displayName: 'Source',
        name: 'source',
        type: 'string',
        default: '',
        description: 'Lead source for the contact',
      },
      {
        displayName: 'State',
        name: 'state',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        default: '',
        description: 'Comma-separated list of tags to apply to the contact',
      },
      {
        displayName: 'Website',
        name: 'website',
        type: 'string',
        default: '',
        placeholder: 'https://example.com',
      },
      {
        displayName: 'Postal Code',
        name: 'postalCode',
        type: 'string',
        default: '',
      },
    ],
  },

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  {
    displayName: 'Search Query',
    name: 'query',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['search'],
      },
    },
    description: 'Search term — name, email, phone, or company',
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['search'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 20,
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: {
        resource: ['contact'],
        operation: ['search'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
];
