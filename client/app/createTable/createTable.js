'use strict';

angular.module('dicegamesProjectApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('createTable', {
        url: '/createTable',
        templateUrl: 'app/createTable/createTable.html',
        controller: 'createTableController'
      });
  });