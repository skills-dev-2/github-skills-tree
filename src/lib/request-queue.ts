/**
 * Simple request queue to control GitHub API call rate
 * Helps ensure we stay under rate limits by adding delays between calls
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;
  private minDelay = 100; // Minimum delay between requests (ms)
  private lastRequestTime = 0;

  /**
   * Add a request to the queue
   */
  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: requestFn,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the queue with controlled timing
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      // Ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minDelay) {
        const delayNeeded = this.minDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }

      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      this.lastRequestTime = Date.now();
    }

    this.isProcessing = false;
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      lastRequestTime: this.lastRequestTime
    };
  }
}

// Export singleton instance
export const apiRequestQueue = new RequestQueue();