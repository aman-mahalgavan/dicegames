'use strict';

var express = require('express');
var controller = require('./table.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();
console.log('ROUTES ==>');
router.post('/findTable',auth.isAuthenticated(), controller.index);
router.post('/createTable',auth.isAuthenticated(), controller.create);
router.get('/listPublicTables', controller.listPublicTables);
router.post('/joinTable', controller.joinTable);
// router.post('/listPrivateTables', controller.listPrivateTables);

// router.get('/', auth.hasRole('admin'), controller.index);
// router.delete('/:id', auth.hasRole('admin'), controller.destroy);
// router.get('/me', auth.isAuthenticated(), controller.me);
// router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
// router.get('/:id', auth.isAuthenticated(), controller.show);
// router.post('/', controller.create);

module.exports = router;
