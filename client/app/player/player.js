'use strict';

angular.module('dicegamesProjectApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('player', {
        url: '/player/:tableId',
        templateUrl: 'app/player/player.html',
        controller: 'playerController'
      });
  });