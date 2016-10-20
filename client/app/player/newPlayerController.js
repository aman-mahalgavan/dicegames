angular.module('dicegamesProjectApp').controller('playerController', function($scope, $rootScope, $state, $http, pubnubConfig) {

	// PubNub Settings
	pubnub = PUBNUB.init({
        publish_key: pubnubConfig.publish_key,
        subscribe_key: pubnubConfig.subscribe_key,
        uuid: JSON.stringify($scope.userDetails),
        ssl: pubnubConfig.ssl
    });

    // Fetch User's Details ( API needs the AUTH token for sending back the user details )
    (function() {
        $http.get('/api/users/me').success(function(response) {
            
            $scope.userDetails = response;
            var tableId = $state.params.tableId;
            findMyTable($scope.userDetails, tableId);

        }).error(function(error) {
            console.log("Error Fetching User's Details.")
            console.log(error);
        })
    })();

    function findMyTable(userDetails, tableId) {
        $http.post('/api/tables/findTable', {tableId: tableId}).success(function(dealersTable) {
            
            $scope.dealerTableDetails = dealersTable;
            $scope.betAmount = $scope.dealerTableDetails.data.AnteAmount;

            // startPlayersVideoStream(userDetails, dealersTable);
            // initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, dealersTable);

        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
    };

    // Game Logic =>

    // Global Variables for Game. Players who join the table will get this information and then continue playing from there.
	// Players will be allowed to be in the table while it is in Wait mode other wise they will have to wait for another round to start.
    $scope.turn;
	$scope.playersInGame = [];
	$scope.playersInRound = [];
	$scope.time = {
		waitTime: 0,
		roundTime: 0
	};
	$scope.score = {
        'Dealer': {},
        'Player': {}
    };

    function initiateGame(userDetails, dealersTable){

    	// DOM Elements
    	var resultContainer = document.getElementById('diceResults');
    	var gameId = document.querySelector('#gameId');
    	var gameIdQuery = document.querySelector('#gameIdQuery');
    	var output = document.querySelector('#output');
        var whosTurn = document.getElementById('whosTurn');
        var display = document.querySelector('#time');

        // dice images
        var diceOne = '<img data-diceValue="1" src="../../assets/images/diceone.png" style="margin-right:10px;">';
        var diceTwo = '<img data-diceValue="2" src="../../assets/images/dicetwo.png" style="margin-right:10px;">';
        var diceFour = '<img data-diceValue="4" src="../../assets/images/dicefour.png" style="margin-right:10px;">';

        var diceArray = [];
        diceArray.push(diceOne, diceTwo, diceFour);

        // Set up Game Gequirements
        var gameid = dealersTable.data._id;
		var channel = 'dicegames-' + gameid;
		var uuid = JSON.stringify(userDetails);
		var mySign = userDetails._id;

		// Roll Player's Dice
		$scope.rollDice = function() {
            // Disable All playing controls after the dice has been rolled. These will get re-enabled when a new round begins
            document.getElementById('bet').setAttribute('disabled', 'disabled');
            document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
            document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
            resultContainer.innerHTML = "";
            var chosenDices = [];
            for (var i = 0; i < 3; i++) {
                var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
                chosenDices.push(dice);
                resultContainer.innerHTML += dice;
            };

            var arr = document.getElementById('diceResults').children;
            var diceSum = 0;
            for (var j = 0; j < arr.length; j++) {
                diceSum += Number(arr[j].getAttribute('data-diceValue'));
            }
            $scope.DiceTotalValue = diceSum;

            set(diceSum, chosenDices);
        };

        // Get details of who the player has bet on, hide the modal explicitly and roll the player's dice
        $scope.placeBet = function(betAmount, betOn) {
            
            if (betOn == 'me') {
                $scope.gameWinner = $scope.userDetails._id;
            } else if (betOn == 'dealer') {
                $scope.gameWinner = $scope.dealerTableDetails.data.dealer;
            }
            $('#myModal').modal('hide');
            $scope.rollDice();

        };

        // Increase/Decrease the bet amount value
        $scope.changeBetAmt = function(flag, betAmount) {
            if (flag == 'increase') {
                $scope.betAmount = $scope.betAmount + 1;
            }

            if (flag == 'decrease') {
                if (betAmount == $scope.dealerTableDetails.data.AnteAmount) {
                    return;
                };
                $scope.betAmount = $scope.betAmount - 1;
            }
        };

        /* ============== Publish & subscribe using Pubnub ============== */

        // Player will publish his player ID to the dealers public channel
        pubnub.publish({
            channel: dealersTable.data.Dealer._id,
            message: {
                player: JSON.stringify(userDetails),
                flag: 'publishing players channel ID'
            },
            callback: function(m) {
                console.log("Publish Player");
                console.log(m);
            }
        });

        // Subscribe to Dealer's public channel to get dealer's moves
        pubnub.subscribe({
            channel: dealersTable.data._id,
            // connect: play,
            presence: function(m) {
                console.log('Player Controller');
                console.log(m);
                // whosTurn

                if (m.uuid === uuid && m.action === 'join') {
                    if (m.occupancy < 2) {
                        // whosTurn.textContent = 'Waiting for your opponent...';
                    } else if (m.occupancy === 2) {
                        mySign = userDetails._id;
                    }
                    // else if (m.occupancy > 2) {
                    //     alert('This game already have two players!');
                    //     // tictactoe.className = 'disabled';
                    // }
                    if (m.occupancy === 2) {
                        startNewGame();
                    }
                }
                document.getElementById('you').textContent = mySign;
            },
            callback: function(m) {
            	checkGameStatus(m.player, m.diceValue);
            },
        });

        // Publish Player's data on private channel which the dealer is subscribed to
        function publishPosition(player, position, status, diceValue, chosenDices, channelName, gameWinner) {
          
            pubnub.publish({
                channel: channelName,
                message: {
                    player: userDetails._id,
                    playerName: userDetails.name,
                    playerData: player,
                    diceValue: diceValue,
                    dice: chosenDices,
                    channel: channelName,
                    betOn : gameWinner,
                    flag: "publishing player's move"
                },
                callback: function(m) {
                    // $scope.score[m.player] = m.diceValue;
                    console.log("Publish Player");
                    console.log(m);
                    checkGameStatus(userDetails._id, diceValue);
                }
            });
        };

        // Subscribe to players own channel
        pubnub.subscribe({
            channel: userDetails._id,
            presence: function(m){
                // console.log("Data from Dealer on Player's Private channel - Presence");
                // console.log(m);

            },
            callback: function(m) {
                if(m.data){
                    console.log("Data from Dealer on Player's Private channel - Callback");
                    console.log(m);
                    
                    var publishedTime = m.data.timestamp;
                    var endTime = moment(publishedTime).add((m.data.duration+1), 's');
                    var difference = moment().utc().diff(endTime, 'seconds');
                    console.log("difference in published time and players time");
                    console.log(difference);
                    var timerValue = Math.abs(difference);
                    if(m.data.flag == 'wait'){
                        // Disable all playing controls while we are waiting for other players to join
                        document.getElementById('bet').setAttribute('disabled', 'disabled');
                        document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
                        document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
                        waitTimer(timerValue).startTimer(0);
                    };
                    if(m.data.flag == 'startRound'){
                        roundTimer(timerValue).startTimer(0);
                        // Enable all playing controls while the round is going on
                        document.getElementById('bet').removeAttribute('disabled');
                        document.getElementById('decreaseBet').removeAttribute('disabled');
                        document.getElementById('increaseBet').removeAttribute('disabled');
                    };

                };
            }
        });
        /* ============== Publish & subscribe using Pubnub End ============== */

        // Timers
        var roundTimer = function (seconds) {
            var seconds = seconds; 
            var tens = 00; 
            var roundInterval;

            function startCounter (duration) {
                
                tens++; 
                if(seconds > duration){
                    if (tens > 60) {
                        seconds--;
                        tens = 0;
                    }
                }
                if(seconds == duration){
                    clearInterval(roundInterval);
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    $scope.rollDice();
                }else{
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    // Publish the Round Time to all the players playing the game
                }
                

                
                // $scope.time.roundTime = seconds;
                // publishToPlayer($scope.playersPrivateChannel, {time: $scope.time.roundTime, flag: 'RoundTime'});
                console.log(seconds + ' | ' + duration);
            }
            return {
                startTimer: function (duration, flag) {
                    var time = duration;
                    clearInterval(roundInterval);
                    roundInterval = setInterval(function () {
                        startCounter(time, flag);
                    }, 30);
                }
            }
        };

        var waitTimer = function (seconds) {
            var seconds = seconds; 
            var tens = 00; 
            var waitInterval;

            function startCounter (duration) {
                
                tens++; 
                if(seconds > duration){
                    if (tens > 60) {
                        seconds--;
                        tens = 0;
                    }
                }
                if(seconds == duration){
                    clearInterval(waitInterval);
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    
                }else{
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds. Waiting for players to join';
                    
                }
                

                // $scope.time.waitTime = seconds;
                // publishToPlayer($scope.playersPrivateChannel, {time: seconds, flag: 'WaitTime'});
                console.log(seconds + ' | ' + duration);
            }
            return {
                startTimer: function (duration, flag) {
                    var time = duration;
                    clearInterval(waitInterval);
                    waitInterval = setInterval(function () {
                        startCounter(time, flag);
                    }, 30);
                }
            }
        };

        function startNewGame() {
            // document.getElementById('rollDice').removeAttribute('disabled');
            resultContainer.innerHTML = "";
            var i;
            $scope.turn = userDetails._id;

            $scope.score = {
                'Dealer': {},
                'Player': {}
            };
            

            $scope.score.Player['name'] = userDetails.name;
            $scope.score.Player['id'] = userDetails._id;
            $scope.score.Player['value'] = 0;

            $scope.score.Dealer['name'] = dealersTable.data.Dealer.name;
            $scope.score.Dealer['id'] = dealersTable.data.Dealer._id;
            $scope.score.Dealer['value'] = 0;
            

            moves = 0;
            for (i = 0; i < squares.length; i += 1) {
                squares[i].firstChild.nodeValue = EMPTY;
            }

            // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
        };

        function win(score) {
            
            if($scope.score.Dealer.value && $scope.score.Dealer.value != 0 && $scope.score.Player.value && $scope.score.Player.value !=0 ){
                
                if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Player.name + ' Wins.'; // Player Wins
                }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Player.name + ' Wins.'; // Player wins
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value == $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else{
                    return false;
                }
            }else{
                return false;
            }
        };

        function checkGameStatus(player, el) {
            // moves += 1;
            
            console.log('Score for player, ' + player );
            console.log($scope.score );

            if(player == userDetails._id){
                $scope.score.Player.value = el;
            }else if(player == dealersTable.data.Dealer._id){
                $scope.score.Dealer.value = el;
            }

            if (win($scope.score)) {
                alert(win($scope.score));
                document.getElementById('bet').disabled = false;
            } 
            // else if (moves > 2) {
            //     swal('Reset Game', 'error');
            // } 

            else {
                $scope.turn = ($scope.turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
                // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
            }
        };

        function set(diceSum, chosenDices) {
            if ($scope.turn !== mySign) return;
            publishPosition(userDetails, 'this.dataset.position', 'played', diceSum, chosenDices, userDetails._id,  $scope.gameWinner);
        }

    };

});