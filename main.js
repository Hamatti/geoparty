#!/usr/bin/env node

var FuzzySet = require('fuzzyset.js');
var _ = require('underscore-node');
var express = require('express');
var path = require('path');
var models = require('./js/models.js');
var utils = require('./js/utils.js');

var Show = models.show;
var User = models.user;
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

var players = [],
    i = 0,
    gameStarted = false,
    round = 0,
    inCharge;

var questionFiles = utils.getFiles();
var randomShow = _.sample(questionFiles);
var questions = require(path.join(__dirname, 'questionsets', randomShow));
var show = new Show(questions);

console.log("Playing episode " + randomShow);
io.on('connection', function(socket) {
    // No need to restart server for set of questions
    if(players.length === 0) {
        var randomShow = _.sample(questionFiles);
        var questions = require(path.join(__dirname, 'questionsets', randomShow));
        show = new Show(questions);
    }

    if(gameStarted || players.length >= 3) {
        console.log('Game is full');
        socket.emit('fullgame', 'Game is full or already started');
        return;
    }
    socket.on('disconnect', function() {
        console.log('user ' + player.name + ' disconnected');
        players.splice(players.indexOf(player), 1);
        io.emit('playerChange', { 'players': players });
        if(_.isEmpty(players)) {
            gameStarted = false;
        }
    });

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
        player = new User(data.name);
        players.push(player);
        console.log("Changed name: " + player.name);
        io.emit('playerChange', { 'players': players });
    });

    socket.on('getQuestion', function(key) {
        var question = show.getQuestion(key);
        console.log(question);
        io.emit('showQuestion', question);
    });

    socket.on('claim', function(player) {
        socket.broadcast.emit('claimed', player);
        socket.emit('makeAGuess');
    });

    socket.on('guess', function(data) {
        var question = show.getQuestion(data.question);
        var unanswered;
        if(data.player != '') {
            var player = _.filter(players, function(p) {
                    return p.name == data.player;
            })[0];
            var correctAnswer = question.answer;
            var grades = show.grade(question, data.answer);
            var points = grades[0];
            unanswered = grades[1];
            player.money += points;
            console.log('Player ' + player.name + ' got $' + points);
            if(points > 0) {
                inCharge = player.name;
            }
            io.emit('rightAnswer', {guess: data.answer, points: points, answer: correctAnswer, player: player, key: data.question});
        } else {
            var grades = show.grade(question, '');
            unanswered = grades[1];
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

http.listen(3001, function(){
      console.log('listening on *:3000');
});
