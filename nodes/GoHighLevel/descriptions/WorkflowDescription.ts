import { INodeProperties } from 'n8n-workflow';

/** Selector shown in the node UI to choose a Workflow operation. */
export const workflowOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['workflow'],
      },
    },
    options: [
      {
        name: 'List',
        value: 'list',
        description: 'List all workflows in a location',
        action: 'List workflows',
      },
      {
        name: 'Trigger for Contact',
        value: 'trigger',
        description: 'Enroll a contact into a workflow',
        action: 'Trigger a workflow for a contact',
      },
    ],
    default: 'list',
  },
];

/** Fields rendered in the UI for Workflow operations. */
export const workflowFields: INodeProperties[] = [
  // ─── LIST ─────────────────────────────────────────────────────────────────
  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['workflow'],
        operation: ['list'],
      },
    },
    description:
      'Location ID to list workflows for. Leave empty to use the credential default.',
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['workflow'],
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
        resource: ['workflow'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },

  // ─── TRIGGER ──────────────────────────────────────────────────────────────
  {
    displayName: 'Workflow',
    name: 'workflowId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getWorkflows',
    },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['workflow'],
        operation: ['trigger'],
      },
    },
    description: 'The workflow to enroll the contact into. Choose from the list.',
  },
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['workflow'],
        operation: ['trigger'],
      },
    },
    description: 'The GoHighLevel Contact ID to enroll into the workflow',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['workflow'],
        operation: ['trigger'],
      },
    },
    options: [
      {
        displayName: 'Event Start Time',
        name: 'eventStartTime',
        type: 'dateTime',
        default: '',
        description: 'Optional event start time to pass into the workflow',
      },
    ],
  },
];
