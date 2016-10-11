'use strict';

angular.module('dicegamesProjectApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('dealer', {
        url: '/dealer/:tableId ',
        templateUrl: 'app/dealer/dealer.html',
        controller: 'dealerController'
      });
  });