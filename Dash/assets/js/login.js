import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { j } from "./firebase-config.js";

const app = initializeApp(j);
const auth = getAuth(app);
const db = getDatabase(app);

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      localStorage.setItem("user", JSON.stringify(user.email));
      localStorage.setItem("datetime", new Date().toISOString());
      console.log("User signed in:", user);
      window.location.href = "index.html";
    })
    .catch((error) => {
      let message = "Error signing in.";
      if (error.code === "auth/wrong-password") {
        message = "Incorrect password. Please try again.";
      } else if (error.code === "auth/user-not-found") {
        message =
          "No user found with this email. Please check your email or sign up.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email format. Please enter a valid email.";
      } else if (error.code === "auth/too-many-requests") {
        message =
          "Too many unsuccessful login attempts. Please try again later.";
      }

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: message,
      });

      console.error("Error signing in:", error);
    });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out");
      document.getElementById("logoutBtn").style.display = "none";
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "An error occurred while trying to log out.",
        position: "center",
      });

      console.error("Error signing out:", error);
    });
});
