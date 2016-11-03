angular.module('dicegamesProjectApp').controller('createTableController', function($scope, $rootScope, $state, $http, $cookieStore, pubnubConfig) {

	(function(){
		$http.get('/api/users/me').success(function(response){
			$scope.userDetails = response;
            console.log("User Details");
            console.log(response);
		}).error(function(error){
			console.log("Error Fetching User's Details.")
			console.log(error);
		})
	})();

	// Starting Wager //
    $scope.wager = 0;

    $scope.getNumber = function() {
       alert('The number is: [' + $scope.wager + ']');
    };

    $scope.onChange = function(){
       console.log('The number is Changed ', $scope.input.num);
    };

    $scope.changePrivacy = function(value){
    	return value;
    };
	$scope.privacy;
    $scope.hostNewTable = function(){
    	var obj = {};

    	obj['tableName'] = $scope.tableName;
    	obj['AnteAmount'] = $scope.wager;
    	obj['IsPublic'] = $scope.privacy;
    	obj['dealerId'] = $scope.userDetails._id;
        console.log(obj);
    	$http.post('/api/tables/createTable', obj).success(function(response){
    		if(response.flag == 1){ 
    			$state.go('dealer', {tableId: response.data.tableUrl});	
    		}else{
    			swal("Error creating a New Table", ""+response.msg + "", "error");
    		}
    		
    	}).error(function(error){
    		console.log("Error Creating a new table");
    		console.log(error);
    	})

    };

    /*
    	======================================
    	=========== VIDEO Preview ============
    	======================================
    */

    var vid_thumb = document.getElementById("vid-preview");
    
    var connection = new RTCMultiConnection();
    connection.session = {
        audio: true,
        video: true,
        oneway: true
    };

    connection.channel = 'preview';

    connection.onstream = function(e) {
        e.mediaElement.width = '100%';
        vid_thumb.insertBefore(e.mediaElement, vid_thumb.firstChild);
    };

    connection.open('preview');
    connection.connect();
    
    // End Preview Video on state change
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            console.log("State Change");
            if (fromState.name == 'createTable') {
                // Close connection
                connection.close('preview');
            };
    });


});
