/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
var checker = require('license-checker')
var Promise = require('bluebird')

module.exports = function getModules (opts) {
  return new Promise(function (resolve, reject) {
    checker.init(opts, function (err, json) {
      err ? reject(err) : resolve(json)
    })
  })
}
