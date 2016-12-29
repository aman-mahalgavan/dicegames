// angular.module('dicegamesProjectApp').controller('playerController', function($scope, $rootScope, $state, $http, pubnubConfig) {

    // /* DOM Elements For Showing Video Stream */
    // var video_out = document.getElementById("playersVideo");
    // var vid_thumb = document.getElementById("vid-thumb");

//     // DOM Element To display Round Time
//     var display = document.querySelector('#time');

//     var pubnub;
//     // Get User's Details
//     (function() {
//         $http.get('/api/users/me').success(function(response) {
//             $scope.userDetails = response;
//             var tableId = $state.params.tableId;

//             pubnub = PUBNUB.init({
//                 publish_key: pubnubConfig.publish_key,
//                 subscribe_key: pubnubConfig.subscribe_key,
//                 uuid: JSON.stringify($scope.userDetails),
//                 ssl: pubnubConfig.ssl
//             });
            
//             findMyTable($scope.userDetails, tableId);
//         }).error(function(error) {
//             console.log("Error Fetching User's Details.")
//             console.log(error);
//         })
//     })();

//     function findMyTable(userDetails, tableId) {
//         $http.post('/api/tables/findTable', {tableId: tableId}).success(function(dealersTable) {
//             $scope.dealerTableDetails = dealersTable;
//             $scope.betAmount = $scope.dealerTableDetails.data.AnteAmount;

//             startPlayersVideoStream(userDetails, dealersTable);
//             initiateChat(userDetails, dealersTable);
//             initiateGame(userDetails, dealersTable);
//         }).error(function(error) {
//             console.log("Unable to Find Dealer's Table");
//             console.log(error);
//         });
//     };

//     /* Fetch Players list for a particular table */
//     /* Checking every 1 minute if a user has joined or left the table. TODO- find a proper way to check if a user has joined or left the table.*/
//         // var getPlayersList = setInterval(function(){
//         // $http.post('/api/listPlayers', {table: $state.params.host}).success(function(response){
//         //     $scope.players = response.data.players;
//         // }).error(function(error){
//         //     console.log("Error Fetching players list");
//         //     console.log(error);
//         // })
//     // }, 60000)

//     function startPlayersVideoStream(userDetails, tableDetails) {
//         var phone = window.phone = PHONE({
//             // number: $state.params.username,
//             number: userDetails.name,
//             publish_key: pubnubConfig.publish_key,
//             subscribe_key: pubnubConfig.subscribe_key,
//             ssl: pubnubConfig.ssl,
//             uuid: userDetails.name,
//             media: { audio: false, video: true },
//             // oneway:true
//         });
//         var ctrl = window.ctrl = CONTROLLER(phone);
//         ctrl.ready(function() {
//             // ctrl.addLocalStream(vid_thumb);
//             addLog("Logged in as SampleUser");
//         });


//         ctrl.receive(function(session) {
//             session.connected(function(session) {
//                 $(video_out).html(session.video);
//                 addLog(session.number + " has joined.");
//             });
//             session.ended(function(session) {
//                 // ctrl.getVideoElement(session.number).remove();
//                 addLog(session.number + " has left.");
//                 // vidCount--;
//             });
//         });
//         ctrl.videoToggled(function(session, isEnabled) {
//             ctrl.getVideoElement(session.number).toggle(isEnabled);
//             addLog(session.number + ": video enabled - " + isEnabled);
//         });
//         ctrl.audioToggled(function(session, isEnabled) {
//             ctrl.getVideoElement(session.number).css("opacity", isEnabled ? 1 : 0.75);
//             addLog(session.number + ": audio enabled - " + isEnabled);
//         });

//         if (!window.phone) alert("Login First!");
//         var num = $state.params.tableId;
//         // var num = tableDetails.data._id;
//         console.log("Dialing Table => " + num);
//         // if (phone.number() == num) return false; // No calling yourself!
//         ctrl.isOnline(num, function(isOn) {
//             // alert("checking if user is online-  " + isOn + "num- " + num);
//             if (isOn){
//                 ctrl.dial(num);
//             } 
//             else {
//                 alert(tableDetails.data._id + " is Offline");
//             }
//         });
//     };

//     $scope.mute = function() {
//         var audio = ctrl.toggleAudio();
//         if (!audio) $("#mute").html("Unmute");
//         else $("#mute").html("Mute");
//     }

//     $scope.end = function() {
//         ctrl.hangup();
//     }

//     $scope.pause = function() {
//         var video = ctrl.toggleVideo();
//         if (!video) $('#pause').html('Unpause');
//         else $('#pause').html('Pause');
//     }

//     function getVideo(number) {
//         return $('*[data-number="' + number + '"]');
//     }

//     function addLog(log) {
//         // $('#logs').append("<p>" + log + "</p>");
//     }

//     $scope.errWrap = function(fxn, form) {
//         try {
//             return fxn(form);
//         } catch (err) {
//             alert("WebRTC is currently only supported by Chrome, Opera, and Firefox");
//             return false;
//         }
//     }


//     /* ========================================== */
//     /* ================== CHAT ================== */
//     /* ========================================== */

//     function splitString(str) {
//         var details = {};

//         details['chatBadgeColor'] = str.split(':')[0],
//             details['user'] = str.split(':')[1],
//             details['message'] = str.split(':')[2]
//         return details;
//     };

//     // Random Color Generator
//     function getRandomColor() {
//         // creating a random number between 0 and 255
//         var r = Math.floor(Math.random() * 256);
//         var g = Math.floor(Math.random() * 256);
//         var b = Math.floor(Math.random() * 256);

//         // going from decimal to hex
//         var hexR = r.toString(16);
//         var hexG = g.toString(16);
//         var hexB = b.toString(16);

//         // making sure single character values are prepended with a "0"
//         if (hexR.length == 1) {
//             hexR = "0" + hexR;
//         }

//         if (hexG.length == 1) {
//             hexG = "0" + hexG;
//         }

//         if (hexB.length == 1) {
//             hexB = "0" + hexB;
//         }

//         // creating the hex value by concatenatening the string values
//         var hexColor = "#" + hexR + hexG + hexB;

//         return hexColor.toUpperCase();
//     };


