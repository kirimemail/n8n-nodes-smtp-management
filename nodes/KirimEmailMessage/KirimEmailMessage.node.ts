import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type INodeExecutionData,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

interface EmailAttachment {
	filename: string;
	content: Buffer;
	contentType: string;
}

interface ApiErrorResponse {
	success?: boolean;
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
}

const ERROR_MESSAGES: Record<number, { code: string; description: string }> = {
	400: { code: 'BAD_REQUEST', description: 'Bad Request' },
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

export class KirimEmailMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Message',
		name: 'kirimEmailMessage',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send transactional emails using Kirim.Email SMTP',
		defaults: {
			name: 'KirimEmail Message',
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
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a transactional email',
						action: 'Send email',
					},
					{
						name: 'Send with Template',
						value: 'sendTemplate',
						description: 'Send email using a saved template',
						action: 'Send template email',
					},
				],
				default: 'send',
			},
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				required: true,
				placeholder: 'example.com',
				description: 'The domain name owned by the authenticated user',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				required: true,
				placeholder: 'noreply@example.com',
				description: 'Sender email address. Must belong to the authenticated domain.',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'From Name',
				name: 'fromName',
				type: 'string',
				placeholder: 'Company Name',
				description: 'Optional sender display name',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				required: true,
				placeholder: 'recipient@example.com or ["recipient1@example.com","recipient2@example.com"]',
				description:
					'Recipient email address(es). Single email, comma-separated emails, or JSON array string. Maximum 1000 recipients.',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				required: true,
				placeholder: 'Email Subject',
				description: 'Email subject line',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'Text Body',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				required: true,
				description: 'Plain text content for the email body',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'HTML Body',
				name: 'html',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				description: 'Optional HTML content for the email body',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
			},
			{
				displayName: 'Template ID',
				name: 'templateGuid',
				type: 'string',
				required: true,
				placeholder: '550e8400-e29b-41d4-a716-446655440000',
				description: 'UUID of the template to use',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'Variables',
				name: 'variables',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				description:
					'Variables for template replacement as JSON object. Example: {"name": "John", "product": "Widget"}.',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'Reply To',
				name: 'replyTo',
				type: 'string',
				placeholder: 'support@example.com',
				description:
					'Reply-to email address. Must share the same top-level domain as the from address.',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'Headers (JSON)',
				name: 'headers',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				description:
					'Optional custom email headers as JSON. Example: {"X-Campaign-ID": "welcome-series"}.',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				description: 'Binary properties containing attachments',
				displayOptions: {
					show: {
						operation: ['send', 'sendTemplate'],
					},
				},
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const domain = this.getNodeParameter('domain', i) as string;

				if (!domain) {
					throw new NodeOperationError(this.getNode(), 'Domain is required', { itemIndex: i });
				}

				let endpoint = '';
				const formData: Record<string, unknown> = {};

				const toInput = this.getNodeParameter('to', i) as string;
				let to: string | string[];

				if (toInput.trim().startsWith('[')) {
					try {
						to = JSON.parse(toInput) as string[];
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON array format for To field', {
							itemIndex: i,
						});
					}
				} else if (toInput.includes(',')) {
					to = toInput.split(',').map((email: string) => email.trim());
				} else {
					to = toInput;
				}

				if (Array.isArray(to) && to.length > 1000) {
					throw new NodeOperationError(this.getNode(), 'Maximum 1000 recipients per request', {
						itemIndex: i,
					});
				}

				if (operation === 'send') {
					endpoint = `/api/domains/${domain}/message`;

					const from = this.getNodeParameter('from', i) as string;
					const subject = this.getNodeParameter('subject', i) as string;
					const text = this.getNodeParameter('text', i) as string;

					if (!from) {
						throw new NodeOperationError(this.getNode(), 'From email is required', {
							itemIndex: i,
						});
					}
					if (!to) {
						throw new NodeOperationError(this.getNode(), 'To email is required', { itemIndex: i });
					}
					if (!subject) {
						throw new NodeOperationError(this.getNode(), 'Subject is required', { itemIndex: i });
					}
					if (!text) {
						throw new NodeOperationError(this.getNode(), 'Text body is required', { itemIndex: i });
					}

					formData.from = from;
					formData.to = to;
					formData.subject = subject;
					formData.text = text;

					const fromName = this.getNodeParameter('fromName', i) as string;
					if (fromName) {
						formData.from_name = fromName;
					}

					const html = this.getNodeParameter('html', i) as string;
					if (html) {
						formData.html = html;
					}

					const replyTo = this.getNodeParameter('replyTo', i) as string;
					if (replyTo) {
						formData.reply_to = replyTo;
					}

					const headers = this.getNodeParameter('headers', i) as string;
					if (headers) {
						try {
							JSON.parse(headers);
							formData.headers = headers;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Headers must be valid JSON', {
								itemIndex: i,
							});
						}
					}
				} else if (operation === 'sendTemplate') {
					endpoint = `/api/domains/${domain}/message/template`;

					const templateGuid = this.getNodeParameter('templateGuid', i) as string;

					if (!templateGuid) {
						throw new NodeOperationError(this.getNode(), 'Template ID is required', {
							itemIndex: i,
						});
					}
					if (!to) {
						throw new NodeOperationError(this.getNode(), 'To email is required', { itemIndex: i });
					}

					formData.template_guid = templateGuid;
					formData.to = to;

					const from = this.getNodeParameter('from', i) as string;
					if (from) {
						formData.from = from;
					}

					const fromName = this.getNodeParameter('fromName', i) as string;
					if (fromName) {
						formData.from_name = fromName;
					}

					const variables = this.getNodeParameter('variables', i) as string;
					if (variables) {
						try {
							JSON.parse(variables);
							formData.variables = variables;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Variables must be valid JSON', {
								itemIndex: i,
							});
						}
					}

					const replyTo = this.getNodeParameter('replyTo', i) as string;
					if (replyTo) {
						formData.reply_to = replyTo;
					}

					const headers = this.getNodeParameter('headers', i) as string;
					if (headers) {
						try {
							JSON.parse(headers);
							formData.headers = headers;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Headers must be valid JSON', {
								itemIndex: i,
							});
						}
					}
				}

				const attachmentProps = (this.getNodeParameter('attachments', i, '') as string) || '';
				const binaryDataKeys = attachmentProps
					? attachmentProps
							.split(',')
							.map((s) => s.trim())
							.filter(Boolean)
					: [];

				if (binaryDataKeys.length > 0) {
					const attachments: EmailAttachment[] = [];

					for (const key of binaryDataKeys) {
						const binaryData = items[i].binary?.[key];
						if (binaryData) {
							attachments.push({
								filename: binaryData.fileName || key,
								content: Buffer.from(binaryData.data, 'base64'),
								contentType: binaryData.mimeType || 'application/octet-stream',
							});
						}
					}

					if (attachments.length > 0) {
						formData.attachments = attachments.map((att) => ({
							value: att.content,
							options: {
								filename: att.filename,
								contentType: att.contentType,
							},
						}));
					}
				}

				const credentials = await this.getCredentials('kirimEmailSmtpUserApi');
				const baseUrl = credentials.baseUrl as string;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'kirimEmailSmtpUserApi',
					{
						method: 'POST',
						url: `${baseUrl}${endpoint}`,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						formData: formData as any,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} as any,
				);

				returnData.push({
					json: response as INodeExecutionData['json'],
					pairedItem: { item: i },
				});
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
