# @kirimemail/n8n-nodes-smtp-management

n8n community node for Kirim.Email SMTP API - validate emails, check quota, and send transactional emails.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Nodes](#nodes)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Error Handling](#error-handling)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Nodes

### KirimEmail Message

Send transactional emails using Kirim.Email SMTP.

**Operations:**

- **Send** - Send a single transactional email
- **Send with Template** - Send email using a saved template

**Fields:**

- Domain - Your verified Kirim.Email domain
- From - Sender email address
- From Name - Optional sender display name
- To - Recipient email address(es)
- Subject - Email subject line
- Text Body - Plain text content
- HTML Body - Optional HTML content
- Reply To - Optional reply-to address
- Headers (JSON) - Optional custom headers
- Attachments - Optional binary attachments

### KirimEmail Validation

Validate email addresses individually or in bulk.

**Operations:**

- **Validate** - Validate a single email address
- **Validate Strict** - Validate with strict mode (no warnings)
- **Validate Bulk** - Validate multiple emails (max 100)
- **Validate Bulk Strict** - Validate multiple emails with strict mode

**Fields:**

- Email / Emails - Email address(es) to validate
- Simplify Output - Return simplified output with essential fields only

### KirimEmail Quota

Check quota information.

**Operations:**

- **Get** - Get current quota information

### KirimEmail SMTP Webhook Trigger

Receive webhook events from Kirim.Email SMTP.

**Events:**

- Email queued, sent, delivered, bounced, etc.
- Automatic signature verification

**Fields:**

- Simplify Output - Return a simplified output with essential fields only

## Credentials

### KirimEmail SMTP User API

1. Log in to your [Kirim.Email](https://smtp.kirim.email) account
2. Navigate to your SMTP settings
3. Copy your API token
4. Use the API token as the password in n8n credential (username is `api`)

### KirimEmail SMTP Webhook API

Required for the KirimEmail SMTP Webhook Trigger node.

1. Log in to your [Kirim.Email](https://smtp.kirim.email) account
2. Navigate to your domain settings
3. Copy your API key and API secret
4. Enter your verified domain name

## Compatibility

Compatible with n8n@1.60.0 or later

## Error Handling

All nodes include comprehensive error handling for API responses:

- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Invalid or missing authentication credentials
- **403 Forbidden** - You do not have permission to access this resource
- **404 Not Found** - The requested resource was not found
- **422 Validation Error** - Invalid input data
- **429 Rate Limit Exceeded** - Too many requests. n8n will automatically retry with built-in retry mechanism
- **500 Server Error** - Internal server error

For 429 errors, n8n's built-in retry mechanism will automatically retry the request.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Kirim.Email SMTP API docs](https://smtp.kirim.email)
