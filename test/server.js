'use strict'

const code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script({ output: process.stdout })
const build = require('../')

lab.experiment('POST /', () => {
  let server

  lab.beforeEach((done) => {
    build({ port: 8989 }, (err, s) => {
      server = s
      done(err)
    })
  })

  lab.test('Add point', (done) => {
    var point = {
      date: new Date().toISOString(),
      type: 'smog',
      value: 42,
    }
    const options = { method: 'POST', url: '/', payload: point }
    server.inject(options, function (response) {
      const result = response.result
      code.expect(result).to.equal(null)
      code.expect(response.statusCode).to.equal(200)
      done()
    })
  })
})
