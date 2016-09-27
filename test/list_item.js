/* globals it, describe, before, after */
var assert = require('assert')
var mockery = require('mockery')

describe('exceptions module', function () {
  var getItem
  before(function () {
    var semverMock = {satisfies: function (version, accepted) {
      return version === accepted
    }}

    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    })
    mockery.registerMock('semver', semverMock)
    var exceptionList = {
      'pp': [{version_range: '2.9.0'}],
      'x': [{version_range: '1.0.0'}]
    }
    getItem = require('../lib/list_item.js')(exceptionList)
  })

  it('Returns list item if name is on exception list and version is ok', function () {
    assert.deepEqual(getItem('x@1.0.0'), {version_range: '1.0.0'})
  })

  it('Returns null if name is not on exception list', function () {
    assert.equal(getItem('y@1.0.0'), null)
  })

  it('Returns null if version is not in accepted range', function () {
    assert.equal(getItem('x@1.0.1'), null)
  })

  after(function () {
    mockery.disable()
  })
})
