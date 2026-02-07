# Security Report

## Date: February 7, 2026

## Executive Summary

This report documents the findings of a security audit conducted on the TinyTasks repository to identify exposed API keys, secrets, and other sensitive information.

## Critical Findings

### 1. 🔴 CRITICAL: Nylas Client Secret Exposed in Client-Side Code

**Location:** `lib/nylasCalendar.ts:145`

**Issue:** The Nylas OAuth client secret is exposed in the client-side code through the use of the `EXPO_PUBLIC_` environment variable prefix.

**Risk Level:** HIGH

**Impact:**
- Client secrets are designed to be confidential and should never be exposed to end users
- The `EXPO_PUBLIC_` prefix in Expo causes the variable to be bundled into the client-side JavaScript
- Anyone can extract this secret by:
  - Inspecting the JavaScript bundle
  - Using browser/app developer tools
  - Monitoring network traffic
- An exposed client secret allows malicious actors to:
  - Impersonate your application
  - Make unauthorized API requests on your behalf
  - Potentially exhaust your API quota
  - Access or manipulate user data

**Current Implementation:**
```typescript
// In lib/nylasCalendar.ts
async exchangeCodeForToken(code: string) {
  const response = await fetch(`${NYLAS_API_URL}/oauth/token`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: process.env.EXPO_PUBLIC_NYLAS_CLIENT_ID,
      client_secret: process.env.EXPO_PUBLIC_NYLAS_CLIENT_SECRET, // ⚠️ EXPOSED!
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.EXPO_PUBLIC_NYLAS_REDIRECT_URI,
    }),
  });
}
```

**Recommended Solution:**

1. **Create a Backend Proxy Service:**
   - Set up a backend API endpoint (e.g., using Supabase Edge Functions, AWS Lambda, or your own server)
   - Store the client secret securely on the backend (NOT in the Expo app)
   - Example endpoint: `POST /api/nylas/exchange-token`

2. **Update the OAuth Flow:**
   ```typescript
   // Client-side (lib/nylasCalendar.ts)
   async exchangeCodeForToken(code: string) {
     // Call your backend proxy instead of Nylas directly
     const response = await fetch(`${YOUR_BACKEND_URL}/api/nylas/exchange-token`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         code: code,
         redirect_uri: process.env.EXPO_PUBLIC_NYLAS_REDIRECT_URI,
       }),
     });
     
     const data = await response.json();
     return data.access_token;
   }
   ```

3. **Backend Implementation (Example using Supabase Edge Function):**
   ```typescript
   // Backend: supabase/functions/nylas-exchange-token/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   
   serve(async (req) => {
     const { code, redirect_uri } = await req.json()
     
     const response = await fetch('https://api.nylas.com/oauth/token', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         client_id: Deno.env.get('NYLAS_CLIENT_ID'),
         client_secret: Deno.env.get('NYLAS_CLIENT_SECRET'), // Secure on backend
         grant_type: 'authorization_code',
         code: code,
         redirect_uri: redirect_uri,
       }),
     })
     
     const data = await response.json()
     return new Response(JSON.stringify({ access_token: data.access_token }))
   })
   ```

4. **Environment Variable Changes:**
   - Remove `EXPO_PUBLIC_` prefix from `NYLAS_CLIENT_SECRET` in your backend environment
   - Keep `EXPO_PUBLIC_` prefix only for variables that are safe to expose (like Client ID)

**Timeline for Fix:**
- Immediate: Rotate the exposed Nylas client secret
- Short-term: Implement the backend proxy solution
- Verification: Test the new flow thoroughly before deployment

---

## Positive Findings

### ✅ Good Security Practices Observed:

1. **Environment Files Protected:**
   - `.env` is properly listed in `.gitignore`
   - No actual `.env` file with credentials is committed to the repository
   - `.env.example` contains placeholder values only

2. **Previous Security Remediation:**
   - Git history shows a previous commit removed a `process.env` file containing secrets
   - This indicates awareness of security best practices

3. **Supabase Anonymous Key Usage:**
   - Using `EXPO_PUBLIC_SUPABASE_ANON_KEY` is acceptable for Supabase
   - Supabase's Row Level Security (RLS) protects data even with exposed anonymous keys
   - This is the intended usage pattern for Supabase in client-side applications

4. **No Hardcoded Credentials:**
   - No API keys, tokens, or passwords found hardcoded in the source code
   - All credentials properly reference environment variables

---

## Recommendations

### Immediate Actions:
1. ✅ **Document the security issue** (completed in this report)
2. 🔄 **Rotate the Nylas client secret** immediately if it's currently in use
3. 🔄 **Implement backend proxy** for OAuth token exchange
4. 🔄 **Update environment variable naming** to remove `EXPO_PUBLIC_` from client secret

### Best Practices Going Forward:

1. **Secret Management:**
   - Never prefix secrets with `EXPO_PUBLIC_` or any other "public" indicator
   - Use backend services for any operations requiring client secrets
   - Regularly rotate API keys and secrets

2. **Code Review Process:**
   - Review all environment variable additions to ensure proper prefix usage
   - Check that sensitive operations are performed server-side
   - Use automated tools to scan for exposed secrets

3. **Security Testing:**
   - Periodically audit the codebase for exposed credentials
   - Test JavaScript bundles to ensure no secrets are visible
   - Use tools like `git-secrets` or `trufflehog` to scan repositories

4. **Documentation:**
   - Document which environment variables are safe to expose
   - Maintain clear guidelines on OAuth implementation
   - Keep security documentation up to date

---

## Tools and Commands Used for Audit:

```bash
# Search for potential API keys and secrets
grep -r "API_KEY\|SECRET\|TOKEN" --include="*.ts" --include="*.tsx" --include="*.js"

# Check for hardcoded credentials patterns
grep -r "(eyJ[a-zA-Z0-9_-]+\|sk_live_\|pk_live_)" .

# Verify .env files are not committed
git log --all --full-history -- "*.env*"

# Search git history for sensitive data
git log --all -p -S "SUPABASE\|NYLAS"
```

---

## Conclusion

The TinyTasks repository demonstrates good security hygiene in most areas, with proper use of `.gitignore` and environment variables. However, the exposure of the Nylas client secret in client-side code represents a critical security vulnerability that should be addressed immediately.

The recommended solution involves implementing a backend proxy service to handle the OAuth token exchange securely, ensuring that client secrets remain confidential on the server side.

---

## References

- [Expo Environment Variables Documentation](https://docs.expo.dev/guides/environment-variables/)
- [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [Nylas OAuth Documentation](https://developer.nylas.com/docs/developer-tools/authentication/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth)
