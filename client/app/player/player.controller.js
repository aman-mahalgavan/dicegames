angular.module('dicegamesProjectApp').controller('playerController', function($scope, $rootScope, $state, $http, pubnubConfig) {

    /* DOM Elements For Showing Video Stream */
    var video_out = document.getElementById("playersVideo");
    var vid_thumb = document.getElementById("vid-thumb");

    // DOM Element To display Round Time
    var display = document.querySelector('#time');

    var pubnub;
    // Get User's Details
    (function() {
        $http.get('/api/users/me').success(function(response) {
            $scope.userDetails = response;
            var tableId = $state.params.tableId;

            pubnub = PUBNUB.init({
                publish_key: pubnubConfig.publish_key,
                subscribe_key: pubnubConfig.subscribe_key,
                uuid: $scope.userDetails
            });
            
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

            startPlayersVideoStream(userDetails, dealersTable);
            initiateChat(userDetails, dealersTable);
            initiateGame(userDetails, dealersTable);
        }).error(function(error) {
            console.log("Unable to Find Dealer's Table");
            console.log(error);
        });
    };

    /* Fetch Players list for a particular table */
    /* Checking every 1 minute if a user has joined or left the table. TODO- find a proper way to check if a user has joined or left the table.*/
        // var getPlayersList = setInterval(function(){
        // $http.post('/api/listPlayers', {table: $state.params.host}).success(function(response){
        //     $scope.players = response.data.players;
        // }).error(function(error){
        //     console.log("Error Fetching players list");
        //     console.log(error);
        // })
    // }, 60000)

    function startPlayersVideoStream(userDetails, tableDetails) {
        var phone = window.phone = PHONE({
            // number: $state.params.username,
            number: userDetails.name,
            publish_key: pubnubConfig.publish_key,
            subscribe_key: pubnubConfig.subscribe_key,
            ssl: pubnubConfig.ssl,
            uuid: userDetails.name,
            media: { audio: false, video: true },
            // oneway:true
        });
        var ctrl = window.ctrl = CONTROLLER(phone);
        ctrl.ready(function() {
            // ctrl.addLocalStream(vid_thumb);
            addLog("Logged in as SampleUser");
        });


        ctrl.receive(function(session) {
            session.connected(function(session) {
                $(video_out).html(session.video);
                addLog(session.number + " has joined.");
            });
            session.ended(function(session) {
                // ctrl.getVideoElement(session.number).remove();
                addLog(session.number + " has left.");
                // vidCount--;
            });
        });
        ctrl.videoToggled(function(session, isEnabled) {
            ctrl.getVideoElement(session.number).toggle(isEnabled);
            addLog(session.number + ": video enabled - " + isEnabled);
        });
        ctrl.audioToggled(function(session, isEnabled) {
            ctrl.getVideoElement(session.number).css("opacity", isEnabled ? 1 : 0.75);
            addLog(session.number + ": audio enabled - " + isEnabled);
        });

        if (!window.phone) alert("Login First!");
        var num = $state.params.tableId;
        // var num = tableDetails.data._id;
        console.log("Dialing Table => " + num);
        // if (phone.number() == num) return false; // No calling yourself!
        ctrl.isOnline(num, function(isOn) {
            // alert("checking if user is online-  " + isOn + "num- " + num);
            if (isOn){
                ctrl.dial(num);
            } 
            else {
                alert(tableDetails.data._id + " is Offline");
            }
        });
    };

    $scope.mute = function() {
        var audio = ctrl.toggleAudio();
        if (!audio) $("#mute").html("Unmute");
        else $("#mute").html("Mute");
    }

    $scope.end = function() {
        ctrl.hangup();
    }

    $scope.pause = function() {
        var video = ctrl.toggleVideo();
        if (!video) $('#pause').html('Unpause');
        else $('#pause').html('Pause');
    }

    function getVideo(number) {
        return $('*[data-number="' + number + '"]');
    }

    function addLog(log) {
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
                    // box.innerHTML = "<div class='chatElement'>" + (''+userDetails.message).replace( /[<>]/g, '' ) + '</div><br>' + box.innerHTML
            }
        });
        pubnub.bind('keyup', input, function(e) {
            (e.keyCode || e.charCode) === 13 && pubnub.publish({
                channel: channel,
                message: chatBadgeColor + ':' + userDetails.name + ':' + input.value,
                x: (input.value = '')
            })
        })

        pubnub.here_now({
            channel: channel,
            callback: function(m) {
                console.log(m)
                    // m['user'] = $state.params.username;
                    // m['chatBadgeColor'] = chatBadgeColor;
                    // hostName = m.user;
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

        userDetails['playersChannel'] = 'dicegames' + (Math.floor(Math.random() * 100));

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
            for (var j = 0; j < arr.length; j++) {
                diceSum += Number(arr[j].getAttribute('data-diceValue'));
            }
            $scope.DiceTotalValue = diceSum;

            set(diceSum, chosenDices);
        };

        $scope.placeBet = function(betAmount, betOn) {
            // alert(betAmount + betOn);
            if (betOn == 'me') {
                $scope.gameWinner = $scope.userDetails._id;
            } else if (betOn == 'dealer') {
                $scope.gameWinner = $scope.dealerTableDetails.data.dealer;
            }
            $('#myModal').modal('hide');

            $scope.rollDice();

        };

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


        var channel = 'tictactoe--' + gameid;
        console.log('Channel: ' + channel);

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

        // var mySign = 'O';
        var mySign = userDetails._id;

        pubnub.subscribe({
            // channel_group: 'AllChannels',
            channel: dealersTable.data._id,
            connect: play,
            presence: function(m) {
                console.log('Player Controller');
                console.log(m);
                // whosTurn

                if (m.uuid === uuid && m.action === 'join') {
                    if (m.occupancy < 2) {
                        // whosTurn.textContent = 'Waiting for your opponent...';
                    } else if (m.occupancy === 2) {
                        // mySign = 'O';
                        mySign = userDetails._id;
                    }
                    // else if (m.occupancy > 2) {
                    //     alert('This game already have two players!');
                    //     // tictactoe.className = 'disabled';
                    // }
                    if (m.occupancy === 2) {
                        // tictactoe.className = '';
                        startNewGame();
                    }
                }


                document.getElementById('you').textContent = mySign;
            },
            callback: function(m) {
                // Display the move
                // if (document.querySelector('#moves')) {
                //     var movesOutput = document.querySelector('#moves');
                //     movesOutput.innerHTML = movesOutput.innerHTML + displayOutput(m);
                // }

                // Display the move on the board
                // var el = document.querySelector('[data-position="' + m.position + '"]');
                // el.firstChild.nodeValue = m.player;
                // console.log("Subscribe Player");
                // console.log(m);
                
                checkGameStatus(m.player, m.diceValue);    
                
                
            },
        });

        // Player will publish his player ID to the dealers public channel
        pubnub.publish({
            // channel_group: 'diceGamesChannelGroup',
            channel: dealersTable.data.Dealer._id,
            message: {
                player: userDetails,
                // diceValue: diceValue,
                // dice: chosenDices,
                channel: 'publishing players channel ID'
                // betOn : $scope.gameWinner
            },
            callback: function(m) {
                console.log("Publish Player");
                console.log(m);
                timer().startTimer(20, 'currentRound');
            }
        });

        function publishPosition(player, position, status, diceValue, chosenDices, channelName) {
          
            pubnub.publish({
                channel: channelName,
                message: {
                    player: userDetails._id,
                    playerData: player,
                    diceValue: diceValue,
                    dice: chosenDices,
                    channel: channelName,
                    betOn : $scope.gameWinner,
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
                console.log("player's own channel on which the dealer will publish a private message");
                console.log(m);
            },
            callback: function(m) {
                // console.log("Publish Player");
                // console.log(m);
                // setTimeout(function(){
                // document.getElementById('bet').disabled = false;
                // timer().startTimer(10, 'nextRound');
                // }, 100);
            }
        });

        var timer = function () {
            var seconds = 00; 
            var tens = 00; 
            var Interval;

            function startTimer (duration, flag) {
                if(flag == 'currentRound'){
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
                        if(!$scope.betOptions){
                            document.getElementById('bet').disabled = true;
                        }
                    }else{
                        display.textContent = seconds + ' Seconds Remaining';    
                    }
                }
                else if(flag == 'nextRound'){
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
                        if(!$scope.betOptions){
                            document.getElementById('bet').disabled = false;
                            startNewGame();
                        }
                    }else{
                        display.textContent = 'Next Round Will Start in- ' + seconds;    
                    }
                }
                console.log(seconds);
            }
            return {
                startTimer: function (time, flag) {
                    time = time || 20;
                    clearInterval(Interval);
                    Interval = setInterval(function () {
                        startTimer(time, flag);
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
            turn = userDetails._id,
            wins = [7, 56, 448, 73, 146, 292, 273, 84];
        // $scope.score = {};

        function startNewGame() {
            // document.getElementById('rollDice').removeAttribute('disabled');
            resultContainer.innerHTML = "";
            var i;

            $scope.score = {
                'X': {},
                'O': {}
            };
            $scope.score.O['name'] = userDetails._id;
            $scope.score.O['value'] = 0;
            $scope.score.X['name'] = dealersTable.data.Dealer._id;
            $scope.score.X['value'] = 0;
            turn = userDetails._id;

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
            // console.log('Moves: ' + moves);
            // console.log("checkGameStatus el _. Player");
            // console.log(el);
            // $scope.score[player] = el;
            console.log('Score for player, ' + player );
            console.log($scope.score );

            if(player == userDetails._id){
                $scope.score.O.value = el;
            }else if(player == dealersTable.data.Dealer._id){
                $scope.score.X.value = el;
            }

            if (win($scope.score)) {
                alert(win($scope.score));
                document.getElementById('bet').disabled = false;
                timer().startTimer(10, 'nextRound');
            } 
            // else if (moves > 2) {
            //     swal('Reset Game', 'error');
            // } 

            else {
                turn = (turn === dealersTable.data.Dealer._id) ? userDetails._id : dealersTable.data.Dealer._id;
                // whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
            }
        }
        
        function set(diceSum, chosenDices) {

            if (turn !== mySign) return;

            // if (this.firstChild.nodeValue !== EMPTY) return;
            publishPosition(userDetails, 'this.dataset.position', 'played', diceSum, chosenDices, userDetails._id);

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
   }
})
