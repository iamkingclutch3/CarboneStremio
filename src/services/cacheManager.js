export const createCache = () => {
  const data = Object.create(null);
  const timers = Object.create(null);

  return {
    get(key) {
      const entry = data[key];
      if (!entry) return null;

      if (entry.expires > Date.now()) {
        return entry.value;
      }

      // Auto-clean expired entries
      this.delete(key);
      return null;
    },

    set(key, value, ttl = 5 * 60 * 1000) {
      // Clear existing timer if any
      if (timers[key]) clearTimeout(timers[key]);

      const expires = Date.now() + ttl;
      data[key] = { value, expires };

      // Set auto-cleanup timer
      timers[key] = setTimeout(() => {
        this.delete(key);
      }, ttl);
    },

    delete(key) {
      if (timers[key]) clearTimeout(timers[key]);
      delete data[key];
      delete timers[key];
    },

    toJSON() {
      return Object.entries(data).reduce((acc, [key, { value, expires }]) => {
        acc[key] = { value, expires };
        return acc;
      }, {});
    },

    // Make it iterable for saving
    [Symbol.iterator]() {
      return Object.entries(data)[Symbol.iterator]();
    },
  };
};

// Initialize cache
export const userRequestCache = createCache();
