const mock = require('pactum').mock;
const test = require('uvu').test;
const assert = require('uvu/assert');

const request = require('../src/index');

test.before(() => {
  return mock.start();
});

test.after(() => {
  return mock.stop();
});

test.after.each(() => {
  request.defaults.retry = 1;
  request.defaults.delay = 100;
  request.defaults.networkErrorDelay = 1000;
  mock.clearInteractions();
});

test('GET - text response', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      status: 200,
      body: 'output'
    }
  });
  const response = await request.get('http://localhost:9393/api/get');
  assert.equal(response, 'output');
});

test('GET - with default retry & custom delay', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      onCall: {
        0: {
          status: 500
        },
        1: {
          status: 200,
          body: 'output'
        }
      }
    }
  });
  const response = await request.get({
    url: 'http://localhost:9393/api/get',
    delay: 1
  });
  assert.equal(response, 'output');
});

test('GET - with qs & custom retry & delay', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get',
      query: {
        user: 'bob',
        age: '23'
      }
    },
    willRespondWith: {
      onCall: {
        0: {
          status: 500
        },
        1: {
          status: 500
        },
        2: {
          status: 200,
          body: 'output'
        }
      }
    }
  });
  const response = await request.get({
    url: 'http://localhost:9393/api/get',
    qs: {
      user: 'bob',
      age: 23
    },
    retry: 2,
    delay: 1
  });
  assert.equal(response, 'output');
});

test('POST - with JSON body', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'POST',
      path: '/api/post',
      body: {
        msg: 'input'
      }
    },
    willRespondWith: {
      status: 200,
      body: 'output'
    }
  });
  const response = await request.post({
    url: 'http://localhost:9393/api/post',
    body: { msg: 'input' }
  });
  assert.equal(response, 'output');
});

test('PUT - with text body', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'PUT',
      path: '/api/put',
      body: 'input'
    },
    willRespondWith: {
      status: 200,
      body: 'output'
    }
  });
  const response = await request.put({
    url: 'http://localhost:9393/api/put',
    body: 'input'
  });
  assert.equal(response, 'output');
});

test('DELETE - with auth & returns JSON', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'DELETE',
      path: '/api/delete',
      headers: {
        authorization: 'Basic dXNlcjpwYXNz'
      }
    },
    willRespondWith: {
      status: 200,
      body: {
        msg: 'deleted'
      }
    }
  });
  const response = await request.delete({
    url: 'http://localhost:9393/api/delete',
    auth: {
      user: 'user',
      pass: 'pass'
    }
  });
  assert.equal(response, { msg: 'deleted' });
});

test('DELETE - with core & auth', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'DELETE',
      path: '/api/delete',
      headers: {
        authorization: 'Basic dXNlcjpwYXNz'
      }
    },
    willRespondWith: {
      status: 200,
      body: {
        msg: 'deleted'
      }
    }
  });
  const response = await request.delete({
    url: 'http://localhost:9393/api/delete',
    core: {},
    auth: {
      user: 'user',
      pass: 'pass'
    }
  });
  assert.equal(response, { msg: 'deleted' });
});

test('PATCH - with headers', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'PATCH',
      path: '/api/patch',
      headers: {
        authorization: 'Basic dXNlcjpwYXNz'
      }
    },
    willRespondWith: {
      status: 200,
      body: {
        msg: 'patched'
      }
    }
  });
  const response = await request.patch({
    url: 'http://localhost:9393/api/patch',
    headers: {
      authorization: 'Basic dXNlcjpwYXNz'
    }
  });
  assert.equal(response, { msg: 'patched' });
});

test('HEAD - request', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'HEAD',
      path: '/api/head'
    },
    willRespondWith: {
      status: 200
    }
  });
  const response = await request.head({
    url: 'http://localhost:9393/api/head'
  });
});

test('GET - updated default retry & delays', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      onCall: {
        0: {
          status: 500
        },
        1: {
          status: 500
        },
        2: {
          status: 200,
          body: 'output'
        }
      }
    }
  });
  request.defaults.retry = 2;
  request.defaults.delay = 2;
  const response = await request.get('http://localhost:9393/api/get');
  assert.equal(response, 'output');
});

test('GET - 500 response', async () => {
  request.defaults.delay = 1;
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      status: 500,
      body: 'Some Error'
    }
  });
  let response;
  try {
    await request.get('http://localhost:9393/api/get');
  } catch (error) {
    response = error;
  }
  assert.equal(response.name, 'StatusCodeError');
  assert.equal(response.statusCode, 500);
  assert.equal(response.statusMessage, 'Internal Server Error');
  assert.equal(response.body, 'Some Error');
  assert.equal(response.toString(), 'StatusCodeError: 500 - Some Error');
});

test('GET - 400 client error - should not retry', async () => {
  request.defaults.delay = 1;
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      onCall: {
        0: {
          status: 400,
          body: 'error'
        }
      }
    }
  });
  let response;
  try {
    await request.get('http://localhost:9393/api/get');
  } catch (error) {
    response = error;
  }
  assert.equal(response.name, 'StatusCodeError');
  assert.equal(response.statusCode, 400);
  assert.equal(response.statusMessage, 'Bad Request');
  assert.equal(response.body, 'error');
});

test('GET - 400 client error - custom retry strategy', async () => {
  request.defaults.delay = 1;
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      onCall: {
        0: {
          status: 400,
          body: 'error'
        }
      }
    }
  });
  let response;
  try {
    await request.get({
      url: 'http://localhost:9393/api/get',
      retryStrategy: () => true,
      fullResponse: true
    });
  } catch (error) {
    response = error;
  }
  assert.equal(response.name, 'StatusCodeError');
  assert.equal(response.statusCode, 404);
  assert.equal(response.statusMessage, 'Not Found');
});

test('GET - custom error strategy', async () => {
  mock.addMockInteraction({
    withRequest: {
      method: 'GET',
      path: '/api/get'
    },
    willRespondWith: {
      status: 401,
      body: 'output'
    }
  });
  const response = await request.get({
    url: 'http://localhost:9393/api/get',
    errorStrategy: () => false,
    fullResponse: true
  });
  assert.equal(response.body.toString(), 'output');
});

test('Network Error', async () => {
  request.defaults.networkErrorDelay = 1;
  let err;
  try {
    await request.get('http://localhost:3241');
  } catch (error) {
    err = error;
  }
  assert.equal(err.code, 'ECONNREFUSED');
});

test('Network Error - overriding default network delay', async () => {
  let err;
  try {
    await request.get({
      url: 'http://localhost:3241',
      delay: 2
    });
  } catch (error) {
    err = error;
  }
  assert.equal(err.code, 'ECONNREFUSED');
});

test.run();