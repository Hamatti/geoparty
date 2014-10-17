var socket = io();
var player;
var inCharge;
var timeout;

var insertQuestions = function(_questions) {
    var $target = $('.gamearea');
    $target.empty();
    var $table = $('<table>');
    var $headerRow = $('<tr>');
    var row1 = $('<tr>');
    var row2 = $('<tr>');
    var row3 = $('<tr>');
    var row4 = $('<tr>');
    var row5 = $('<tr>');
    var rows = [row1, row2, row3, row4, row5];
    for(var category in _questions) {
        var $th = $('<th>');
        $th.html(category);
        $headerRow.append($th);
        var questions = _questions[category];
        _.each(questions, function(q, i) {
            var row = $(rows[i]);
            var $td = $('<td>');
            $td.html(q.value);
            $td.attr({'class': 'question'});
            $td.attr({'data-key': q.value + '::' + q.category});
            row.append($td);
        });
    }
    $table.append($headerRow);
    _.each(rows, function(r) {
        $table.append(r);
    });
    $target.append($table);
    };
    
$(function() {
    $('#submit').on('click', function(ev) {
        var name = $(ev.target).parent().find('input').val();
        $('#name').hide();
        socket.emit('name', {'name': name});
        $('#game').show();
        player = name;
        if($('.playerlist').children().length === 1){
            $('.forcestart').append('<button id="startgame">Start anyway</button>');
        }
    });

    socket.on('playerChange', function(data) {
        var ul = $('.playerlist');
        ul.empty();
        _.each(data.players, function(p) {
            var $li = $('<li>');
            $li.append(p.name + ": " + p.money);
            ul.append($li);
        });
    });

    socket.on('gameInit', function(data) {
        insertQuestions(data.questions);
    });

    socket.on('inCharge', function(name) {
        if (name === player) {
            _inCharge = 'Your';
        } else {
            _inCharge = name + "'s";
        }
        $('h1').html(_inCharge + ' turn to choose a question');
        inCharge = name;
    });



    $('.gamearea').on('click', '.question:not(.done)', function(ev) {
        if(player !== inCharge) {
            return;
        }
        var key = $(ev.target).data('key');
        socket.emit('getQuestion', key); 
    });

    socket.on('showQuestion', function(q) {
        $('.gamearea').hide();
        var over = $('.overlay');
        over.empty();
        var p = $('<p>');
        var p2 = $('<p>');
        //var input = $('<input>');
        var button = $('<button>');
        button.html('I KNOW THIS!');
        button.attr('class', 'claim');
        p.html(q.question);
        p2.append(button);
        var key = q.value + '::' + q.category;
        p2.attr('data-key', key);
        p2.attr('class', 'claim');
        over.append(p);
        over.append(p2);
        over.show();
        timeout = setTimeout(function() {
            socket.emit('guess', {question: key, answer: '', player: ''});
        }, 10000);
    });

   $('.overlay').on('click', 'button.claim', function(ev) {
        clearTimeout(timeout);
        var key = $(ev.target).parent().data('key');
        socket.emit('claim', key);
   });

   $('.overlay').on('click', 'button.guess', function(ev) {
        var $target = $(ev.target).parent();
        var key = $target.data('key');
        var answer = $target.find('input').val();

        socket.emit('guess', {question: key, answer: answer, player: player});
   });

   socket.on('claimed', function() {
        $('.claim').remove();
   });

   socket.on('makeAGuess', function() {
       var $target = $('.overlay p.claim');
       $target.empty();
       var $input = $('<input class="answer" />');
       var $button = $('<button class="guess">Guess</button>');
       $target.append($input);
       $target.append($button);
   });

   socket.on('rightAnswer', function(data) {
       var key = data.key;
       var message;
       if(player !== 'None') {
         var playerName = data.player.name;
         message = '$' + data.points + ' for ' + playerName;
       } else {
         message = 'No one answered';
       }

       $('.overlay').hide();
       var $target = $('.question[data-key="' + key + '"]')
       $target.html(message);
       $target.addClass('done');
       if(data.points < 0) {
          $target.addClass('wrong');
       }
       var $rightOverlay = $('.answerlayout');
       $rightOverlay.empty();
       var $p = $('<p>Right answer was ' + data.answer + '</p>');
       var $p2 = $('<p>' + data.player.name + ' got ' + data.points + ' points.</p>');
       $rightOverlay.append($p);
       $rightOverlay.append($p2);
       $rightOverlay.show();
       setTimeout(function() {
           $rightOverlay.hide();
            $('.gamearea').show();
       }, 3000);
        
   });

   socket.on('nextRound', function(questions) {
       insertQuestions(questions);    
   });

   socket.on('endGame', function(players) {
       var topList = _.sortBy(players.players, function(p) {
           return p.money;
       });
       var overlay = $('.overlay');
       overlay.empty();
       var h1 = $('<h1>');
       h1.html('Final score');
       overlay.append(h1);
       var ol = $('<ol>');
       _.each(topList, function(p) {
           var li = $('<li>');
           li.html(p.name + ': ' + p.money);
           ol.append(li);
       });
       overlay.append(ol);
       overlay.show();
       $('.gamearea').hide();
   });

   socket.on('fullgame', function(msg) {
       window.location = '/';
   });

   $('body').on('click', '#startgame', function(ev) {
       socket.emit('forcestart', {});
   });
});
