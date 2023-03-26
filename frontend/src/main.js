// A helper you may want to use when uploading new images to the server.
import {
  fileToDataUrl,
  apiCall,
  errorShow,
  getUserDetails,
  getUserId,
  isViewAtBottom,
  throttle,
} from "./helpers.js";
import {
  populateFeed,
  getCurrentFeedIndex,
  clearPolls,
  getPopulateDone,
  setPopulateDone,
} from "./feed.js";
import { watchClick, showProfile } from "./profile.js";

///////////////
// Functions //
///////////////

export const show = (element) => {
  document.getElementById(element).classList.remove("hide");
};
export const hide = (element) => {
  document.getElementById(element).classList.add("hide");
};

// Hides all pages
export const hideAll = () => {
  hide("page-job-feed");
  hide("page-job-post");
  hide("page-profile");
  hide("page-profile-update");
  hide("error-popup");
};

// active is the id
const setActiveNav = (active) => {
  document.getElementById("nav-job-post").classList.remove("active");
  document.getElementById("nav-job-feed").classList.remove("active");
  document.getElementById("nav-profile-me").classList.remove("active");
  document.getElementById(active).classList.add("active");
};

const showFeedPage = () => {
  hideAll();
  show("page-job-feed");
  setActiveNav("nav-job-feed");
  populateFeed(0, true);
};

const doUserLoginActions = () => {
  show("section-logged-in");
  hide("section-logged-out");
  showFeedPage();
  // Check browser supports notifications
  if ("Notification" in window) {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        notificationGranted = true;
      } else {
        console.log("Note to marker: notification permission is not granted.");
      }
    });
  }
};

// Save token and userId
const setToken = (token, userId) => {
  setPopulateDone(false);
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
  doUserLoginActions();
};

////////////////////////////////
// Add .addEventListener here //
////////////////////////////////

// Login page email input, pressing enter
document.getElementById("login-email").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    document.getElementById("login-password").focus();
  }
});

// Login page password input, pressing enter
document
  .getElementById("login-password")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("login-login").click();
    }
  });

// Login page, toggle show/hide passwords
document.getElementById("login-show-password").addEventListener("click", () => {
  var login_password = document.getElementById("login-password");
  if (login_password.type === "password") {
    login_password.type = "text";
  } else {
    login_password.type = "password";
  }
});

// Login page, login button
document.getElementById("login-login").addEventListener("click", () => {
  // login
  const payload = {
    email: document.getElementById("login-email").value,
    password: document.getElementById("login-password").value,
  };
  apiCall("auth/login", "POST", payload, (data) => {
    setToken(data.token, data.userId);
  });
});

// Register page name input, pressing enter
document
  .getElementById("register-name")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("register-email").focus();
    }
  });

// Register page email input, pressing enter
document
  .getElementById("register-email")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("register-password").focus();
    }
  });

// Register page password input, pressing enter
document
  .getElementById("register-password")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("register-password-confirm").focus();
    }
  });

// Register page password confirm input, pressing enter
document
  .getElementById("register-password-confirm")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("register-register").click();
    }
  });

// Register page, register button
document.getElementById("register-register").addEventListener("click", () => {
  const password = document.getElementById("register-password");
  const passwordConfirm = document.getElementById("register-password-confirm");
  // different password error checking
  if (password.value !== passwordConfirm.value) {
    errorShow("Passwords do not match!");
    return;
  }
  // hide error if passwords match
  hide("error-popup");
  // register
  const email = document.getElementById("register-email");
  const name = document.getElementById("register-name");
  const payload = {
    email: email.value,
    password: password.value,
    name: name.value,
  };
  apiCall("auth/register", "POST", payload, (data) => {
    setToken(data.token, data.userId);
    password.value = "";
    passwordConfirm.value = "";
    email.value = "";
    name.value = "";
    show("page-login");
    hide("page-register");
  });
});

// Error popup, close button
document.getElementById("error-close").addEventListener("click", () => {
  hide("error-popup");
});

// Navbar Job Feed, show job feed page
document
  .getElementById("nav-job-feed")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      showFeedPage();
    }
  });
document.getElementById("nav-job-feed").addEventListener("click", () => {
  showFeedPage();
});

// Navbar Create Job, show job post page
const navSwitchCreateJob = () => {
  hideAll();
  show("page-job-post");
  setActiveNav("nav-job-post");
  document.getElementById("job-post-title").focus();
};
document
  .getElementById("nav-job-post")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      navSwitchCreateJob();
    }
  });
document.getElementById("nav-job-post").addEventListener("click", () => {
  navSwitchCreateJob();
});

// Navbar Me, show your profile page
const navSwitchShowMe = () => {
  showProfile(getUserId());
  setActiveNav("nav-profile-me");
};
document
  .getElementById("nav-profile-me")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      navSwitchShowMe();
    }
  });
document.getElementById("nav-profile-me").addEventListener("click", () => {
  navSwitchShowMe();
});

// Register page, login button
document.getElementById("register-login").addEventListener("click", () => {
  // show register page, hide login page
  show("page-login");
  hide("page-register");
});

// Login page, register button
document.getElementById("login-register").addEventListener("click", () => {
  // show register page, hide login page
  show("page-register");
  hide("page-login");
});

