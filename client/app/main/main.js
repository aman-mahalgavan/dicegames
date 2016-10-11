'use strict';

angular.module('dicegamesProjectApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/dashboard',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });
  });