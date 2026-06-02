import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IDataObject,
} from 'n8n-workflow';

import {
  gohighlevelApiRequest,
  gohighlevelApiRequestAllItems,
  buildBody,
} from './GenericFunctions';

import { contactOperations, contactFields } from './descriptions/ContactDescription';
import { opportunityOperations, opportunityFields } from './descriptions/OpportunityDescription';
import { calendarOperations, calendarFields } from './descriptions/CalendarDescription';
import { workflowOperations, workflowFields } from './descriptions/WorkflowDescription';

export class GoHighLevel implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GoHighLevel',
    name: 'goHighLevel',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    icon: 'file:GoHighLevel.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the GoHighLevel CRM API v2',
    defaults: {
      name: 'GoHighLevel',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'goHighLevelApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://services.leadconnectorhq.com',
      headers: {
        Version: '2021-07-28',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      // ─── Resource Selector ──────────────────────────────────────────────────
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Contact',
            value: 'contact',
            description: 'Manage CRM contacts',
          },
          {
            name: 'Opportunity',
            value: 'opportunity',
            description: 'Manage pipeline opportunities / deals',
          },
          {
            name: 'Calendar',
            value: 'calendar',
            description: 'Manage calendars and appointments',
          },
          {
            name: 'Workflow',
            value: 'workflow',
            description: 'List and trigger automation workflows',
          },
        ],
        default: 'contact',
      },
      // ─── Resource-specific Operations & Fields ──────────────────────────────
      ...contactOperations,
      ...contactFields,
      ...opportunityOperations,
      ...opportunityFields,
      ...calendarOperations,
      ...calendarFields,
      ...workflowOperations,
      ...workflowFields,
    ],
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Dynamic dropdown loaders
  // ───────────────────────────────────────────────────────────────────────────

  methods = {
    loadOptions: {
      /**
       * Load all pipelines for the current location.
       * Used by Opportunity → Pipeline dropdown.
       */
      async getPipelines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId = (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);

        if (!locationId) {
          throw new NodeOperationError(
            this.getNode(),
            'Location ID is required to load pipelines. Set it in credentials or the node.',
          );
        }

        const response = await gohighlevelApiRequest.call(
          this,
          'GET',
          '/opportunities/pipelines',
          {},
          { locationId },
        );

        const pipelines = (response.pipelines as IDataObject[]) ?? [];
        return pipelines.map((p) => ({
          name: p.name as string,
          value: p.id as string,
        }));
      },

      /**
       * Load stages for the currently selected pipeline.
       * Used by Opportunity → Stage dropdown.
       */
      async getPipelineStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId = (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);
        const pipelineId = this.getCurrentNodeParameter('pipelineId') as string;

        if (!pipelineId) {
          return [];
        }

        const response = await gohighlevelApiRequest.call(
          this,
          'GET',
          '/opportunities/pipelines',
          {},
          { locationId },
        );

        const pipelines = (response.pipelines as IDataObject[]) ?? [];
        const pipeline = pipelines.find((p) => p.id === pipelineId);
        const stages = (pipeline?.stages as IDataObject[]) ?? [];

        return stages.map((s) => ({
          name: s.name as string,
          value: s.id as string,
        }));
      },

      /**
       * Load all calendars for the current location.
       * Used by Calendar → Calendar dropdown.
       */
      async getCalendars(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId = (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);

        const response = await gohighlevelApiRequest.call(
          this,
          'GET',
          '/calendars',
          {},
          { locationId },
        );

        const calendars = (response.calendars as IDataObject[]) ?? [];
        return calendars.map((c) => ({
          name: c.name as string,
          value: c.id as string,
        }));
      },

      /**
       * Load all workflows for the current location.
       * Used by Workflow → Workflow dropdown.
       */
      async getWorkflows(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId = (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);

        const response = await gohighlevelApiRequest.call(
          this,
          'GET',
          '/workflows',
          {},
          { locationId },
        );

        const workflows = (response.workflows as IDataObject[]) ?? [];
        return workflows.map((w) => ({
          name: w.name as string,
          value: w.id as string,
        }));
      },
    },
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Execute
  // ───────────────────────────────────────────────────────────────────────────

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('goHighLevelApi');
    const defaultLocationId = credentials.locationId as string;

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[];

        // ─── CONTACTS ─────────────────────────────────────────────────────────
        if (resource === 'contact') {
          responseData = await executeContact.call(this, operation, i, defaultLocationId);
        }
        // ─── OPPORTUNITIES ────────────────────────────────────────────────────
        else if (resource === 'opportunity') {
          responseData = await executeOpportunity.call(this, operation, i, defaultLocationId);
        }
        // ─── CALENDARS ────────────────────────────────────────────────────────
        else if (resource === 'calendar') {
          responseData = await executeCalendar.call(this, operation, i, defaultLocationId);
        }
        // ─── WORKFLOWS ────────────────────────────────────────────────────────
        else if (resource === 'workflow') {
          responseData = await executeWorkflow.call(this, operation, i, defaultLocationId);
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
            itemIndex: i,
          });
        }

        // Normalise to array
        const outputItems = Array.isArray(responseData) ? responseData : [responseData];
        returnData.push(
          ...outputItems.map((item) => ({
            json: item,
            pairedItem: { item: i },
          })),
        );
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource handler functions
// ─────────────────────────────────────────────────────────────────────────────

