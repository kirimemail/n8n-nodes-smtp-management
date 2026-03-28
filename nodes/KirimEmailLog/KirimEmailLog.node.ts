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

export class KirimEmailLog implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Log',
		name: 'kirimEmailLog',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: 'Get logs',
		description: 'Get email logs using Kirim.Email SMTP',
		defaults: {
			name: 'KirimEmail Log',
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
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'example.com',
			},
			{
				displayName: 'Start Date',
				name: 'start',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'End Date',
				name: 'end',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Sender',
				name: 'sender',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					min: 1,
					max: 10000,
				},
				description: 'Max number of results to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: {
					min: 0,
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('kirimEmailSmtpUserApi');
				const baseUrl = credentials.baseUrl as string;
				const domain = this.getNodeParameter('domain', i) as string;

				if (!domain) {
					throw new NodeOperationError(this.getNode(), 'Domain is required', { itemIndex: i });
				}

				const url = `${baseUrl}/api/domains/${domain}/log`;
				const queryParams: Record<string, string> = {};

				const start = this.getNodeParameter('start', i) as string;
				const end = this.getNodeParameter('end', i) as string;
				const sender = this.getNodeParameter('sender', i) as string;
				const recipient = this.getNodeParameter('recipient', i) as string;
				const subject = this.getNodeParameter('subject', i) as string;
				const limit = this.getNodeParameter('limit', i) as number;
				const offset = this.getNodeParameter('offset', i) as number;

				if (start) {
					queryParams.start = start;
				}
				if (end) {
					queryParams.end = end;
				}
				if (sender) {
					queryParams.sender = sender;
				}
				if (recipient) {
					queryParams.recipient = recipient;
				}
				if (subject) {
					queryParams.subject = subject;
				}
				if (limit) {
					queryParams.limit = String(limit);
				}
				if (offset) {
					queryParams.offset = String(offset);
				}

				const queryString = new URLSearchParams(queryParams).toString();
				const requestUrl = queryString ? `${url}?${queryString}` : url;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'kirimEmailSmtpUserApi',
					{
						method: 'GET',
						url: requestUrl,
					},
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
