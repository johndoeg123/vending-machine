const express = require('express');
const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, { 'multiplex': true });
const bodyParser = require('body-parser');
const serialport = require('serialport');
const vmBoard = require('./vending-machine.js');
const firebase = require('firebase');
const config = require('./config.js');
const log = require('./utils.js').log

var board = null;
var startArgument = process.argv[2];
var myFirebaseRef;

log("Starting Server...");

if (startArgument != undefined) {
  log('Start Arguments: ' + startArgument);
}


firebase.initializeApp(config.firebaseConfig);
myFirebaseRef = connectFirebase()
connectOnStart();

// point to static files in public dir
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// get index.html
//
app.get('/', (req, res, next, err) => {
  res.sendFile(__dirname + 'index.html');
})

// restart with Port
//
app.post('/restartPort', (req, res) => {

  res.setHeader('Content-Type', 'application/json');

  port = req.body.port
  log('Restart Port: ' + port);
  process.argv[2] = port;

  setTimeout(() => {
    process.on('exit', () => {
      require('child_process').spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit',
        shell: true
      });
    });
    process.exit();
  }, 1000);

  res.send(JSON.stringify({ done: 'done ' + port }));
})

// restart without Port
//
app.get('/restart', (req, res) => {

  res.setHeader('Content-Type', 'application/json');

  log('Restart');
  process.argv[2] = null;

  setTimeout(() => {
    process.on('exit', () => {
      require('child_process').spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit',
        shell: true
      });
    });
    process.exit();
  }, 1000);

  res.sendStatus(200);
})

// get all Ports and filter for Arduino
//
app.get('/ports', (req, res) => {

  // log('Get Ports...');

  serialport.list((err, ports) => {

    var ArduinoPorts = ports.map((port) => {

      if (typeof port.vendorId != 'undefined') {

        if (port.vendorId.includes('2341')) {
          return port;
        }
      } else return { comName: 'noArduino' }
    })

    res.send(JSON.stringify(ArduinoPorts));
  });
});

//start server
//
httpServer.listen(8080, () => {
  log('Server is listening on 8080...');
});

// Connect on Start based on Starting Method
//
function connectOnStart() {

  var portCOM;

  if (startArgument === undefined) {

    serialport.list((err, ports) => {

      ports.forEach((port) => {

        if (typeof port.vendorId != 'undefined') {

          if (port.vendorId.includes('2341')) {
            portCOM = port.comName;
            log('Your Board is on ' + portCOM)
            board = vmBoard.vendingMachineBoard(portCOM, myFirebaseRef, io);
          }
        }
      });
    });
  }
  else {

    portCOM = startArgument;
    log('Try starting Board on ' + portCOM);
    board = vmBoard.vendingMachineBoard(portCOM, myFirebaseRef, io);
  }
}

// Connect to Firebase
//
function connectFirebase() {

  // sign in to firebase
  firebase.auth().signInWithEmailAndPassword(config.secrets.userName, config.secrets.password).then(() => {
    log('Connected to Firebase');

  }).catch((error) => {
    // Handle Errors here
    log(error.code + ' : ' + error.message);
  });
  return firebase.database().ref();
}




