# phin-retry

![Build](https://github.com/ASaiAnudeep/phin-retry/workflows/Build/badge.svg?branch=master)
![Coverage](https://img.shields.io/codeclimate/coverage/ASaiAnudeep/phin-retry)

The ultra-lightweight Node.js HTTP client.

> This is a wrapper around [Phin](https://github.com/ethanent/phin) that adds support for retry & looks like [request-promise](https://github.com/request/request-promise).

## Install

```shell
npm install phin-retry
```

## Usage

```javascript
const request = require('phin-retry');

// should be used in async context
const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');

await request.post({
    url: 'http://localhost:9393/api/post',
    body: { msg: 'input' },
    retry: 3,
    delay: 500
  });

// custom retry, error & delay strategy
const response = await request.delete({
    url: 'http://localhost:9393/api/delete',
    auth: {
      user: 'name',
      pass: 'secret'
    },
    errorStrategy: ({response, error, options}) => {
        if (error) return true;
        if (response.statusCode >= 400) {
          return false;
        }
        return true;
      },
    retryStrategy: ({response, error, options}) => {
        if (error) return true;
        if (options.method === 'POST') return false;
        if (response.statusCode >=200 && response.StatusCode < 300) {
          return false;
        }
        return true;
      },
    delayStrategy: ({response, error, options, delay}) => {
        if (error) return 5000;
        return 2000;
      },
  });

```

* It supports **get**, **post**, **put**, **delete**, **patch** HTTP methods.
* By default, this library will retry once on failure (StatusCode >= 500 & network errors) with a delay of 100 or 1000 milliseconds. Override this behavior with custom retry strategy function.
* Responses with status codes < 200 & >= 300 are thrown as errors. Override this behavior with custom error strategy function.
* All options from **phin** are supported. Refer [Phin](https://www.npmjs.com/package/phin) for more usage examples.
* Access underlying **phin** library through `request.phin`.

## API

### Defaults

Access default options through `request.defaults`.

| Option              | Type     | Description                        |
| ----------------    | -------- | ---------------------------------- |
| `retry`             | number   | max no of times to retry (1)       |
| `delay`             | number   | delay between retries (100ms)      |
| `networkErrorDelay` | number   | delay for network errors (1000ms)  |
| `retryStrategy`     | function | default retry strategy function    |
| `delayStrategy`     | function | default delay strategy function    |
| `errorStrategy`     | function | default error strategy function    |     


### Options

It supports all options from **phin**, refer [Phin](https://www.npmjs.com/package/phin) for more details.

| Method           | Type     | Description                     |
| ---------------- | -------- | ------------------------------- |
| `url`            | string   | request url                     |
| `qs`             | object   | query parameters                |
| `auth`           | object   | authentication object           |
| `headers`        | object   | headers object                  |
| `retry`          | number   | max no of times to retry        |
| `delay`          | number   | delay between retries           |
| `body`           | any      | equivalent to data in phin      |
| `fullResponse`   | boolean  | returns full phin response      |
| `retryStrategy`  | function | custom retry strategy function  |
| `delayStrategy`  | function | custom delay strategy function  |
| `errorStrategy`  | function | custom error strategy function  |     
