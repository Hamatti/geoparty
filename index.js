var express = require('express');
var app = express();
var User = require('./player.js').user;
var questions = require('./questions.json');
var path = require('path');
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

io.on('connection', function(socket) {
    if(players.length >= 3) {
        console.log('Game is full');
        socket.emit('error', { msg: 'This game is full' });
        return;
    }
    else {
        var player = new User('player' + i++);
        console.log(player);
        players.push(player)
    
        console.log(player.name + ' joined the game');
        console.log(players);
        io.emit('playerChange', { 'players': players });

        if(players.length == 3) {
            // Start the game
            io.emit('gameInit', {});
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
});


http.listen(3000, function(){
      console.log('listening on *:3000');
});