//     function initiateChat(userDetails, tableDetails) {
//         var chatBadgeColor = getRandomColor();
//         // var box = PUBNUB.$('box'), input = PUBNUB.$('input'), channel = tableDetails.data._id;
//         var box = PUBNUB.$('box'),
//             input = PUBNUB.$('input'),
//             channel = 'dicegames';
//         pubnub.subscribe({
//             channel: channel,
//             callback: function(text) {
//                 var userAttr = splitString(text);
//                 if (userAttr.user != userDetails.name) {
//                     userAttr.user = '@' + userAttr.user;
//                 }
//                 box.innerHTML = "<div class='chatElement' style='border-left:5px solid " + userAttr.chatBadgeColor + "'><div class='username'>" + userAttr.user + "</div>" + ('' + userAttr.message).replace(/[<>]/g, '') + '</div><br>' + box.innerHTML
//                     // box.innerHTML = "<div class='chatElement'>" + (''+userDetails.message).replace( /[<>]/g, '' ) + '</div><br>' + box.innerHTML
//             }
//         });
//         pubnub.bind('keyup', input, function(e) {
//             (e.keyCode || e.charCode) === 13 && pubnub.publish({
//                 channel: channel,
//                 message: chatBadgeColor + ':' + userDetails.name + ':' + input.value,
//                 x: (input.value = '')
//             })
//         })

//         pubnub.here_now({
//             channel: channel,
//             callback: function(m) {
//                 console.log(m)
//                     // m['user'] = $state.params.username;
//                     // m['chatBadgeColor'] = chatBadgeColor;
//                     // hostName = m.user;
//             }
//         });
//     };


//     function initiateGame(userDetails, dealersTable){
//          /* From CodePen */
//         var diceOne = '<img data-diceValue="1" src="../../assets/images/diceone.png" style="margin-right:10px;">';
//         var diceTwo = '<img data-diceValue="2" src="../../assets/images/dicetwo.png" style="margin-right:10px;">';
//         var diceFour = '<img data-diceValue="4" src="../../assets/images/dicefour.png" style="margin-right:10px;">';

//         // var diceArray = document.getElementsByClassName('dice');
//         var diceArray = [];
//         diceArray.push(diceOne, diceTwo, diceFour);

//         var resultContainer = document.getElementById('diceResults');

//         userDetails['playersChannel'] = 'dicegames' + (Math.floor(Math.random() * 100));

//         $scope.rollDice = function() {
//             // Disable All playing controls after the dice has been rolled. These will get re-enabled when a new round begins
//             document.getElementById('bet').setAttribute('disabled', 'disabled');
//             document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//             document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//             resultContainer.innerHTML = "";
//             var chosenDices = [];
//             for (var i = 0; i < 3; i++) {
//                 var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
//                 chosenDices.push(dice);
//                 resultContainer.innerHTML += dice;
//             };

//             var arr = document.getElementById('diceResults').children;
//             var diceSum = 0;
//             for (var j = 0; j < arr.length; j++) {
//                 diceSum += Number(arr[j].getAttribute('data-diceValue'));
//             }
//             $scope.DiceTotalValue = diceSum;

//             set(diceSum, chosenDices);
//         };

//         $scope.placeBet = function(betAmount, betOn) {
//             // alert(betAmount + betOn);
//             if (betOn == 'me') {
//                 $scope.gameWinner = $scope.userDetails._id;
//             } else if (betOn == 'dealer') {
//                 $scope.gameWinner = $scope.dealerTableDetails.data.dealer;
//             }
//             $('#myModal').modal('hide');

//             $scope.rollDice();

//         };

//         $scope.changeBetAmt = function(flag, betAmount) {
//             if (flag == 'increase') {
//                 $scope.betAmount = $scope.betAmount + 1;
//             }

//             if (flag == 'decrease') {
//                 if (betAmount == $scope.dealerTableDetails.data.AnteAmount) {
//                     return;
//                 };
//                 $scope.betAmount = $scope.betAmount - 1;
//             }
//         };

//         // (function() {

//         var gameId = document.querySelector('#gameId');
//         var gameIdQuery = document.querySelector('#gameIdQuery');
//         // var tictactoe = document.querySelector('#tictactoe');
//         var output = document.querySelector('#output');
//         // var whosTurn = document.getElementById('whosTurn');

//         var gameid = '';
//         var rand = (Math.random() * 9999).toFixed(0);

//         // gameid = (getGameId()) ? getGameId() : rand;
//         gameid = dealersTable.data._id;

//         // gameId.textContent = gameid;

//         // var oppenetUrl = 'http://codepen.io/PubNub/pen/jbVbdj/?id=' +gameid;
//         // var oppenetUrl = 'https://localhost:8080/#/player/'+$state.params.host+'/aman';
//         // gameIdQuery.innerHTML = '<a href="' +oppenetUrl+ '" target="_blank">' +oppenetUrl+ '</a>';


//         var channel = 'tictactoe--' + gameid;
//         console.log('Channel: ' + channel);

//         // var uuid = PUBNUB.uuid();
//         var uuid = JSON.stringify(userDetails);

//         // When you fork the project, please do use your own pub/sub keys.
//         // http://admin.pubnub.com
//         // var pubnub = PUBNUB.init({
//         //     publish_key: pubnubConfig.publish_key,
//         //     subscribe_key: pubnubConfig.subscribe_key,
//         //     uuid: uuid
//         // });

//         function displayOutput(m) {
//             if (!m) return;
//             return '<li><strong>' + m.player + '</strong>: ' + m.position + '</li>';
//         }

//         /*
//          * Tic-tac-toe
//          * Based on the single-player Tic Tac Toe on http://jsfiddle.net/5wKfF/378/
//          * Multiplayer feature with PubNub
//          */

//         // var mySign = 'O';
//         var mySign = userDetails._id;

//         pubnub.subscribe({
//             // channel_group: 'AllChannels',
//             channel: dealersTable.data._id,
//             connect: play,
//             presence: function(m) {
//                 console.log('Player Controller');
//                 console.log(m);
//                 // whosTurn

//                 if (m.uuid === uuid && m.action === 'join') {
//                     if (m.occupancy < 2) {
//                         // whosTurn.textContent = 'Waiting for your opponent...';
//                     } else if (m.occupancy === 2) {
//                         // mySign = 'O';
//                         mySign = userDetails._id;
//                     }
//                     // else if (m.occupancy > 2) {
//                     //     alert('This game already have two players!');
//                     //     // tictactoe.className = 'disabled';
//                     // }
//                     if (m.occupancy === 2) {
//                         // tictactoe.className = '';
//                         startNewGame();
//                     }
//                 }


//                 document.getElementById('you').textContent = mySign;
//             },
//             callback: function(m) {
//                 // Display the move
//                 // if (document.querySelector('#moves')) {
//                 //     var movesOutput = document.querySelector('#moves');
//                 //     movesOutput.innerHTML = movesOutput.innerHTML + displayOutput(m);
//                 // }

//                 // Display the move on the board
//                 // var el = document.querySelector('[data-position="' + m.position + '"]');
//                 // el.firstChild.nodeValue = m.player;
//                 // console.log("Subscribe Player");
//                 // console.log(m);
                
