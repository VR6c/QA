/**
 * In-Memory LRU & Redis-compatible Cache Service
 */
class MemoryCacheService {
  constructor(defaultTTLSeconds = 300) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  del(key) {
    this.cache.delete(key);
  }

  delPattern(pattern) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheService = new MemoryCacheService(300);
