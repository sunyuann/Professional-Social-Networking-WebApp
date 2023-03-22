// A helper you may want to use when uploading new images to the server.
import {
  fileToDataUrl,
  apiCall,
  clearChildren,
  cloneNode,
  getHoursMinutesSince,
  getUserDetails,
  errorShow,
} from "./helpers.js";

///////////////
// Functions //
///////////////

const show = (element) => {
  document.getElementById(element).classList.remove("hide");
};
const hide = (element) => {
  document.getElementById(element).classList.add("hide");
};

const createJobElement = (jobDetail, isJob = false) => {
  const baseFeedItem = document.getElementById("feed-item");
  const feedDom = cloneNode(baseFeedItem);
  // Update fields
  feedDom.querySelector(".feed-image").innerText = jobDetail.image;
  feedDom.querySelector(".feed-title").innerText = jobDetail.title;
  feedDom.querySelector(".feed-start").innerText = jobDetail.start;
  feedDom.querySelector(".feed-description").innerText = jobDetail.description;
  feedDom.querySelector(".feed-likes").innerText =
    "Likes: " + jobDetail.likes.length;
  // get liked list
  const likedList = feedDom.querySelector(".feed-likes-list");
  let likeStart = "";
  if (jobDetail.likes.length === 0) {
    likeStart += "Liked by no one";
  } else {
    likeStart += "Liked by ";
    const likeName = feedDom.querySelector(".feed-likes-name");
    const likeSep = feedDom.querySelector(".feed-likes-sep");
    // Add the list
    for (const i in jobDetail.likes) {
      if (i > 0) {
        const dupSep = cloneNode(likeSep);
        likedList.appendChild(dupSep);
      }
      const dupName = cloneNode(likeName);
      dupName.innerText = jobDetail.likes[i].userName;
      dupName.addEventListener("click", () => {
        showProfile(jobDetail.likes[i].userId);
      });
      likedList.appendChild(dupName);
    }
  }
  feedDom.querySelector(".feed-likes-start").innerText = likeStart;
  // toggling show and hide feed likes list
  feedDom.querySelector(".feed-likes").addEventListener("click", () => {
    if (likedList.classList.contains("hide")) {
      likedList.classList.remove("hide");
    } else {
      likedList.classList.add("hide");
    }
  });

  let likeButtonTurnOn = true;
  // console.log(jobDetail.likes[0].userId);
  for (var i = 0; i < jobDetail.likes.length; i++) {
    if (jobDetail.likes[0].userId === 65687) {
      likeButtonTurnOn = false;
    }
  }
  if (likeButtonTurnOn) {
    feedDom.querySelector(".feed-like-button").value = "Like";
  } else {
    feedDom.querySelector(".feed-like-button").value = "Unlike";
  }
  likeButtonTurnOn = !likeButtonTurnOn;
  // like button
  feedDom
    .querySelector(".feed-like-button")
    .setAttribute("id", "feed-like-button_" + jobDetail.id);
  feedDom.querySelector(".feed-like-button").addEventListener("click", () => {
    // like/dislike button
    const payload = {
      id: jobDetail.id,
      turnon: !likeButtonTurnOn,
    };
    apiCall("job/like", "PUT", payload, () => {});
    if (likeButtonTurnOn) {
      feedDom.querySelector(".feed-like-button").value = "Like";
    } else {
      feedDom.querySelector(".feed-like-button").value = "Unlike";
    }
    likeButtonTurnOn = !likeButtonTurnOn;
  });

  feedDom.querySelector(".feed-comments").innerText =
    "Comments: " + jobDetail.comments.length;
  // get comment list
  const commentsList = feedDom.querySelector(".feed-comments-list");
  let commentStart = "";
  if (jobDetail.comments.length === 0) {
    commentStart += "No comments yet";
  } else {
    const commentItem = feedDom.querySelector(".feed-comments-item");
    // Add the list
    for (const com of jobDetail.comments) {
      const dupCom = cloneNode(commentItem);
      const dupName = dupCom.querySelector(".feed-comments-name");
      const dupComment = dupCom.querySelector(".feed-comments-comment");
      dupName.innerText = com.userName;
      dupComment.innerText = com.comment;
      dupName.addEventListener("click", () => {
        showProfile(com.userId);
      });
      commentsList.appendChild(dupCom);
    }
  }
  feedDom.querySelector(".feed-comments-start").innerText = commentStart;
  // toggling show and hide feed comments list
  feedDom.querySelector(".feed-comments").addEventListener("click", () => {
    if (commentsList.classList.contains("hide")) {
      commentsList.classList.remove("hide");
    } else {
      commentsList.classList.add("hide");
    }
  });

  // post comment
  const feedComment = feedDom.querySelector(".feed-comment");
  feedDom
    .querySelector(".feed-comment-button")
    .addEventListener("click", () => {
      // post comment button
      if (feedComment.value !== "") {
        const payload = {
          id: jobDetail.id,
          comment: feedComment.value,
        };
        apiCall("job/comment", "POST", payload, () => {
          feedComment.value = "";
        });
        hide("error-popup");
      } else {
        // case if comment box empty
        errorShow("Comment can't be empty, please try again.");
      }
    });

  // Fetch creator name and update
  getUserDetails(jobDetail.creatorId)
    .then((creator) => {
      feedDom.querySelector(".feed-creator").innerText = creator.name;
      feedDom.querySelector(".feed-creator").addEventListener("click", () => {
        showProfile(jobDetail.creatorId);
      });
    })
    .catch((error) => {
      console.log("TODO populateFeed getUserDetails ERROR! ", error);
    });
  // Update job created string
  let createStr = jobDetail.createdAt.split("T")[0];
  const [hours, minutes] = getHoursMinutesSince(jobDetail.createdAt);
  if (hours < 24) {
    createStr = `${hours} hours, ${minutes} minutes ago`;
  }
  feedDom.querySelector(".feed-created").innerText = createStr;

  if (isJob) {
    feedDom.querySelector(".jobs-update-delete").classList.remove("hide");
  }
  return feedDom;
};

