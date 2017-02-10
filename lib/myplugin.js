'use strict'

var MongoClient = require('mongodb').MongoClient
var pino = require('pino')()
var timeseries = require('@danilo.sanchi/timeseries')
var Joi = require('joi')
var through2 = require('through2')

function createMongoConnection(url, callback) {
  MongoClient.connect(url, callback)
}

module.exports.register = function (server, options, next) {
  var url = 'mongodb://localhost:27017/hello'
  createMongoConnection(url, function(err, db) {
    if (err) return next(err)

    var timeserie = timeseries(db, pino)

    function addPointHandler (request, reply) {

      var point = request.payload
      timeserie.addPoint(point.date, point.type, point.value, reply)
    }

    server.route({ method: 'POST', path: '/', handler: addPointHandler, config: {
      validate: {
        payload: {
          date: Joi.date().iso(),
          type: Joi.string().min(3),
          value: Joi.number(),
        },
      },
    }})

    function fetchSerieHandler (request, reply) {
      var type = request.query.type
      var from = request.query.from
      var to = request.query.to

      var stream = timeserie.fetchSerie(type, {to: to, from: from})
      var r = stream.pipe(through2.obj(function(data, encoding, callback) {
        this.push(JSON.stringify(data)+'\n')
        callback()
      })).pipe(through2())

      reply(r)
    }

    server.route({ method: 'GET', path: '/', handler: fetchSerieHandler, config: {
      validate: {
        query: {
          type: Joi.string().min(3),
          from: Joi.date().iso(),
          to: Joi.date().iso(),
        },
      },
    }})

    next()
  })
}

module.exports.register.attributes = {
  name: 'myplugin',
  version: '0.0.1'
}
