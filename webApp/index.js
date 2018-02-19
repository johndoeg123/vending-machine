var candyCounter, myFirebaseRef, name1, password;

const firebaseConfig = {
    apiKey: "AIzaSyAajz2yx8UHVzy-oXudHYYVR7bg4g6XbuE",
    authDomain: "iotapp-14c09.firebaseapp.com",
    databaseURL: "https://iotapp-14c09.firebaseio.com",
    projectId: "iotapp-14c09",
    storageBucket: "iotapp-14c09.appspot.com",
    messagingSenderId: "353876118400"
};

firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged((user) => {
    if (user != null) {
        myFirebaseRef = firebase.database().ref(`user/${user.uid}/device-VendingMachine`);
        init();
        document.getElementById('login').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'block';
    }
    else {
        document.getElementById('login').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'none';
    }
});

window.addEventListener('load', () => {
    candyCounter = document.getElementById('candiesCounter');
    name1 = document.getElementById('name');
    password = document.getElementById('password');
    candiesCounter.innerHTML = '<h1> -- </h1>';
    connectFirebase();
})

function connectFirebase() {
    // sign in to firebase
    firebase.auth().signInWithEmailAndPassword(name1.value, password.value).then(() => {
        console.log('Connected...');
    }).catch((error) => {
        // Handle Errors
        console.log(error.code + ' : ' + error.message);
    });
}

function init() {
    myFirebaseRef.child('VendingMachineData/candies').on('value', (snap) => {
        candiesCounter.innerHTML = '<h1>' + snap.val() + ' </h1>';
    })
}

function blinkLight() {
    myFirebaseRef.child('VendingMachineActions/blinkLight').set(true);
}

function spendCandy() {
    myFirebaseRef.child('VendingMachineActions/spendCandy').set(true);
}

function logout() {
    firebase.auth().signOut();
}