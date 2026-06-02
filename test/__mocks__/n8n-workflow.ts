/**
 * Mock for n8n-workflow package used in Jest tests.
 * Provides stub implementations of the types and classes used by the node.
 */

export class NodeApiError extends Error {
  constructor(
    public readonly node: unknown,
    public readonly error: unknown,
    public readonly options?: { message?: string; description?: string },
  ) {
    super(options?.message ?? 'NodeApiError');
    this.name = 'NodeApiError';
  }
}

export class NodeOperationError extends Error {
  constructor(
    public readonly node: unknown,
    message: string,
    public readonly options?: { itemIndex?: number },
  ) {
    super(message);
    this.name = 'NodeOperationError';
  }
}

// Type stubs — Jest doesn't need the runtime implementations, only the types
export type IDataObject = Record<string, unknown>;
export type INodeProperties = unknown;
export type INodePropertyOptions = { name: string; value: string };
export type INodeType = unknown;
export type INodeTypeDescription = unknown;
export type INodeExecutionData = { json: IDataObject; pairedItem?: unknown };
export type IExecuteFunctions = unknown;
export type ILoadOptionsFunctions = unknown;
export type IHookFunctions = unknown;
export type IHttpRequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type IRequestOptions = unknown;
export type IAuthenticateGeneric = unknown;
export type ICredentialTestRequest = unknown;
export type ICredentialType = unknown;
export type JsonObject = Record<string, unknown>;
export type INodeProperties_v2 = unknown;
