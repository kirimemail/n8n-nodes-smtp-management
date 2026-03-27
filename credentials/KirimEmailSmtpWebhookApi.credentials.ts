import type { IAuthenticateGeneric, Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class KirimEmailSmtpWebhookApi implements ICredentialType {
	name = 'kirimEmailSmtpWebhookApi';

	displayName = 'KirimEmail SMTP Webhook API';

	icon: Icon = {
		light: 'file:assets/logo-bg-white.svg',
		dark: 'file:assets/logo-bg-black.svg',
	};

	documentationUrl = 'https://smtp-app.kirim.email/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'key_4909************************e8d6',
			description: 'API key for authentication.',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'example.id',
			description: 'Domain name for webhook signature verification.',
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: '8ad78587************************66db',
			description: 'API secret for webhook signature verification.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.apiKey}}',
				password: '={{$credentials.apiSecret}}',
			},
			headers: {
				domain: '={{$credentials.domain}}',
			},
		},
	};
	

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://smtp-app.kirim.email',
			url: '/api/v4/transactional/log',
			method: 'GET',
		},
	};
}