async function executeContact(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject | IDataObject[]> {
  if (operation === 'create') {
    const locationId =
      (this.getNodeParameter('locationId', i) as string) || defaultLocationId;
    const body = buildBody({
      firstName: this.getNodeParameter('firstName', i) as string,
      lastName: this.getNodeParameter('lastName', i) as string,
      email: this.getNodeParameter('email', i) as string,
      phone: this.getNodeParameter('phone', i) as string,
      companyName: this.getNodeParameter('companyName', i) as string,
      locationId,
    });

    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
    if (additionalFields.tags) {
      body.tags = (additionalFields.tags as string).split(',').map((t) => t.trim());
      delete additionalFields.tags;
    }
    Object.assign(body, additionalFields);

    const response = await gohighlevelApiRequest.call(this, 'POST', '/contacts', body);
    return (response.contact as IDataObject) ?? response;
  }

  if (operation === 'get') {
    const contactId = this.getNodeParameter('contactId', i) as string;
    const response = await gohighlevelApiRequest.call(this, 'GET', `/contacts/${contactId}`);
    return (response.contact as IDataObject) ?? response;
  }

  if (operation === 'update') {
    const contactId = this.getNodeParameter('contactId', i) as string;
    const body = buildBody({
      firstName: this.getNodeParameter('firstName', i) as string,
      lastName: this.getNodeParameter('lastName', i) as string,
      email: this.getNodeParameter('email', i) as string,
      phone: this.getNodeParameter('phone', i) as string,
      companyName: this.getNodeParameter('companyName', i) as string,
    });

    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
    if (additionalFields.tags) {
      body.tags = (additionalFields.tags as string).split(',').map((t) => t.trim());
      delete additionalFields.tags;
    }
    Object.assign(body, additionalFields);

    const response = await gohighlevelApiRequest.call(
      this,
      'PUT',
      `/contacts/${contactId}`,
      body,
    );
    return (response.contact as IDataObject) ?? response;
  }

  if (operation === 'delete') {
    const contactId = this.getNodeParameter('contactId', i) as string;
    await gohighlevelApiRequest.call(this, 'DELETE', `/contacts/${contactId}`);
    return { success: true, id: contactId };
  }

  if (operation === 'search') {
    const query = this.getNodeParameter('query', i) as string;
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;
    const locationId = (this.getNodeParameter('locationId', i) as string) || defaultLocationId;

    if (returnAll) {
      return gohighlevelApiRequestAllItems.call(
        this,
        'GET',
        '/contacts/search',
        {},
        { query, locationId },
        'contacts',
      );
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/contacts/search',
      {},
      { query, locationId, limit },
    );
    return (response.contacts as IDataObject[]) ?? [];
  }

  throw new NodeOperationError(this.getNode(), `Unknown contact operation: ${operation}`, {
    itemIndex: i,
  });
}

async function executeOpportunity(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject | IDataObject[]> {
  if (operation === 'create') {
    const pipelineId = this.getNodeParameter('pipelineId', i) as string;
    const pipelineStageId = this.getNodeParameter('pipelineStageId', i) as string;
    const contactId = this.getNodeParameter('contactId', i) as string;
    const status = this.getNodeParameter('status', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    const body = buildBody({
      pipelineId,
      pipelineStageId,
      contactId,
      status,
      name: this.getNodeParameter('name', i) as string,
      ...additionalFields,
    });

    const response = await gohighlevelApiRequest.call(this, 'POST', '/opportunities', body);
    return (response.opportunity as IDataObject) ?? response;
  }

  if (operation === 'get') {
    const opportunityId = this.getNodeParameter('opportunityId', i) as string;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      `/opportunities/${opportunityId}`,
    );
    return (response.opportunity as IDataObject) ?? response;
  }

  if (operation === 'update') {
    const opportunityId = this.getNodeParameter('opportunityId', i) as string;
    const status = this.getNodeParameter('status', i) as string;
    const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
    const body = buildBody({ status, ...updateFields });
    const response = await gohighlevelApiRequest.call(
      this,
      'PUT',
      `/opportunities/${opportunityId}`,
      body,
    );
    return (response.opportunity as IDataObject) ?? response;
  }

  if (operation === 'delete') {
    const opportunityId = this.getNodeParameter('opportunityId', i) as string;
    await gohighlevelApiRequest.call(this, 'DELETE', `/opportunities/${opportunityId}`);
    return { success: true, id: opportunityId };
  }

  if (operation === 'list') {
    const pipelineId = this.getNodeParameter('pipelineId', i) as string;
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;
    const filters = this.getNodeParameter('filters', i) as IDataObject;
    const qs: IDataObject = { pipelineId, ...filters };

    if (returnAll) {
      return gohighlevelApiRequestAllItems.call(
        this,
        'GET',
        '/opportunities/search',
        {},
        qs,
        'opportunities',
      );
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/opportunities/search',
      {},
      { ...qs, limit },
    );
    return (response.opportunities as IDataObject[]) ?? [];
  }

  throw new NodeOperationError(this.getNode(), `Unknown opportunity operation: ${operation}`, {
    itemIndex: i,
  });
}

async function executeCalendar(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject | IDataObject[]> {
  if (operation === 'listCalendars') {
    const locationId =
      (this.getNodeParameter('locationId', i) as string) || defaultLocationId;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/calendars',
      {},
      { locationId },
    );
    return (response.calendars as IDataObject[]) ?? [];
  }

  if (operation === 'createAppointment') {
    const calendarId = this.getNodeParameter('calendarId', i) as string;
    const contactId = this.getNodeParameter('contactId', i) as string;
    const startTime = this.getNodeParameter('startTime', i) as string;
    const endTime = this.getNodeParameter('endTime', i) as string;
    const title = this.getNodeParameter('title', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    const body = buildBody({
      calendarId,
      contactId,
      startTime,
      endTime,
      title,
      ...additionalFields,
    });

    const response = await gohighlevelApiRequest.call(
      this,
      'POST',
      '/calendars/events/appointments',
      body,
    );
    return (response.appointment as IDataObject) ?? response;
  }

  if (operation === 'getAppointment') {
    const appointmentId = this.getNodeParameter('appointmentId', i) as string;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      `/calendars/events/appointments/${appointmentId}`,
    );
    return (response.appointment as IDataObject) ?? response;
  }

  if (operation === 'updateAppointment') {
    const appointmentId = this.getNodeParameter('appointmentId', i) as string;
    const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
    const body = buildBody({ ...updateFields });
    const response = await gohighlevelApiRequest.call(
      this,
      'PUT',
      `/calendars/events/appointments/${appointmentId}`,
      body,
    );
    return (response.appointment as IDataObject) ?? response;
  }

  if (operation === 'deleteAppointment') {
    const appointmentId = this.getNodeParameter('appointmentId', i) as string;
    await gohighlevelApiRequest.call(
      this,
      'DELETE',
      `/calendars/events/appointments/${appointmentId}`,
    );
    return { success: true, id: appointmentId };
  }

  throw new NodeOperationError(this.getNode(), `Unknown calendar operation: ${operation}`, {
    itemIndex: i,
  });
}

async function executeWorkflow(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject | IDataObject[]> {
  if (operation === 'list') {
    const locationId =
      (this.getNodeParameter('locationId', i) as string) || defaultLocationId;
    const returnAll = this.getNodeParameter('returnAll', i) as boolean;

    if (returnAll) {
      return gohighlevelApiRequestAllItems.call(
        this,
        'GET',
        '/workflows',
        {},
        { locationId },
        'workflows',
      );
    }

    const limit = this.getNodeParameter('limit', i) as number;
    const response = await gohighlevelApiRequest.call(
      this,
      'GET',
      '/workflows',
      {},
      { locationId, limit },
    );
    return (response.workflows as IDataObject[]) ?? [];
  }

  if (operation === 'trigger') {
    const workflowId = this.getNodeParameter('workflowId', i) as string;
    const contactId = this.getNodeParameter('contactId', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    const body = buildBody({ contactId, ...additionalFields });
    const response = await gohighlevelApiRequest.call(
      this,
      'POST',
      `/workflows/${workflowId}/subscribe`,
      body,
    );
    return response;
  }

  throw new NodeOperationError(this.getNode(), `Unknown workflow operation: ${operation}`, {
    itemIndex: i,
  });
}
