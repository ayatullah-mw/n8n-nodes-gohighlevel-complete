import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
  IDataObject,
} from 'n8n-workflow';

import { gohighlevelApiRequest, buildBody } from './GenericFunctions';
import {
  formatPhoneE164,
  parseTags,
  mergeTags,
  removeTags,
  findContactByIdentifier,
  findExistingOpportunity,
} from './SmartFunctions';

import {
  smartContactOperations,
  smartContactFields,
  smartPipelineOperations,
  smartPipelineFields,
} from './descriptions/SmartDescription';

/**
 * GoHighLevel Smart node.
 *
 * Wraps the GoHighLevel API with intelligent, opinionated operations:
 *
 * - **Upsert Contact** — duplicate-checked create-or-update with automatic
 *   E.164 phone formatting and tag merging.
 * - **Add / Remove / Replace Tags** — non-destructive tag management that
 *   fetches existing tags first.
 * - **Push to Pipeline** — finds an existing opportunity for the contact in
 *   the target pipeline and updates it; creates a new one only when needed.
 *
 * Designed to be used alongside the raw `GoHighLevel` node, not replace it.
 */
export class GoHighLevelSmart implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GoHighLevel (Smart)',
    name: 'goHighLevelSmart',
    icon: 'file:GoHighLevel.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Smart GoHighLevel operations: duplicate-safe contact upsert, tag management, and pipeline push with E.164 phone formatting.',
    defaults: { name: 'GoHighLevel Smart' },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [{ name: 'goHighLevelApi', required: true }],
    properties: [
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Contact',
            value: 'contact',
            description: 'Smart contact operations (upsert, tag management)',
          },
          {
            name: 'Pipeline',
            value: 'pipeline',
            description: 'Push a contact into a pipeline stage (creates or updates)',
          },
        ],
        default: 'contact',
      },
      ...smartContactOperations,
      ...smartContactFields,
      ...smartPipelineOperations,
      ...smartPipelineFields,
    ],
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Dynamic dropdown loaders (shared with GoHighLevel.node.ts)
  // ───────────────────────────────────────────────────────────────────────────

  methods = {
    loadOptions: {
      /** Load all pipelines for the current location. */
      async getPipelines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId =
          (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);

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

      /** Load stages for the selected pipeline. */
      async getPipelineStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('goHighLevelApi');
        const locationId =
          (this.getCurrentNodeParameter('locationId') as string) ||
          (credentials.locationId as string);
        const pipelineId = this.getCurrentNodeParameter('pipelineId') as string;

        if (!pipelineId) return [];

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

        if (resource === 'contact') {
          responseData = await executeSmartContact.call(
            this,
            operation,
            i,
            defaultLocationId,
          );
        } else if (resource === 'pipeline') {
          responseData = await executeSmartPipeline.call(
            this,
            operation,
            i,
            defaultLocationId,
          );
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
            itemIndex: i,
          });
        }

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
// Smart Contact Handler
// ─────────────────────────────────────────────────────────────────────────────

