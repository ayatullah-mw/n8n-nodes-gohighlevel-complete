import { INodeProperties } from 'n8n-workflow';

/** Selector shown in the node UI to choose an Opportunity operation. */
export const opportunityOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['opportunity'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new opportunity',
        action: 'Create an opportunity',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve an opportunity by ID',
        action: 'Get an opportunity',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List opportunities in a pipeline',
        action: 'List opportunities',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update an existing opportunity',
        action: 'Update an opportunity',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete an opportunity by ID',
        action: 'Delete an opportunity',
      },
    ],
    default: 'create',
  },
];

/** Fields rendered in the UI for Opportunity operations. */
export const opportunityFields: INodeProperties[] = [
  // ─── GET / UPDATE / DELETE ────────────────────────────────────────────────
  {
    displayName: 'Opportunity ID',
    name: 'opportunityId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['get', 'update', 'delete'],
      },
    },
    description: 'The unique ID of the GoHighLevel opportunity',
  },

  // ─── CREATE ───────────────────────────────────────────────────────────────
  {
    displayName: 'Opportunity Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['create'],
      },
    },
    description: 'Display name for the opportunity',
  },
  {
    displayName: 'Pipeline',
    name: 'pipelineId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getPipelines',
    },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['create', 'list'],
      },
    },
    description: 'The pipeline to place this opportunity in. Choose from the list.',
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
      show: {
        resource: ['opportunity'],
        operation: ['create'],
      },
    },
    description: 'The stage within the selected pipeline. Depends on Pipeline selection.',
  },
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['create'],
      },
    },
    description: 'The GoHighLevel Contact ID to associate with this opportunity',
  },
  {
    displayName: 'Status',
    name: 'status',
    type: 'options',
    default: 'open',
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['create', 'update'],
      },
    },
    options: [
      { name: 'Open', value: 'open' },
      { name: 'Won', value: 'won' },
      { name: 'Lost', value: 'lost' },
      { name: 'Abandoned', value: 'abandoned' },
    ],
    description: 'Current status of the opportunity',
  },

  // ─── UPDATE additional fields ──────────────────────────────────────────────
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Pipeline Stage',
        name: 'pipelineStageId',
        type: 'string',
        default: '',
        description: 'Stage ID to move the opportunity to',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        default: 'open',
        options: [
          { name: 'Open', value: 'open' },
          { name: 'Won', value: 'won' },
          { name: 'Lost', value: 'lost' },
          { name: 'Abandoned', value: 'abandoned' },
        ],
      },
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
        description: 'GoHighLevel user ID to assign this opportunity to',
      },
    ],
  },

  // ─── CREATE additional fields ──────────────────────────────────────────────
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['create'],
      },
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
        description: 'GoHighLevel user ID to assign this opportunity to',
      },
    ],
  },

  // ─── LIST ─────────────────────────────────────────────────────────────────
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['list'],
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
        resource: ['opportunity'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['opportunity'],
        operation: ['list'],
      },
    },
    options: [
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        default: 'open',
        options: [
          { name: 'Open', value: 'open' },
          { name: 'Won', value: 'won' },
          { name: 'Lost', value: 'lost' },
          { name: 'Abandoned', value: 'abandoned' },
        ],
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Filter by opportunity name',
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