const populateFeed = () => {
  apiCall("job/feed", "GET", { start: 0 }, (data) => {
    // Sort recent jobs first
    data.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    for (const feedItem of data) {
      const feedDom = createJobElement(feedItem);
      // Put the thing in the thing
      document.getElementById("feed-items").appendChild(feedDom);
    }
    console.log("data", data);
  });
};

const showProfile = (userId) => {
  hideAll();
  const btn = document.getElementById("profile-edit");
  if (userId === localStorage.getItem("userId")) {
    btn.classList.remove("hide");
  } else {
    btn.classList.add("hide");
  }
  // Populate page-profile
  getUserDetails(userId)
    .then((user) => {
      const pp = document.getElementById("page-profile");
      pp.querySelector("#profile-userid").innerText = user.id;
      pp.querySelector("#profile-email").innerText = user.email;
      pp.querySelector("#profile-name").innerText = user.name;
      pp.querySelector("#profile-image").innerText = user.image;
      // Watch list
      const watchList = pp.querySelector("#profile-watched-list");
      const watchStart = pp.querySelector("#profile-watched-start");
      const watchName = pp.querySelector(".profile-watched-name");
      const watchSep = pp.querySelector(".profile-watched-sep");
      let watchString = `Watched by ${user.watcheeUserIds.length} users`;
      watchString += `${user.watcheeUserIds.length > 0 ? ": " : "."}`;
      watchStart.innerText = watchString;
      clearChildren(watchList);
      watchList.append(watchStart);
      for (const i in user.watcheeUserIds) {
        const watcheeId = user.watcheeUserIds[i];
        if (i > 0) {
          const dupSep = cloneNode(watchSep);
          watchList.appendChild(dupSep);
        }
        const dupName = cloneNode(watchName);
        getUserDetails(watcheeId)
          .then((watchee) => {
            dupName.innerText = watchee.name;
          })
          .catch((error) => {
            console.log(
              `TODO showProfile getUserDetails forloop ${watcheeId} ERROR!`,
              error
            );
          });
        dupName.addEventListener("click", () => {
          showProfile(watcheeId);
        });
        watchList.appendChild(dupName);
      }
      // Jobs list
      const jobs = pp.querySelector("#profile-jobs");
      if (user.jobs.length === 0) {
        jobs.innerText = "No jobs.";
      } else {
        jobs.innerText = "Jobs:";
        // Most recent first
        user.jobs.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        for (const job of user.jobs) {
          const jobDom = createJobElement(job, true);
          jobs.appendChild(jobDom);
        }
      }
    })
    .catch((error) => {
      console.log("TODO showProfile getUserDetails ERROR! ", error);
    });
  show("page-profile");
};

