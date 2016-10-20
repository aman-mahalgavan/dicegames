angular.module('dicegamesProjectApp').controller('dealerController', function($scope, $rootScope, $state, $http, pubnubConfig, $cookieStore) {

	// PubNub Settings
	pubnub = PUBNUB.init({
        publish_key: pubnubConfig.publish_key,
        subscribe_key: pubnubConfig.subscribe_key,
        uuid: $scope.userDetails,
        ssl: pubnubConfig.ssl,
        broadcast: true,
        oneway: true
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

    // Fetch Table Details
    function findMyTable(userDetails, tableId) {
        $http.post('/api/tables/findTable', {tableId: tableId}).success(function(dealersTable) {
           	
           	$scope.dealerTableDetails = dealersTable;
            // startDealersVideoStream(userDetails, dealersTable);
            // initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, $scope.dealerTableDetails);

        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
    };

	// TODO: Video Broadcast Logic
	/*function startDealersVideoStream(userDetails, tableDetails) {
        $scope.phone = window.phone = PHONE({
            number: $state.params.tableId,
            publish_key: pubnubConfig.publish_key,
            subscribe_key: pubnubConfig.subscribe_key,
            ssl: pubnubConfig.ssl,
            uuid: pubnubConfig.uuid
        });

        $scope.ctrl = window.ctrl = CONTROLLER($scope.phone);

        $scope.ctrl.ready(function() {
            $scope.ctrl.addLocalStream(vid_thumb);
            addLog("Logged in as " + userDetails.firstname);
        });

        $scope.ctrl.receive(function(session) {
            session.connected(function(session) {
                video_out.appendChild(session.video);
                addLog(session.number + " has joined.");
                // vidCount++;
            });
            session.ended(function(session) {
                // ctrl.getVideoElement(session.number).remove();
                addLog(session.number + " has left.");
                // vidCount--;
            });
        });

        $scope.ctrl.videoToggled(function(session, isEnabled) {
            $scope.ctrl.getVideoElement(session.number).toggle(isEnabled);
            addLog(session.number + ": video enabled - " + isEnabled);
        });

        $scope.ctrl.audioToggled(function(session, isEnabled) {
            $scope.ctrl.getVideoElement(session.number).css("opacity", isEnabled ? 1 : 0.75);
            addLog(session.number + ": audio enabled - " + isEnabled);
        });
    };

     // // Call Options
    function makeCall(form) {
        if (!window.phone) alert("Login First!");
        var num = form.number.value;
        if ($scope.phone.number() == num) return false; // No calling yourself!
        $scope.ctrl.isOnline(num, function(isOn) {
            if (isOn) {
                $scope.ctrl.dial(num);
            } else {
                alert("User is Offline");
            }
        });
        return false;
    }

    $scope.mute = function() {
        var audio = $scope.ctrl.toggleAudio();
        if (!audio) $("#mute").html("Unmute");
        else $("#mute").html("Mute");
    }

    $scope.end = function() {
        $scope.ctrl.hangup();
    }

    $scope.pause = function() {
        var video = $scope.ctrl.toggleVideo();
        if (!video) $('#pause').html('Unpause');
        else $('#pause').html('Pause');
    }

    function getVideo(number) {
        return $('*[data-number="' + number + '"]');
    }

    function addLog(log) {
        // console.log(log); 
        // $('#logs').append("<p>" + log + "</p>");
    }

    $scope.errWrap = function(fxn, form) {
        try {
            return fxn(form);
        } catch (err) {
            alert("WebRTC is currently only supported by Chrome, Opera, and Firefox");
            return false;
        }
    }*/

    /* ========================================== */
    /* ================== CHAT ================== */
    /* ========================================== */

    function splitString(str) {
        var details = {};

        details['chatBadgeColor'] = str.split(':')[0],
            details['user'] = str.split(':')[1],
            details['message'] = str.split(':')[2]
        return details;
    };

    // Random Color Generator
    function getRandomColor() {
        // creating a random number between 0 and 255
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);

        // going from decimal to hex
        var hexR = r.toString(16);
        var hexG = g.toString(16);
        var hexB = b.toString(16);

        // making sure single character values are prepended with a "0"
        if (hexR.length == 1) {
            hexR = "0" + hexR;
        }

        if (hexG.length == 1) {
            hexG = "0" + hexG;
        }

        if (hexB.length == 1) {
            hexB = "0" + hexB;
        }

        // creating the hex value by concatenatening the string values
        var hexColor = "#" + hexR + hexG + hexB;

        return hexColor.toUpperCase();
    };


    function initiateChat(userDetails, tableDetails) {
        var chatBadgeColor = getRandomColor();
        // var box = PUBNUB.$('box'), input = PUBNUB.$('input'), channel = tableDetails.data._id;
        var box = PUBNUB.$('box'),
            input = PUBNUB.$('input'),
            channel = 'dicegames';
        pubnub.subscribe({
            channel: channel,
            callback: function(text) {
                var userAttr = splitString(text);
                if (userAttr.user != userDetails.name) {
                    userAttr.user = '@' + userAttr.user;
                }
                box.innerHTML = "<div class='chatElement' style='border-left:5px solid " + userAttr.chatBadgeColor + "'><div class='username'>" + userAttr.user + "</div>" + ('' + userAttr.message).replace(/[<>]/g, '') + '</div><br>' + box.innerHTML
                    // box.innerHTML = "<div class='chatElement'>" + (''+text).replace( /[<>]/g, '' ) + '</div><br>' + box.innerHTML

            },
            presence: function(m) {
                // console.log("Presence ==> ");
                // console.log(m);
            }
        });
        pubnub.bind('keyup', input, function(e) {

            (e.keyCode || e.charCode) === 13 && pubnub.publish({
                channel: channel,
                message: chatBadgeColor + ':' + userDetails.name + ": " + input.value,
                x: (input.value = '')
            })
        })

        pubnub.here_now({
            channel: channel,
            callback: function(m) {
                // console.log("here now")
                // console.log(m)
                    // m['user'] = $state.params.tableName;
                    // userName = m.user;
            }
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

		// Set up Game Requirements
		var gameid = dealersTable.data._id;
		var gameChannel = 'dicegames-' + gameid;
		var uuid = JSON.stringify(userDetails);
		var mySign = userDetails._id;

		// Roll Dealer's Dice
		$scope.rollDice = function() {
		    // document.getElementById('rollDice').setAttribute('disabled', 'disabled');
		    resultContainer.innerHTML = "";
		    var chosenDices = [];
		    for (var i = 0; i < 3; i++) {
		        var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
		        chosenDices.push(dice);
		        resultContainer.innerHTML += dice;
		    };
		    var arr = document.getElementById('diceResults').children;
		    var diceSum = 0;
		    for(var j=0;j<arr.length;j++){
		      diceSum += Number(arr[j].getAttribute('data-diceValue'));
		    }
		    $scope.DiceTotalValue = diceSum;
		    set(diceSum);
		};

		/* ============== Publish & subscribe using Pubnub ============== */

		// Subscribe to a public channel where players will publish their channel names only
        (function(){
	        pubnub.subscribe({
	            channel: dealersTable.data.Dealer._id,
	            connect: startNewGame,
	            presence: function(m){
	                console.log("Players will publish their ID's here - presence");
	                console.log(m);
	            },
	            callback: function(m){
	                console.log("Players will publish their ID's here - callback");
	                console.log(m);
	                m.player = JSON.parse(m.player);
	                // m.player['playing'] = true;
	                subscribeToPlayersChannel(m.player._id);
	                collectPlayers(m);
	            }
	        });
        })();

        // Subscribe & Publish to player's channels. 
        // This is a private channel between the dealer and the player.
        function subscribeToPlayersChannel(channel){
        	$scope.playersPrivateChannel = channel;
            pubnub.subscribe({
                channel: channel,
                presence: function(m){
                    console.log("Dealer's subscribes to player's channel - presence");
                    console.log(m);
                },
                callback: function(m){
                    console.log("Dealer's subscribes to player's channel - callback");
                    console.log(m);
                    // $scope.score[m.player] = m.diceValue;
                    $scope.score['Player']['id'] = m.player;
                    $scope.score['Player']['name'] = m.playerName;
                    $scope.score['Player']['value'] = m.diceValue;
                    $scope.gameWinner = m.betOn;
                    // publishToPlayer(channel, "");

                    // $scope.score[dealersTable.data.Dealer._id] = 0;

                    checkGameStatus(m.player, m.diceValue);
                    if($scope.timer && $scope.timer > 0 ){
                        $scope.playersResults.push(m);
                    }else if($scope.timer && $scope.timer <= 0 ){
                        $scope.timer = 20;
                        publishToPlayer(channel, "Please Wait for this round to finish!");
                    }
                }
            }); 
        };

        // Privately publish to player
        function publishToPlayer(playersChannel, data){
            pubnub.publish({
                channel: playersChannel,
                message: {
                    data: data
                },
                callback: function(m) {
                    console.log("Dealer Publishes to a single player");
                    console.log(m);
                }
            });
        };

        // Publish Dealer's data on a public channel which the players will subscribe to.
        function publishPosition(player, position, status, diceValue) {

            pubnub.publish({
                // channel_group: 'AllChannels',
                channel: dealersTable.data._id,
                message: {
                    player: player,
                    position: position,
                    diceValue: diceValue,
                    channel: gameChannel
                },
                callback: function(m) {
                    console.log("Publish Dealer");
                    console.log(m);
                    // if(m.diceValue > 0){
                    //     checkGameStatus(m.player, m.diceValue);    
                    // }
                    checkGameStatus(player, diceValue);    
                }
            });                
        };

        // Get Current Players in the Channel
        function fetchPlayersInGame(){
            pubnub.here_now({
                channel: gameChannel,
                includeUUIDs: true,
                includeState: true
            },
            function(status, response){
                $scope.playersOnTheTable = status.uuids.map(v => JSON.parse(v));
            });    
        };
        
		/* ============== Publish & subscribe using Pubnub End ============== */

		 // Kepp all the players in an array if they join within the wait time
        function collectPlayers(data){
            if(!$scope.roundStarted){
            	data.player['playing'] = true;
                $scope.playersInRound.push(data.player._id);
            }

            if($scope.playersInRound.length == 1){
            	data.player['playing'] = false;
            	$scope.playersInGame.push(data.player._id);
                
                pubnub.time(function(time){ 

	            	// Convert pubnub timeToken to IST --> 
	            	var pubnubTime = new Date(time/1e4);
	            	console.log("Dealer publishing the PubNub time to the player - Wait Time");
	            	console.log(pubnubTime);

	            	// Disable all playing controls while we are waiting for other players to join
	            	// document.getElementById('rollDice').setAttribute('disabled', 'disabled');

                    // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                	waitTimer(10).startTimer(0);
                	publishToPlayer($scope.playersPrivateChannel, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
	            	
	            });
            }
        }

        function startRound(){
            $scope.roundStarted = true;
            pubnub.time(function(time){ 
            	
            	// Convert pubnub timeToken to IST
            	var pubnubTime = new Date(time/1e4);
            	console.log("Dealer publishing the PubNub time to the player - Start Round Time");
	            console.log(pubnubTime);

            	roundTimer(20).startTimer(0);
            	publishToPlayer($scope.playersPrivateChannel, {flag: 'startRound', duration: 20, timestamp: pubnubTime, timeString: time});
            	
            });
            // startNewGame();
        }


        function rollDiceOnce(){
            $scope.diceRolled = true;
            $scope.rollDice();

            // setTimeout(function(){
            //     startNewGame(10, display);
            // }, 10000);
        }

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
                    rollDiceOnce();

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
                    startRound();
                    
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

        /* ========= Start A New Game ========= */
        function startNewGame() {
        	$scope.diceRolled = false;
			// document.getElementById('rollDice').removeAttribute('disabled');
            var i;

            turn = userDetails._id;
            $scope.score = {
                'Dealer': {},
                'Player': {}
            };
            $scope.score.Dealer['name'] = userDetails.name;
            $scope.score.Dealer['id'] = userDetails._id;
            $scope.score.Dealer['value'] = 0;
            // for (i = 0; i < squares.length; i += 1) {
            //     squares[i].firstChild.nodeValue = EMPTY;
            // }

            // whosTurn.textContent = (turn === mySign) ? 'Waiting for players to join' : 'Player\'s turn';
            // timer(10).startTimer(0, 'wait');
        };
        /* ========= End ========= */

        // Login for Win & Lose
        function win(score) {
            if($scope.score.Dealer.value && $scope.score.Dealer.value != 0 && $scope.score.Player.value && $scope.score.Player.value !=0 ){
                // if($scope.score.Dealer.value > $scope.score.Player.value){
                //     return $scope.score.Dealer.name + ' wins';
                // }else if( $scope.score.Player.value > $scope.score.Dealer.value){
                //     return $scope.score.Player.name + ' wins';
                // }else if($scope.score.Player.value == $scope.score.Dealer.value){
                //     return $scope.score.Dealer.name + ' wins';
                // }else{
                //     return false;
                // }
                if($scope.gameWinner == $scope.score.Dealer.name && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Player.name + ' Wins.'; // Player Wins
                }else if($scope.gameWinner == $scope.score.Dealer.name && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.name && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.name && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Player.name + ' Wins.'; // Player wins
                }else if($scope.gameWinner == $scope.score.Player.name && $scope.score.Dealer.value == $scope.score.Player.value){
                    return $scope.score.Dealer.name + ' Wins.'; // Player loses
                }else{
                    return false;
                }
            }else{
                return false;
            }
        };

        // Check Game Status
        function checkGameStatus(player, el) {
           
            console.log('Score for player, ' + player );
            console.log($scope.score);

            if(player == userDetails._id){
                $scope.score.Dealer.value = el;
            };

            if (win($scope.score)) {
                alert(win($scope.score));
                startNewGame();
                pubnub.time(function(time){ 

	            	// Convert pubnub timeToken to IST --> 
	            	var pubnubTime = new Date(time/1e4);
	            	console.log("Dealer publishing the PubNub time to the player - Wait Time");
	            	console.log(pubnubTime);

                    // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                	waitTimer(10).startTimer(0);
                	publishToPlayer($scope.playersPrivateChannel, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
	            	
	            });
            } 

            else {
                turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
                // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
            }
        };

        // publish Dealer's dice on the public channel
        function set(diceValue) {
        	publishPosition(mySign, 'this.dataset.position', 'played', diceValue);
        };

	};

});