const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
const app = express();
admin.initializeApp();
const firebase = require('firebase');
const db = admin.firestore();

const firebaseConfig = {
    apiKey: "AIzaSyB7oXuxKOF07QAN9J2pVGIjNGa8EAS5pcg",
    authDomain: "final-project-social-med-2021.firebaseapp.com",
    databaseURL: "https://final-project-social-med-2021-default-rtdb.firebaseio.com",
    projectId: "final-project-social-med-2021",
    storageBucket: "final-project-social-med-2021.appspot.com",
    messagingSenderId: "619389954602",
    appId: "1:619389954602:web:33868edb9eced78f3ab153",
    measurementId: "G-WMBQBFMJEH"
  };

firebase.initializeApp(firebaseConfig);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

app.get('/screams', (req,res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                // FUNCTION THAT RETURN DATA FROM THE DOCUMENT
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(screams);
        })
        .catch((err) => console.error(err));
    });

app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db
    .collection('screams')
    .add(newScream)
    .then(doc => {
        res.json({message: `document ${doc.id} created succefully`});
    })
    .catch(err => {
        res.status(500).json({ error: 'something went wrong'});
        console.error(err);
    });
});

// HELPER FUNCTIONS
const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

// SIGNUP ROUTE
app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};
    if(isEmpty(newUser.email)) {
        errors.email = 'Must not be empty'
    } else if(!isEmail(newUser.email)) {
        errors.email = 'Must use a valid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';
// CHECK FOR ERRORS
    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

//VALIDATE DATA
let token, userId;
db.doc(`/users/${newUser.handle}`).get()
    .then((doc) => {
        if(doc.exists){
            return res.status(400).json({ handle: 'This handle is already taken'});
        } else {
            return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then((data) => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idToken) => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({ token });
    })
    .catch (err => {
        console.error(err);
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({ email: 'Email is already in use'});
        } else {
            return res.status(500).json({ error: err.code});
        }
    });
});


exports.api = functions.region('us-east4').https.onRequest(app);