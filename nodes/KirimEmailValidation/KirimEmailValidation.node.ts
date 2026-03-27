import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class KirimEmailValidation implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Validation',
		name: 'kirimEmailValidation',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Validate email addresses using Kirim.Email SMTP',
		defaults: {
			name: 'KirimEmail Validation',
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
			baseURL: '={{$credentials.baseUrl}}',
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
						name: 'Validate',
						value: 'validate',
						description: 'Validate a single email address',
						action: 'Validate email',
					},
					{
						name: 'Validate Strict',
						value: 'validateStrict',
						description: 'Validate with strict mode (no warnings)',
						action: 'Validate email strictly',
					},
					{
						name: 'Validate Bulk',
						value: 'validateBulk',
						description: 'Validate multiple emails (max 100)',
						action: 'Validate bulk emails',
					},
					{
						name: 'Validate Bulk Strict',
						value: 'validateBulkStrict',
						description: 'Validate multiple emails with strict mode',
						action: 'Validate bulk emails strictly',
					},
				],
				default: 'validate',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				placeholder: 'name@email.com',
				displayOptions: {
					show: {
						operation: ['validate', 'validateStrict'],
					},
				},
				default: '',
				description: 'The email address to validate',
			},
			{
				displayName: 'Emails',
				name: 'emails',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['validateBulk', 'validateBulkStrict'],
					},
				},
				default: '',
				description: 'Comma-separated list of email addresses to validate (max 100)',
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to return simplified output with just essential data',
			},
		],
	};

	requestMethods = {
		validate: 'POST',
		validateStrict: 'POST',
		validateBulk: 'POST',
		validateBulkStrict: 'POST',
	};

	routing = {
		'/api/email/validate': {
			post: {
				body: {
					email: '={{$parameter.email}}',
				},
			},
		},
		'/api/email/validate/strict': {
			post: {
				body: {
					email: '={{$parameter.email}}',
				},
			},
		},
		'/api/email/validate/bulk': {
			post: {
				body: {
					emails: '={{$parameter.emails.split(",").map(e => e.trim())}}',
				},
			},
		},
		'/api/email/validate/bulk/strict': {
			post: {
				body: {
					emails: '={{$parameter.emails.split(",").map(e => e.trim())}}',
				},
			},
		},
	};
}
