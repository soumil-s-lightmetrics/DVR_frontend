import { JwtRsaVerifier } from "aws-jwt-verify";
import { SimpleJwksCache } from "aws-jwt-verify/jwk";
import { SimpleJsonFetcher } from "aws-jwt-verify/https";

// Node's https module (used internally to fetch the JWKS) sends no
// User-Agent header by default, unlike curl or a browser. The JWKS endpoint
// sits behind a WAF/CDN that 403s requests with no User-Agent, so set one
// explicitly here.
const jwksCache = new SimpleJwksCache({
  fetcher: new SimpleJsonFetcher({
    defaultRequestOptions: { headers: { "User-Agent": "lm-labs-jwt-verifier" } },
  }),
});

// Verifies the RS256 access token minted by the external auth system
// (white-qa.lightmetrics.co) — not Cognito. aws-jwt-verify's generic RSA
// verifier checks signature (against the JWKS below), issuer, audience, and
// expiry (tokens are 1h-lived) on every call. JWKS keys are cached in
// memory, so this doesn't hit the network on every request.
export const jwtVerifier = JwtRsaVerifier.create(
  {
    issuer: process.env.AUTH_ISSUER!,
    audience: process.env.AUTH_AUDIENCE!,
    jwksUri: process.env.AUTH_JWKS_URI!,
  },
  { jwksCache }
);
