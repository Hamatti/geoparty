var _ = require('underscore-node');

exports.user = function(name) {
    this.money = 0;
    this.name = name;
}

exports.show = function(questions) {
    this.rounds = ['Jeopardy!', 'Double Jeopardy!'];
    this.questions = questions;

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
        return qs;
    }

    this.getQuestion = function(key) {
        var value = key.split('::')[0];
        var cat = key.split('::')[1];
        return _.filter(this.questions, function(q) {
            return q.category === cat && q.value === value;
        })[0];
    }
}