//                 checkGameStatus(m.player, m.diceValue);    
                
                
//             },
//         });

//         // Player will publish his player ID to the dealers public channel
//         pubnub.publish({
//             // channel_group: 'diceGamesChannelGroup',
//             channel: dealersTable.data.Dealer._id,
//             message: {
//                 player: JSON.stringify(userDetails),
//                 // diceValue: diceValue,
//                 // dice: chosenDices,
//                 flag: 'publishing players channel ID'
//                 // betOn : $scope.gameWinner
//             },
//             callback: function(m) {
//                 console.log("Publish Player");
//                 console.log(m);
//                 // timer().startTimer(20, 'currentRound');
//             }
//         });

//         function publishPosition(player, position, status, diceValue, chosenDices, channelName, gameWinner) {
          
//             pubnub.publish({
//                 channel: channelName,
//                 message: {
//                     player: userDetails._id,
//                     playerName: userDetails.name,
//                     playerData: player,
//                     diceValue: diceValue,
//                     dice: chosenDices,
//                     channel: channelName,
//                     betOn : gameWinner,
//                     flag: "publishing player's move"
//                 },
//                 callback: function(m) {

//                     console.log("Publish Player");
//                     console.log(m);
//                     checkGameStatus(userDetails._id, diceValue);
//                 }
//             });
//         };
        
//         // Subscribe to players own channel
//         pubnub.subscribe({
//             channel: userDetails._id,
//             presence: function(m){
//                 // console.log("Data from Dealer on Player's Private channel - Presence");
//                 // console.log(m);

//             },
//             callback: function(m) {
//                 if(m.data){
//                     console.log("Data from Dealer on Player's Private channel - Callback");
//                     console.log(m);
                    
//                     var publishedTime = m.data.timestamp;
//                     var endTime = moment(publishedTime).add((m.data.duration+1), 's');
//                     var difference = moment().utc().diff(endTime, 'seconds');
//                     console.log("difference in published time and players time");
//                     console.log(difference);
//                     var timerValue = Math.abs(difference);
//                     if(m.data.flag == 'wait'){
//                         // Disable all playing controls while we are waiting for other players to join
//                         document.getElementById('bet').setAttribute('disabled', 'disabled');
//                         document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//                         document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//                         waitTimer(timerValue).startTimer(0);
//                     };
//                     if(m.data.flag == 'startRound'){
//                         roundTimer(timerValue).startTimer(0);
//                         // Enable all playing controls while the round is going on
//                         document.getElementById('bet').removeAttribute('disabled');
//                         document.getElementById('decreaseBet').removeAttribute('disabled');
//                         document.getElementById('increaseBet').removeAttribute('disabled');
//                     };

//                 };
//             }
//         });

//         // function startRound(){
//             //     $scope.roundStarted = true;
//             //     pubnub.time(function(time){ 
                    
//             //         // Convert pubnub timeToken to IST --> var a = new Date(time/1e4);
//             //         var pubnubTime = new Date(time/1e4);
//             //         console.log("Dealer publishing the PubNub time to the player - Start Round Time");
//             //         console.log(pubnubTime);

//             //         roundTimer(20).startTimer(0);
//             //         publishToPlayer($scope.playersPrivateChannel, {flag: 'startRound', duration: 20, timestamp: pubnubTime, timeString: time});
                    
//             //     });
//             //     // startNewGame();
//         // }

//         // var timer = function () {
//             //     var seconds = 00; 
//             //     var tens = 00; 
//             //     var Interval;

//             //     function startTimer (duration, flag) {
//             //         if(flag == 'currentRound'){
//             //             tens++; 
//             //             if(seconds < duration){
//             //                 if (tens > 60) {
//             //                     console.log("seconds");
//             //                     seconds++;
//             //                     tens = 0;
//             //                 }
//             //             }
//             //             if(seconds == duration){
//             //                 clearInterval(Interval);
//             //                 display.textContent = '';
//             //                 if(!$scope.betOptions){
//             //                     document.getElementById('bet').disabled = true;
//             //                 }
//             //             }else{
//             //                 display.textContent = seconds + ' Seconds Remaining';    
//             //             }
//             //         }
//             //         else if(flag == 'nextRound'){
//             //             tens++; 
//             //             if(seconds < duration){
//             //                 if (tens > 60) {
//             //                     console.log("seconds");
//             //                     seconds++;
//             //                     tens = 0;
//             //                 }
//             //             }
//             //             if(seconds == duration){
//             //                 clearInterval(Interval);
//             //                 display.textContent = '';
//             //                 if(!$scope.betOptions){
//             //                     document.getElementById('bet').disabled = false;
//             //                     startNewGame();
//             //                 }
//             //             }else{
//             //                 display.textContent = 'Next Round Will Start in- ' + seconds;    
//             //             }
//             //         }
//             //         console.log(seconds);
//             //     }
//             //     return {
//             //         startTimer: function (time, flag) {
//             //             time = time || 20;
//             //             clearInterval(Interval);
//             //             Interval = setInterval(function () {
//             //                 startTimer(time, flag);
//             //             }, 30);
//             //         },

//             //         stopTimer: function () {
//             //             clearInterval(Interval);
//             //         },

//             //         resetTimer: function () {
//             //             seconds = 00; 
//             //             tens = 00; 
//             //             clearInterval(Interval);
//             //         }
//             //     }
//         // };

//         var roundTimer = function (seconds) {
//             var seconds = seconds; 
//             var tens = 00; 
//             var roundInterval;

//             function startCounter (duration) {
                
//                 tens++; 
//                 if(seconds > duration){
//                     if (tens > 60) {
//                         seconds--;
//                         tens = 0;
//                     }
//                 }
//                 if(seconds == duration){
//                     clearInterval(roundInterval);
//                     display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
//                     $scope.rollDice();
//                 }else{
//                     display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
//                     // Publish the Round Time to all the players playing the game
//                 }
                

                
//                 // $scope.time.roundTime = seconds;
//                 // publishToPlayer($scope.playersPrivateChannel, {time: $scope.time.roundTime, flag: 'RoundTime'});
//                 console.log(seconds + ' | ' + duration);
//             }
//             return {
//                 startTimer: function (duration, flag) {
//                     var time = duration;
//                     clearInterval(roundInterval);
//                     roundInterval = setInterval(function () {
//                         startCounter(time, flag);
//                     }, 30);
//                 }
//             }
//         };

//         var waitTimer = function (seconds) {
//             var seconds = seconds; 
//             var tens = 00; 
//             var waitInterval;

//             function startCounter (duration) {
                
