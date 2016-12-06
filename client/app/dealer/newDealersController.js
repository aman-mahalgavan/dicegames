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
            publishIDToServer(userDetails, dealersTable)
            broadcastVideo(userDetails, dealersTable);
            initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, $scope.dealerTableDetails);

        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
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

    // Delete Table when the bowser window is closed or navigated to some other link
    // $(window).on('unload', function(){
        // connection.close($scope.userDetails._id);
        // deleteTable($scope.dealerTableDetails.data._id);
    // });
    // window.onbeforeunload = function(e){
    //     event.preventDefault();
    //     connection.close($scope.userDetails._id);
    //     deleteTable($scope.dealerTableDetails.data._id);
    // };

    // Delete table when the dealer leaves the table via state change
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        console.log("State Change");
        if (fromState.name == 'dealer') {
            var confirmed = confirm('You are about to leave the table. Table will be closed.');
            if (confirmed) {
                connection.close($scope.userDetails._id);
                deleteTable($scope.dealerTableDetails.data._id);
            } else {
                return;
            };
        };
    });

    function deleteTable(tableID){
        if(!tableID){
            tableID = $scope.dealerTableDetails.data._id;
        }
        $http.post('/api/tables/removeTable', { tableId: tableID }).success(function(response) {
            console.log("Table Removed");
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

        // var sessions = {};
        // connection.onNewSession = function(session) {
        //     if (sessions[session.sessionid]) return;
        //     sessions[session.sessionid] = session;

        //     var tr = document.createElement('tr');
        //     tr.innerHTML = '<td><strong>' + session.sessionid + '</strong> is sharing his webcam in one-way direction!</td>' +
        //         '<td><button class="join">View His Webcam</button></td>';
        //     roomsList.insertBefore(tr, roomsList.firstChild);

        //     var joinRoomButton = tr.querySelector('.join');
        //     joinRoomButton.setAttribute('data-sessionid', session.sessionid);
        //     joinRoomButton.onclick = function() {
        //         this.disabled = true;

        //         var sessionid = this.getAttribute('data-sessionid');
        //         session = sessions[sessionid];

        //         if (!session) throw 'No such session exists.';

        //         connection.join(session);
        //     };
        // };

        var videosContainer = document.getElementById('videos-container');
        var roomsList = document.getElementById('rooms-list');
        connection.open(userDetails._id);
        // document.getElementById('setup-new-broadcast').onclick = function() {
        //     this.disabled = true;

        //     // connection.open(document.getElementById('broadcast-name').value || 'Anonymous');
        //     connection.open(userDetails._id);
        // };

        // setup signaling to search existing sessions
        connection.connect();

        // (function() {
        //     var uniqueToken = document.getElementById('unique-token');
        //     if (uniqueToken)
        //         if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
        //         else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
        // })();

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
                box.innerHTML = "<div class='chatElement' style='display:block;width:96%;border-left:5px solid " + userAttr.chatBadgeColor + "'><div class='username'>" + userAttr.user + "</div>" + ('' + userAttr.message).replace(/[<>]/g, '') + '</div><br>' + box.innerHTML;
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
                    // m['user'] = $state.params.tableName;
                    // userName = m.user;
                    
                    
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


    function initiateGame(userDetails, dealersTable){

        // DOM Elements
        var resultContainer = document.getElementById('diceResults');
        var gameId = document.querySelector('#gameId');
        var gameIdQuery = document.querySelector('#gameIdQuery');
        var output = document.querySelector('#output');
        // var whosTurn = document.getElementById('whosTurn');
        var display = document.querySelector('#time');

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
                    console.log("Players will publish their ID's here Or publish Results- callback");
                    console.log(m);
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
                        // Display Dice and the amount won/lost in the round in the results container
                        document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">'
                        m.dice.forEach(function(dice){
                            document.getElementById('playersResults').innerHTML += dice;
                        });
                        document.getElementById('playersResults').innerHTML += m.data + '</div>';

                        // Reset scores when a round is over and somebody has won the round
                        setTimeout(function(){
                            startNewGame();
                            pubnub.time(function(time){
                                // Convert pubnub timeToken to IST --> 
                                var pubnubTime = new Date(time/1e4);
                                // console.log("Dealer publishing the PubNub time to the player - Wait Time");
                                // console.log(pubnubTime);
                                
                                // start the wait timer for the next round after 5 seconds
                                // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                                $scope.playersInRound.forEach(function(item){
                                    publishToPlayer(item._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                                });
                                waitTimer(10).startTimer(0);
                            });
                        }, 5000);
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
        function subscribeToPlayersChannel(channel){
            $scope.playersPrivateChannel = channel;
            // console.log('playersPrivateChannel');
            // console.log($scope.playersPrivateChannel);
            pubnub.subscribe({
                channel: channel,
                presence: function(m){
                    // console.log("Dealer's subscribeToPlayersChannel - presence");
                    // console.log(m);
                },
                callback: function(m){
                    // console.log("Dealer's subscribeToPlayersChannel - callback");
                    // console.log(m);
                    // if(m.player && m.playerName && m.diceValue && m.betOn){
                    if(m.player && m.playerName && m.diceValue){
                        $scope.score.Player['id'] = m.player;
                        $scope.score.Player['name'] = m.playerName;
                        $scope.score.Player['value'] = m.diceValue;    
                        $scope.gameWinner = m.betOn;
                        $scope.betAmount = m.betAmt;
                        $scope.playersDice = m.dice;
                    }else if(m.flag == 'Player Folded'){
                        // Display that the player has folded
                        // document.getElementById('playersResults').innerHTML +=  '<div>' + m.playerName + ' Folded.</div>';

                        // Reset scores when a round is over and somebody has folded the round
                        setTimeout(function(){
                            pubnub.time(function(time){
                            startNewGame();
                                // Convert pubnub timeToken to IST --> 
                                var pubnubTime = new Date(time/1e4);
                                // console.log("Dealer publishing the PubNub time to the player - Wait Time");
                                // console.log(pubnubTime);
                                
                                // start the wait timer for the next round after 5 seconds
                                // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                                $scope.playersInRound.forEach(function(item){
                                    publishToPlayer(item._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                                })
                                waitTimer(10).startTimer(0);
                            });
                        }, 5000);
                    };

                    // if($scope.waitTimer && $scope.waitTimer > 0 ){
                    //     $scope.playersResults.push(m);
                    // }else if($scope.waitTimer && $scope.waitTimer <= 0 ){
                    //     // $scope.timer = 20;
                    //     publishToPlayer(channel, "Please Wait for this round to finish!");
                    // }
                    // checkGameStatus(m.player, m.diceValue, $scope.betAmount);
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
            $scope.playersInGame.push(data.player);
            
            // if a round has not started yet, put the players in another array which 
            // we will use to keep track of how many players are playing in a round.
            // And subscribe the dealer to them.
            if(!$scope.roundStarted){
                // data.player['playing'] = true;
                // $scope.playersInRound = [];
                $scope.playersInRound = angular.copy($scope.playersInGame);
                // $scope.playersInGame.forEach(function(item){
                //     // item['playing'] = true;
                //     $scope.playersInRound.push(item);
                // })
                $scope.playersInRound.forEach(function(item){
                    // alert('Subscribed to ' + item._id);
                    subscribeToPlayersChannel(item._id);
                });
            }
            // Start the game when the 1st player joins the dealer and start the wait time for both the dealer and the player.
            if($scope.playersInRound.length == 1){ // if a single player has joined the game
                pubnub.time(function(time){
                    // console.log("TIME PUBNUB");
                    // console.log(time);
                    // Convert pubnub timeToken to IST --> 
                    var pubnubTime = new Date(time/1e4);
                    // console.log("Dealer publishing the PubNub time to the player - Wait Time");
                    // console.log(pubnubTime);

                    // Disable all playing controls while we are waiting for other players to join
                    // document.getElementById('rollDice').setAttribute('disabled', 'disabled');

                    // Publish the Wait Time to all the players playing the game and start the timer for the dealer
                       publishToPlayer(data.player._id, {flag: 'wait', duration: 10, timestamp: pubnubTime, timeString: time});
                       waitTimer(10).startTimer(0);
                    
                    
                });
            }

            if($scope.playersInRound.length > 1){ // if more than 1 player have joined the game
                pubnub.time(function(time){

                    // Convert pubnub timeToken to IST --> 
                    var pubnubTime = new Date(time/1e4);
                    // console.log("Dealer publishing the PubNub time to the all players - Wait Time");
                    // console.log(pubnubTime);

                    // Disable all playing controls while we are waiting for other players to join
                    // document.getElementById('rollDice').setAttribute('disabled', 'disabled');
                    if($scope.roundStarted){
                        publishToPlayer(data.player._id, {flag: 'roundInProgress', duration: $scope.waitTimer, timestamp: pubnubTime, timeString: time});                            
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

            }
            // console.log("Players In Round", $scope.playersInRound);
        };

        function startRound(){
            $scope.roundStarted = true;
            pubnub.time(function(time){ 
                
                // Convert pubnub timeToken to IST
                var pubnubTime = new Date(time/1e4);
                // console.log("Dealer publishing the PubNub time to the player - Start Round Time");
                // console.log(pubnubTime);

                $scope.playersInRound.forEach(function(item){
                    publishToPlayer(item._id, {flag: 'startRound', duration: 20, timestamp: pubnubTime, timeString: time});
                })
                roundTimer(20).startTimer(0);
                
            });
            // startNewGame();
        };


        function rollDiceOnce(){
            $scope.diceRolled = true;
            $scope.rollDice();

            // setTimeout(function(){
            //     startNewGame(10, display);
            // }, 10000);
        };

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
                    $scope.roundTimer = seconds;
                    clearInterval(roundInterval);
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    rollDiceOnce();

                }else{
                    display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
                    // Publish the Round Time to all the players playing the game
                }
                

                
                $scope.roundTimer = seconds;
                // publishToPlayer($scope.playersPrivateChannel, {time: $scope.time.roundTime, flag: 'RoundTime'});
                // console.log($scope.roundTimer + ' | ' + duration);
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
                    $scope.waitTimer = seconds;
                    clearInterval(waitInterval);
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    startRound();
                    
                }else{
                    display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    
                }
                

                $scope.waitTimer = seconds;
                // publishToPlayer($scope.playersPrivateChannel, {time: seconds, flag: 'WaitTime'});
                // console.log($scope.waitTimer + ' | ' + duration);
            }
            return {
                startTimer: function (duration, flag) {
                    $scope.roundStarted = false;
                    startNewGame();
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

            resultContainer.innerHTML = '';
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
           
            // console.log('Score for player, ' + player );
            // console.log($scope.score);

            // console.log("Check game status- player");
            // console.log(player +' | ' + el );
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
                turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
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