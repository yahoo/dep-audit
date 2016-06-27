/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
var licenseSatisfies = require('spdx-satisfies')
var correct = require('spdx-correct')
var valid = require('validate-npm-package-license')
var getItem = require('./list_item.js')
var json = require(process.cwd() + '/package.json')

function satisfies (license, allowed) {
  try {
    return licenseSatisfies(license, allowed)
  } catch (e) { // catch lexical error if license not recognized
    return false
  }
}

function spdxFix (spdx) {
  var licenses = spdx.split(' ')
  var fixed = licenses.map(function (val, ind) {
    if (val.charAt(0) === '(') {
      return '(' + (correct(val.slice(1)) || val.slice(1))
    } else if (val.charAt(val.length - 1) === ')') {
      return (correct(val.slice(0, -1)) || val.slice(0, -1)) + ')'
    } else {
      return correct(val) || val
    }
  })
  return fixed.join(' ')
}

module.exports = function audit (fix, modules, allowed, inclusions, exclusions) {
  if (valid(allowed).spdx !== true) {
    throw new Error('Allowed licenses ' + allowed + ' is not a valid spdx expression')
  }

  var getInclusion = getItem(inclusions)
  var getExclusion = getItem(exclusions)

  return Object.keys(modules).reduce(function (list, name) {
    if (json.name + '@' + json.version === name) {
      return list // does not audit the project in the working directory
    }
    var licenses = modules[name].licenses
    if (Array.isArray(licenses)) {
      licenses = '(' + licenses.join(' OR ') + ')'
    }
    licenses = licenses.replace(/[*]/g, '') // in case we are guessing
    licenses = fix ? spdxFix(licenses) : licenses

    var exception = null
    if (satisfies(licenses, allowed)) {
      exception = getExclusion(name)
      if (exception) {
        var err = new Error('Module ' + name + ' is on the exclusion list')
        err.item = exception
        throw err
      }
    } else {
      exception = getInclusion(name)
      if (!exception) {
        throw new Error('License ' + licenses + ' is not allowed and module ' +
          name + ' is not on the inclusion list')
      }
    }

    return exception ? list.concat([exception]) : list
  }, [])
}