//                 tens++; 
//                 if(seconds > duration){
//                     if (tens > 60) {
//                         seconds--;
//                         tens = 0;
//                     }
//                 }
//                 if(seconds == duration){
//                     clearInterval(waitInterval);
//                     display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    
//                 }else{
//                     display.textContent = 'Next Round will Start in ' + seconds + ' Seconds. Waiting for players to join';
                    
//                 }
                

//                 // $scope.time.waitTime = seconds;
//                 // publishToPlayer($scope.playersPrivateChannel, {time: seconds, flag: 'WaitTime'});
//                 console.log(seconds + ' | ' + duration);
//             }
//             return {
//                 startTimer: function (duration, flag) {
//                     var time = duration;
//                     clearInterval(waitInterval);
//                     waitInterval = setInterval(function () {
//                         startCounter(time, flag);
//                     }, 30);
//                 }
//             }
//         };


//         function getGameId() {
//             // If the uRL comes with referral tracking queries from the URL
//             if (window.location.search.substring(1).split('?')[0].split('=')[0] !== 'id') {
//                 return null;
//             } else {
//                 return window.location.search.substring(1).split('?')[0].split('=')[1];
//             }
//         }

//         var squares = [],
//             EMPTY = '\xA0',
//             // score,
//             moves,
//             turn = userDetails._id,
//             wins = [7, 56, 448, 73, 146, 292, 273, 84];
//         // $scope.score = {};

//         function startNewGame() {
//             // document.getElementById('rollDice').removeAttribute('disabled');
//             resultContainer.innerHTML = "";
//             var i;

//             $scope.score = {
//                 'Dealer': {},
//                 'Player': {}
//             };
//             $scope.score.Player['name'] = userDetails.name;
//             $scope.score.Player['id'] = userDetails._id;
//             $scope.score.Player['value'] = 0;
//             $scope.score.Dealer['name'] = dealersTable.data.Dealer.name;
//             $scope.score.Dealer['id'] = dealersTable.data.Dealer._id;
//             $scope.score.Dealer['value'] = 0;
//             turn = userDetails._id;

//             moves = 0;
//             for (i = 0; i < squares.length; i += 1) {
//                 squares[i].firstChild.nodeValue = EMPTY;
//             }

//             // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
//         }

//         function win(score) {
//             /* Original Win Procedure */
//             // if($scope.score.X.value && $scope.score.X.value != 0 && $scope.score.O.value && $scope.score.O.value !=0 ){
//             //     if($scope.score.X.value > $scope.score.O.value){
//             //         return ' X wins';
//             //     }else if( $scope.score.O.value > $scope.score.X.value){
//             //         return 'O wins';
//             //     }else if($scope.score.O.value == $scope.score.X.value){
//             //         return 'X wins';
//             //     }else{
//             //         return false;
//             //     }
//             // }else{
//             //     return false;
//             // }


//             /* Test case */
//             if($scope.score.Dealer.value && $scope.score.Dealer.value != 0 && $scope.score.Player.value && $scope.score.Player.value !=0 ){
                
