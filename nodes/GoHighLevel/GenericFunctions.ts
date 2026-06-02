import {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IHttpRequestMethods,
  IRequestOptions,
  JsonObject,
  NodeApiError,
} from 'n8n-workflow';

/** Union of all n8n function contexts that can make requests. */
export type GhlContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

export const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

/**
 * Makes a single authenticated request to the GoHighLevel API v2.
 *
 * @param this - n8n execution context
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param endpoint - API endpoint path, e.g. '/contacts'
 * @param body - Request body for POST/PUT/PATCH requests
 * @param qs - Query string parameters
 * @returns Parsed JSON response as IDataObject
 * @throws NodeApiError on HTTP errors (401, 403, 404, 429, 500)
 */
export async function gohighlevelApiRequest(
  this: GhlContext,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<IDataObject> {
  const credentials = await this.getCredentials('goHighLevelApi');

  const options: IRequestOptions = {
    method,
    headers: {
      Authorization: `Bearer ${credentials.apiKey as string}`,
      Version: GHL_API_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    uri: `${GHL_BASE_URL}${endpoint}`,
    qs,
    json: true,
  };

  if (Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return (await this.helpers.request(options)) as IDataObject;
  } catch (error) {
    const err = error as JsonObject & {
      statusCode?: number;
      response?: { body?: { message?: string; msg?: string } };
    };

    // Surface a friendly message for known GHL error codes
    const statusCode = err.statusCode as number | undefined;
    const responseBody = err.response?.body;

    if (statusCode === 401) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'Unauthorized: Check your GoHighLevel API Key.',
        description: 'The API key provided is invalid or has expired.',
      });
    }

    if (statusCode === 403) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'Forbidden: Insufficient permissions for this operation.',
        description:
          'Your API key does not have access to this resource. Check Location ID and key scopes.',
      });
    }

    if (statusCode === 404) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'Not Found: The requested resource does not exist.',
        description:
          responseBody?.message ?? responseBody?.msg ?? 'Resource not found in GoHighLevel.',
      });
    }

    if (statusCode === 429) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'Rate Limited: Too many requests to GoHighLevel API.',
        description: 'GoHighLevel rate limit hit. Use the "Retry on Fail" option in n8n.',
      });
    }

    if (statusCode && statusCode >= 500) {
      throw new NodeApiError(this.getNode(), err, {
        message: 'GoHighLevel API Internal Error.',
        description:
          responseBody?.message ??
          responseBody?.msg ??
          'An unexpected error occurred on the GoHighLevel server.',
      });
    }

    throw new NodeApiError(this.getNode(), err);
  }
}

/**
 * Fetches all items from a paginated GoHighLevel API endpoint.
 *
 * Automatically handles GHL's cursor-based pagination and aggregates all results.
 *
 * @param this - n8n execution context
 * @param method - HTTP method
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param qs - Query string parameters (limit/startAfter will be managed internally)
 * @param itemsKey - The key in the response JSON that contains the array of items
 * @returns Flat array of all result items across all pages
 */
export async function gohighlevelApiRequestAllItems(
  this: GhlContext,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
  itemsKey = 'contacts',
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  const pageSize = 100;
  let startAfterId: string | undefined;
  let startAfterDate: string | number | undefined;
  let hasMore = true;

  while (hasMore) {
    const pageQs: IDataObject = { ...qs, limit: pageSize };

    if (startAfterId) {
      pageQs.startAfterId = startAfterId;
    }
    if (startAfterDate) {
      pageQs.startAfter = startAfterDate;
    }

    const response = await gohighlevelApiRequest.call(this, method, endpoint, body, pageQs);
    const items = (response[itemsKey] as IDataObject[] | undefined) ?? [];

    allItems.push(...items);

    // GHL v2 uses cursor-based pagination via `meta.startAfter` / `meta.startAfterId`
    const meta = response.meta as IDataObject | undefined;
    const nextAfterDate = meta?.startAfter as string | number | undefined;
    const nextAfterId = meta?.startAfterId as string | undefined;

    // Also support simple total-based pagination for list endpoints
    const total = meta?.total as number | undefined;

    if (items.length < pageSize) {
      hasMore = false;
    } else if (nextAfterId) {
      startAfterId = nextAfterId;
      startAfterDate = nextAfterDate;
    } else if (total !== undefined && allItems.length >= total) {
      hasMore = false;
    } else {
      hasMore = false;
    }
  }

  return allItems;
}

/**
 * Builds a clean body object by omitting undefined / empty-string values.
 *
 * @param fields - Key-value pairs to include in the request body
 * @returns Cleaned IDataObject safe to send as JSON
 */
export function buildBody(fields: Record<string, unknown>): IDataObject {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined && v !== ''),
  ) as IDataObject;
}
