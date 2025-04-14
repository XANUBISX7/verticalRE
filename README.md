# VerticalRE Proxy Server

A proxy server for Salesforce authentication and data fetching.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- **POST** `/api/auth`
  - Body parameters:
    - `username`: Salesforce username
    - `password`: Salesforce password
    - `client_id`: Salesforce client ID
    - `client_secret`: Salesforce client secret

### Query
- **POST** `/api/query`
  - Body parameters:
    - `instance_url`: Salesforce instance URL
    - `access_token`: Salesforce access token
    - `query`: SOQL query string

## Error Handling

The server returns appropriate HTTP status codes and error messages in case of failures:
- 400: Bad Request (invalid parameters or authentication failure)
- 500: Internal Server Error

## Security

- The server uses CORS to restrict access to allowed origins
- Sensitive information (passwords, tokens) should be transmitted securely
- Consider implementing rate limiting and additional security measures in production 