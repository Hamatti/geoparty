#GEOPARTY
For fun version of Jeopardy for Chartio Hackathon Oct 16-17th 2014

Author: Juha-Matti Santala ([@hamatti](http://twitter.com/hamatti))

![jeopardy](http://hamatti.org/geoparty.png)
## Introduction

This game is a little fun hackathon project inspired by love for Jeopardy. I wanted to do something with Node.js since I mostly hack around with Python.

Game supports up to 3 players per game (can be increased in `main.js`).


## Installation

Clone the repo

`$ git clone https://github.com/Hamatti/geoparty.git`

Install dependencies

`$ npm install`

Run 

`$ npm main.js`

## Generating more questionsets

*HOX requires [jq](http://stedolan.github.io/jq/)*

In `bin/` is a file `create_questions.sh` that takes a show number as a parameter and creates a subset to run against.

`$ cd bin`

`$ ./create_questions.sh 4000` creates a subset from episode 4000.



