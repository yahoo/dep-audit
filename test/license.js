/* globals it, describe, before, after */
var assert = require('assert')
var mockery = require('mockery')

describe('license module', function () {
  var getLicenses
  before(function () {
    var checkerMock = {
      init: function (opts, callback) {
        if (opts.err) {
          callback(new Error('Could not get licenses', null))
        }
        callback(null, 'success')
      }
    }
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    })
    mockery.registerMock('license-checker', checkerMock)
    getLicenses = require('../lib/license.js')
  })

  it('Returns resolved promise on success', function () {
    var opt = {}
    return getLicenses(opt)
    .then(function (data) {
      assert.equal(data, 'success')
    })
  })

  it('Rejects promise on error', function () {
    var opt = {err: true}
    return getLicenses(opt)
    .then(function (data) {
      assert.fail('No error thrown')
    })
    .catch(function (e) {
      assert.equal(e.message, 'Could not get licenses')
    })
  })

  after(function () {
    mockery.disable()
  })
})