// nav logout button
document.getElementById("nav-logout").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    show("logout-popup");
  }
});
document.getElementById("nav-logout").addEventListener("click", () => {
  show("logout-popup");
});

// logout button
document.getElementById("logout").addEventListener("click", () => {
  clearPolls();
  show("section-logged-out");
  hide("section-logged-in");
  hide("logout-popup");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
});

// logout close button
document.getElementById("logout-close").addEventListener("click", () => {
  hide("logout-popup");
});

// Create job title input, when Enter pressed
document
  .getElementById("job-post-title")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("job-post-image").focus();
      document.getElementById("job-post-image").click();
    }
  });

// Create job image input, when image selected
document
  .getElementById("job-post-image")
  .addEventListener("change", (event) => {
    if (event.target.files.length > 0) {
      document.getElementById("job-post-start-date").focus();
    }
  });

// Create job start date input, when Enter pressed
document
  .getElementById("job-post-start-date")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("job-post-start-time").focus();
    }
  });

// Create job start time input, when Enter pressed
document
  .getElementById("job-post-start-time")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("job-post-description").focus();
    }
  });

// Create job description input, when Enter pressed
document
  .getElementById("job-post-description")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("create-job").click();
    }
  });

// creating job
document.getElementById("create-job").addEventListener("click", () => {
  const title = document.getElementById("job-post-title").value;
  const description = document.getElementById("job-post-description").value;
  const startDate = document.getElementById("job-post-start-date").value;
  const startTime = document.getElementById("job-post-start-time").value;
  // error checking
  if (title === "") {
    errorShow("Please enter a title");
    return;
  } else if (document.querySelector("#job-post-image").files.length === 0) {
    errorShow("Please upload an image");
    return;
  } else if (startDate === "") {
    errorShow("Please select a date");
  } else if (startTime === "") {
    errorShow("Please select a time");
  } else if (description === "") {
    errorShow("Please enter a description");
    return;
  }

  // convert to base64, then create job
  const image_file = document.querySelector("#job-post-image").files[0];
  fileToDataUrl(image_file)
    .then((image) => {
      const payload = {
        title: title,
        image: image,
        start: new Date(`${startDate}T${startTime}`).toISOString(),
        description: description,
      };
      apiCall("job", "POST", payload, () => {
        document.getElementById("job-post-title").value = "";
        document.getElementById("job-post-image").value = "";
        document.getElementById("job-post-start-date").value = "";
        document.getElementById("job-post-start-time").value = "09:00";
        document.getElementById("job-post-description").value = "";
      });
      hide("error-popup");
    })
    .catch((error) => {
      console.log("Image not found", error);
    });
});

// Click edit profile
document.getElementById("profile-edit").addEventListener("click", () => {
  if (getUserId()) {
    hideAll();
    show("page-profile-update");
  } else {
    errorShow("You're not logged in");
  }
});

// Save update profile
document.getElementById("update-profile").addEventListener("click", () => {
  const passwordDom = document.getElementById("update-password");
  const imageDom = document.getElementById("update-image");
  const payload = {};
  if (passwordDom.value.length > 0) {
    payload.password = passwordDom.value;
  }
  // Error if update to same email, so exclude from payload if same
  getUserDetails(getUserId()).then((user) => {
    const updateEmail = document.getElementById("update-email");
    const updateName = document.getElementById("update-name");
    if (updateEmail.value !== user.email) {
      payload.email = updateEmail.value;
    }
    if (updateName.value !== user.name) {
      payload.name = updateName.value;
    }
    // Do this function right at the end
    const upload = (payload) => {
      apiCall("user", "PUT", payload, () => {
        hideAll();
        showProfile(getUserId());
      });
    };
    if (imageDom.files.length > 0) {
      fileToDataUrl(imageDom.files[0])
        .then((image) => {
          payload.image = image;
          upload(payload);
        })
        .catch((error) => {
          errorShow("Provided profile image is not a png, jpg or jpeg.");
          imageError = true;
        });
    } else {
      upload(payload);
    }
  });
});

// Update profile cancel
document
  .getElementById("update-profile-cancel")
  .addEventListener("click", () => {
    hideAll();
    showProfile(getUserId());
  });

// Watch email input, when Enter pressed
document
  .getElementById("watch-search-email")
  .addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      document.getElementById("btn-watch-search").click();
    }
  });

// Watch email button on feed page
document.getElementById("btn-watch-search").addEventListener("click", () => {
  const emailNode = document.getElementById("watch-search-email");
  watchClick(emailNode.value, true, null);
  emailNode.value = "";
});

// Refresh job feed
document.getElementById("feed-refresh").addEventListener("click", () => {
  populateFeed(0, true);
});

// Scrolling
const throttledScroll = throttle(() => {
  if (getPopulateDone()) {
    populateFeed(getCurrentFeedIndex(), false);
  }
}, 500);
window.addEventListener("scroll", () => {
  if (isViewAtBottom() && getUserId()) {
    throttledScroll();
  }
});

////////////////
// Main logic //
////////////////

// Whether notification permission has been granted, asked on user log in
var notificationGranted = false;
export const getNotificationGranted = () => {
  return notificationGranted;
};
if (localStorage.getItem("token") && getUserId()) {
  doUserLoginActions();
  console.log("Token: ", localStorage.getItem("token"));
}
