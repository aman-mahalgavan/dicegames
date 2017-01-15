'use strict';

angular.module('dicegamesProjectApp')
  .controller('NavbarCtrl', function ($rootScope, $scope, $location, Auth, $http) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/dashboard'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $rootScope.addCredit = function(creditAmount){
      $http.post('/api/users/addCredit', {creditAmount: creditAmount}).success(function(response){
          console.log("Credit Added");
          console.log(response);
          swal('Credit Added Successfully', "success");
          $('#addCreditModal').modal('hide');
      }).error(function(error){
          swal('Error Adding Credit to your Account at the moment. Please try Later.', error);
      });
    };
  });