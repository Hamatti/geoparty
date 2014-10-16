var socket = io();
var player;

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



    $('.gamearea').on('click', '.question:not(.done)', function(ev) {
        var key = $(ev.target).data('key');
        socket.emit('getQuestion', key); 
    });

    socket.on('showQuestion', function(q) {
        $('.gamearea').hide();
        var over = $('.overlay');
        over.empty();
        var p = $('<p>');
        var p2 = $('<p>');
        var input = $('<input>');
        var button = $('<button>');
        button.html('Answer');
        p.html(q.question);
        p2.append(input);
        p2.append(button);
        p2.attr('data-key', q.value + '::' + q.category);
        p2.attr('class', 'answer');
        over.append(p);
        over.append(p2);
        over.show();
    });

   $('.overlay').on('click', 'button', function(ev) {
        var $target = $(ev.target);
        var key = $target.parent().data('key');
        var answer = $target.parent().find('input').val();
        socket.emit('guess', {question: key, answer: answer, player: player});
   });

   socket.on('rightAnswer', function(data) {
       var key = data.key;
       var playerName = data.player.name;

       $('.overlay').hide();
       var $target = $('.question[data-key="' + key + '"]')
       $target.html('$' + data.points + ' for ' + playerName);
       $target.addClass('done');
       if(data.points < 0) {
          $target.addClass('wrong');
       }
       $('.gamearea').show();
   });

   socket.on('nextRound', function(questions) {
       insertQuestions(questions);    
   });

});
