'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

	var TableSchema = new Schema({
		
		Name: String,
		TableUrl : String,
		// TableId : Number,
		AnteAmount: Number,
		IsPublic: Boolean,
		dialNumber: String,
		Dealer: {type: Schema.Types.ObjectId, ref: 'users'},
		players : [{type: Schema.Types.ObjectId, ref: 'users'}],
		Start : {type: Date, default: Date.now},
		End: Date,
		ActiveCount: Number,
		LeftCount: Number,
		live: {type: Boolean, default: true},
		CreatedOn : {type: Date, default: Date.now},
		ModifiedOn: {type: Date, default: Date.now}

	},{ collection: 'tables' });

module.exports = mongoose.model('tables', TableSchema);