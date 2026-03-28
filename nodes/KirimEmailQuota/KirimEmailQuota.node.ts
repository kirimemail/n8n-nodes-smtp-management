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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('kirimEmailSmtpUserApi');
				const baseUrl = credentials.baseUrl as string;

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'kirimEmailSmtpUserApi',
					{
						method: 'GET',
						url: `${baseUrl}/api/quota`,
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
