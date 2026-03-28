import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type INodeExecutionData,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

interface ApiErrorResponse {
	success?: boolean;
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
}

const ERROR_MESSAGES: Record<number, { code: string; description: string }> = {
	400: { code: 'BAD_REQUEST', description: 'Bad Request - Invalid request parameters' },
	401: {
		code: 'UNAUTHORIZED',
		description: 'Unauthorized - Invalid or missing authentication credentials',
	},
	403: {
		code: 'FORBIDDEN',
		description: 'Forbidden - You do not have permission to access this resource',
	},
	404: { code: 'NOT_FOUND', description: 'Not Found - The requested resource was not found' },
	422: { code: 'VALIDATION_ERROR', description: 'Validation Error - Invalid input data' },
	429: {
		code: 'RATE_LIMIT_EXCEEDED',
		description: 'Too Many Requests - Rate limit exceeded. Please try again later.',
	},
	500: {
		code: 'SERVER_ERROR',
		description: 'Internal Server Error - An unexpected error occurred',
	},
};

function parseApiError(errorResponse: ApiErrorResponse): string {
	if (errorResponse.message) {
		return errorResponse.message;
	}
	if (errorResponse.error) {
		return errorResponse.error;
	}
	return 'An unknown error occurred';
}

function getErrorDetails(statusCode: number): { code: string; description: string } {
	return (
		ERROR_MESSAGES[statusCode] || {
			code: 'UNKNOWN_ERROR',
			description: 'An unknown error occurred',
		}
	);
}

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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const simplifyOutput = this.getNodeParameter('simplifyOutput', i) as boolean;

				let endpoint = '';
				let body: Record<string, unknown> = {};

				if (operation === 'validate') {
					endpoint = '/api/email/validate';
					const email = this.getNodeParameter('email', i) as string;
					if (!email) {
						throw new NodeOperationError(this.getNode(), 'Email is required', { itemIndex: i });
					}
					body = { email };
				} else if (operation === 'validateStrict') {
					endpoint = '/api/email/validate/strict';
					const email = this.getNodeParameter('email', i) as string;
					if (!email) {
						throw new NodeOperationError(this.getNode(), 'Email is required', { itemIndex: i });
					}
					body = { email };
				} else if (operation === 'validateBulk') {
					endpoint = '/api/email/validate/bulk';
					const emails = this.getNodeParameter('emails', i) as string;
					if (!emails) {
						throw new NodeOperationError(this.getNode(), 'Emails are required', { itemIndex: i });
					}
					body = { emails: emails.split(',').map((e) => e.trim()) };
				} else if (operation === 'validateBulkStrict') {
					endpoint = '/api/email/validate/bulk/strict';
					const emails = this.getNodeParameter('emails', i) as string;
					if (!emails) {
						throw new NodeOperationError(this.getNode(), 'Emails are required', { itemIndex: i });
					}
					body = { emails: emails.split(',').map((e) => e.trim()) };
				}

				const credentials = await this.getCredentials('kirimEmailSmtpUserApi');
				const baseUrl = credentials.baseUrl as string;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'kirimEmailSmtpUserApi',
					{
						method: 'POST',
						url: `${baseUrl}${endpoint}`,
						body,
					},
				);

				if (simplifyOutput && typeof response === 'object' && response !== null) {
					const resp = response as Record<string, unknown>;
					if (operation === 'validateBulk' || operation === 'validateBulkStrict') {
						const simplified = {
							success: resp.success,
							data: resp.data,
							summary: (resp.data as { summary?: unknown })?.summary,
						};
						returnData.push({
							json: simplified as INodeExecutionData['json'],
							pairedItem: { item: i },
						});
					} else {
						const simplified = {
							success: resp.success,
							data: resp.data,
						};
						returnData.push({
							json: simplified as INodeExecutionData['json'],
							pairedItem: { item: i },
						});
					}
				} else {
					returnData.push({
						json: response as INodeExecutionData['json'],
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}

				const httpError = error as { statusCode?: number; response?: { body?: ApiErrorResponse } };
				const statusCode = httpError.statusCode || 500;
				const errorResponse = httpError.response?.body as ApiErrorResponse | undefined;

				let errorMessage = (error as Error).message;
				const errorCode = getErrorDetails(statusCode).code;

				if (errorResponse) {
					errorMessage = parseApiError(errorResponse);
				}

				throw new NodeApiError(
					this.getNode(),
					{
						message: errorMessage,
						code: errorCode,
						httpCode: statusCode.toString(),
						description: getErrorDetails(statusCode).description,
						retry: statusCode === 429,
					},
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}
}
