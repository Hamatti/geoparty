var express = require('express');
var app = express();

var path = require('path');
var http = require('http').Server(app);

app.use('/css', express.static(path.join(__dirname, '/css')));
app.use('/img', express.static(path.join(__dirname, '/img')));
app.use('/js', express.static(path.join(__dirname, '/js')));
app.use('/font-awesome-4.10', express.static(path.join(__dirname, '/font-awesome-4.10')));;

app.get('/', function(req, res){
      res.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(3000, function(){
      console.log('listening on *:3000');
});
