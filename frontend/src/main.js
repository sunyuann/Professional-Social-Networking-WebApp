import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

///////////////
// Functions //
///////////////
const errorShow = (content) => {
  document.getElementById("error-popup").classList.remove("hide");
  document.getElementById("error-content").textContent = content;
};

const isUserLoggedIn = () => {
  return false;
};

const show = (element) => {
  document.getElementById(element).classList.remove("hide");
};
const hide = (element) => {
  document.getElementById(element).classList.add("hide");
};

const populateFeed = () => {
  apiCall("job/feed", "GET", { start: 0 }, (data) => {
    const baseFeedItem = document.getElementById("feed-item");
    // Sort recent jobs first
    data.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    for (const feedItem of data) {
      const feedDom = baseFeedItem.cloneNode(true);
      // Remove ID and hide class
      feedDom.removeAttribute("id");
      feedDom.classList.remove("hide");
      // Update fields
      feedDom.querySelector(".feed-image").innerText = feedItem.image;
      feedDom.querySelector(".feed-title").innerText = feedItem.title;
      feedDom.querySelector(".feed-start").innerText = feedItem.start;
      feedDom.querySelector(".feed-description").innerText =
        feedItem.description;
      feedDom.querySelector(".feed-likes").innerText =
        "Likes: " + feedItem.likes.length;
      feedDom.querySelector(".feed-comments").innerText =
        "Comments: " + feedItem.comments.length;
      // Fetch creator name and update
      getUserDetails(feedItem.creatorId)
        .then((creator) => {
          feedDom.querySelector(".feed-creator").innerText = creator.name;
        })
        .catch((error) => {
          console.log("TODO populateFeed getUserDetails ERROR! ", error);
        });
      // Update job created string
      let createStr = feedItem.createdAt.split("T")[0];
      const [hours, minutes] = getHoursMinutesSince(feedItem.createdAt);
      if (hours < 24) {
        createStr = `${hours} hours, ${minutes} minutes ago`;
      }
      feedDom.querySelector(".feed-created").innerText = createStr;
      // Put the thing in the thing
      document.getElementById("feed-items").appendChild(feedDom);
    }
    console.log("data", data);
  });
};

const setToken = (token) => {
  localStorage.setItem("token", token);
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed();
};

// api call function
const apiCall = (path, method, body, success) => {
  const options = {
    method: method,
    headers: {
      "Content-type": "application/json",
    },
  };
  if (method === "GET") {
    path += "?";
    for (const key in body) {
      path += key + "=" + body[key] + "&";
    }
    path = path.substring(0, path.length - 1);
  } else {
    options.body = JSON.stringify(body);
  }
  if (localStorage.getItem("token")) {
    options.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  }

  fetch("http://localhost:5005/" + path, options).then((response) => {
    response.json().then((data) => {
      if (data.error) {
        errorShow(data.error);
      } else {
        if (success) {
          success(data);
        }
      }
    });
  });
};

const getUserDetails = (userId) => {
  return new Promise((resolve, reject) => {
    apiCall("user", "GET", { userId: userId }, (data) => {
      resolve(data);
    });
  });
};

// Returns [hours, minutes] where hours and minutes are ints
const getHoursMinutesSince = (datetimestr) => {
  const ms = new Date() - new Date(datetimestr);
  let minutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes - hours * 60;
  return [hours, minutes];
};

////////////////////////////////
// Add .addEventListener here //
////////////////////////////////

// Login page, login button
document.getElementById("login-login").addEventListener("click", () => {
  // login
  const payload = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value,
  };
  apiCall("auth/login", "POST", payload, (data) => {
    setToken(data.token);
  });
});

// Login page, toggle show/hide passwords (optional??)
document.getElementById("login-show-password").addEventListener("click", () => {
  var login_password = document.getElementById("login-password");
  if (login_password.type === "password") {
    login_password.type = "text";
  } else {
    login_password.type = "password";
  }
});

// Register page, register button
document.getElementById("register-register").addEventListener("click", () => {
  const registerPassword = document.getElementById("register-password").value;
  const registerPasswordConfirm = document.getElementById(
    "register-password-confirm"
  ).value;
  // different password error checking
  if (registerPassword !== registerPasswordConfirm) {
    errorShow("Passwords do not match!");
    return;
  }
  // hide error if passwords match

  hide("error-popup");
  // register
  const payload = {
    email: document.getElementById("register-email").value,
    password: document.getElementById("register-password").value,
    name: document.getElementById("register-name").value,
  };
  apiCall("auth/register", "POST", payload, (data) => {
    setToken(data.token);
  });
  //document.getElementById("register-form").submit();
});

// Error popup, close button
document.getElementById("error-close").addEventListener("click", () => {
  hide("error-popup");
});

// Navbar register, show register page
document.getElementById("nav-register").addEventListener("click", () => {
  show("page-register");
  hide("page-login");
});

// Login register, show login page
document.getElementById("nav-login").addEventListener("click", () => {
  show("page-login");
  hide("page-register");
});

// if token does not exist, display logged out section
document.getElementById("logout").addEventListener("click", () => {
  show("section-logged-out");
  hide("section-logged-in");
  localStorage.removeItem("token");
});

document.getElementById("create-job-fake").addEventListener("click", () => {
  const payload = {
    title: "TETS",
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
    start: "2011-10-05T14:48:00.000Z",
    description:
      "Dedicated technical wizard with a passion and interest in human relationships",
  };
  apiCall("job", "POST", payload);
});

////////////////
// Main logic //
////////////////
if (localStorage.getItem("token")) {
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed();
  console.log(localStorage.getItem("token"));
}
