angular.module('dicegamesProjectApp').controller('dealerController', function($scope, $rootScope, $state, $http, pubnubConfig, $cookieStore) {

    /* DOM Elements for Showing the Video */
    var video_out = document.getElementById("dealersVideo");
    var vid_thumb = document.getElementById("vid-thumb");

    // DOM Element To display Round Time
    var display = document.querySelector('#time');
    var pubnub;
    $scope.playersResults = [];
    // Fetch User's Details ( API needs the AUTH token for sending back the user details )
    (function() {
        $http.get('/api/users/me').success(function(response) {
            $scope.userDetails = response;

            pubnub = PUBNUB.init({
                publish_key: pubnubConfig.publish_key,
                subscribe_key: pubnubConfig.subscribe_key,
                uuid: $scope.userDetails,
                ssl: pubnubConfig.ssl,
                broadcast: true,
                oneway: true
            });

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
            
            startDealersVideoStream(userDetails, dealersTable);
            initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, $scope.dealerTableDetails);
        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
    };

    function startDealersVideoStream(userDetails, tableDetails) {
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

    // /* Fetch Players list for a particular table */
    // /* Checking every 1 minute if a user has joined or left the table. TODO- find a proper way to check if a user has joined or left the table.*/
        // setInterval(function(){
        //     $http.post('/api/listPlayers', {table: $state.params.tableId}).success(function(response){
        //         $scope.players = response.data.players;
        //     }).error(function(error){
        //         console.log("Error Fetching players list");
        //         console.log(error);
        //     });
    // }, 10000);


    // // Check state change
    // $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        //     // console.log("State Change");
        //     if (fromState.name == 'dealer') {
        //         var confirmed = confirm('You are about to leave the table. Table will be closed.');
        //         if (confirmed) {
        //             $http.post('/api/removeTable', { tableId: $scope.dealerTableDetails.data._id }).success(function(response) {
        //                 // console.log("Table Removed");
        //             }).error(function(err) {
        //                 console.log("Error Removing the Table");
        //                 console.log(err);
        //             });
        //         } else {
        //             return;
        //         };
        //     };

    // });

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
        console.log(log); 
        // $('#logs').append("<p>" + log + "</p>");
    }

    $scope.errWrap = function(fxn, form) {
        try {
            return fxn(form);
        } catch (err) {
            alert("WebRTC is currently only supported by Chrome, Opera, and Firefox");
            return false;
        }
    }



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
                console.log("Presence ==> ");
                console.log(m);
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
                console.log("here now")
                console.log(m)
                    // m['user'] = $state.params.tableName;
                    // userName = m.user;
            }
        });
    };

    
    function initiateGame(userDetails, dealersTable){
        /* From CodePen */

        var diceOne = '<img data-diceValue="1" src="../../assets/images/diceone.png" style="margin-right:10px;">';
        var diceTwo = '<img data-diceValue="2" src="../../assets/images/dicetwo.png" style="margin-right:10px;">';
        var diceFour = '<img data-diceValue="4" src="../../assets/images/dicefour.png" style="margin-right:10px;">';

        // var diceArray = document.getElementsByClassName('dice');
        var diceArray = [];
        diceArray.push(diceOne, diceTwo, diceFour);

        var resultContainer = document.getElementById('diceResults');
        
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


        // (function() {

            var gameId = document.querySelector('#gameId');
            var gameIdQuery = document.querySelector('#gameIdQuery');
            // var tictactoe = document.querySelector('#tictactoe');
            var output = document.querySelector('#output');
            // var whosTurn = document.getElementById('whosTurn');

            var gameid = '';
            var rand = (Math.random() * 9999).toFixed(0);

            // gameid = (getGameId()) ? getGameId() : rand;
            gameid = dealersTable.data._id;

            // gameId.textContent = gameid;

            // var oppenetUrl = 'http://codepen.io/PubNub/pen/jbVbdj/?id=' +gameid;
            // var oppenetUrl = 'https://localhost:8080/#/player/'+$state.params.host+'/aman';
            // gameIdQuery.innerHTML = '<a href="' +oppenetUrl+ '" target="_blank">' +oppenetUrl+ '</a>';


            var gameChannel = 'tictactoe--' + gameid;
            console.log('Channel: ' + gameChannel);

            // var uuid = PUBNUB.uuid();
            var uuid = userDetails;

            // When you fork the project, please do use your own pub/sub keys.
            // http://admin.pubnub.com
            // var pubnub = PUBNUB.init({
            //     publish_key: pubnubConfig.publish_key,
            //     subscribe_key: pubnubConfig.subscribe_key,
            //     uuid: uuid
            // });

            function displayOutput(m) {
                if (!m) return;
                return '<li><strong>' + m.player + '</strong>: ' + m.position + '</li>';
            }

            /*
             * Tic-tac-toe
             * Based on the single-player Tic Tac Toe on http://jsfiddle.net/5wKfF/378/
             * Multiplayer feature with PubNub
             */
            // var mySign = 'X';
            var mySign = userDetails._id;

            // Subscribe to a public channel where players will publish their channel names
            pubnub.subscribe({
                channel: dealersTable.data.Dealer._id,
                connect: play,
                presence: function(m){
                    console.log("Dealer's subscribed public channel presence");
                    console.log(m);
                },
                callback: function(m){
                    console.log("Dealer's subscribed public channel presence");
                    console.log(m);
                     
                    m.player['playing'] = true;
                    subscribeToPlayersChannel(m.player._id);
                    collectPlayers(m);
                }
            });

             // Subscribe to player's channels
            function subscribeToPlayersChannel(channel){
                pubnub.subscribe({
                    channel: channel,
                    presence: function(m){
                        console.log("Dealer's subscribed public channel presence");
                        console.log(m);
                    },
                    callback: function(m){
                        console.log("Player's published data on private channel");
                        console.log(m);
                        // $scope.score[m.player] = m.diceValue;
                        $scope.score['O']['name'] = m.player;
                        $scope.score['O']['value'] = m.diceValue;
                        
                        // $scope.score[dealersTable.data.Dealer._id] = 0;

                        // checkGameStatus(m.player, m.diceValue);
                        if($scope.timer && $scope.timer > 0 ){
                            $scope.playersResults.push(m);
                        }else if($scope.timer && $scope.timer <= 0 ){
                            $scope.timer = 20;
                            publishToPlayer(channel, "Please Wait for this round to finish!");
                        }
                    }
                }); 

                // Privately publish to player
                function publishToPlayer(playersChannel, message){
                    pubnub.publish({
                        channel: playersChannel,
                        message: {
                            message: message
                        },
                        callback: function(m) {
                            console.log("Dealer Publishes to a single player");
                            console.log(m);
                        }
                    });
                };
            };

            // Publish to a public channel
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

            $scope.playersInRound = [];
            function collectPlayers(data){
                if(!$scope.roundStarted){
                    $scope.playersInRound.push(data.player._id);
                }

                if($scope.playersInRound.length == 1){
                    // setTimeout(function() {
                        startRound();
                    // }, 1000);
                }
            }

            function startRound(){
                $scope.roundStarted = true;
                // var twentySeconds = 20;
                // startTimer(twentySeconds, display);
                
                timer().startTimer(20);

                setTimeout(function(){
                    $scope.diceRolled = false;
                }, 30000);
            }

            /* Timer - 0 to Duration */
            var timer = function () {
                var seconds = 00; 
                var tens = 00; 
                var Interval;

                function startTimer (duration) {
                    tens++; 
                    if(seconds < duration){
                        if (tens > 60) {
                            console.log("seconds");
                            seconds++;
                            tens = 0;
                        }
                    }
                    if(seconds == duration){
                        clearInterval(Interval);
                        display.textContent = '';
                        rollDiceOnce();
                    }else{
                        display.textContent = seconds + ' Seconds Remaining';    
                    }
                    
                    console.log(seconds);
                }
                return {
                    startTimer: function (time) {
                        time = time || 30;
                        clearInterval(Interval);
                        Interval = setInterval(function () {
                            startTimer(time);
                        }, 30);
                    },

                    stopTimer: function () {
                        clearInterval(Interval);
                    },

                    resetTimer: function () {
                        seconds = 00; 
                        tens = 00; 
                        clearInterval(Interval);
                    }
                }
            }

            /* Reverse Timer - Duration to 0 */
            // var timer = function () {
            //     var seconds = 20; 
            //     var tens = 00; 
            //     var Interval;

            //     function startTimer (duration) {
            //         tens++; 
            //         if(seconds > duration){
            //             if (tens > 60) {
            //                 console.log("seconds");
            //                 seconds--;
            //                 tens = 0;
            //             }
            //         }
            //         if(seconds == duration){
            //             clearInterval(Interval);
            //         }
                    
            //         console.log(seconds);
            //     }
            //     return {
            //         startTimer: function (time) {
            //             time = time || 30;
            //             clearInterval(Interval);
            //             Interval = setInterval(function () {
            //                 startTimer(time);
            //             }, 30);
            //         }
            //     }
            // }

            /*function startTimer(duration, display) {
                // $scope.timer = duration;
                // var minutes, seconds;
                // $scope.interval = setInterval(function () {
                //     if (--$scope.timer < 0) {
                //         return;
                //         // timer = duration;
                //     }else if($scope.timer == 0){
                //         turn = userDetails._id;
                //         rollDiceOnce();
                //         clearInterval($scope.interval);
                //     }
                //     minutes = parseInt($scope.timer / 60, 10)
                //     seconds = parseInt($scope.timer % 60, 10);
                //     minutes = minutes < 10 ? "0" + minutes : minutes;
                //     seconds = seconds < 10 ? "0" + seconds : seconds;
                //     display.textContent = minutes + ":" + seconds;
                // }, 1000);

                var seconds = 00; 
                var tens = 00; 
                var appendTens = document.getElementById("tens")
                var appendSeconds = document.getElementById("seconds")
                var buttonStart = document.getElementById('button-start');
                var buttonStop = document.getElementById('button-stop');
                var buttonReset = document.getElementById('button-reset');
                var Interval ; 
                setInterval(function(){
                    startTimer(20)
                }, 10);
                buttonStart.onclick = function() {
                    clearInterval(Interval);
                    Interval = setInterval(startTimer, 10);
                }

                buttonStop.onclick = function() {
                    clearInterval(Interval);
                }


                buttonReset.onclick = function() {
                    clearInterval(Interval);
                    tens = "00";
                    seconds = "00";
                    appendTens.innerHTML = tens;
                    appendSeconds.innerHTML = seconds;
                }

                function startTimer (duration) {
                    tens++; 
                    if(seconds < duration){
                        if (tens < 9) {
                            appendTens.innerHTML = "0" + tens;
                        }
                        if (tens > 9) {
                            appendTens.innerHTML = tens;
                        }
                        if (tens > 60) {
                            console.log("seconds");
                            seconds++;
                            appendSeconds.innerHTML = "0" + seconds;
                            tens = 0;
                            appendTens.innerHTML = "0" + 0;
                        }
                        if (seconds > 9) {
                            appendSeconds.innerHTML = seconds;
                        }
                    }
                }
            }
*/
            $scope.diceRolled = false;
            function rollDiceOnce(){
                $scope.diceRolled = true;
                $scope.rollDice();

                setTimeout(function(){
                    startNewGame(10, display);
                }, 10000);
            }

            function fetchPlayersInGame(){
                pubnub.here_now({
                    channel: gameChannel,
                    includeUUIDs: true,
                    includeState: true
                },
                function(status, response){
                    // console.log("status");
                    // console.log(status);
                    $scope.playersJoinedTheTable = status.uuids.map(v => JSON.parse(v));
                    // console.log('response');
                    // console.log(response);
                });    
            };

            function getGameId() {
                // If the uRL comes with referral tracking queries from the URL
                if (window.location.search.substring(1).split('?')[0].split('=')[0] !== 'id') {
                    return null;
                } else {
                    return window.location.search.substring(1).split('?')[0].split('=')[1];
                }
            }

            var squares = [],
                EMPTY = '\xA0',
                // score,
                moves,
                turn = null,
                wins = [7, 56, 448, 73, 146, 292, 273, 84];

            // $scope.score = {};
            function startNewGame() {
              // document.getElementById('rollDice').removeAttribute('disabled');
                var i;

                // turn = 'O';
                $scope.score = {
                    'X': {},
                    'O': {}
                };
                // turn = userDetails._id;
                $scope.score.X['name'] = userDetails._id;
                $scope.score.X['value'] = 0;
                moves = 0;
                for (i = 0; i < squares.length; i += 1) {
                    squares[i].firstChild.nodeValue = EMPTY;
                }

                // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
            }

            function win(score) {
                if($scope.score.X.value && $scope.score.X.value != 0 && $scope.score.O.value && $scope.score.O.value !=0 ){
                    if($scope.score.X.value > $scope.score.O.value){
                        return ' X wins';
                    }else if( $scope.score.O.value > $scope.score.X.value){
                        return 'O wins';
                    }else if($scope.score.O.value == $scope.score.X.value){
                        return 'X wins';
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }

                // var i;
                // for (i = 0; i < wins.length; i += 1) {
                //     if ((wins[i] & score) === wins[i]) {
                //         return true;
                //     }
                // }
                // return false;
            }

            function checkGameStatus(player, el) {
                moves += 1;
                // $scope.score[player] = el;
                console.log('Score for player, ' + player );
                console.log($scope.score);

                if(player == userDetails._id){
                    $scope.score.X.value = el;
                };

                if (win($scope.score)) {
                    alert(win($scope.score));
                } 

                // else if (moves > 2) {
                //     alert('Boooo!');
                // } 

                else {
                    // turn = (turn === 'X') ? 'O' : 'X';
                    turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
                    // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
                }
            }

            function set(diceValue) {

                // if (turn !== mySign){
                //   return;
                // }

                // if ( this.firstChild.nodeValue !== EMPTY ) {
                //   return;
                // }

                // checkGameStatus(m.player, m.diceValue);
                publishPosition(mySign, 'this.dataset.position', 'played', diceValue);
                
            }

            function play() {

                var board = document.createElement('table'),
                    indicator = 1,
                    i, j,
                    row, cell;
                board.border = 1;

                for (i = 1; i < 4; i += 1) {
                    row = document.createElement('tr');
                    board.appendChild(row);
                    for (j = 1; j < 4; j += 1) {
                        cell = document.createElement('td');
                        cell.dataset.position = i + '-' + j;
                        cell.width = cell.height = 50;
                        cell.align = cell.valign = 'center';
                        cell.indicator = indicator;
                        cell.onclick = set;
                        cell.appendChild(document.createTextNode(''));
                        row.appendChild(cell);
                        squares.push(cell);
                        indicator += indicator;

                    }
                }

                // tictactoe = document.getElementById('tictactoe');
                // tictactoe.appendChild(board);
                startNewGame();
            }

        // })();
    /* END */
    };



});