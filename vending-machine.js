const five = require("johnny-five");
const tweet = require('./tweet.js');
const log = require('./utils.js').log;
const events = require('events');

var resetEvent = new events.EventEmitter();
var servo, led, button, rgbLed;
var _myFirebaseRef, _board, _io, _port;

var boardStatus = {
  isActive: false,
  light: 0,
  servo: 0,
  color: '#ff0000',
  brightness: 0
}

var boardActions = {
  blinkLight: false,
  spendCandy: false
}

var boardData = {
  candies: 0
}


// main Function for Johnny Five
// 
function vendingMachineBoard(port, myFirebaseRef, io) {

  var inAction = false;

  _myFirebaseRef = myFirebaseRef;
  _myFirebaseRef.child('VendingMachineActions').set(boardActions);
  _port = port;
  _io = io;

  // new Board instance - look which Port is used
  //
  _board = new five.Board({
    id: 'VendingMachine',
    port: _port,
    debug: false,
    repl: false
  });

  // Board on close
  //
  _board.on('close', () => {
    log('Board closed!!!');
    myFirebaseRef.child('VendingMachine/isActive').set(false);
    _board.io.reset();
    _board = null;
    io.sockets.removeAllListeners();
  });

  // Board on Error
  //
  _board.on('error', (msg) => {
    log('ERROR: ' + msg);
  })

  // Exit Function
  //
  _board.on("exit", () => {
    log('Board Exit...');
    myFirebaseRef.child('VendingMachine/isActive').set(false);
    servo.min();
    led.off();
    rgbLed.off();
  });

  // Board Verbindung herstellen
  //
  _board.on('ready', () => {

    log("Board " + _board.id + " is ready!");

    servo = new five.Servo(10);
    led = five.Led(13);
    button = new five.Button(8);
    rgbLed = new five.Led.RGB({
      pins: {
        red: 3,
        green: 5,
        blue: 6
      }
    });

    resetBoardStatus();

    button.on('press', () => {

      if (inAction == false) {

        inAction = true;

        log('Button pressed...');

        servoKick().then(() => {
          blinkLight().then(() => {
            tweet.postTweet('Candy for Carmen :-)');
            resetEvent.emit('reset');
            countCandy();
            inAction = false;
          });
        });
      }
    });

    socket();
    firebaseActions();

  });
  return _board;
}


function countCandy() {
  _myFirebaseRef.child('VendingMachineData').once('value', (snap) => {
    try {
      boardData.candies = snap.val().candies + 1;
      _myFirebaseRef.child('VendingMachineData').transaction(boardData);
    }
    catch (err) {
      _myFirebaseRef.child('VendingMachineData').set(boardData);
    }
  });
}

// setting Actions triggerd bey Firebase from outside
//
function firebaseActions() {

  _myFirebaseRef.child('VendingMachineActions').on('value', (snap) => {

    snap.forEach((element) => {

      boardActions[element.key] = element.val();

      if (element.val() == true) {

        switch (element.key) {

          case 'blinkLight':
            log('Blink light was triggered from Firebase...');
            blinkLight().then(() => {
              tweet.postTweet('Carmen got a blinking light!');
              resetEvent.emit('reset');
            });
            boardActions.blinkLight = false;
            break;

          case 'spendCandy':
            log('Spend candy was triggered from Firebase...');
            servoKick().then(() => {
              blinkLight().then(() => {
                tweet.postTweet('Carmen was remembered to take a candy!');
                resetEvent.emit('reset');
                countCandy();
              });
            });
            boardActions.spendCandy = false;
            break;
        }
        _myFirebaseRef.child('VendingMachineActions').set(boardActions);
      }
    });
  })

}

// WebSocket Handling
// 
function socket() {

  _io.sockets.on('connection', (socket) => {

    log('Socket is established!');

    resetEvent.on('reset', () => {
      socket.emit('reset');
    })

    socket.on('light', (data) => {
      boardStatus.light = data;
      updateBoardStatus();
    });

    socket.on('servo', (data) => {
      boardStatus.servo = data;
      updateBoardStatus();
    });

    socket.on('color', (data) => {
      boardStatus.color = data;
      updateBoardStatus();
    });

    socket.on('brightness', (data) => {
      boardStatus.brightness = data;
      updateBoardStatus();
    });

    socket.on('reset', () => {
      resetBoardStatus();
    });

    // FireBase Reference Section only works on Socket Connection 
    // 
    _myFirebaseRef.child('VendingMachine').on('value', (snap) => {
      snap.forEach((element) => {
        boardStatus[element.key] = element.val()
        socket.emit(element.key, element.val())
      });
    });

    _myFirebaseRef.child('VendingMachineData/candies').on('value', (snap) => {
      socket.emit('candiesCount', snap.val())
    })
  });
}

// Upadte Board Status means updating all Actuators, Lights etc based on boardStatus Object 
// 
function updateBoardStatus() {

  servo.to(boardStatus.servo);
  rgbLed.color(boardStatus.color);
  rgbLed.intensity(boardStatus.brightness);
  if (boardStatus.light == 1) {
    rgbLed.on();
  }
  else {
    rgbLed.off();
  }
  _myFirebaseRef.child('VendingMachine').set(boardStatus);
}

// Reset Board Status 
//
function resetBoardStatus() {
  boardStatus.isActive = true;
  boardStatus.light = 0;
  boardStatus.servo = 0;
  boardStatus.color = '#ff0000';
  boardStatus.brightness = 0;
  updateBoardStatus();
}

// Kick the Servo out 
//
function servoKick() {
  return new Promise((resolve, reject) => {
    servo.max();
    _board.wait(1000, () => {
      servo.min();
      resolve(true);
    });
  })
}

// Blink the Light
//
function blinkLight() {
  return new Promise((resolve, reject) => {
    rgbLed.intensity(100);
    rgbLed.strobe(500);
    _board.wait(3000, () => {
      rgbLed.stop();
      rgbLed.off();
      resolve(true);
    });
  });
}



// Module Exports
//
module.exports.vendingMachineBoard = vendingMachineBoard;