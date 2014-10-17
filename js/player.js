var _ = require('underscore-node');

exports.user = function(name) {
    this.money = 0;
    this.name = name;
}

exports.show = function(questions) {
    this.rounds = ['Jeopardy!', 'Double Jeopardy!'];
    this.questions = questions;
    this.unanswered = 0;

    this.getByRound = function(round) {
        return _.filter(this.questions, function(q) {
            return q.round == this.rounds[round];
        }, this);
    }

    this.pickCategories = function(round) {
        return _.sample(_.uniq(_.map(this.getByRound(round), function(q) {
            return q.category;
        })), 4);
    }

    this.getQuestions = function(round) {
        var cat = this.pickCategories(round);
        var questions = _.filter(this.getByRound(round), function(q) {
            return _.contains(cat, q.category);
        }, this);
        var qs = {}
        _.each(cat, function(c) {
            qs[c] = [];
        });
        _.each(questions, function(q) {
            qs[q.category].push(q);
        });
        this.unanswered = questions.length;
        return qs;
    }

    this.getQuestion = function(key) {
        var value = key.split('::')[0];
        var cat = key.split('::')[1];
        return _.filter(this.questions, function(q) {
            return q.category === cat && q.value === value;
        })[0];
    }

    this.grade = function(question, answer) {
        var value = parseInt(question.value.replace('$', '').replace(',', ''));
        var f = new FuzzySet([question.answer]);
        var fuzz = f.get(answer);
        if(fuzz != null) {
            correctness = fuzz[0][0];
        } else {
            correctness = 0;
        }
        var points = (correctness > 0.4) ? value : -value;
        this.unanswered--;
        return [points, this.unanswered];
    }
}

