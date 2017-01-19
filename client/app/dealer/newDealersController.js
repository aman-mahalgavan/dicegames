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
            $scope.tableName = dealersTable.data.Dealer.name;
            publishIDToServer(userDetails, dealersTable)
            broadcastVideo(userDetails, dealersTable);
            initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, $scope.dealerTableDetails);

        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
    };

    // Delete the table when the user closes the browser
    window.onbeforeunload = function (event) {
        deleteTable();
        // var message = 'Important: Your table will close if you choose to leave the page. Are you sure?';
        // if (typeof event == 'undefined') {
        //     event = window.event;
        // }
        // if (event) {
        //     event.returnValue = message;
        // }
        // return message;
    };

    function publishIDToServer(userDetails, tableDetails){
        pubnub.publish({
            channel: 'diceGamesDealerList',
            message: {
                user: userDetails,
                table: tableDetails
            },
            callback: function(m) {
                console.log("Publishing data to server");
                console.log(m);
            }
        });
    };

  
    // Delete table when the dealer leaves the table via state change
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        console.log("State Change");
        if (fromState.name == 'dealer') {
            var confirmed = confirm('You are about to leave the table. Table will be closed.');
            if (confirmed) {
                connection.close($scope.userDetails._id);
                deleteTable($scope.dealerTableDetails.data._id);
                if($scope.roundInterval && $scope.roundInterval != 0){
                    var dealersDice = [];
                    for (var i = 0; i < 3; i++) {
                        var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
                        dealersDice.push(dice);
                    };

                    // var arr = document.getElementById('diceResults').children;
                    var diceSum = 0;
                    for(var j=0;j<dealersDice.length;j++){
                        var x = dealersDice[j];
                      diceSum += Number(x.substring(21, 22));
                    }

                    $scope.alertUsers($scope.dealerTableDetails.data._id, 'lastRound', dealersDice, $scope.dealerTableDetails.data.Dealer.name, $scope.dealerTableDetails.data.Dealer._id, diceSum );
                }else if($scope.waitTimer && $scope.waitTimer != 0 && !$scope.roundTimer){
                    $scope.alertUsers($scope.dealerTableDetails.data._id, 'dealerLeft', null);
                }
            } else {
                return;
            };
        };
    });

    $scope.alertUsers = function(dealersTable, flag, dealersDice, dealerName, dealerId, diceValue){
        var message = {
            flag: flag
        };
        // diceValue, userDetails.name, chosendices
        if(flag == 'lastRound'){
            message['dealersDice'] = dealersDice;
            message['player']= dealerId,
            message['playerName']= dealerName,
            message['position']= 'position',
            message['diceValue']= diceValue,
            message['channel']= 'gameChannel',
            message['dealersDice']= dealersDice
        };
        pubnub.publish({
            channel: dealersTable,
            message: message,
            callback: function(m) {
                console.log("Dealer Left. All Players Alerted.");
                // console.log(m);
                // if(m.diceValue > 0){
                //     checkGameStatus(m.player, m.diceValue);    
                // }
                // checkGameStatus(dealer, diceValue);   
            }
        });
    };

    function deleteTable(tableID){
        if(!tableID){
            tableID = $scope.dealerTableDetails.data._id;
        }
        $http.post('/api/tables/removeTable', { tableId: tableID }).success(function(response) {
            console.log("Table Removed");
            // alert('Table Removed');
        }).error(function(err) {
            console.log("Error Removing the Table");
            console.log(err);
        });
    }

    /* DOM Elements for Showing the Video */
    var video_out = document.getElementById("dealersVideo");
    var vid_thumb = document.getElementById("vid-thumb");
    var connection;
    
    // TODO: Video Broadcast Logic
    function broadcastVideo(userDetails, tableDetails){
        // Muaz Khan     - https://github.com/muaz-khan
        // MIT License   - https://www.webrtc-experiment.com/licence/
        // Documentation - https://github.com/muaz-khan/RTCMultiConnection

        connection = new RTCMultiConnection();
        connection.session = {
            audio: true,
            video: true,
            oneway: true
        };

        // connection.channel = 'testVideoBroadcast';
        connection.channel = $state.params.tableId;

        connection.onstream = function(e) {
            e.mediaElement.width = '100%';
            // e.mediaElement.style.transform = 'rotateY(180deg)';
            videosContainer.insertBefore(e.mediaElement, videosContainer.firstChild);
            // rotateVideo(e.mediaElement);
            scaleVideos();
        };

        // function rotateVideo(mediaElement) {
        //     mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
        //     setTimeout(function() {
        //         mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
        //     }, 1000);
        // }

        connection.onstreamended = function(e) {
            e.mediaElement.style.opacity = 0;
            // rotateVideo(e.mediaElement);
            setTimeout(function() {
                if (e.mediaElement.parentNode) {
                    e.mediaElement.parentNode.removeChild(e.mediaElement);
                }
                scaleVideos();
            }, 1000);
        };

      
        var videosContainer = document.getElementById('videos-container');
        var roomsList = document.getElementById('rooms-list');
        connection.open(userDetails._id);
        

        // setup signaling to search existing sessions
        connection.connect();

        function scaleVideos() {
            var videos = document.querySelectorAll('video'),
                length = videos.length,
                video;

            var minus = 130;
            var windowHeight = 700;
            var windowWidth = 600;
            var windowAspectRatio = windowWidth / windowHeight;
            var videoAspectRatio = 4 / 3;
            var blockAspectRatio;
            var tempVideoWidth = 0;
            var maxVideoWidth = 0;

            for (var i = length; i > 0; i--) {
                blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
                if (blockAspectRatio <= windowAspectRatio) {
                    tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
                } else {
                    tempVideoWidth = windowWidth / i;
                }
                if (tempVideoWidth > maxVideoWidth)
                    maxVideoWidth = tempVideoWidth;
            }
            for (var i = 0; i < length; i++) {
                video = videos[i];
                if (video)
                    video.width = maxVideoWidth - minus;
            }
        };

        window.onresize = scaleVideos;
    };

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
                box.innerHTML = "<div class='chatElement' style='display:block;width:96%;border-left:5px solid " + userAttr.chatBadgeColor + "'><div class='username'>" + userAttr.user + "</div>" + ('' + userAttr.message).replace(/[<>]/g, '') + '</div>' + box.innerHTML;
                    // box.innerHTML = "<div class='chatElement'>" + (''+text).replace( /[<>]/g, '' ) + '</div><br>' + box.innerHTML
                $('#box').reverseChildren();
                $("#box").scrollTop($("#box")[0].scrollHeight + 10);
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
            }
        });
    };

    $.fn.reverseChildren = function() {
      return this.each(function(){
        var $this = $(this);
        $this.children().each(function(){ $this.prepend(this) });
      });
    };
    
    // Game Logic =>
    
    // Global Variables for Game. Players who join the table will get this information and then continue playing from there.
    // Players will be allowed to be in the table while it is in Wait mode other wise they will have to wait for another round to start.
    $scope.turn;
    $scope.playersInGame = [];
    $scope.playersInRound = [];
    $scope.roundStarted = false;
    $scope.time = {
        waitTime: 0,
        roundTime: 0
    };
    $scope.score = {
        'Dealer': {},
        'Player': {}
    };

    // dice images
    var diceOne = '<img data-diceValue="1" src="../../assets/images/diceone.png" style="margin-right:10px;">';
    var diceTwo = '<img data-diceValue="2" src="../../assets/images/dicetwo.png" style="margin-right:10px;">';
    var diceThree = '<img data-diceValue="3" src="../../assets/images/diceThree.png" style="margin-right:10px;">';
    var diceFour = '<img data-diceValue="4" src="../../assets/images/dicefour.png" style="margin-right:10px;">';
    var diceFive = '<img data-diceValue="5" src="../../assets/images/diceFive.png" style="margin-right:10px;">';
    var diceSix = '<img data-diceValue="6" src="../../assets/images/diceSix.png" style="margin-right:10px;">';

    var diceArray = [];
    diceArray.push(diceOne);
    diceArray.push(diceTwo);
    diceArray.push(diceThree);
    diceArray.push(diceFour);
    diceArray.push(diceFive);
    diceArray.push(diceSix);

    function initiateGame(userDetails, dealersTable){

        // DOM Elements
        var resultContainer = document.getElementById('diceResults');
        var gameId = document.querySelector('#gameId');
        var gameIdQuery = document.querySelector('#gameIdQuery');
        var output = document.querySelector('#output');
        // var whosTurn = document.getElementById('whosTurn');
        var display = document.querySelector('#time');

        

        // Set up Game Requirements
        var gameid = dealersTable.data._id;
        var gameChannel = 'dicegames-' + gameid;
        var uuid = JSON.stringify(userDetails);
        var mySign = userDetails._id;

        $scope.resultingDice = [];
        // Roll Dealer's Dice
        $scope.rollDice = function() {
            // document.getElementById('rollDice').setAttribute('disabled', 'disabled');
            resultContainer.innerHTML = "";
            var chosenDices = [];
            for (var i = 0; i < 3; i++) {
                var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
                chosenDices.push(dice);
                resultContainer.innerHTML += dice;
                $scope.resultingDice = angular.copy(chosenDices);
            };
            var arr = document.getElementById('diceResults').children;
            var diceSum = 0;
            for(var j=0;j<arr.length;j++){
              diceSum += Number(arr[j].getAttribute('data-diceValue'));
            }
            // $scope.DiceTotalValue = diceSum;
            set(diceSum, chosenDices);
        };

        /* ============== Publish & subscribe using Pubnub ============== */
        var subscriptionCounter = 0;
        // Subscribe to a public channel where players will publish their ID's only
        (function(){
            // console.log('channel to publish global result => ', dealersTable.data.Dealer._id);
            pubnub.subscribe({
                channel: dealersTable.data.Dealer._id,
                connect: startNewGame,
                presence: function(m){
                    // console.log("Players will publish their ID's here - presence");
                    // console.log(m);
                },
                callback: function(m){
                    subscriptionCounter += 1;
                    console.log("Players will publish their ID's here Or publish Results- callback");
                    console.log(m);

                    console.log("subscriptionCounter =>> " , subscriptionCounter);
                    if(m.flag == 'playerResult'){
                        // alert(m);
                    }else{
                        m.player = JSON.parse(m.player);
                        // m.player['playing'] = true;
                        collectPlayers(m);
                        subscribeToPublicChannel();
                        // subscribeToPlayersChannel(m.player._id);
                    }
                }
            });
        })();

        $scope.publishResultCounter = 0;
        function subscribeToPublicChannel(){
            console.log('channel to publish global result => ', dealersTable.data.Dealer._id);
            pubnub.subscribe({
                channel: dealersTable.data._id,
                // connect: startNewGame,
                presence: function(m){
                    // console.log("Players will publish their ID's here - presence");
                    // console.log(m);
                },
                callback: function(m){
                    console.log("Players will publish their ID's here Or publish Results- callback");
                    console.log(m);
                    if(m.flag == 'playerResult'){
                        // if($scope.publishResultCounter == 0){                        
                            // Display Dice and the amount won/lost in the round in the results container
                            document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">'
                            m.dice.forEach(function(dice){
                                document.getElementById('playersResults').innerHTML += dice;
                            });
                            document.getElementById('playersResults').innerHTML += m.data + '</div>';

                            $scope.playersInRound = angular.copy($scope.playersInGame);
                            $scope.publishResultCounter = 1;
                            console.log("Number of players Starting new round after results ", $scope.playersInRound);
                        // }
                        // Reset scores when a round is over and somebody has won the round
                        setTimeout(function(){
                            startNewGame();
                            pubnub.time(function(time){
                                // Convert pubnub timeToken to IST --> 
                                var pubnubTime = new Date(time/1e4);
                                // start the wait timer for the next round after 5 seconds
                                // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                                $scope.playersInRound.forEach(function(item){
                                    publishToPlayer(item._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                                });
                                waitTimer(10).startTimer(0);
                            });
                        }, 3000);
                    }
                    if(m.flag == 'playersBet'){
                        console.log("Players Bet Amount");
                        console.log(m);
                        document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">';
                        document.getElementById('playersResults').innerHTML += m.player.name + ' has bet $' + m.data;
                    }
                }
            });
        };

        // Subscribe & Publish to player's channels. 
        // This is a private channel between the dealer and the player.
        $scope.playersPrivateChannel = [];
        function subscribeToPlayersChannel(channel){
            $scope.playersPrivateChannel.push(JSON.stringify(channel));
            // console.log('playersPrivateChannel');
            console.log("$scope.playersPrivateChannel => ");
            console.log($scope.playersPrivateChannel);
            pubnub.subscribe({
                channel: channel,
                presence: function(m){
                    // console.log("Dealer's subscribeToPlayersChannel - presence");
                    // console.log(m);
                },
                callback: function(m){
                    $scope.playersInRound = angular.copy($scope.playersInGame);
                    // $scope.playersInGame = [];
                    if(m.player && m.playerName && m.diceValue){
                        $scope.score.Player['id'] = m.player;
                        $scope.score.Player['name'] = m.playerName;
                        $scope.score.Player['value'] = m.diceValue;    
                        $scope.gameWinner = m.betOn;
                        $scope.betAmount = m.betAmt;
                        $scope.playersDice = m.dice;
                    }else if(m.flag == 'Player Folded'){
                        // Reset scores when a round is over and somebody has folded the round
                        setTimeout(function(){
                            pubnub.time(function(time){
                            startNewGame();
                                // Convert pubnub timeToken to IST --> 
                                var pubnubTime = new Date(time/1e4);
                                // start the wait timer for the next round after 5 seconds
                                // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                                $scope.playersInRound.forEach(function(item){
                                    publishToPlayer(item._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                                })
                                waitTimer(10).startTimer(0);
                            });
                        }, 3000);
                    };
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
                    // console.log("Dealer Publishes to a single player");
                    // console.log(m);
                }
            });
        };

        
        // Publish Dealer's data on a public channel which the players will subscribe to.
        function publishPosition(dealer, position, status, diceValue, dealerName, chosenDice) {

            pubnub.publish({
                // channel_group: 'AllChannels',
                channel: dealersTable.data._id,
                message: {
                    player: dealer,
                    playerName: dealerName,
                    position: position,
                    diceValue: diceValue,
                    channel: gameChannel,
                    dealersDice: chosenDice
                },
                callback: function(m) {
                    // console.log("Publish Dealer");
                    // console.log(m);
                    // if(m.diceValue > 0){
                    //     checkGameStatus(m.player, m.diceValue);    
                    // }
                    // checkGameStatus(dealer, diceValue);   
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
            // Keep every joining player in an array. 
            // This will be the array of players who are connected to the dealer but not subscribed to for playing the game.
            // data.player['playing'] = false;
            // alert(JSON.stringify(data));
            $scope.playersInGame.push(data.player);
            
            // if a round has not started yet, put the players in another array which 
            // we will use to keep track of how many players are playing in a round.
            // And subscribe the dealer to them.
            if(!$scope.roundStarted){
                // alert("Round not started");
                // data.player['playing'] = true;
                // $scope.playersInRound = [];
                
                $scope.playersInRound = angular.copy($scope.playersInGame);
                // $scope.playersInGame = [];
                console.log("$scope.playersInRound when round is not started", $scope.playersInRound);
                // $scope.playersInGame.forEach(function(item){
                //     // item['playing'] = true;
                //     $scope.playersInRound.push(item);
                // })
                $scope.playersInRound.forEach(function(item){
                    // alert('Subscribed to ' + item._id);
                    subscribeToPlayersChannel(item._id);
                });
            };
            // if($scope.roundStarted){
            //     // alert("Round Started");
            //     // alert('roundInProgress (collctPlayers Function)', JSON.stringify($scope.playersInRound));
            //     console.log("$scope.playersInRound when round is started", $scope.playersInRound);
            //     publishToPlayer(data.player._id, {flag: 'roundInProgress', duration: 0, timestamp: null, timeString: null});                            
            // };
            // Start the game when the 1st player joins the dealer and start the wait time for both the dealer and the player.
            if($scope.playersInRound.length == 1 && !$scope.roundStarted){ // if a single player has joined the game
                pubnub.time(function(time){
                    var pubnubTime = new Date(time/1e4);
                    
                    // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                       publishToPlayer(data.player._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                       waitTimer(10).startTimer(0);
                    
                    
                });
            }
            if($scope.playersInRound.length > 1){ // if more than 1 player have joined the game
                pubnub.time(function(time){

                    // Convert pubnub timeToken to IST --> 
                    var pubnubTime = new Date(time/1e4);
                    
                    if($scope.roundStarted){
                        console.log("$scope.playersInRound when round is started", $scope.playersInRound);
                        publishToPlayer(data.player._id, {flag: 'roundInProgress', duration: 0, timestamp: pubnubTime, timeString: time});                            
                    }else{
                        // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                        if($scope.waitTimer != 0){
                            publishToPlayer(data.player._id, {flag: 'wait', duration: $scope.waitTimer, timestamp: pubnubTime, timeString: time});    
                        }else{
                           publishToPlayer(data.player._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                           waitTimer(10).startTimer(0);
                        }    
                    }
                    
                    
                });

            };
            console.log("Players In Round", $scope.playersInRound);
        };

        function startRound(){
            $scope.roundStarted = true;
            pubnub.time(function(time){ 
                
                // Convert pubnub timeToken to IST
                var pubnubTime = new Date(time/1e4);
                
                $scope.playersInRound.forEach(function(item){
                    publishToPlayer(item._id, {flag: 'startRound', duration: 20, timestamp: pubnubTime, timeString: time});
                })
                roundTimer(20).startTimer(0);
                
            });
        };


        function rollDiceOnce(){
            $scope.diceRolled = true;
            $scope.rollDice();
        };

        // Timers

        var roundTimer = function (seconds) {
            var seconds = seconds; 
            var tens = 00; 
            $scope.roundInterval;

            function startCounter (duration) {
                
                tens++; 
                if(seconds > duration){
                    if (tens > 60) {
                        seconds--;
                        tens = 0;
                    }
                }
                if(seconds == duration){
                    $scope.roundTimer = seconds;
                    clearInterval($scope.roundInterval);
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    // publishTimerValues(seconds);
                    // $scope.playersInRound = angular.copy($scope.playersInGame);
                    // $scope.playersInGame = [];
                    rollDiceOnce();

                }else{
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    // publishTimerValues(seconds);
                    // Publish the Round Time to all the players playing the game
                }
                

                
                $scope.roundTimer = seconds;
                
                // publishToPlayer($scope.playersPrivateChannel, {time: $scope.time.roundTime, flag: 'RoundTime'});
                // console.log($scope.roundTimer + ' | ' + duration);
            }
            return {
                startTimer: function (duration, flag) {
                    $scope.roundStarted = true;
                    var time = duration;
                    if($scope.waitInterval){
                        clearInterval($scope.waitInterval);
                    }
                    clearInterval($scope.roundInterval);
                    $scope.roundInterval = setInterval(function () {
                        startCounter(time, flag);
                    }, 30);
                }
            }
        };
        
        var waitTimer = function (seconds) {
            var seconds = seconds; 
            var tens = 00; 
            $scope.waitInterval;

            function startCounter (duration) {
                
                tens++; 
                if(seconds > duration){
                    if (tens > 60) {
                        seconds--;
                        tens = 0;
                    }
                }
                if(seconds == duration){
                    $scope.waitTimer = seconds;
                    clearInterval($scope.waitInterval);
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    startRound();
                    
                }else{
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                }
                

                $scope.waitTimer = seconds;
            }
            return {
                startTimer: function (duration, flag) {
                    $scope.roundStarted = false;
                    startNewGame();
                    var time = duration;
                    if($scope.roundInterval){
                        clearInterval($scope.roundInterval);
                    }
                    clearInterval($scope.waitInterval);
                    $scope.waitInterval = setInterval(function () {
                        startCounter(time, flag);
                    }, 30);
                }
            }
        };

        /* ========= Start A New Game ========= */
        function startNewGame() {
            $scope.diceRolled = false;
            var i;

            resultContainer.innerHTML = '';
            turn = userDetails._id;
            $scope.score = {
                'Dealer': {},
                'Player': {}
            };
            $scope.score.Dealer['name'] = userDetails.name;
            $scope.score.Dealer['id'] = userDetails._id;
            $scope.score.Dealer['value'] = 0;
        };
        /* ========= End ========= */

        // Login for Win & Lose
        function win(score) {
            if($scope.score.Dealer.value && $scope.score.Dealer.value != 0 && $scope.score.Player.value && $scope.score.Player.value !=0 ){
                if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Player.name + ' Won $' + $scope.betAmount; // Player Wins
                }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
                }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value == $scope.score.Player.value){
                    return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value > $scope.score.Player.value){
                    return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value < $scope.score.Player.value){
                    return $scope.score.Player.name + ' Won $' + $scope.betAmount; // Player wins
                }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value == $scope.score.Player.value){
                    return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
                }else{
                    return false;
                }
            }else{
                return false;
            }
        };

        // Check Game Status
        function checkGameStatus(player, el) {
            if(player == userDetails._id){
                $scope.score.Dealer.value = el;
            };

            if (win($scope.score)) {
                // alert(win($scope.score));
                
                // // Reset scores when a round is over and somebody has won the round
                // setTimeout(function(){
                //     startNewGame();
                //     pubnub.time(function(time){
                //         // Convert pubnub timeToken to IST --> 
                //         var pubnubTime = new Date(time/1e4);
                //         // console.log("Dealer publishing the PubNub time to the player - Wait Time");
                //         // console.log(pubnubTime);
                        
                //         // start the wait timer for the next round after 5 seconds
                //         // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                //         $scope.playersInRound.forEach(function(item){
                //             publishToPlayer(item._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                //         });
                //         waitTimer(10).startTimer(0);
                //     });
                // }, 5000);
            } 

            else {
                // turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
                // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';

                // Reset scores when a round is over and somebody has won the round
                // setTimeout(function(){
                //     startNewGame();
                //     pubnub.time(function(time){
                //         // Convert pubnub timeToken to IST --> 
                //         var pubnubTime = new Date(time/1e4);
                //         console.log("Dealer publishing the PubNub time to the player - Wait Time");
                //         console.log(pubnubTime);
                        
                //         // start the wait timer for the next round after 5 seconds
                //         // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                //         waitTimer(10).startTimer(0);
                //         publishToPlayer($scope.playersPrivateChannel, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                //     });
                // }, 5000);
            }
        };

        // publish Dealer's dice on the public channel
        function set(diceValue, chosendices) {
            publishPosition(mySign, 'this.dataset.position', 'played', diceValue, userDetails.name, chosendices);
        };

    };

    var scrolled = false;
    function updateScroll(){
        if(!scrolled){
            var element = document.getElementById("box");
            element.scrollTop = element.scrollHeight;
        }
    }

    $("#box").on('scroll', function(){
        scrolled=true;
    });

});