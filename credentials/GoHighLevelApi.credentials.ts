import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * GoHighLevel API v2 credentials.
 *
 * Supports both sub-account API keys and agency-level keys.
 * API Keys are generated at: Settings → API Keys within GoHighLevel.
 *
 * Base URL: https://services.leadconnectorhq.com
 * API Version header: 2021-07-28
 */
export class GoHighLevelApi implements ICredentialType {
  name = 'goHighLevelApi';
  displayName = 'GoHighLevel API';
  documentationUrl = 'https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'API Key from GoHighLevel. Navigate to Settings → API Keys to generate one.',
    },
    {
      displayName: 'Location ID',
      name: 'locationId',
      type: 'string',
      default: '',
      description:
        'Default Location (Sub-Account) ID. Can be overridden per operation. Find this in Settings → Business Info.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        Version: '2021-07-28',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://services.leadconnectorhq.com',
      url: '/locations/search',
      method: 'GET',
      qs: {
        limit: 1,
      },
    },
  };
}
