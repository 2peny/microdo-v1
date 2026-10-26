export class SlidingWindowRateLimiter {
  constructor(maxRequests, windowMs, maxTrackedClients = 10000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxTrackedClients = maxTrackedClients;
    this.requestsByClient = new Map();
  }

  check(clientKey, now = Date.now()) {
    const key = clientKey || 'unknown';
    const windowStart = now - this.windowMs;
    const requests = (this.requestsByClient.get(key) || [])
      .filter((timestamp) => timestamp > windowStart);

    if (requests.length >= this.maxRequests) {
      this.requestsByClient.set(key, requests);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((requests[0] + this.windowMs - now) / 1000)
        ),
      };
    }

    if (!this.requestsByClient.has(key) && this.requestsByClient.size >= this.maxTrackedClients) {
      for (const [client, timestamps] of this.requestsByClient) {
        const activeRequests = timestamps.filter((timestamp) => timestamp > windowStart);
        if (activeRequests.length === 0) {
          this.requestsByClient.delete(client);
        } else {
          this.requestsByClient.set(client, activeRequests);
        }
      }
      if (this.requestsByClient.size >= this.maxTrackedClients) {
        return { allowed: false, retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
      }
    }

    requests.push(now);
    this.requestsByClient.set(key, requests);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
