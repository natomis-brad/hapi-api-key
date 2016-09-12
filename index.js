'use strict';
const Boom = require('boom');
const Hoek = require('hoek');

const pluginDefaults = {
    schemeName: 'api-key'
};

const schemeDefaults = {
    apiKeys: {},
    // by default the incoming POST will
    // look in request.query.token for the api key:
    queryKey: 'token',
    headerKey: 'x-api-key'
};

function getApiKeyFromArray(headerKey, apiKeys) {
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i][headerKey];
        if (apiKey !== undefined) {
            return apiKey;
        }
    }
}

/***
 * @param options
 * @param query
 * @param headers
 * @returns {apiKey: string, the api key}
 */
function getApiKey(options, query, headers) {
    /*

    This function is biased towards query string parameters.

    queryKey = the querystring parameter defined in the options object, by default it is named 'token'
    queryValue = the value of the querystring parameter, may be null

    headerKey = the key of the key value pair in the header collection, by default it is named 'x-api-key'
    headerValue = the value associated with headerKey, may be null

    apiKey = the key name that will be returned from this function, returns false if not found
    keyType = the type of the apiKey, object, array, etc.

     */

    let apiKey = false;
    let queryKey = options.queryKey;
    let headerKey = options.headerKey;
    let queryValue = query[queryKey];
    let headerValue = headers[headerKey];
    let keyType = "string";
    let values = false;

    // Look at the query string
    if (options.apiKeys && options.apiKeys.length && options.apiKeys.length > 0) {
        keyType = "array";
    }

    // query string token supplied, but not set
    if (queryValue !== undefined) {
        apiKey ={
            key: queryKey,
            value: queryValue,
            keyType: keyType,
            keys: options.apiKeys

        };
      return apiKey;
    }

    if (headerKey !== undefined) {
        if (keyType === 'array'){
            values = getApiKeyFromArray(headerKey, options.apiKeys);
        }

        apiKey ={
            key: headerKey,
            value: values,
            keyType: keyType,
            keys: options.apiKeys
        };
        return apiKey;
    }

    // look at the headers
    return apiKey;
}

exports.register = (server, pluginOptions, next) => {
    pluginOptions = Hoek.applyToDefaults(pluginDefaults, pluginOptions);

    server.auth.scheme(pluginOptions.schemeName, (authServer, options) => {
        options = Hoek.applyToDefaults(schemeDefaults, options);
        return {
            authenticate: (request, reply) => {
                // check in both the query params and the X-API-KEY header for an api key:

                let apiKey = getApiKey(options, request.query, request.headers);

                if(apiKey === false){
                    return reply(Boom.unauthorized('Invalid Missing API Key.'));
                }


                let credentials = options.apiKeys[apiKey];
                if(apiKey.keyType == 'array'){
                    credentials = getApiKeyFromArray(apiKey.key, apiKey.keys);
                }

                if (credentials !== undefined) {
                    return reply.continue({credentials});
                }
                // otherwise return a 401:
                return reply(Boom.unauthorized('Invalid API Key.'));
            }
        };
    });
    /* will call server.auth.strategy
     package should be of the form:
     strategy: {
     name: 'myStrategyName',
     mode: true // (can be any valid strategy mode)
     apiKeys: {
     'anAPIKey': {
     name: 'authenticationName'
     }
     ]
     }
     */
    if (pluginOptions.strategy) {
        server.auth.strategy(pluginOptions.strategy.name,
            pluginOptions.schemeName,
            pluginOptions.strategy.mode,
            {apiKeys: pluginOptions.strategy.apiKeys});
    }
    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
