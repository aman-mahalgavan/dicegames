/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var fs = require('fs')
var https = require('https');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

// Server Certificates
var options = {
   key  : fs.readFileSync(__dirname + '/server.key'),
   cert : fs.readFileSync(__dirname + '/server.crt'),
};

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();

// https.createServer(options, app).listen(config.port, config.ip, function () {
//    console.log('Game Is Live on -> ' + config.port);
// });

// var server = require('http').createServer(app);
var server = https.createServer(options, app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
