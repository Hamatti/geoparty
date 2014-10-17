var FuzzySet = require('fuzzyset.js');
var _ = require('underscore-node');
var express = require('express');
var path = require('path');
var questions = require('./737.json');
var util = require('./js/player.js');

var Show = util.show;
var User = util.user;
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/css', express.static(path.join(__dirname, '/css')));
app.use('/img', express.static(path.join(__dirname, '/img')));
app.use('/js', express.static(path.join(__dirname, '/js')));
app.use('/fonts', express.static(path.join(__dirname, '/fonts')));

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/game/', function(req, res) {
    res.sendFile(path.join(__dirname, 'game.html'));
});

var players = [];
var i = 0;
var gameStarted = false;
var round = 1;
var inCharge;

var show = new Show(questions);
io.on('connection', function(socket) {
    if(gameStarted || players.length >= 3) {
        console.log('Game is full');
        socket.emit('fullgame', 'Game is full or already started');
        return;
    }
    else {
        var player = new User('player' + i++);
        players.push(player)
        console.log(player.name + ' joined the game');
        console.log(players);
        io.emit('playerChange', { 'players': players });

        if(players.length == 3 && !gameStarted) {
            // Start the game
            gameStarted = true;
            playQuestions = show.getQuestions(round);
            inCharge = _.sample(players).name;
            io.emit('gameInit', {round: 1, questions: playQuestions});
            io.emit('inCharge', inCharge);
        }
        socket.on('disconnect', function() {
            console.log('user ' + player.name + ' disconnected');
            players.splice(players.indexOf(player), 1);
            io.emit('playerChange', { 'players': players });
            if(_.isEmpty(players)) {
                gameStarted = false;
            }
        });
    }

    socket.on('forcestart', function() {
        gameStarted = true;
        playQuestions = show.getQuestions(round);
        inCharge = _.sample(players).name;
        io.emit('gameInit', {round: round, questions: playQuestions});
        io.emit('inCharge', inCharge);
    });

    socket.on('name', function(data) {
        if(_.filter(players, function(p) {
            return p.name == data.name;
           }).length) {
            data.name = data.name += '_2';
        }
        player.name = data.name;
        console.log("Changed name: " + player.name);
        io.emit('playerChange', { 'players': players });
    });

    socket.on('getQuestion', function(key) {
        var question = show.getQuestion(key);
        console.log(question);
        io.emit('showQuestion', question);
    });

    socket.on('claim', function() {
        socket.broadcast.emit('claimed');
        socket.emit('makeAGuess');
    });

    socket.on('guess', function(data) {
        var question = show.getQuestion(data.question);
        if(data.player != '') {
        var player = _.filter(players, function(p) {
            return p.name == data.player;
        })[0];
        var correctAnswer = question.answer;
        var grades = show.grade(question, data.answer);
        var points = grades[0];
        var unanswered = grades[1];
        player.money += points;
        console.log('Player ' + player.name + ' got ' + points + ' points.');
        if(points > 0) {
            inCharge = player.name;
        }
        io.emit('rightAnswer', {points: points, answer: correctAnswer, player: player, key: data.question});
        }
        else {
            io.emit('rightAnswer', {points: 0, answer: question.answer, player: 'None', key: data.question});
        }
        io.emit('inCharge', inCharge);
        io.emit('playerChange', {players: players});
        if(unanswered === 0 && round === 0) {
            round++
            io.emit('nextRound', show.getQuestions(round));
        } else if (unanswered == 0 && round === 1) {
            console.log('End.');
            io.emit('endGame', {players: players});
        }
    });
});

http.listen(3000, function(){
      console.log('listening on *:3000');
});