async function executeSmartContact(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject> {
  // ─── UPSERT ───────────────────────────────────────────────────────────────
  if (operation === 'upsert') {
    const locationId =
      (this.getNodeParameter('locationId', i) as string) || defaultLocationId;
    const email = this.getNodeParameter('email', i) as string;
    const rawPhone = this.getNodeParameter('phone', i) as string;
    const firstName = this.getNodeParameter('firstName', i) as string;
    const lastName = this.getNodeParameter('lastName', i) as string;
    const companyName = this.getNodeParameter('companyName', i) as string;
    const rawTags = this.getNodeParameter('tags', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    // Format phone to E.164
    const phoneCountryCode = (additionalFields.phoneCountryCode as string) || '1';
    delete additionalFields.phoneCountryCode;

    const phone = rawPhone ? formatPhoneE164(rawPhone, phoneCountryCode) : '';

    // ── Duplicate check ────────────────────────────────────────────────────
    const existing = await findContactByIdentifier.call(
      this,
      locationId,
      undefined, // no direct ID on upsert — we always search
      email || undefined,
      phone || undefined,
    );

    const incomingTags = rawTags ? parseTags(rawTags) : [];

    if (existing) {
      // ── UPDATE path ──────────────────────────────────────────────────────
      const contactId = existing.id as string;

      // Merge tags: existing + incoming (deduped, case-insensitive)
      const existingTags = (existing.tags as string[]) ?? [];
      const mergedTags = incomingTags.length > 0 ? mergeTags(existingTags, incomingTags) : existingTags;

      const body = buildBody({
        firstName,
        lastName,
        email,
        phone,
        companyName,
        tags: mergedTags.length > 0 ? mergedTags : undefined,
        ...additionalFields,
      });

      const res = await gohighlevelApiRequest.call(
        this,
        'PUT',
        `/contacts/${contactId}`,
        body,
      );
      const updated = (res.contact as IDataObject) ?? res;
      return {
        ...updated,
        _upsertAction: 'updated',
        _duplicateFound: true,
        _formattedPhone: phone || undefined,
      };
    } else {
      // ── CREATE path ──────────────────────────────────────────────────────
      const body = buildBody({
        firstName,
        lastName,
        email,
        phone,
        companyName,
        locationId,
        tags: incomingTags.length > 0 ? incomingTags : undefined,
        ...additionalFields,
      });

      const res = await gohighlevelApiRequest.call(this, 'POST', '/contacts', body);
      const created = (res.contact as IDataObject) ?? res;
      return {
        ...created,
        _upsertAction: 'created',
        _duplicateFound: false,
        _formattedPhone: phone || undefined,
      };
    }
  }

  // ─── ADD TAGS ─────────────────────────────────────────────────────────────
  if (operation === 'addTags') {
    return tagOperation.call(this, i, defaultLocationId, 'add');
  }

  // ─── REMOVE TAGS ──────────────────────────────────────────────────────────
  if (operation === 'removeTags') {
    return tagOperation.call(this, i, defaultLocationId, 'remove');
  }

  // ─── REPLACE TAGS ─────────────────────────────────────────────────────────
  if (operation === 'replaceTags') {
    return tagOperation.call(this, i, defaultLocationId, 'replace');
  }

  throw new NodeOperationError(
    this.getNode(),
    `Unknown contact operation: ${operation}`,
    { itemIndex: i },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Operation Helper
// ─────────────────────────────────────────────────────────────────────────────

async function tagOperation(
  this: IExecuteFunctions,
  i: number,
  defaultLocationId: string,
  mode: 'add' | 'remove' | 'replace',
): Promise<IDataObject> {
  const contactId = this.getNodeParameter('contactId', i) as string;
  const email = this.getNodeParameter('lookupEmail', i) as string;
  const rawPhone = this.getNodeParameter('lookupPhone', i) as string;
  const rawTags = this.getNodeParameter('tags', i) as string;
  const locationId =
    (this.getNodeParameter('locationId', i) as string) || defaultLocationId;

  const phone = rawPhone ? formatPhoneE164(rawPhone) : '';
  const incomingTags = parseTags(rawTags);

  if (incomingTags.length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Tags field is required and must contain at least one tag.',
      { itemIndex: i },
    );
  }

  // Find the contact
  const contact = await findContactByIdentifier.call(
    this,
    locationId,
    contactId || undefined,
    email || undefined,
    phone || undefined,
  );

  if (!contact) {
    throw new NodeOperationError(
      this.getNode(),
      'Contact not found. Provide a valid Contact ID, Email, or Phone.',
      { itemIndex: i },
    );
  }

  const resolvedId = contact.id as string;
  const existingTags = (contact.tags as string[]) ?? [];

  let finalTags: string[];
  if (mode === 'add') {
    finalTags = mergeTags(existingTags, incomingTags);
  } else if (mode === 'remove') {
    finalTags = removeTags(existingTags, incomingTags);
  } else {
    // replace
    finalTags = incomingTags;
  }

  const res = await gohighlevelApiRequest.call(
    this,
    'PUT',
    `/contacts/${resolvedId}`,
    { tags: finalTags },
  );

  const updated = (res.contact as IDataObject) ?? res;
  return {
    ...updated,
    _tagOperation: mode,
    _previousTags: existingTags,
    _newTags: finalTags,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Pipeline Handler
// ─────────────────────────────────────────────────────────────────────────────

async function executeSmartPipeline(
  this: IExecuteFunctions,
  operation: string,
  i: number,
  defaultLocationId: string,
): Promise<IDataObject> {
  if (operation === 'push') {
    const contactId = this.getNodeParameter('contactId', i) as string;
    const email = this.getNodeParameter('lookupEmail', i) as string;
    const rawPhone = this.getNodeParameter('lookupPhone', i) as string;
    const locationId =
      (this.getNodeParameter('locationId', i) as string) || defaultLocationId;
    const pipelineId = this.getNodeParameter('pipelineId', i) as string;
    const pipelineStageId = this.getNodeParameter('pipelineStageId', i) as string;
    const opportunityName = this.getNodeParameter('opportunityName', i) as string;
    const status = this.getNodeParameter('status', i) as string;
    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

    const phone = rawPhone ? formatPhoneE164(rawPhone) : '';

    // ── Step 1: Resolve the contact ────────────────────────────────────────
    const contact = await findContactByIdentifier.call(
      this,
      locationId,
      contactId || undefined,
      email || undefined,
      phone || undefined,
    );

    if (!contact) {
      throw new NodeOperationError(
        this.getNode(),
        'Contact not found. Provide a valid Contact ID, Email, or Phone to push to a pipeline.',
        { itemIndex: i },
      );
    }

    const resolvedContactId = contact.id as string;
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
    const dealName = opportunityName || contactName || 'New Deal';

    // ── Step 2: Duplicate check in this pipeline ───────────────────────────
    const existingOpp = await findExistingOpportunity.call(
      this,
      resolvedContactId,
      pipelineId,
    );

    if (existingOpp) {
      // ── UPDATE path ──────────────────────────────────────────────────────
      const oppId = existingOpp.id as string;
      const body = buildBody({
        pipelineStageId,
        status,
        name: dealName,
        ...additionalFields,
      });

      const res = await gohighlevelApiRequest.call(
        this,
        'PUT',
        `/opportunities/${oppId}`,
        body,
      );
      const updated = (res.opportunity as IDataObject) ?? res;
      return {
        ...updated,
        _pushAction: 'updated',
        _duplicateFound: true,
        _resolvedContactId: resolvedContactId,
      };
    } else {
      // ── CREATE path ──────────────────────────────────────────────────────
      const body = buildBody({
        pipelineId,
        pipelineStageId,
        contactId: resolvedContactId,
        name: dealName,
        status,
        ...additionalFields,
      });

      const res = await gohighlevelApiRequest.call(this, 'POST', '/opportunities', body);
      const created = (res.opportunity as IDataObject) ?? res;
      return {
        ...created,
        _pushAction: 'created',
        _duplicateFound: false,
        _resolvedContactId: resolvedContactId,
      };
    }
  }

  throw new NodeOperationError(
    this.getNode(),
    `Unknown pipeline operation: ${operation}`,
    { itemIndex: i },
  );
}
