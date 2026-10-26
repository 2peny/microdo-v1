export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  constructor(maxRequests: number, windowMs: number, maxTrackedClients?: number);
  check(clientKey: string, now?: number): RateLimitDecision;
}
