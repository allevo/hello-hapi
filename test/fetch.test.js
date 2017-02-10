'use strict'

const code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script({ output: process.stdout })
const build = require('../')
var pino = require('pino')
var timeseries = require('@danilo.sanchi/timeseries')

var MongoClient = require('mongodb').MongoClient

var map = require('async').map
var moment = require('moment')

var db

lab.experiment('GET /', () => {
  let server

  lab.beforeEach((done) => {
    build({ port: 8989 }, (err, s) => {
      server = s
      done(err)
    })
  })

  lab.beforeEach((done) => {
    MongoClient.connect('mongodb://localhost:27017/hello', function (err, _db) {
      if (err) return done(err)
      db = _db
      db.dropDatabase(done)
      done()
    })
  })

  var points = [{
    date: moment().subtract(1, 'month').toDate(),
    type: 'smog',
    value: Math.random() * 100,
  }, {
    date: moment().subtract(3, 'days').toDate(),
    type: 'smog',
    value: Math.random() * 100,
  }, {
    date: new Date(),
    type: 'smog',
    value: Math.random() * 100,
  }, {
    date: new Date(),
    type: 'temp',
    value: Math.random() * 100,
  }]
  lab.beforeEach((done) => {
    var logger = pino()
    var timeserie = timeseries(db, logger)
    map(points, function (item, next) {
      timeserie.addPoint(item.date, item.type, item.value, next)
    }, done)
  })

  lab.test('Fetch Points', (done) => {
    var from = moment().subtract(4, 'days').toDate().toISOString()
    var to = new Date().toISOString()

    var payload = {
      type: 'smog',
      from: from,
      to: to,
    }

    const options = { method: 'GET', url: '/?' + require('querystring').stringify(payload) }
    server.inject(options, function (response) {
      var docs = response.rawPayload.toString().split('\n').map(i => {
        if (!i) return
        return JSON.parse(i)
      })
      docs.pop()

      code.expect(docs.length).to.equal(2)
      //code(docs[0].date).to.equal(2)
      code.expect(docs[0].type).to.equal('smog')
      //code(docs[0].value).to.equal(42)

      code.expect(docs[1].type).to.equal('smog')
      //code(docs[1].value).to.equal(42)

      done()
    })
  })
})
