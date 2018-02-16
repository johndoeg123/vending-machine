var candyCounter, myFirebaseRef, name1, password;

const firebaseConfig = {
    
};

firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged((user) => {
    if (user != null) {
        myFirebaseRef = firebase.database().ref(`user/${user.uid}/device-VendingMachine`);
        init();
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
        console.log('Connected to Firebase...');
    }).catch((error) => {
        // Handle Errors here
        console.log(error.code + ' : ' + error.message);
    });
    // return firebase.database().ref();
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

function logout(){

    firebase.auth().signOut();
}