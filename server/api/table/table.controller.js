'use strict';

var Table = require('./table.model');
var User = require('../user/user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var shortid = require('shortid');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of tables
 */
exports.index = function(req, res) {
  // Table.find({}, function (err, tables) {
  //   if(err) return res.status(500).send(err);
  //   res.status(200).json(tables);
  // });
  
  var findObject = {};
	if(req.body.tableId){
		findObject['_id'] = req.body.tableId;
	}else {
		return res.json('Auth Token Required')
	}

	Table.findOne(findObject).populate('Dealer players', '-hashedPassword -salt').exec(function(err, table){
		if(err){
			return res.json({flag:0, msg:"Error finding the table.", data: err});
		}else{
			res.json({flag:1, msg:"Dealer's table.", data: table});
		}
	});
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  	var randomTableUrl = shortid.generate();
	// var randomTableId = Math.round(Math.random() * Math.pow(10, 9)); // generates a random numeric value
	
	if(!req.body.tableName ){
		return res.json("Please Provide a Name for the Table.");
	}
	if( req.body.AnteAmount == null || req.body.AnteAmount == undefined ){
		return res.json("Please Provide the AnteAmount value");
	}
	if( !req.body.IsPublic ){
		return res.json("Plase define if the table is Public or not");
	}
	if( !req.body.dealerId ){
		return res.json("Please Specify the Dealer's ID");
	}

   	var obj = {
   		Name: req.body.tableName,
   		AnteAmount : req.body.AnteAmount,
   		IsPublic: req.body.IsPublic,
   		Dealer: req.body.dealerId,
   		TableUrl : randomTableUrl
		// TableId : randomTableId
   	}

   	Table.findOne({Name: req.body.tableName}, function(err, foundTable){
   		if(err){
   			res.json({flag:0, msg:"Error finding the table.", data: err});
   		}else{
   			if(foundTable){
   				res.json({flag:0, msg:"A Table Already exists with this name. Please try with another name."});	
   			}else{
   				Table.create(obj, function(err, result){
			   		if(err){
			   			res.json({flag:0, msg: "Error Creating a Table", data: err});
			   		}else{
			   			res.json({flag:1, msg:"Table Created", data: { tableUrl: result._id }});
			   		}
			   	});
   			}
   		}
   	})
};

exports.listPublicTables = function( req, res, next){
	Table.find({IsPublic: true, live: true}, function (err, tables){
		if(err)
			return res.json(err);

		return res.json({flag:1, msg:"Public Tables.", data: tables})
	})
};

exports.joinTable = function (req, res, next){
	/* 	{
			tableName : 'Texas Hold'em Poker,
			playerId : ObjectID
		} 
	*/

	var tableId = req.body.tableId;
	var playerId = req.body.playerId;
	Table.findOne({_id: tableId}, function(err, table){
		if(err){
			res.json({flag: 0, msg: "Cannot Find Table", data: err});
		}else{
			table.players.push(playerId);
			table.save(function(err, result){
				if(err)
					return res.json({flag:0, msg: "Error Adding Player to Dealer's Table"});
				return res.json({flag:1, msg: "Player Added to Dealer's Table", data: result});
			})
		}
	})
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

exports.removeTable = function(req, res){
	var tableId = req.body.tableId;
	console.log("tableId to be removed");
	console.log(tableId);
	Table.remove({_id: tableId}, function(err, result){
		if(err){
			res.json({flag:0, msg:"Error Deleting Requested Table", data:err});
		}else{
			res.json({flag:1, msg:"Requested Table Removed", data:result});
		}
	})
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
