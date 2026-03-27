# @kirimemail/n8n-nodes-smtp-management

n8n community node for Kirim.Email SMTP API - validate emails and check quota.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Nodes](#nodes)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Nodes

### KirimEmail Validation

Validate email addresses individually or in bulk.

**Operations:**

- **Validate** - Validate a single email address
- **Validate Strict** - Validate with strict mode (no warnings)
- **Validate Bulk** - Validate multiple emails (max 100)
- **Validate Bulk Strict** - Validate multiple emails with strict mode

### KirimEmail Quota

Check quota information.

**Operations:**

- **Get** - Get current quota information

## Credentials

### KirimEmail SMTP User API

1. Log in to your [Kirim.Email](https://smtp.kirim.email) account
2. Navigate to your SMTP settings
3. Copy your API token
4. Use the API token as the password in n8n credential (username is `api`)

## Compatibility

Compatible with n8n@1.60.0 or later

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Kirim.Email SMTP API docs](https://smtp.kirim.email)