const updateProfile = () => {
  getUserDetails(localStorage.getItem("userId"))
    .then((user) => {
      const pu = document.getElementById("page-profile-update");
      pu.querySelector("#update-email").value = user.email;
      pu.querySelector("#update-name").value = user.name;
    })
    .catch((error) => {
      console.log("TODO showProfile getUserDetails ERROR! ", error);
    });
};

// Hides all pages
const hideAll = () => {
  hide("page-job-feed");
  hide("page-job-post");
  hide("page-profile");
  hide("page-profile-update");
  hide("error-popup");
};

// Save token and userId
const setToken = (token, userId) => {
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed();
  updateProfile();
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
    setToken(data.token, data.userId);
    hide("error-popup");
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
    setToken(data.token, userId);
  });
  //document.getElementById("register-form").submit();
});

// Error popup, close button
document.getElementById("error-close").addEventListener("click", () => {
  hide("error-popup");
});

// Navbar register, show register page
// document.getElementById("nav-register").addEventListener("click", () => {
//   show("page-register");
//   hide("page-login");
// });

// Navbar login, show login page
// document.getElementById("nav-login").addEventListener("click", () => {
//   show("page-login");
//   hide("page-register");
// });

// Navbar Job Feed, show job feed page
document.getElementById("nav-job-feed").addEventListener("click", () => {
  hideAll();
  show("page-job-feed");
});

// Navbar Create Job, show job post page
document.getElementById("nav-job-post").addEventListener("click", () => {
  hideAll();
  show("page-job-post");
});

// Navbar Me, show your profile page
document.getElementById("nav-profile-me").addEventListener("click", () => {
  showProfile(localStorage.getItem("userId"));
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

// logout button
document.getElementById("logout").addEventListener("click", () => {
  show("section-logged-out");
  hide("section-logged-in");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
});

// creating job
document.getElementById("create-job").addEventListener("click", () => {
  const title = document.getElementById("job-post-title").value;
  const description = document.getElementById("job-post-description").value;
  // error checking
  if (title === "") {
    errorShow("Please enter a title");
    return;
  } else if (document.querySelector("#job-post-image").files.length === 0) {
    errorShow("Please upload an image");
    return;
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
        start: new Date().toISOString(),
        description: description,
      };
      apiCall("job", "POST", payload, () => {
        document.getElementById("job-post-title").value = "";
        document.getElementById("job-post-description").value = "";
        document.getElementById("job-post-image").value = "";
      });
      hide("error-popup");
    })
    .catch((error) => {
      console.log("Image not found", error);
    });
});

// Page update profile
document.getElementById("profile-edit").addEventListener("click", () => {
  if (localStorage.getItem("userId")) {
    hideAll();
    show("page-profile-update");
  } else {
    errorShow("You're not logged in");
  }
});

// Update profile
document.getElementById("update-profile").addEventListener("click", () => {
  const passwordDom = document.getElementById("update-password");
  const imageDom = document.getElementById("update-image");
  const payload = {};
  if (passwordDom.value.length > 0) {
    payload.password = passwordDom.value;
  }
  getUserDetails(localStorage.getItem("userId"))
    .then((user) => {
      const updateEmail = document.getElementById("update-email");
      const updateName = document.getElementById("update-name");
      if (updateEmail.value !== user.email) {
        payload.email = updateEmail.value;
      }
      if (updateName.value !== user.name) {
        payload.name = updateName.value;
      }
      const upload = (payload) => {
        apiCall("user", "PUT", payload, () => {
          hideAll();
          showProfile(localStorage.getItem("userId"));
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
    })
    .catch((error) => {
      console.log("TODO getUserDetails update profile ERROR! ", error);
    });
});

////////////////
// Main logic //
////////////////
if (localStorage.getItem("token") && localStorage.getItem("userId")) {
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed();
  updateProfile();
  console.log(localStorage.getItem("token"));
}
const curr_date = new Date();
console.log(new Date().toISOString());
