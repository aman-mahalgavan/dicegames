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
    			// localStorage.setItem('tableUrl', response.data.tableUrl);
                // localStorage.setItem('tableId', response.data.table_id);
                // $cookieStore.put('tableUrl', response.data.tableUrl);
                // $state.go('dealer', {host: response.data.table_id, tableName:$scope.tableName });   
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
    	=============== VIDEO ================
    	======================================
    */

    var vid_thumb = document.getElementById("vid-preview");
    
    var phone1 = window.phone1 = PHONE({
        number: 'preview',
        ssl: true,
        publish_key: pubnubConfig.publish_key,
        subscribe_key: pubnubConfig.subscribe_key,
    });
    var ctrl1 = window.ctrl1 = CONTROLLER(phone1);
    ctrl1.ready(function() {
        ctrl1.addLocalStream(vid_thumb);
    });
        

});
