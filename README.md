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
const post1 = await request.get('https://jsonplaceholder.typicode.com/posts/1');

const post2 = await request.get({
    url: 'https://jsonplaceholder.typicode.com/posts',
    qs: {
      id: 1
    },
    retry: 3,
    delay: 500
  });
```

All options from **phin** are supported. Refer [Phin](https://www.npmjs.com/package/phin) for more usage examples.

## API

### Methods

| Method   | Description                                | Usage                        |
| -------- | ------------------------------------------ | ---------------------------- |
| `get`    | performs a GET request on the resource     | `await request.get({})`      |
| `post`   | performs a POST request on the resource    | `await request.post({})`     |
| `put`    | performs a PUT request on the resource     | `await request.put({})`      |
| `delete` | performs a DELETE request on the resource  | `await request.delete({})`   |
| `patch`  | performs a PATCH request on the resource   | `await request.patch({})`    |
| `head`   | performs a HEAD request on the resource    | `await request.head({})`     |

### Options

It supports all options from **phin**, refer [Phin](https://www.npmjs.com/package/phin) more details.

| Method           | Type     | Description                 |
| ---------------- | -------- | --------------------------- |
| `url`            | string   | request url                 |
| `qs`             | object   | query parameters            |
| `auth`           | object   | authentication object       |
| `retry`          | number   | max no of times to retry    |
| `delay`          | number   | delay between retries       |
| `body`           | any      | equivalent to data in phin  |
| `fullResponse`   | boolean  | returns full phin response  |

**By default, this library will retry once on failure (StatusCode < 200 & >= 300 ) with a delay of 100 milliseconds.**