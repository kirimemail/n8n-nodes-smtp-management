import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KirimEmailSmtpUserApi implements ICredentialType {
	name = 'kirimEmailSmtpUserApi';

	displayName = 'KirimEmail SMTP User API';

	icon: Icon = {
		light: 'file:assets/logo-bg-white.svg',
		dark: 'file:assets/logo-bg-black.svg',
	};

	documentationUrl = 'https://smtp.kirim.email';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'The username for authentication',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The API token for authentication',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://smtp-app.kirim.email',
			description: 'The base URL for the API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/quota',
			method: 'GET',
		},
	};
}
