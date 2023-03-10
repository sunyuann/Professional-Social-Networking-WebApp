import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

///////////////
// Functions //
///////////////
const loginShow = () => {
  document.getElementById("login-screen").style.display = "block";
};
const loginHide = () => {
  document.getElementById("login-screen").style.display = "none";
};
const registerShow = () => {
  document.getElementById("register-screen").style.display = "block";
};
const registerHide = () => {
  document.getElementById("register-screen").style.display = "none";
};
const errorShow = (content) => {
  document.getElementById("error-popup").style.display = "block";
  document.getElementById("error-content").textContent = content;
};
const errorHide = () => {
  document.getElementById("error-popup").style.display = "none";
};

const isUserLoggedIn = () => {
  return false;
};

////////////////
// Main logic //
////////////////
console.log("Let's go!");

if (!isUserLoggedIn()) {
  loginShow();
}

////////////////////////////////
// Add .addEventListener here //
////////////////////////////////
// Login screen, login button
document.getElementById("login-login").addEventListener("click", () => {
  loginHide();
  // TODO
});
// Login screen, register button
document.getElementById("login-register").addEventListener("click", () => {
  loginHide();
  registerShow();
});

// Register screen, register button
document.getElementById("register-register").addEventListener("click", () => {
  const pass1 = document.getElementById("register-password").value;
  const pass2 = document.getElementById("register-password-confirm").value;
  if (pass1 !== pass2) {
    errorShow("Passwords do not match!");
    return;
  }
  document.getElementById("register-form").submit();
});
// Register screen, back button
document.getElementById("register-back").addEventListener("click", () => {
  registerHide();
  loginShow();
});

// Error popup, close button
document.getElementById("error-close").addEventListener("click", () => {
  errorHide();
});
