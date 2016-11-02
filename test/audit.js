/* globals it, describe, before, after */
var assert = require('assert')
var mockery = require('mockery')

describe('audit module', function () {
  var audit, bl, wl
  before(function () {
    bl = {name: 'x', version_range: '1.0.0',
      audit_trail: '1/1/2000', desc: 'blacklisted'}
    wl = {name: 'y', version_range: '2.0.0',
      audit_trail: '2/2/2000', desc: 'whitelisted'}
    var exceptionMock = function (config) {
      return function (name) {
        var item = null
        var split = name.split('@')
        if (split[0] === config.name &&
        split[1] === config.version_range) {
          item = config
        }
        return item
      }
    }
    var satisfiesMock = function (license, allowed) {
      if (license === 'err') {
        throw new Error()
      }
      return license === allowed
    }
    var fixMock = function (spdx) {
      if (spdx === 'OR' || spdx === 'unknown') {
        return null
      }
      return 'fix_' + spdx
    }
    var validMock = function (license) {
      if (license === 'invalid') {
        return {spdx: false}
      }
      return {spdx: true}
    }
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    })
    mockery.registerMock('spdx-satisfies', satisfiesMock)
    mockery.registerMock('spdx-correct', fixMock)
    mockery.registerMock('validate-npm-package-license', validMock)
    mockery.registerMock('./list_item.js', exceptionMock)
    audit = require('../lib/audit')
  })

  it('reports packages not in inclusion list', function () {
    var modules = {'z@1.0.1': {licenses: 'foo'}}
    var res = audit(false, modules, 'bar', wl, bl)
    assert.equal(Object.keys(res.pass).length, 0, 'no passing modules')
    assert.deepEqual(res.fail, {
      'z@1.0.1': 'foo'
    }, 'one failing module')
  })

  it('reports packages in exclusion list', function () {
    var modules = {'x@1.0.0': {licenses: 'foo'}}
    var res = audit(false, modules, 'foo', wl, bl)
    assert.equal(Object.keys(res.pass).length, 0, 'no passing modules')
    assert.deepEqual(res.fail, {
      'x@1.0.0': {
        name: 'x',
        version_range: '1.0.0',
        audit_trail: '1/1/2000',
        desc: 'blacklisted'
      }
    }, 'one failing module')
  })

  it('reports all passing modules', function () {
    var modules = {'z@1.0.0': {licenses: 'foo'}, 'y@2.0.0': {licenses: 'bar'}}
    var res = audit(false, modules, 'foo', wl, bl)
    assert.deepEqual(res, {
      pass: {
        'y@2.0.0': {
          name: 'y',
          version_range: '2.0.0',
          audit_trail: '2/2/2000',
          desc: 'whitelisted'
        },
        'z@1.0.0': 'foo'
      },
      fail: {}
    })
  })

  it('Removes asterisks from licenses when checking', function () {
    var modules = {'z@5.0.0': {licenses: '(foo* OR bar*)'}}
    var res = audit(false, modules, '(foo OR bar)', wl, bl)
    assert.deepEqual(res.pass, {
      'z@5.0.0': '(foo OR bar)'
    })
  })

  it('Fixes licenses in spdx expression', function () {
    var modules = {'m@5.0.0': {licenses: '(foo OR bar OR test)'}}
    var res = audit(true, modules, '(fix_foo OR fix_bar OR fix_test)', wl, bl)
    assert.deepEqual(res.pass, {
      'm@5.0.0': '(fix_foo OR fix_bar OR fix_test)'
    })
  })

  it('Fixer returns original value if it cannot fix license', function () {
    var modules = {'z@2.3.0': {licenses: '(unknown OR unknown)'}}
    var res = audit(true, modules, '(unknown OR unknown)', wl, bl)
    assert.deepEqual(res.pass, {
      'z@2.3.0': '(unknown OR unknown)'
    })
  })

  it('If license cannot be read, does not satisfy', function () {
    var modules = {z: {licenses: 'err'}}
    var res = audit(false, modules, 'mit', wl, bl)
    assert.deepEqual(res.fail, {
      'z': 'err'
    })
  })

  it('If allowed licenses are invalid, throws error', function () {
    try {
      var modules = {z: {licenses: 'foo'}}
      audit(false, modules, 'invalid', wl, bl)
    } catch (e) {
      assert.equal(e.message, 'Allowed licenses invalid is not a valid spdx expression')
    }
  })

  it('If license field is array, create spdx', function () {
    var modules = {'x@2.1.1': {licenses: ['MIT', 'ISC']}}
    var res = audit(false, modules, '(MIT OR ISC)', wl, bl)
    assert.deepEqual(res.pass, {
      'x@2.1.1': '(MIT OR ISC)'
    })
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })
})
