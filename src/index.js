const phin = require('phin');

/**
 * @typedef {object} WrapperOptions
 * @property {number} [retry] - max retries on failures - defaults to 1
 * @property {number} [delay] - delay in ms between retries - defaults to 100ms
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
    const message = response.statusMessage ? response.statusMessag : '';
    super(`${response.statusCode} - ${message}`);
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
  
  retry(response, error) {
    if (error) {
      return true;
    }
    if (response.statusCode >= 500) {
      return true;
    }
    return false;
  },

  error(response, error) {
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
  retryStrategy: strategies.retry,
  errorStrategy: strategies.error
};

const helper = {

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  string(buffer) {
    if (buffer instanceof Buffer) {
      return buffer.toString();
    } else {
      return buffer;
    }
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
    if (typeof options.retry === 'number') {
      return options.retry;
    } else {
      return defaults.retry;
    }
  },

  delay(options) {
    if (typeof options.delay === 'number') {
      return options.delay;
    } else {
      return defaults.delay;
    }
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
  },

  init(options) {
    const retry = helper.retry(options);
    const delay = helper.delay(options);
    const fullResponse = options.fullResponse || false;
    helper.qs(options);
    helper.auth(options);
    helper.body(options);
    helper.delete(options);
    return { retry, delay, fullResponse };
  },

  updateOptions(options, retry, delay, fullResponse) {
    options.retry = retry - 1;
    options.delay = delay;
    options.fullResponse = fullResponse;
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

  async __fetch(opts) {
    const options = typeof opts === 'string' ? { url: opts, method: 'GET' } : opts;
    const { retry, delay, fullResponse } = helper.init(options);
    let res, err;
    try {
      res = await phin(options);
    } catch (error) {
      err = error;
    }
    if (this.defaults.retryStrategy(res, err, options) && retry > 0) {
      helper.updateOptions(options, retry, delay, fullResponse);
      await helper.sleep(delay);
      return this[options.method.toLowerCase()](options);
    }
    if (this.defaults.errorStrategy(res, err, options)) {
      return helper.reject(res, err, fullResponse);
    } else {
      return helper.resolve(res, fullResponse);
    }
  }

};

module.exports = request;