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
    mockery.enable({useCleanCache: true})
    mockery.registerMock('spdx-satisfies', satisfiesMock)
    mockery.registerMock('spdx-correct', fixMock)
    mockery.registerMock('validate-npm-package-license', validMock)
    mockery.registerMock('./list_item.js', exceptionMock)
    audit = require('../lib/audit')
  })

  it('Raise error if license invalid and not on inclusion list', function () {
    try {
      var modules = {'z@1.0.1': {licenses: 'foo'}}
      audit(false, modules, 'bar', wl, bl)
      assert.fail('No error thrown.')
    } catch (e) {
      assert.equal(e.message,
        'License foo is not allowed and module z@1.0.1 is not on the inclusion list')
    }
  })

  it('Raise error if license valid and on the exclusion list', function () {
    try {
      var modules = {'x@1.0.0': {licenses: 'foo'}}
      audit(false, modules, 'foo', wl, bl)
      assert.fail('No error thrown')
    } catch (e) {
      assert.equal(e.message, 'Module x@1.0.0 is on the exclusion list')
    }
  })

  it('Returns info of modules on inclusion list if all modules pass', function () {
    var modules = {'z@1.0.0': {licenses: 'foo'}, 'y@2.0.0': {licenses: 'bar'}}
    var item = audit(false, modules, 'foo', wl, bl)
    assert.deepEqual([{name: 'y', version_range: '2.0.0',
      audit_trail: '2/2/2000', desc: 'whitelisted'}], item)
  })

  it('Terminates immediately on first bad module', function () {
    try {
      var modules = {'x@1.0.0': {licenses: 'foo'}, 'z@3.0.0': {licenses: 'bar'}}
      audit(false, modules, 'foo', wl, bl)
      assert.fail('No error thrown')
    } catch (e) {
      assert.equal(e.message, 'Module x@1.0.0 is on the exclusion list')
    }
  })

  it('Removes asterisks from licenses when checking', function () {
    var modules = {'z@5.0.0': {licenses: '(foo* OR bar*)'}}
    var item = audit(false, modules, '(foo OR bar)', wl, bl)
    assert.deepEqual([], item)
  })

  it('Fixes licenses in spdx expression', function () {
    var modules = {'z@5.0.0': {licenses: '(foo OR bar OR test)'}}
    var item = audit(true, modules, '(fix_foo OR fix_bar OR fix_test)', wl, bl)
    assert.deepEqual([], item)
  })

  it('Fixer returns original value if it cannot fix license', function () {
    var modules = {'z@2.3.0': {licenses: '(unknown OR unknown)'}}
    var item = audit(true, modules, '(unknown OR unknown)', wl, bl)
    assert.deepEqual([], item)
  })

  it('If license cannot be read, does not satisfy', function () {
    var modules = {'y@2.0.0': {licenses: 'err'}}
    audit(false, modules, 'mit', wl, bl)
    try {
      modules = {z: {licenses: 'err'}}
      audit(false, modules, 'mit', wl, bl)
    } catch (e) {
      assert.equal(e.message, 'License err is not allowed and module z is not on the inclusion list')
    }
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
    var item = audit(false, modules, '(MIT OR ISC)', wl, bl)
    assert.deepEqual([], item)
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })
})
