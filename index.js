/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
var getLicenses = require('./lib/license')
var audit = require('./lib/audit')

module.exports = function (opts, callback, beforeHook) {
  getLicenses(opts.checker)
  .then(function (json) {
    if (typeof beforeHook === 'function') {
      return beforeHook(json)
    }
    return json
  })
  .then(function (json) {
    var inclusions = audit(opts.fix, json, opts.spdx, opts.include, opts.exclude)
    callback(null, inclusions)
  })
  .catch(callback)
}