//                 if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value > $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Wins.'; // Player Wins
//                 }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value < $scope.score.Player.value){
//                     return $scope.score.Dealer.name + ' Wins.'; // Player loses
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value > $scope.score.Player.value){
//                     return $scope.score.Dealer.name + ' Wins.'; // Player loses
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value < $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Wins.'; // Player wins
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value == $scope.score.Player.value){
//                     return $scope.score.Dealer.name + ' Wins.'; // Player loses
//                 }else{
//                     return false;
//                 }

//                 // if($scope.score.X.value > $scope.score.O.value){
//                 //     return ' X wins';
//                 // }else if( $scope.score.O.value > $scope.score.X.value){
//                 //     return 'O wins';
//                 // }else if($scope.score.O.value == $scope.score.X.value){
//                 //     return 'X wins';
//                 // }else{
//                 //     return false;
//                 // }
//             }else{
//                 return false;
//             }

//             // var i;
//             // for (i = 0; i < wins.length; i += 1) {
//             //     if ((wins[i] & score) === wins[i]) {
//             //         return true;
//             //     }
//             // }
//             // return false;
//         }

//         function checkGameStatus(player, el) {
//             moves += 1;
//             // console.log('Moves: ' + moves);
//             // console.log("checkGameStatus el _. Player");
//             // console.log(el);
//             // $scope.score[player] = el;
//             console.log('Score for player, ' + player );
//             console.log($scope.score );

//             if(player == userDetails._id){
//                 $scope.score.Player.value = el;
//             }else if(player == dealersTable.data.Dealer._id){
//                 $scope.score.Dealer.value = el;
//             }

//             if (win($scope.score)) {
//                 alert(win($scope.score));
//                 document.getElementById('bet').disabled = false;
//                 // timer().startTimer(10, 'nextRound');
//             } 
//             // else if (moves > 2) {
//             //     swal('Reset Game', 'error');
//             // } 

//             else {
//                 turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
//                 // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
//             }
//         }
        
//         function set(diceSum, chosenDices) {

//             if (turn !== mySign) return;

//             // if (this.firstChild.nodeValue !== EMPTY) return;
//             $scope.score['Player']['id'] = userDetails._id;
//             $scope.score['Player']['name'] = userDetails.name;
//             $scope.score['Player']['value'] = diceSum;
//             publishPosition(userDetails, 'this.dataset.position', 'played', diceSum, chosenDices, userDetails._id,  $scope.gameWinner);
//         }

//         function play() {

//             var board = document.createElement('table'),
//                 indicator = 1,
//                 i, j,
//                 row, cell;
//             board.border = 1;

//             for (i = 1; i < 4; i += 1) {
//                 row = document.createElement('tr');
//                 board.appendChild(row);
//                 for (j = 1; j < 4; j += 1) {
//                     cell = document.createElement('td');
//                     cell.dataset.position = i + '-' + j;
//                     cell.width = cell.height = 50;
//                     cell.align = cell.valign = 'center';
//                     cell.indicator = indicator;
//                     cell.onclick = set;
//                     cell.appendChild(document.createTextNode(''));
//                     row.appendChild(cell);
//                     squares.push(cell);
//                     indicator += indicator;

//                 }
//             }

//             // tictactoe = document.getElementById('tictactoe');
//             // tictactoe.appendChild(board);
//             startNewGame();
//         }

//         // })();

//     /* END */
//    }
// })



/*================================================  27th Dec 2016 backup ====================================================*/
// angular.module('dicegamesProjectApp').controller('playerController', function($scope, $rootScope, $state, $http, pubnubConfig) {

// 	// PubNub Settings
// 	pubnub = PUBNUB.init({
//         publish_key: pubnubConfig.publish_key,
//         subscribe_key: pubnubConfig.subscribe_key,
//         uuid: JSON.stringify($scope.userDetails),
//         ssl: pubnubConfig.ssl
//     });

//     // Fetch User's Details ( API needs the AUTH token for sending back the user details )
//     (function() {
//         $http.get('/api/users/me').success(function(response) {
            
//             $scope.userDetails = response;
//             var tableId = $state.params.tableId;
//             findMyTable($scope.userDetails, tableId);

//         }).error(function(error) {
//             console.log("Error Fetching User's Details.")
//             console.log(error);
//         })
//     })();

//     function findMyTable(userDetails, tableId) {
//         $http.post('/api/tables/findTable', {tableId: tableId}).success(function(dealersTable) {
            
//             $scope.dealerTableDetails = dealersTable;
//             $scope.betAmount = $scope.dealerTableDetails.data.AnteAmount;

//             // startPlayersVideoStream(userDetails, dealersTable);
//             ReceiveVideo(userDetails, dealersTable);
//             initiateChat(userDetails, dealersTable);
//             initiateGame(userDetails, dealersTable);

//         }).error(function(error) {
//             console.log("Unable to Find Dealer's Table");
//             console.log(error);
//         });
//     };

//     /* DOM Elements For Showing Video Stream */
//     var video_out = document.getElementById("playersVideo");
//     var vid_thumb = document.getElementById("vid-thumb");

//     // Live Video Stream
//     function ReceiveVideo(userDetails, tableDetails){
//         // Muaz Khan     - https://github.com/muaz-khan
//         // MIT License   - https://www.webrtc-experiment.com/licence/
//         // Documentation - https://github.com/muaz-khan/RTCMultiConnection

//         var connection = new RTCMultiConnection();
//         connection.session = {
//             audio: true,
//             video: true,
//             oneway: true
//         };

//         // connection.channel = 'testVideoBroadcast';
//         connection.channel = $state.params.tableId;

//         connection.onstream = function(e) {
//             e.mediaElement.width = '100%';
//             videosContainer.insertBefore(e.mediaElement, videosContainer.firstChild);
//             // rotateVideo(e.mediaElement);
//             scaleVideos();
//         };

//         // function rotateVideo(mediaElement) {
//         //     mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
//         //     setTimeout(function() {
//         //         mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
//         //     }, 1000);
//         // }

//         connection.onstreamended = function(e) {
//             e.mediaElement.style.opacity = 0;
//             // rotateVideo(e.mediaElement);
//             setTimeout(function() {
//                 if (e.mediaElement.parentNode) {
//                     e.mediaElement.parentNode.removeChild(e.mediaElement);
//                 }
//                 scaleVideos();
//             }, 1000);
//         };

//         var sessions = {};
//         connection.onNewSession = function(session) {
//             if (sessions[session.sessionid]) return;
//             sessions[session.sessionid] = session;

//             // var tr = document.createElement('tr');
//             // tr.innerHTML = '<td><strong>' + session.sessionid + '</strong> is sharing his webcam in one-way direction!</td>' +
//             //     '<td><button class="join">View His Webcam</button></td>';
//             // roomsList.insertBefore(tr, roomsList.firstChild);

//             // var joinRoomButton = tr.querySelector('.join');
//             // joinRoomButton.setAttribute('data-sessionid', session.sessionid);
//             // joinRoomButton.onclick = function() {
//             //     this.disabled = true;

//             //     var sessionid = this.getAttribute('data-sessionid');
//             //     // session = sessions[sessionid];
//             //     session = sessions[tableDetails.data.Dealer._id];

//             //     if (!session) throw 'No such session exists.';

//             //     connection.join(session);
//             // };

//             session = sessions[tableDetails.data.Dealer._id];

//             if (!session) throw 'No such session exists.';

//             connection.join(session);
//         };

//         var videosContainer = document.getElementById('videos-container');
//         var roomsList = document.getElementById('rooms-list');

//         // document.getElementById('setup-new-broadcast').onclick = function() {
//         //     this.disabled = true;

//         //     connection.open(document.getElementById('broadcast-name').value || 'Anonymous');
//         // };

//         // setup signaling to search existing sessions
//         connection.connect();

//         // (function() {
//         //     var uniqueToken = document.getElementById('unique-token');
//         //     if (uniqueToken)
//         //         if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
//         //         else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
//         // })();

//         function scaleVideos() {
//             var videos = document.querySelectorAll('video'),
//                 length = videos.length,
//                 video;

//             var minus = 130;
//             var windowHeight = 700;
//             var windowWidth = 600;
//             var windowAspectRatio = windowWidth / windowHeight;
//             var videoAspectRatio = 4 / 3;
//             var blockAspectRatio;
//             var tempVideoWidth = 0;
//             var maxVideoWidth = 0;

//             for (var i = length; i > 0; i--) {
//                 blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
//                 if (blockAspectRatio <= windowAspectRatio) {
//                     tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
//                 } else {
//                     tempVideoWidth = windowWidth / i;
//                 }
//                 if (tempVideoWidth > maxVideoWidth)
//                     maxVideoWidth = tempVideoWidth;
//             }
//             for (var i = 0; i < length; i++) {
//                 video = videos[i];
//                 if (video)
//                     video.width = maxVideoWidth - minus;
//             }
//         };

//         window.onresize = scaleVideos;
//     };

//     /* ========================================== */
//     /* ================== CHAT ================== */
//     /* ========================================== */

//     function splitString(str) {
//         var details = {};

//         details['chatBadgeColor'] = str.split(':')[0],
//             details['user'] = str.split(':')[1],
//             details['message'] = str.split(':')[2]
//         return details;
//     };

//     // Random Color Generator
//     function getRandomColor() {
//         // creating a random number between 0 and 255
//         var r = Math.floor(Math.random() * 256);
//         var g = Math.floor(Math.random() * 256);
//         var b = Math.floor(Math.random() * 256);

//         // going from decimal to hex
//         var hexR = r.toString(16);
//         var hexG = g.toString(16);
//         var hexB = b.toString(16);

//         // making sure single character values are prepended with a "0"
//         if (hexR.length == 1) {
//             hexR = "0" + hexR;
//         }

//         if (hexG.length == 1) {
//             hexG = "0" + hexG;
//         }

//         if (hexB.length == 1) {
//             hexB = "0" + hexB;
//         }

//         // creating the hex value by concatenatening the string values
//         var hexColor = "#" + hexR + hexG + hexB;

//         return hexColor.toUpperCase();
//     };

//     function initiateChat(userDetails, tableDetails) {
//         var chatBadgeColor = getRandomColor();
//         // var box = PUBNUB.$('box'), input = PUBNUB.$('input'), channel = tableDetails.data._id;
//         var box = PUBNUB.$('box'),
//             input = PUBNUB.$('input'),
//             channel = 'dicegames';
//         pubnub.subscribe({
//             channel: channel,
//             callback: function(text) {
//                 var userAttr = splitString(text);
//                 if (userAttr.user != userDetails.name) {
//                     userAttr.user = '@' + userAttr.user;
//                 }
//                 box.innerHTML = "<div class='chatElement' style='display:block;width:96%;border-left:5px solid " + userAttr.chatBadgeColor + "'><div class='username'>" + userAttr.user + "</div>" + ('' + userAttr.message).replace(/[<>]/g, '') + '</div><br>' + box.innerHTML;
//                     // box.innerHTML = "<div class='chatElement'>" + (''+userDetails.message).replace( /[<>]/g, '' ) + '</div><br>' + box.innerHTML
//                     $('#box').reverseChildren();
//                     $("#box").scrollTop($("#box")[0].scrollHeight + 10);
//             }
//         });
//         pubnub.bind('keyup', input, function(e) {
//             (e.keyCode || e.charCode) === 13 && pubnub.publish({
//                 channel: channel,
//                 message: chatBadgeColor + ':' + userDetails.name + ':' + input.value,
//                 x: (input.value = '')
//             })
//         })

//         pubnub.here_now({
//             channel: channel,
//             callback: function(m) {
//                 console.log(m)
//                     // m['user'] = $state.params.username;
//                     // m['chatBadgeColor'] = chatBadgeColor;
//                     // hostName = m.user;
                    
//             }
//         });
//     };

//     // Reverse Chat messages UI
//     $.fn.reverseChildren = function() {
//       return this.each(function(){
//         var $this = $(this);
//         $this.children().each(function(){
//           $this.prepend(this);
//         });
//       });
//     };

//     // Game Logic =>

//     // Global Variables for Game. Players who join the table will get this information and then continue playing from there.
// 	// Players will be allowed to be in the table while it is in Wait mode other wise they will have to wait for another round to start.
//     $scope.turn;
// 	$scope.playersInGame = [];
// 	$scope.playersInRound = [];
// 	$scope.time = {
// 		waitTime: 0,
// 		roundTime: 0
// 	};
// 	$scope.score = {
//         'Dealer': {},
//         'Player': {}
//     };

//     function initiateGame(userDetails, dealersTable){

//     	// DOM Elements
//     	var resultContainer = document.getElementById('diceResults');
//         var dealersDiceContainer = document.getElementById('dealersDice');
//     	var gameId = document.querySelector('#gameId');
//     	var gameIdQuery = document.querySelector('#gameIdQuery');
//     	var output = document.querySelector('#output');
//         // var whosTurn = document.getElementById('whosTurn');
//         var display = document.querySelector('#time');

//         // dice images
//         var diceOne = '<img data-diceValue="1" src="../../assets/images/diceone.png" style="margin-right:10px;">';
//         var diceTwo = '<img data-diceValue="2" src="../../assets/images/dicetwo.png" style="margin-right:10px;">';
//         var diceThree = '<img data-diceValue="3" src="../../assets/images/diceThree.png" style="margin-right:10px;">';
//         var diceFour = '<img data-diceValue="4" src="../../assets/images/dicefour.png" style="margin-right:10px;">';
//         var diceFive = '<img data-diceValue="5" src="../../assets/images/diceFive.png" style="margin-right:10px;">';
//         var diceSix = '<img data-diceValue="6" src="../../assets/images/diceSix.png" style="margin-right:10px;">';

//         // var diceArray = [];
//         // diceArray.push(diceOne, diceTwo, diceThree, diceFour, diceFive, diceSix);
//         var diceArray = [];
//         diceArray.push(diceOne);
//         diceArray.push(diceTwo);
//         diceArray.push(diceThree);
//         diceArray.push(diceFour);
//         diceArray.push(diceFive);
//         diceArray.push(diceSix);
//         // Set up Game Requirements
//         var gameid = dealersTable.data._id;
// 		var channel = 'dicegames-' + gameid;
// 		var uuid = JSON.stringify(userDetails);
// 		var mySign = userDetails._id;
//         var chosenDices = [];

// 		$scope.resultingDice = [];
// 		// Roll Player's Dice
// 		$scope.rollDice = function() {
//             // Disable All playing controls after the dice has been rolled. These will get re-enabled when a new round begins
//             document.getElementById('bet').setAttribute('disabled', 'disabled');
//             document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//             document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//             resultContainer.innerHTML = "";
//             dealersDiceContainer.innerHTML = "";
//             chosenDices = [];
//             for (var i = 0; i < 3; i++) {
//                 var dice = diceArray[Math.floor(Math.random() * diceArray.length)]
//                 chosenDices.push(dice);
//                 $scope.resultingDice = angular.copy(chosenDices);
//                 // resultContainer.innerHTML += dice;
//             };
//             $scope.diceSum = 0;

//             // var arr = document.getElementById('diceResults').children;
//             // for (var j = 0; j < arr.length; j++) {
//             //     diceSum += Number(arr[j].getAttribute('data-diceValue'));
//             // }
//             chosenDices.forEach(function(item){
//                 $scope.diceSum += Number(item.substr(21, 1));
//             });
//             // $scope.DiceTotalValue = $scope.diceSum;
//             $scope.score.Player['name'] = userDetails.name;
//             $scope.score.Player['id'] = userDetails._id;
//             $scope.score.Player['value'] = $scope.diceSum;
//             // set($scope.diceSum, chosenDices);
//         };

//         // Get details of who the player has bet on, hide the modal explicitly and roll the player's dice
//         $scope.placeBet = function(betAmount, betOn) {
//             // document.getElementById('bet').setAttribute('disabled', 'disabled');
//             // document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//             // document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//             if (betOn == 'me') {
//                 $scope.gameWinner = $scope.userDetails._id;
//             } else if (betOn == 'dealer') {
//                 $scope.gameWinner = $scope.dealerTableDetails.data.Dealer._id;
//             }
//             $('#myModal').modal('hide');
//             $scope.rollDice(); // Roll dice when the player places a bet
//             publishResultGlobally('channelName', userDetails, $scope.betAmount, null, 'playersBet');
//             // Disable All Controls after the dice has been rolled
//             // document.getElementById('bet').setAttribute('disabled', 'disabled');
//             // document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//             // document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//         };

//         // Increase/Decrease the bet amount value
//         $scope.changeBetAmt = function(flag, betAmount) {
//             if (flag == 'increase') {
//                 $scope.betAmount = $scope.betAmount + 1;
//             }

//             if (flag == 'decrease') {
//                 if (betAmount == $scope.dealerTableDetails.data.AnteAmount) {
//                     return;
//                 };
//                 $scope.betAmount = $scope.betAmount - 1;
//             }
//         };

//         /* ============== Publish & subscribe using Pubnub ============== */

//         // Ask player is they want to start the game or not
//         setTimeout(function() {

//             swal({
//                title: "Dicegames will begin in a while.",
//                text: "You will be able to bet once the game starts.",
//                type: "warning",
//                showCancelButton: false,
//                confirmButtonColor: "#DD6B55",
//                confirmButtonText: "Yes, Start the game!",
//                closeOnConfirm: true}, 
//             function(){ 
//                 // Player will publish his player ID to the dealers public channel
//                 pubnub.publish({
//                     channel: dealersTable.data.Dealer._id,
//                     message: {
//                         player: JSON.stringify(userDetails),
//                         flag: 'publishing players channel ID'
//                     },
//                     callback: function(m) {
//                         // console.log("Publish Player");
//                         // console.log(m);
//                     }
//                 });
//             });

//         }, 2000);

//         // Subscribe to Dealer's public channel to get dealer's moves
//         pubnub.subscribe({
//             channel: dealersTable.data._id,
//             // connect: play,
//             presence: function(m) {
                
//                 if (m.uuid === uuid && m.action === 'join') {
//                     startNewGame();
//                 }
//                 document.getElementById('you').textContent = mySign;
//             },
//             callback: function(m) {
//                 $scope.score.Dealer['name'] = m.playerName;
//                 $scope.score.Dealer['id'] = m.player;
//                 $scope.score.Dealer['value'] = m.diceValue;
//                 $scope.dealersDice = m.dealersDice;
//                 if(m.dealersDice){
//                     dealersDiceContainer.innerHTML = m.dealersDice;
//                 }
//             	checkGameStatus(m.player, m.diceValue);
//                 if(m.flag == 'playerResult'){
//                     // Display Dice and the amount won/lost in the round in the results container
//                     document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">'
//                     // $scope.resultingDice.forEach(function(dice){
//                     //     document.getElementById('playersResults').innerHTML += dice;
//                     // });
//                     m.dice.forEach(function(dice){
//                         document.getElementById('playersResults').innerHTML += dice;
//                     });
//                     document.getElementById('playersResults').innerHTML += m.data + '</div>';
//                 }
//                 if(m.flag == 'playersBet'){
//                     document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">' + m.player.name + ' has bet $';
    
//                     document.getElementById('playersResults').innerHTML += m.data + '</div>';
//                 }
//             },
//         });

//         function publishResultGlobally(channelName, player, result, playersDice, flag){
//             // console.log("Channel Name to publish global result => " , dealersTable.data._id);
//             pubnub.publish({
//                 channel: dealersTable.data._id,
//                 message: {
//                     flag: flag,
//                     data: result,
//                     player: player,
//                     dice: playersDice
//                 },
//                 callback: function(m) {
//                     // console.log("Published On " + dealersTable.data._id);
//                     console.log("Published Message " + result);
//                     // $scope.score.Dealer['name'] = m.playerName;
//                     // $scope.score.Dealer['id'] = m.player;
//                     // $scope.score.Dealer['value'] = m.diceValue;
//                     // $scope.dealersDice = m.dealersDice;
//                     // if(m.dealersDice){
//                     //     dealersDiceContainer.innerHTML = m.dealersDice;
//                     // }
//                     // checkGameStatus(m.player, m.diceValue);
//                 },
//             });
//         };

//         function publishFoldMessage(channelName, player){
//             pubnub.publish({
//                 channel: channelName,
//                 message: {
//                     player: player._id,
//                     playerName: player.name,
//                     playerData: player,
//                     flag: 'Player Folded'
//                 },
//                 callback: function(m) {
//                     // $scope.score[m.player] = m.diceValue;
//                     console.log("Publish Player");
//                     console.log(m);
//                     // checkGameStatus(userDetails._id, diceValue);
//                 }
//             });
//         };

//         // Publish Player's data on private channel which the dealer is subscribed to
//         function publishPosition(player, position, status, diceValue, chosenDices, channelName, gameWinner, betAmount) {
          
//             pubnub.publish({
//                 channel: channelName,
//                 message: {
//                     player: player._id,
//                     playerName: player.name,
//                     playerData: player,
//                     diceValue: diceValue,
//                     dice: chosenDices,
//                     channel: channelName,
//                     betOn : gameWinner,
//                     betAmt : betAmount,
//                     flag: "publishing player's move"
//                 },
//                 callback: function(m) {
//                     // $scope.score[m.player] = m.diceValue;
//                     console.log("Publish Player");
//                     console.log(m);
//                     // checkGameStatus(userDetails._id, diceValue);
//                 }
//             });
//         };

//         // Subscribe to players own channel
//         pubnub.subscribe({
//             channel: userDetails._id,
//             presence: function(m){
//                 // console.log("Data from Dealer on Player's Private channel - Presence");
//                 // console.log(m);

//             },
//             callback: function(m) {
//                 if(m.data){
//                     // console.log("Data from Dealer on Player's Private channel - Callback");
//                     // console.log(m);
                    
//                     var publishedTime = m.data.timestamp;
//                     var endTime = moment(publishedTime).add((m.data.duration), 's');
//                     var difference = moment().utc().diff(endTime, 'seconds');
                   
//                     var timerValue = Math.abs(difference);
//                     if(m.data.flag == 'wait'){
//                         console.log("Wait Round");

//                         // Disable all playing controls while we are waiting for other players to join
//                         document.getElementById('bet').setAttribute('disabled', 'disabled');
//                         document.getElementById('decreaseBet').setAttribute('disabled', 'disabled');
//                         document.getElementById('increaseBet').setAttribute('disabled', 'disabled');
//                         // waitTimer(timerValue).startTimer(0);
//                         waitTimer(m.data.duration).startTimer(0);
//                     };
//                     if(m.data.flag == 'startRound'){
//                         console.log("Start Round");
//                         if($scope.waitInterval){
//                             clearInterval($scope.waitInterval);
//                         }
//                         // roundTimer(timerValue).startTimer(0);
//                         roundTimer(m.data.duration).startTimer(0);
                        
//                     };
//                     if(m.data.flag == 'roundInProgress'){
//                         // alert("Round in Progress");
//                         display.textContent = 'Round In Progress. Please wait for the next round to begin.';
//                     }

//                 };
//             }
//         });
//         /* ============== Publish & subscribe using Pubnub End ============== */

//         // Timers
//         var roundTimer = function (seconds) {
//             var seconds = seconds; 
//             var tens = 00; 
//             $scope.roundInterval;

//             function startCounter (duration) {
                
//                 tens++; 
//                 if(seconds > duration){
//                     if (tens > 60) {
//                         seconds--;
//                         tens = 0;
//                     }
//                 }
//                 if(seconds == duration){
//                     clearInterval($scope.roundInterval);
//                     display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
//                     // $scope.rollDice(); // Roll dice when the round timer reaches 0
//                     if($scope.resultingDice.length == 3){
//                     	$scope.resultingDice.forEach(function(dice){
//                     		resultContainer.innerHTML += dice;
//                         });
//                         set($scope.diceSum, chosenDices);
//                     }else{
//                         $scope.score.Player['value'] = 0;
//                         resultContainer.innerHTML += "You Folded. Please Wait for the Next Round to start."
//                         // document.getElementById('playersResults').innerHTML += '<div>' + userDetails.name + ' Folded.</div>';
//                         publishFoldMessage(userDetails._id, userDetails);
//                     };
//                 }else{
//                     display.textContent = 'Round Time: ' + seconds + ' Seconds Remaining';
//                     // Publish the Round Time to all the players playing the game
//                 }
                

                
//                 // $scope.time.roundTime = seconds;
//                 // publishToPlayer($scope.playersPrivateChannel, {time: $scope.time.roundTime, flag: 'RoundTime'});
//                 // console.log(seconds + ' | ' + duration);
//             }
//             return {
//                 startTimer: function (duration, flag) {
//                     // Enable all playing controls while the round is going on
//                     document.getElementById('bet').removeAttribute('disabled');
//                     document.getElementById('decreaseBet').removeAttribute('disabled');
//                     document.getElementById('increaseBet').removeAttribute('disabled');

//                     // Clear Dealers Dice Images as the new round starts
//                     dealersDiceContainer.innerHTML = "";

//                     var time = duration;
//                     clearInterval($scope.roundInterval);
//                     $scope.roundInterval = setInterval(function () {
//                         startCounter(time, flag);
//                     }, 30);
//                 }
//             }
//         };

//         var waitTimer = function (seconds) {
//             var seconds = seconds; 
//             var tens = 00; 
//             $scope.waitInterval;

//             function startCounter (duration) {
                
//                 tens++; 
//                 if(seconds > duration){
//                     if (tens > 60) {
//                         seconds--;
//                         tens = 0;
//                     }
//                 }
//                 if(seconds == duration){
//                     clearInterval($scope.waitInterval);
//                     display.textContent = 'Next Round will Start in ' + seconds + ' Seconds.';
                    
//                 }else{
//                     display.textContent = 'Next Round will Start in ' + seconds + ' Seconds. Waiting for players to join';
                    
//                 }
                

//                 // $scope.time.waitTime = seconds;
//                 // publishToPlayer($scope.playersPrivateChannel, {time: seconds, flag: 'WaitTime'});
//                 // console.log(seconds + ' | ' + duration);
//             }
//             return {
//                 startTimer: function (duration, flag) {
//                     $scope.resultingDice = [];
//                     $('#diceResults').html('');
//                     startNewGame();
//                     if($scope.dealersDice){
//                         dealersDiceContainer.innerHTML = $scope.dealersDice;
//                     }
//                     var time = duration;
//                     clearInterval($scope.waitInterval);
//                     $scope.waitInterval = setInterval(function () {
//                         startCounter(time, flag);
//                     }, 30);
//                 }
//             }
//         };

//         function startNewGame() {
//             // document.getElementById('rollDice').removeAttribute('disabled');
            

            
//             $scope.resultingDice = [];
//             var i;
//             $scope.turn = userDetails._id;

//             $scope.score = {
//                 'Dealer': {},
//                 'Player': {}
//             };
            

//             $scope.score.Player['name'] = userDetails.name;
//             $scope.score.Player['id'] = userDetails._id;
//             $scope.score.Player['value'] = 0;

//             $scope.score.Dealer['name'] = dealersTable.data.Dealer.name;
//             $scope.score.Dealer['id'] = dealersTable.data.Dealer._id;
//             $scope.score.Dealer['value'] = 0;
            

//             // moves = 0;
//             // for (i = 0; i < squares.length; i += 1) {
//             //     squares[i].firstChild.nodeValue = EMPTY;
//             // }

//             // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
//         };

//         function win(score) {
            
//             if($scope.score.Dealer.value && $scope.score.Dealer.value != 0 && $scope.score.Player.value && $scope.score.Player.value !=0 ){
                
//                 if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value > $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Won $' + $scope.betAmount; // Player Wins
//                 }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value < $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
//                 }else if($scope.gameWinner == $scope.score.Dealer.id && $scope.score.Dealer.value == $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value > $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value < $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Won $' + $scope.betAmount; // Player wins
//                 }else if($scope.gameWinner == $scope.score.Player.id && $scope.score.Dealer.value == $scope.score.Player.value){
//                     return $scope.score.Player.name + ' Lost $' + $scope.betAmount; // Player loses
//                 }else{
//                     return false;
//                 }
//             }else{
//                 return false;
//             }
//         };

//         function checkGameStatus(player, el) {
//             // moves += 1;
            
//             // console.log('Score for player, ' + player );
//             // console.log($scope.score );

//             if(player == userDetails._id){
//                 $scope.score.Player.value = el;
//             }else if(player == dealersTable.data.Dealer._id){
//                 $scope.score.Dealer.value = el;
//             }

//             if (win($scope.score)) {
//                 // alert(win($scope.score));
                
//                 // Display Dice and the amount won/lost in the round in the results container
//                 // document.getElementById('playersResults').innerHTML += '<div style="margin-bottom:10px;">'
//                 // $scope.resultingDice.forEach(function(dice){
//                 //     document.getElementById('playersResults').innerHTML += dice;
//                 // });
//                 // document.getElementById('playersResults').innerHTML += win($scope.score) + '</div>';
//                 publishResultGlobally('channelName', player, win($scope.score), $scope.resultingDice, 'playerResult');
//                 document.getElementById('bet').disabled = false;
//                 // Reset scores when a round is over and somebody has won the round
//                 // startNewGame();
//             }
//             // else if (moves > 2) {
//             //     swal('Reset Game', 'error');
//             // } 

//             else {
//                 $scope.turn = ($scope.turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
//                 // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
//             }
//         };

//         function set(diceSum, chosenDices) {
//             // if ($scope.turn !== mySign) return;
//             publishPosition(userDetails, 'this.dataset.position', 'played', diceSum, chosenDices, userDetails._id,  $scope.gameWinner, $scope.betAmount);
//         }

//     };

//     var scrolled = false;
//     function updateScroll(){
//         if(!scrolled){
//             var element = document.getElementById("yourDivID");
//             element.scrollTop = element.scrollHeight;
//         }
//     }

//     $("#yourDivID").on('scroll', function(){
//         scrolled=true;
//     });

// });