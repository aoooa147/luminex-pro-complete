/**
 * Request Batcher
 * Batches multiple API requests into a single request to reduce network overhead
 */

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  url: string;
  options?: RequestInit;
}

class RequestBatcher {
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private batchTimeout: number = 50; // 50ms batch window
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Batch a request - if multiple requests come in within the batch window,
   * they will be batched together
   */
  async batchRequest<T = any>(
    url: string,
    options?: RequestInit,
    batchKey?: string
  ): Promise<T> {
    const key = batchKey || url;

    return new Promise<T>((resolve, reject) => {
      // Add request to pending queue
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }

      this.pendingRequests.get(key)!.push({
        resolve,
        reject,
        url,
        options,
      });

      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to process batch
      const timeout = setTimeout(() => {
        this.processBatch(key);
      }, this.batchTimeout);

      this.timeouts.set(key, timeout);
    });
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(key: string): Promise<void> {
    const requests = this.pendingRequests.get(key);
    if (!requests || requests.length === 0) {
      return;
    }

    // Clear pending requests
    this.pendingRequests.delete(key);
    this.timeouts.delete(key);

    // Process requests in parallel
    const promises = requests.map(async (req) => {
      try {
        const response = await fetch(req.url, req.options);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`);
        }
        const data = await response.json();
        req.resolve(data);
      } catch (error) {
        req.reject(error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingRequests.clear();
    this.timeouts.clear();
  }
}

// Singleton instance
export const requestBatcher = new RequestBatcher();

/**
 * Batch multiple API requests
 */
export async function batchRequests<T extends Record<string, any>>(
  requests: Record<keyof T, { url: string; options?: RequestInit }>
): Promise<T> {
  const keys = Object.keys(requests) as Array<keyof T>;
  const promises = keys.map(async (key) => {
    const { url, options } = requests[key];
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed for ${String(key)}: ${response.statusText}`);
    }
    return response.json();
  });

  const results = await Promise.all(promises);
  
  const result = {} as T;
  keys.forEach((key, index) => {
    result[key] = results[index];
  });

  return result;
}

