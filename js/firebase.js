import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import { getFirestore, collection, deleteField, onSnapshot, addDoc, getDocs, doc, getDoc, query, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import { getKey } from "./getapikey.js";



const firebaseApp = initializeApp({
    apiKey: getKey(),
    authDomain: "paper-dragons.firebaseapp.com",
    projectId: "paper-dragons",
    storageBucket: "paper-dragons.appspot.com",
    appId: "1:145134858362:web:25f8fd1666c89569d20bc3",
    messagingSenderId: "145134858362"
}, "Paper Dragons");

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const userLoginCallbacks = [];
const addLoginCallback = callback => userLoginCallbacks.push(callback);

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        console.log("User Signed In:", user.displayName);
        userLoginCallbacks.forEach(f => f());
        // ...
    } else {
        // User is signed out
        // ...
        console.log("No User Signed In");
    }
});



if (!auth.currentUser)
    getRedirectResult(auth)
    .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        const userDocRef = doc(db, "users", user.uid);
        console.log(user);
        getDoc(userDocRef)
            .then((userDocSnap) => {
                if (!userDocSnap.exists()) setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoUrl: user.photoURL,
                    admin: false,
                    homebrew: []
                });
            })
            .catch((error) => {
                console.error(error);
            });
        return result;

    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;

        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        //if (error.name == 'TypeError') signInWithRedirect(auth, provider);
    });

const provider = new GoogleAuthProvider();
auth.languageCode = 'it';
const logIn = () => {
    console.log("loging in...");
    if (auth.currentUser) return;
    signInWithRedirect(auth, provider);
}

const logOut = () => {
    signOut(auth)
        .then((result) => {})
        .catch((error) => console.log(error));
};
const docExists = async(docRef) => {
    return (await fsdbOps.getDoc(docRef)).exists();
}
const docData = async(docRef) => {
    return (await fsdbOps.getDoc(docRef)).data();
};

document.addEventListener('readystatechange', event => {
    document.querySelectorAll("button.login").forEach((button) => {
        button.addEventListener("click", logIn);
    });
    document.querySelectorAll("button.logout").forEach((button) => {
        button.addEventListener("click", logOut);
    });
});

const getTodoRef = () => { return doc(db, "users", auth.currentUser.uid, "plannerApp", "todo"); };
const getCalendarRef = () => { return doc(db, "users", auth.currentUser.uid, "plannerApp", "calendar"); };
const getDateRef = () => { return doc(db, "users", auth.currentUser.uid, "plannerApp", "date"); };

const reference = {};
addLoginCallback(() => {
    reference.todo = getTodoRef();
    reference.calendar = getCalendarRef();
    reference.date = getDateRef();
});
export { addLoginCallback, reference, deleteField, onSnapshot, getDoc, addDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove };