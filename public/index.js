// load socket.io-client and connect to the host that serves the page
var socket = io({ autoConnect: true, reconnection: true });

var selectedPort;
var portsList;
var ports = null;
var color, brightness, lightbox, servoSlider, servoText, candiesCounter;

// after page load
//
window.addEventListener("load", () => {

    lightbox = document.getElementById("light");
    servoSlider = document.getElementById("servoSlider");
    servoText = document.getElementById('servoText');
    color = document.getElementById('color');
    brightness = document.getElementById('brightness');
    portsList = document.getElementById('ports');
    candiesCounter = document.getElementById('candiesCounter');

    // add Event listeners to HTML Elements and emit Socket events to Server
    //
    color.addEventListener('change', (color) => {
        socket.emit('color', color.target.value);
    });

    brightness.addEventListener('change', (brightness) => {
        socket.emit('brightness', brightness.target.value);
    })

    lightbox.addEventListener("change", (checkbox) => {
        socket.emit("light", Number(checkbox.target.checked));
    });

    servoSlider.addEventListener('change', (slider) => {
        var value = slider.target.value;
        servoText.value = value;
        socket.emit('servo', value);
    })

    servoText.addEventListener('change', (text) => {
        var value = text.target.value;
        servoSlider.value = value;
        socket.emit('servo', value);
    })

    portsList.addEventListener('change', (list) => {
        selectedPort = list.target.value;
        // console.log(selectedPort);
        //console.log(ports.find(findPort));
    })
});


// Handle Socket Connection, set HTML Elements based on incoming Socket Data from Server and push Status back to Server
//
socket.on('color', (data) => {
    color.value = data;
    socket.emit('color', data);
})

socket.on('brightness', (data) => {
    brightness.value = data;
    socket.emit('brightness', data);
})

socket.on('light', (data) => {
    lightbox.checked = data;
    socket.emit("light", data);
});

socket.on('servo', (data) => {
    servoSlider.value = data;
    servoText.value = data;
    socket.emit('servo', data);
})

socket.on('candiesCount', (data) => {
    candiesCounter.innerHTML = '<h4>' + data + ' candies consumed</h4>';
})

socket.on('reset', () => {
    reset();
})

socket.on('reconnect_attempt'), () => {
    // console.log('reConnected');
}

socket.on('connect', () => {
    console.log('Connected');
});

socket.on('disconnect', () => {
    console.log('Disconnected');
    setTimeout(() => {
        console.log('try to reconnect...');
        socket.open();
    }, 5000);
});


// Handle Server Requests
//
function restart() {

    var request = new XMLHttpRequest();
    request.open('GET', '/restart', true);

    request.responseType = 'json';
    request.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

    request.onload = function () {
        console.log(request.statusText);
    }

    request.send();
}

function restartPort() {

    var request = new XMLHttpRequest();
    request.open('POST', '/restartPort', true);

    request.responseType = 'json';
    request.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

    request.onload = function () {
        // console.log(request.response);
    }
    request.send(JSON.stringify({ port: selectedPort }))
}

function getPorts() {

    // console.log('Get Ports...');

    var request = new XMLHttpRequest();

    request.open('GET', '/ports');
    request.responseType = 'json';

    request.onload = function () {

        ports = request.response;
        portsList.options.length = 0;

        ports.map((port) => {
            var option = document.createElement("option");
            option.value = port.comName;
            option.text = port.comName;
            portsList.appendChild(option);
        });
    }
    request.send();
}

function findPort(port) {
    return port.comName === selectedPort;
}

function reset() {
    socket.emit('reset');
    color.value = '#ff0000';
    lightbox.checked = false;
    brightness.value = 0;
    servoSlider.value = 0;
    servoText.value = 0;
}