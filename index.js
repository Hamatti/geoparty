var express = require('express');
var app = express();
var util = require('./player.js');
var User = util.user;
var Show = util.show;
var questions = require('./737.json');
var path = require('path');
var http = require('http').Server(app);
var _ = require('underscore-node');
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
var round = 0;

var show = new Show(questions);
io.on('connection', function(socket) {
    if(players.length >= 3) {
        console.log('Game is full');
        return;
    }
    else {
        var player = new User('player' + i++);
        players.push(player)
        console.log(player.name + ' joined the game');
        console.log(players);
        io.emit('playerChange', { 'players': players });

        if(true || (players.length == 3 && !gameStarted)) {
            // Start the game
            gameStarted = true;
            playQuestions = show.getQuestions(0);
            io.emit('gameInit', {round: 1, questions: playQuestions});
        }
        socket.on('disconnect', function() {
            console.log('user ' + player.name + ' disconnected');
            players.splice(players.indexOf(player), 1);
            io.emit('playerChange', { 'players': players });
        });
    }
    socket.on('name', function(data) {
        player.name = data.name;
        console.log("Changed name: " + player.name);
        io.emit('playerChange', { 'players': players });
    });

    socket.on('getQuestion', function(key) {
        var question = show.getQuestion(key);
        io.emit('showQuestion', question);
    });

    socket.on('guess', function(data) {
        var question = show.getQuestion(data.question);
        var correctAnswer = question.answer;
        io.emit('rightAnswer', {points: 0, answer: correctAnswer});
        console.log(question.question);
        console.log(data.answer);
        console.log(correctAnswer);
    });
});

http.listen(3000, function(){
      console.log('listening on *:3000');
});
