'use strict';

angular.module('dicegamesProjectApp')
  .controller('MainCtrl', function ($scope, $http, $state) {
    // $scope.awesomeThings = [];

    // $http.get('/api/things').success(function(awesomeThings) {
    //   $scope.awesomeThings = awesomeThings;
    // });

    // $scope.addThing = function() {
    //   if($scope.newThing === '') {
    //     return;
    //   }
    //   $http.post('/api/things', { name: $scope.newThing });
    //   $scope.newThing = '';
    // };

    // $scope.deleteThing = function(thing) {
    //   $http.delete('/api/things/' + thing._id);
    // };

    (function(){
      $http.get('/api/users/me').success(function(response){
        $scope.playerDetails = response;
      }).error(function(error){
        console.log("Error Fetching User's Details.");
        console.log(error);
      });
    })();
    
    $scope.liveTables = [];

    // Delete interval when the user navigates to another page
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        console.log("State Change");
        if (fromState.name == 'main') {
          if($scope.fetchTables){
            clearInterval($scope.fetchTables);
          }
        };
    });


    // Fetch List of Tables
    $scope.fetchTables = setInterval(function(){
      $http.get('/api/tables/listPublicTables').success(function(response){
        /*if(response.data.length > 0){
          response.data.forEach(function(item){
            // item.CreatedOn = moment(item.CreatedOn).format('dddd, MMMM Do YYYY, h:mm:ss a ');
            // console.log(item.CreatedOn);
          });
        };*/

        angular.copy(response.data, $scope.liveTables);
      }).error(function(err){
        console.log("Error Fetching List of Dealer's Tables");
        console.log(err);
      }); 
    }, 5000);
    

    function TrimString(x) {
        return x.replace(/ /g,'');
    }

    // $scope.createTable = function(){

    //  /* 
    //    API PAYLOAD - 
    //    Name: req.body.name,
    //        AnteAmt : req.body.AnteAmount,
    //        IsPublic: req.body.IsPublic,
    //        Dealer: req.body.userId,
    //        TableUrl : randomTableUrl,
    //    TableId : randomTableId
    //  */

    //  var hostname = prompt('Enter a Table Name', 'Table Name');
      
    //  if (hostname != null) {
    //    hostname = TrimString(hostname);
    //    $http.post('/api/table', {name:hostname}).success(function(response){
    //      $state.go('dealer', {host:hostname, tableName: });  
    //    }).error(function(err){
    //      alert('Error Creating a Table.');
    //    })
    //  }
    // };

    $scope.joinTableFromList = function(table){
      var playerid = $scope.playerDetails._id;
      /*
        Sample Payload
        {
          tableName:host.Name, - Mongoose _id
          playerId:username
        }
      */
      // var username = prompt('Enter a UserName', 'username');
      
      // if (username != null) {
        $http.post('/api/tables/joinTable', {tableId:table._id, playerId:playerid}).success(function(){
          $state.go('player', { tableId:table._id });
        }).error(function(error){
          console.log("Error Joining the table");
          console.log(error);
        });
      // }
    };
  });
