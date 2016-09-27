/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
var getLicenses = require('./lib/license')
var audit = require('./lib/audit')

// The second argument to the callback is an object with the `pass` and `fail`
// keys.  Each of these is an object.  For each key package@version the value
// is the reason why the package passes or fails the checks.  If the reason is
// a string it's the license of the package@version, otherwise the reason is
// the exception object.
module.exports = function (opts, callback) {
  getLicenses(opts.checker)
  .then(function (json) {
    if (typeof opts.hook === 'function') {
      return opts.hook(json)
    }
    return json
  })
  .then(function (json) {
    var report = audit(opts.fix, json, opts.spdx, opts.include, opts.exclude)
    callback(null, report)
  })
  .catch(callback)
}
