import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class KirimEmailQuota implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Quota',
		name: 'kirimEmailQuota',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Check quota information using Kirim.Email SMTP',
		defaults: {
			name: 'KirimEmail Quota',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'kirimEmailSmtpUserApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://smtp-app.kirim.email',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get current quota information',
						action: 'Get quota',
					},
				],
				default: 'get',
			},
		],
	};

	requestMethods = {
		get: 'GET',
	};

	routing = {
		'/api/quota': {
			get: {},
		},
	};
}
