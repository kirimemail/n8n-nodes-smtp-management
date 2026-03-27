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
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The API token for authentication',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: 'api',
				password: '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://smtp-app.kirim.email',
			url: '/api/quota',
			method: 'GET',
		},
	};
}
