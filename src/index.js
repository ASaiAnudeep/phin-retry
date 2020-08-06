const phin = require('phin');

/**
 * @typedef {object} WrapperOptions
 * @property {number} [retry] - max retries on failures - defaults to 1
 * @property {number} [delay] - delay in ms between retries - defaults to 100ms
 * @property {function} [retryStrategy] - custom retry strategy function
 * @property {function} [delayStrategy] - custom delay strategy function
 * @property {function} [errorStrategy] - custom error strategy function
 * @property {object} [qs] - key-value pairs of query parameters
 * @property {object} [auth] - auth object
 * @property {string} auth.user - auth user
 * @property {string} auth.pass - auth pass
 * @property {object} [body] - body
 * @property {boolean} [fullResponse] - resolve or reject with full response
 */

/**
 * @typedef {phin.IJSONResponseOptions & WrapperOptions} RequestOptions
 */

class StatusCodeError extends Error {
  constructor(response, fullResponse) {
    super(`${response.statusCode} - ${helper.string(response.body)}`);
    this.name = this.constructor.name;
    this.statusCode = response.statusCode;
    this.statusMessage = response.statusMessage;
    this.body = helper.json(response.body);
    if (fullResponse) {
      this.response = response;
    }
  }
}

const strategies = {
  
  retry({response, error}) {
    if (error) {
      return true;
    }
    if (response.statusCode >= 500) {
      return true;
    }
    return false;
  },

  delay({error, delay}) {
    if (error && delay === defaults.delay) {
      return defaults.networkErrorDelay;
    }
    return delay;
  },

  error({response, error}) {
    if (error) {
      return true;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return true;
    }
    return false;
  }

};

const defaults = {
  retry: 1,
  delay: 100,
  networkErrorDelay: 1000,
  retryStrategy: strategies.retry,
  delayStrategy: strategies.delay,
  errorStrategy: strategies.error
};

const helper = {

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  string(buffer) {
    if (buffer instanceof Buffer) {
      return buffer.toString();
    }
    return buffer;
  },

  json(data) {
    try {
      data = this.string(data);
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  },

  retry(options) {
    return typeof options.retry === 'number' ? options.retry : defaults.retry;
  },

  delay(options) {
    return typeof options.delay === 'number' ? options.delay : defaults.delay;
  },

  retryStrategy(options) {
    return typeof options.retryStrategy === 'function' ? options.retryStrategy : defaults.retryStrategy;
  },

  delayStrategy(options) {
    return typeof options.delayStrategy === 'function' ? options.delayStrategy : defaults.delayStrategy;
  },

  errorStrategy(options) {
    return typeof options.errorStrategy === 'function' ? options.errorStrategy : defaults.errorStrategy;
  },

  qs(options) {
    if (options.qs && typeof options.qs === 'object') {
      const queries = [];
      for (const key in options.qs) {
        queries.push(`${key}=${options.qs[key]}`);
      }
      const queryUrl = queries.join('&');
      options.url += `?${queryUrl}`;
    }
  },

  auth(options) {
    if (options.auth && typeof options.auth === 'object') {
      if (options.core) {
        options.core.auth = `${options.auth.user}:${options.auth.pass}`;
      } else {
        options.core = {
          auth: `${options.auth.user}:${options.auth.pass}`
        };
      }
    }
  },

  body(options) {
    if (options.body) {
      options.data = options.body;
    }
  },

  delete(options) {
    delete options.retry;
    delete options.delay;
    delete options.fullResponse;
    delete options.qs;
    delete options.auth;
    delete options.body;
    delete options.retryStrategy;
    delete options.delayStrategy;
    delete options.errorStrategy;
  },

  init(options) {
    const retry = helper.retry(options);
    const delay = helper.delay(options);
    const retryStrategy = helper.retryStrategy(options);
    const delayStrategy = helper.delayStrategy(options);
    const errorStrategy = helper.errorStrategy(options);
    const fullResponse = options.fullResponse || false;
    helper.qs(options);
    helper.auth(options);
    helper.body(options);
    helper.delete(options);
    return { retry, delay, fullResponse, retryStrategy, delayStrategy, errorStrategy };
  },

  updateOptions({options, retry, delay, fullResponse, retryStrategy, errorStrategy}) {
    options.retry = retry - 1;
    options.delay = delay;
    options.fullResponse = fullResponse;
    options.retryStrategy = retryStrategy;
    options.errorStrategy = errorStrategy;
  },

  reject(response, error, full) {
    if (error) {
      throw error;
    }
    throw new StatusCodeError(response, full);
  },

  resolve(response, full) {
    if (full) {
      return response;
    } else {
      return helper.json(response.body);
    }
  }

};

const request = {

  defaults,
  phin,

  /**
   * @param {RequestOptions} options
   */
  get(options) {
    options.method = 'GET';
    return this.__fetch(options);
  },

  /**
   * @param {RequestOptions} options
   */
  post(options) {
    options.method = 'POST';
    return this.__fetch(options);
  },

  /**
   * @param {RequestOptions} options
   */
  head(options) {
    options.method = 'HEAD';
    return this.__fetch(options);
  },

  /**
   * @param {RequestOptions} options
   */
  patch(options) {
    options.method = 'PATCH';
    return this.__fetch(options);
  },

  /**
   * @param {RequestOptions} options
   */
  put(options) {
    options.method = 'PUT';
    return this.__fetch(options);
  },

  /**
   * @param {RequestOptions} options
   */
  delete(options) {
    options.method = 'DELETE';
    return this.__fetch(options);
  },

  /**
   * @private
   */
  async __fetch(opts) {
    const options = typeof opts === 'string' ? { url: opts, method: 'GET' } : opts;
    const { retry, delay, fullResponse, retryStrategy, delayStrategy, errorStrategy } = helper.init(options);
    let response, error;
    try {
      response = await phin(options);
    } catch (err) {
      error = err;
    }
    if (retryStrategy({response, error, options}) && retry > 0) {
      helper.updateOptions({options, retry, delay, fullResponse, retryStrategy, errorStrategy});
      await helper.sleep(delayStrategy({response, error, options, delay}));
      return this[options.method.toLowerCase()](options);
    }
    if (errorStrategy({response, error, options})) {
      return helper.reject(response, error, fullResponse);
    } else {
      return helper.resolve(response, fullResponse);
    }
  }

};

module.exports = request;