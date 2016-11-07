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
var PubNub = require('pubnub')


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

var pubnub = new PubNub({
    publishKey : 'pub-c-d20c6ea0-72f7-4bf7-b6f7-7d1562b435c1',
    subscribeKey : 'sub-c-a9e92b54-8ba6-11e6-8409-0619f8945a4f'
});

// (function(){
// 	console.log('pubnub subscribe');
// 	pubnub.subscribe({
// 	    channel: 'diceGamesDealerList',
// 	    presence: function(m){
// 	        console.log("Server Channel diceGamesDealerList - presence");
// 	        console.log(m);
// 	    },
// 	    callback: function(m){
// 	        console.log("Server Channel diceGamesDealerList - callback");
// 	        console.log(m);
// 	    }
// 	});

// 	pubnub.addListener({
//         status: function(statusEvent) {
//             if (statusEvent.category === "PNConnectedCategory") {
//                 publishSampleMessage();
//             }
//         },
//         message: function(message) {
//             console.log("New Message!!", message);
//         },
//         presence: function(presenceEvent) {
//             // handle presence
//         }
//     })   
// }) ();
pubnub.addListener({
    
    message: function(m) {
        // handle message
        var channelName ='diceGamesDealerList'; // The channel for which the message belongs
        // var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
        // var pubTT = m.timetoken; // Publish timetoken
        var msg = m.message; // The Payload
    },
    presence: function(p) {
    	console.log("Server ");
    	console.log(p);
        // handle presence
        var action = p.action; // Can be join, leave, state-change or timeout
        var channelName = p.channel; // The channel for which the message belongs
        var occupancy = p.occupancy; // No. of users connected with the channel
        var state = p.state; // User State
        // var channelGroup = p.subscription; //  The channel group or wildcard subscription match (if exists)
        // var publishTime = p.timestamp; // Publish timetoken
        // var timetoken = p.timetoken;  // Current timetoken
        var uuid = p.uuid; // UUIDs of users who are connected with the channel
    },
    status: function(s) {
        // handle status
    }
})

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
