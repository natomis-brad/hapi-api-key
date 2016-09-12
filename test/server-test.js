'use strict';
const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const hapiApiKeyPlugin = require('../index.js');

let server;
lab.beforeEach((done) => {
    server = new Hapi.Server({});
    server.connection();
    done();
});

lab.afterEach((done) => {
    server.stop(() => {
        done();
    });
});

lab.test('will reject normal requests ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                'knockknock': {
                    name: 'Who Is There'
                }
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/'
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('will reject requests with a bad api key ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                'knockknock': {
                    name: 'Who Is There'
                }
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/?token=letmein',
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('should allow passage if a correct api key is posted ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                'knockknock': {
                    name: 'Who Is There'
                }
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/?token=knockknock',
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('lets you pass a custom list of api keys ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                mySpecialKey: {
                    name: 'Is Good'
                }
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/?token=mySpecialKey',
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('lets you specify a name for the param that contains the api key ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                'knockknock': {
                    name: 'Who Is There'
                }
            },
            queryKey: 'api'
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/?api=knockknock',
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('you can pass the api key in the X-API-KEY header as well', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: {
                'knockknock': {
                    name: 'Who Is There'
                }
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/',
            headers: {
                'X-API-KEY': 'knockknock'
            }
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('you can specify api keys when you register', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {
            strategy: {
                name: 'apikey',
                mode: false,
                apiKeys: {
                    knockknock: {
                        name: 'whoIsThere'
                    }
                }
            }
        }
    }, (err) => {
        if (err) {
            throw err;
        }
        server.route({
            method: 'GET',
            path: '/',
            config: {
                auth: 'apikey'
            },
            handler(request, reply) {
                reply(request.auth);
            }
        });
        server.inject({
            url: '/?token=knockknock',
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            server.inject({
                url: '/?token=knockknock2',
            }, (response) => {
                code.expect(response.statusCode).to.equal(401);
                done();
            });
        });
    });
});

// api key array tests
lab.test('you can pass the api keys in an array', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: [{'X-API-KEY4': 'abc'}, {'X-API-KEY5': 'dev'}, {'X-API-KEY6': 'jones'}],
            queryKey: 'token',
            headerKey: 'X-API-KEY4'
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/',
            headers: {
                'X-API-KEY4': 'abc'
            }
        }, (response) => {
            code.expect(response.statusCode).to.equal(200);
            done();
        });
    });
});

lab.test('you can pass the api keys in an array - Fail', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: [{'X-API-KEY4': 'abc'}, {'X-API-KEY5': 'dev'}, {'X-API-KEY6': 'jones'}],
            queryKey: 'token',
            headerKey: 'X-API-KEY'
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/',
            headers: {
                'X-API-KEY': 'abc'
            }
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('you can pass the api keys in an array - Fail 2', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: [{'X-API-KEY4': 'abc'}, {'X-API-KEY5': 'dev'}, {'X-API-KEY6': 'jones'}],
            queryKey: 'token',
            headerKey: 'X-API-KEY'
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/',
            headers: {
                'X-API-KEY5': 'abc'
            }
        }, (response) => {
            code.expect(response.statusCode).to.equal(401);
            done();
        });
    });
});

lab.test('lets you specify a name for the param whehre key is in an array ', (done) => {
    server.register({
        register: hapiApiKeyPlugin,
        options: {}
    }, (err) => {
        if (err) {
            throw err;
        }
        server.auth.strategy('api-key', 'api-key', true, {
            apiKeys: [{'X-API-KEY4': 'abc'}, {'X-API-KEY5': 'dev'}, {'X-API-KEY6': 'jones'}],
            queryKey: 'X-API-KEY4'
        });
        server.route({
            method: 'GET',
            path: '/',
            config: {
                handler: (request, reply) => {
                    reply(request.auth);
                }
            }
        });
        server.inject({
            url: '/?X-API-KEY4=abc',
        }, (response) => {
            code.expect(response.statusCode).to.equal(200);
            done();
        });
    });
});
