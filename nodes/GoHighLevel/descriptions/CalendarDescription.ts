import { INodeProperties } from 'n8n-workflow';

/** Selector shown in the node UI to choose a Calendar / Appointment operation. */
export const calendarOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['calendar'],
      },
    },
    options: [
      {
        name: 'List Calendars',
        value: 'listCalendars',
        description: 'Retrieve all calendars in the location',
        action: 'List calendars',
      },
      {
        name: 'Create Appointment',
        value: 'createAppointment',
        description: 'Book a new appointment on a calendar',
        action: 'Create an appointment',
      },
      {
        name: 'Get Appointment',
        value: 'getAppointment',
        description: 'Retrieve a specific appointment by ID',
        action: 'Get an appointment',
      },
      {
        name: 'Update Appointment',
        value: 'updateAppointment',
        description: 'Update an existing appointment',
        action: 'Update an appointment',
      },
      {
        name: 'Delete Appointment',
        value: 'deleteAppointment',
        description: 'Delete an appointment by ID',
        action: 'Delete an appointment',
      },
    ],
    default: 'listCalendars',
  },
];

/** Fields rendered in the UI for Calendar / Appointment operations. */
export const calendarFields: INodeProperties[] = [
  // ─── LIST CALENDARS ────────────────────────────────────────────────────────
  {
    displayName: 'Location ID',
    name: 'locationId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['listCalendars'],
      },
    },
    description:
      'Location ID to list calendars for. Defaults to credential Location ID if left empty.',
  },

  // ─── APPOINTMENT ID fields ─────────────────────────────────────────────────
  {
    displayName: 'Appointment ID',
    name: 'appointmentId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['getAppointment', 'updateAppointment', 'deleteAppointment'],
      },
    },
    description: 'The unique ID of the appointment',
  },

  // ─── CREATE APPOINTMENT ────────────────────────────────────────────────────
  {
    displayName: 'Calendar',
    name: 'calendarId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getCalendars',
    },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    description: 'Calendar to book the appointment on. Choose from the list.',
  },
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    description: 'GoHighLevel Contact ID to associate with the appointment',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    description: 'Appointment start date and time (ISO 8601)',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    description: 'Appointment end date and time (ISO 8601)',
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    default: 'Appointment',
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    description: 'Title / subject of the appointment',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['createAppointment'],
      },
    },
    options: [
      {
        displayName: 'Appointment Status',
        name: 'appointmentStatus',
        type: 'options',
        default: 'new',
        options: [
          { name: 'New', value: 'new' },
          { name: 'Confirmed', value: 'confirmed' },
          { name: 'Cancelled', value: 'cancelled' },
          { name: 'Showed', value: 'showed' },
          { name: 'No Show', value: 'noshow' },
        ],
      },
      {
        displayName: 'Location (Meeting URL or Address)',
        name: 'address',
        type: 'string',
        default: '',
        description: 'Physical address or virtual meeting URL',
      },
      {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        default: '',
        typeOptions: { rows: 3 },
      },
    ],
  },

  // ─── UPDATE APPOINTMENT ────────────────────────────────────────────────────
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['calendar'],
        operation: ['updateAppointment'],
      },
    },
    options: [
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Start Time',
        name: 'startTime',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'End Time',
        name: 'endTime',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'Appointment Status',
        name: 'appointmentStatus',
        type: 'options',
        default: 'confirmed',
        options: [
          { name: 'New', value: 'new' },
          { name: 'Confirmed', value: 'confirmed' },
          { name: 'Cancelled', value: 'cancelled' },
          { name: 'Showed', value: 'showed' },
          { name: 'No Show', value: 'noshow' },
        ],
      },
      {
        displayName: 'Notes',
        name: 'notes',
        type: 'string',
        default: '',
        typeOptions: { rows: 3 },
      },
    ],
  },
];
