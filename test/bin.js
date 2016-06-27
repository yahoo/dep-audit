/* globals it, describe, before */
var assert = require('assert')
var exec = require('child_process').exec

describe('If license does not match', function () {
  var code
  before(function (done) {
    exec('bin/dep-audit --config config/config.json',
      {cwd: process.cwd()},
      function (error) {
        code = error.code
        done()
      })
  })

  it('Should exit 1', function () {
    assert.equal(code, 1)
  })
})

describe('There is a dependency on inclusion list', function () {
  var code
  before(function (done) {
    exec('bin/dep-audit --config test/inclusion.json --fix --guess',
      {cwd: process.cwd()},
      function (error) {
        code = error
        done()
      })
  })

  it('Should exit 0', function () {
    assert.equal(code, null)
  })
})

describe('There is a dependency on exclusion list', function () {
  var err
  before(function (done) {
    exec('bin/dep-audit --config test/exclusion.json --fix --guess',
      {cwd: process.cwd()},
      function (error) {
        err = error
        done()
      })
  })

  it('Should exit 1', function () {
    assert.equal(err.code, 1)
  })
})
