# Google OAuth E2E Testing Setup

This guide explains how to set up and refresh Google OAuth credentials for Cypress end-to-end tests.

## Overview

The E2E tests use Google OAuth to authenticate users. This requires:
1. Google OAuth Client credentials (Client ID and Secret)
2. A refresh token that can be exchanged for access tokens
3. Environment variables to provide these to Cypress

## Current Credentials Location

OAuth credentials are stored in: `co2_client/.env`

```bash
REACT_APP_GOOGLE_CLIENTID = 'your-client-id'
REACT_APP_GOOGLE_CLIENT_SECRET = 'your-client-secret'
GOOGLE_REFRESH_TOKEN = 'your-refresh-token'
```

## When to Refresh the Token

You need to generate a new refresh token when:
- Tests fail with OAuth errors (401 or 400 responses from Google)
- Token hasn't been used for 6+ months (expires automatically)
- Google Cloud Console credentials were changed
- User revoked access to the app
- Error message: `cy.request() failed on: https://www.googleapis.com/oauth2/v4/token`

## How to Generate a New Refresh Token

### Prerequisites
- Access to the Google Cloud Console project
- The current Client ID and Client Secret
- A Google account for testing

### Steps

1. **Go to Google OAuth 2.0 Playground**
   - Navigate to: https://developers.google.com/oauthplayground

2. **Configure OAuth Settings**
   - Click the gear icon (⚙️) in the top right
   - Check "Use your own OAuth credentials"
   - Enter:
     - OAuth Client ID: `460477494607-b498v98u85vbpk9hg9rik20h0e1lr01o.apps.googleusercontent.com`
     - OAuth Client secret: (get from Google Cloud Console or existing `.env`)
   - Leave Access token location as "Authorization header w/ Bearer prefix"

3. **Select Required Scopes**
   - In Step 1, find and select these scopes:
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Authorize APIs"

4. **Authorize with Google Account**
   - Sign in with your test Google account
   - Grant the requested permissions
   - You'll be redirected back to the playground

5. **Exchange Authorization Code for Tokens**
   - In Step 2, click "Exchange authorization code for tokens"
   - You'll receive:
     - Access token (expires in 1 hour)
     - **Refresh token** (this is what we need!)

6. **Update the Environment File**
   ```bash
   cd co2_client
   # Edit .env file
   ```
   
   Update line 3 with the new refresh token:
   ```
   GOOGLE_REFRESH_TOKEN = 'paste-your-new-refresh-token-here'
   ```

7. **Test the New Token**
   ```bash
   # Run the e2e tests
   lefthook run pre-push --commands test-e2e --verbose --force
   ```

## How It Works

The Cypress tests use the refresh token to:
1. Exchange it for a fresh access token via Google's OAuth2 API
2. Use the access token to get user profile information
3. Authenticate with the backend using the ID token
4. Store authentication in localStorage for the test session

See `co2_client/cypress/support/commands.ts` for the implementation.

## Troubleshooting

### Token Exchange Fails
- Verify the Client Secret hasn't changed in Google Cloud Console
- Ensure the refresh token was copied completely (they're long!)
- Check that the OAuth client still has the correct authorized origins

### Tests Still Fail After Update
- Clear any cached tokens: `rm -rf co2_client/cypress/screenshots`
- Ensure the `.env` file is in `co2_client/` directory
- Verify environment variables are loaded (check `console.log(process.env)` in `cypress.config.ts`)

### Need New Client Credentials
If you need to create new OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services → Credentials
4. Create or update OAuth 2.0 Client ID
5. Add authorized JavaScript origins: `http://localhost:3000`, `http://localhost:3001`
6. Update all three values in `.env`

## Security Notes

- **Never commit** the `.env` file with real credentials
- Use separate credentials for development vs production
- Refresh tokens don't expire on their own but can be revoked
- Consider using a dedicated test account rather than personal Google account

## Related Files

- `co2_client/.env` - Environment variables (git-ignored)
- `co2_client/cypress.config.ts` - Loads env vars for Cypress
- `co2_client/cypress/support/commands.ts` - OAuth implementation
- `utils/run_e2e.ts` - E2E test runner script