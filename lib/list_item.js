/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
var semver = require('semver')

module.exports = function getListItem (exceptions) {
  return function (pkg) {
    var components = pkg.split('@')
    var name = components[0]
    var ver = components[1]
    var match = null

    if (exceptions[name]) {
      exceptions[name].some(function (item) {
        if (semver.satisfies(ver, item.version_range)) {
          match = item
          return true
        }
      })
    }
    return match
  }
}
