// A helper you may want to use when uploading new images to the server.
import {
  fileToDataUrl,
  apiCall,
  clearChildren,
  cloneNode,
  errorShow,
  getHoursMinutesSince,
  getNameFromId,
  getUserDetails,
  getUserId,
  isViewAtBottom,
  throttle,
  getDefaultPicture,
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

const updateJob = (feedDom, jobDetail) => {
  // Update fields
  feedDom.querySelector(".feed-image").src = jobDetail.image;
  feedDom.querySelector(".feed-title").innerText = jobDetail.title;
  feedDom.querySelector(".feed-start").innerText = jobDetail.start;
  feedDom.querySelector(".feed-description").innerText = jobDetail.description;
  feedDom.querySelector(".feed-likes").innerText =
    "Likes: " + jobDetail.likes.length;
  // Do likes list
  const likedList = feedDom.querySelector(".feed-likes-list");
  const likesStart = feedDom.querySelector(".feed-likes-start");
  clearChildren(likedList);
  likedList.appendChild(likesStart);
  let likeStr = "";
  if (jobDetail.likes.length === 0) {
    likeStr += "Liked by no one";
  } else {
    likeStr += "Liked by ";
    const likeName = feedDom.querySelector(".feed-likes-name");
    const likeSep = feedDom.querySelector(".feed-likes-sep");
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
  likesStart.innerText = likeStr;
  // Set like button text
  let userLikes = false;
  for (let info of jobDetail.likes) {
    if (info.userId === getUserId()) {
      userLikes = true;
      break;
    }
  }
  if (userLikes) {
    feedDom.querySelector(".feed-like-button").value = "Unlike";
  } else {
    feedDom.querySelector(".feed-like-button").value = "Like";
  }
  feedDom.querySelector(".feed-comments").innerText =
    "Comments: " + jobDetail.comments.length;
  // Do comments
  const commentsList = feedDom.querySelector(".feed-comments-list");
  const commentsStart = feedDom.querySelector(".feed-comments-start");
  clearChildren(commentsList);
  commentsList.appendChild(commentsStart);
  let commentStr = "";
  if (jobDetail.comments.length === 0) {
    commentStr += "No comments yet";
  } else {
    const commentItem = feedDom.querySelector(".feed-comments-item");
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
  commentsStart.innerText = commentStr;
  // Update job created string
  let createStr = jobDetail.createdAt.split("T")[0];
  const [hours, minutes] = getHoursMinutesSince(jobDetail.createdAt);
  if (hours < 24) {
    createStr = `${hours} hours, ${minutes} minutes ago`;
  }
  feedDom.querySelector(".feed-created").innerText = createStr;
};

const createJobElement = (jobDetail, editable = false) => {
  const baseFeedItem = document.getElementById("feed-item");
  const feedDom = cloneNode(baseFeedItem);
  // toggling show and hide feed likes list
  const likedList = feedDom.querySelector(".feed-likes-list");
  feedDom.querySelector(".feed-likes").addEventListener("click", () => {
    if (likedList.classList.contains("hide")) {
      likedList.classList.remove("hide");
    } else {
      likedList.classList.add("hide");
    }
  });
  // like button event handler
  feedDom.querySelector(".feed-like-button").addEventListener("click", () => {
    const btnLike = feedDom.querySelector(".feed-like-button");
    const userLikes = btnLike.value === "Unlike";
    const payload = {
      id: jobDetail.id,
      turnon: !userLikes,
    };
    apiCall("job/like", "PUT", payload, () => {
      if (userLikes) {
        btnLike.value = "Like";
      } else {
        btnLike.value = "Unlike";
      }
    });
  });
  // toggling show and hide feed comments list
  const commentsList = feedDom.querySelector(".feed-comments-list");
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
  // Show/hide edit, delete buttons
  if (editable) {
    feedDom.querySelector(".jobs-update-delete").classList.remove("hide");
    // edit button show form
    feedDom.querySelector(".job-edit-button").addEventListener("click", () => {
      // edit button
      if (feedDom.querySelector(".job-edit-button").value === "Edit") {
        feedDom.querySelector(".job-edit-button").value = "Cancel";
        feedDom.querySelector(".page-job-post-update").classList.remove("hide");
      } else {
        feedDom.querySelector(".job-edit-button").value = "Edit";
        feedDom.querySelector(".page-job-post-update").classList.add("hide");
      }
    });
    // Assign label for inputs
    const toFor = ["title", "image", "start-date", "start-time", "description"];
    for (const t of toFor) {
      feedDom
        .querySelector(`.lbl-job-post-update-${t}`)
        .setAttribute("for", `job-update-${t}-${jobDetail.id}`);
      feedDom
        .querySelector(`.job-post-update-${t}`)
        .setAttribute("id", `job-update-${t}-${jobDetail.id}`);
    }
    // update job button
    feedDom
      .querySelector(".update-job-button")
      .addEventListener("click", () => {
        const title = feedDom.querySelector(".job-post-update-title").value;
        const description = feedDom.querySelector(
          ".job-post-update-description"
        ).value;
        const startDate = feedDom.querySelector(
          ".job-post-update-start-date"
        ).value;
        const startTime = feedDom.querySelector(
          ".job-post-update-start-time"
        ).value;
        // error checking
        if (title === "") {
          errorShow("Please enter a title");
          return;
        } else if (
          feedDom.querySelector(".job-post-update-image").files.length === 0
        ) {
          errorShow("Please upload an image");
          return;
        } else if (startDate === "") {
          errorShow("Please enter a date");
        } else if (startTime === "") {
          errorShow("Please enter a time");
        } else if (description === "") {
          errorShow("Please enter a description");
          return;
        }
        // convert to base64, then create job
        const image_file = feedDom.querySelector(".job-post-update-image")
          .files[0];
        fileToDataUrl(image_file)
          .then((image) => {
            console.log(image);
            const payload = {
              id: jobDetail.id,
              title: title,
              image: image,
              start: new Date(`${startDate}T${startTime}`).toISOString(),
              description: description,
            };
            apiCall("job", "PUT", payload, () => {
              feedDom.querySelector(".job-post-update-title").value = "";
              feedDom.querySelector(".job-post-update-image").value = "";
              feedDom.querySelector(".job-post-update-start-date").value = "";
              feedDom.querySelector(".job-post-update-start-time").value = "";
              feedDom.querySelector(".job-post-update-description").value = "";
              // Update info on page
              feedDom.querySelector(".feed-image").src = payload.image;
              feedDom.querySelector(".feed-title").innerText = payload.title;
              feedDom.querySelector(".feed-start").innerText = payload.start;
              feedDom.querySelector(".feed-description").innerText =
                payload.description;
            });
            hide("error-popup");
          })
          .catch((error) => {
            console.log("Image not found", error);
          });
      });
    // delete job button
    feedDom
      .querySelector(".job-delete-button")
      .addEventListener("click", () => {
        const payload = {
          id: jobDetail.id,
        };
        apiCall("job", "DELETE", payload, () => {
          feedDom.classList.add("hide");
          console.log("SUCCESS");
          hide("error-popup");
        });
      });
  }
  // Update fields, likes list, like button text, comments, created string
  updateJob(feedDom, jobDetail);
  // Fetch creator name and update
  return new Promise((resolve, reject) => {
    getNameFromId(jobDetail.creatorId).then((name) => {
      feedDom.querySelector(".feed-creator").innerText = name;
      feedDom.querySelector(".feed-creator").addEventListener("click", () => {
        showProfile(jobDetail.creatorId);
      });
      resolve(feedDom);
    });
  });
};

// Live updates (and notifications)
// start is a number, represents the first index of the group of 5 jobs this is responsible of.
// nodes is a list of nodes assocated with start
// jobIds is the original list of job ids, to detect job adds/deletes
const liveUpdate = (start, nodes, jobIds, id = null) => {
  if (id === null) {
    id = currentPollId;
    polls.push(currentPollId);
    if (currentPollId === Number.MAX_VALUE) {
      // Make this happen naturally. Do it. I dare you.
      currentPollId = 0;
    } else {
      currentPollId++;
    }
  }
  setTimeout(() => {
    if (polls.includes(id)) {
      apiCall("job/feed", "GET", { start: start }, (data) => {
        if (polls.includes(id)) {
          // Sort recent jobs first
          data.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          let die = false; // Stop polling or not
          let itsAdd = false;
          // Check if feed.length has changed
          if (data.length === nodes.length) {
            for (const i in nodes) {
              if (data[i].id === jobIds[i]) {
                if (nodes[i] !== null) {
                  updateJob(nodes[i], data[i]);
                }
              } else if (start === 0) {
                // Only trigger for jobs 0-4
                die = true;
                // Check if it's a job add or delete
                for (let j = Number(i) + 1; j < data.length; j++) {
                  if (data[j].id === jobIds[i]) {
                    itsAdd = true;
                    break;
                  }
                }
                break;
              }
            }
          } else if (start === 0) {
            // Only trigger for jobs 0-4
            // Feed changed, stop Live Updates
            die = true;
            if (data.length > nodes.length) {
              itsAdd = true;
            }
          }
          if (die) {
            if (start === 0) {
              // No Live Updates, but still need notifications
              polls = [id];
              nodes = [];
              jobIds = [];
              for (const d of data) {
                jobIds.push(d.id);
                nodes.push(null);
              }
            } else {
              polls.length = 0;
            }
            console.log(
              `Note to marker: Live Updates stopped because a job was ${
                itsAdd ? "added to" : "deleted from"
              } the feed.`
            );
            console.log("Please refresh feed to continue Live Updates");
            if (notificationGranted) {
              if (itsAdd) {
                const content = {};
                getNameFromId(data[0].creatorId).then((name) => {
                  content.body = `${name} has posted a new job!\nClick Activate to refresh the feed.`;
                  const notif = new Notification("New Job Posted!", content);
                  notif.onclick = (event) => {
                    // Refresh feed page if notification clicked
                    event.preventDefault();
                    populateFeed(0);
                  };
                });
              }
            }
          }
          if (polls.includes(id)) {
            liveUpdate(start, nodes, jobIds, id);
          }
        }
      });
    }
  }, 1000);
};

// clear === true will remove existing feed items before adding new
const populateFeed = (start, clear = true) => {
  if (clear) {
    polls.length = 0; // Stop polling
    populateDone = false;
  }
  return apiCall("job/feed", "GET", { start: start }, (data) => {
    // Sort recent jobs first
    data.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    const feed = document.getElementById("feed-items");
    if (clear) {
      clearChildren(feed);
      currentFeedIndex = 0;
    }
    if (data.length > 0) {
      const nodes = [];
      const jobIds = [];
      jobIds.push(data[0].id);
      let prom = createJobElement(data[0]);
      for (let i = 1; i < data.length; i++) {
        prom = prom.then((feedDom) => {
          feed.appendChild(feedDom);
          nodes.push(feedDom);
          jobIds.push(data[i].id);
          return createJobElement(data[i]);
        });
      }
      prom.then((feedDom) => {
        feed.appendChild(feedDom);
        nodes.push(feedDom);
        currentFeedIndex += data.length;
        liveUpdate(start, nodes, jobIds);
        if (data.length !== 0 && isViewAtBottom()) {
          populateFeed(currentFeedIndex, false);
        }
        populateDone = true;
      });
    } else if (start === 0) {
      // This is for notifications
      liveUpdate(0, [], []);
    }
    console.log("data", data);
  });
};

const showProfile = (userId) => {
  hideAll();
  // Populate page-profile
  getUserDetails(userId).then((user) => {
    const pp = document.getElementById("page-profile");
    pp.querySelector("#profile-userid").innerText = user.id;
    pp.querySelector("#profile-email").innerText = user.email;
    pp.querySelector("#profile-name").innerText = user.name;
    if (user.image === undefined) {
      pp.querySelector("#profile-image").src = getDefaultPicture();
    } else {
      pp.querySelector("#profile-image").src = user.image;
    }
    // Edit Button
    const btnEdit = document.getElementById("profile-edit");
    if (userId === getUserId()) {
      btnEdit.classList.remove("hide");
    } else {
      btnEdit.classList.add("hide");
    }
    // Watch Button
    const btnWatch = document.getElementById("profile-watch");
    if (userId === getUserId() && !user.watcheeUserIds.includes(getUserId())) {
      btnWatch.classList.add("hide");
    } else {
      const isWatching = user.watcheeUserIds.includes(getUserId());
      if (isWatching) {
        btnWatch.value = "Unwatch";
      } else {
        btnWatch.value = "Watch";
      }
      btnWatch.classList.remove("hide");
      // using .onclick to override, not add another event handler
      btnWatch.onclick = () => {
        watchClick(user.email, !isWatching, user.id);
      };
    }
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
      getNameFromId(watcheeId).then((name) => {
        dupName.innerText = name;
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
      jobs.innerText = "Jobs: loading...";
      // Most recent first
      user.jobs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      const toAdd = [];
      let prom = createJobElement(user.jobs[0], true);
      for (let i = 1; i < user.jobs.length; i++) {
        prom = prom.then((jobDom) => {
          toAdd.push(jobDom);
          return createJobElement(user.jobs[i], true);
        });
      }
      prom.then((jobDom) => {
        clearChildren(jobs);
        jobs.innerText = "Jobs:";
        for (const node of toAdd) {
          jobs.appendChild(node);
        }
        toAdd.push(jobDom);
        jobs.appendChild(jobDom);
      });
    }
    // Prefill profile update fields
    if (userId === getUserId()) {
      const pu = document.getElementById("page-profile-update");
      pu.querySelector("#update-email").value = user.email;
      pu.querySelector("#update-name").value = user.name;
    }
  });
  show("page-profile");
};

// Hides all pages
const hideAll = () => {
  hide("page-job-feed");
  hide("page-job-post");
  hide("page-profile");
  hide("page-profile-update");
  hide("error-popup");
};

const doUserLoginActions = () => {
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed(0);
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
  populateDone = false;
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
  doUserLoginActions();
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
  document.getElementById("nav-job-feed").classList.add("active");
  document.getElementById("nav-job-post").classList.remove("active");
  document.getElementById("nav-profile-me").classList.remove("active");
  populateFeed(0, true);
});

// Navbar Create Job, show job post page
document.getElementById("nav-job-post").addEventListener("click", () => {
  hideAll();
  show("page-job-post");
  document.getElementById("nav-job-post").classList.add("active");
  document.getElementById("nav-job-feed").classList.remove("active");
  document.getElementById("nav-profile-me").classList.remove("active");
});

// Navbar Me, show your profile page
document.getElementById("nav-profile-me").addEventListener("click", () => {
  showProfile(getUserId());
  document.getElementById("nav-profile-me").classList.add("active");
  document.getElementById("nav-job-post").classList.remove("active");
  document.getElementById("nav-job-feed").classList.remove("active");
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
  polls.length = 0;
  show("section-logged-out");
  hide("section-logged-in");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
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
      console.log(new Date(`${startDate}T${startTime}`).toISOString());
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

// Watch profile - needs email context, so addEventListener not defined here.
// Email is string, turnon is boolean
// userId: a number (will show this profile, null won't redirect to profile)
// Refreshes the feed as well
const watchClick = (email, turnon, userId) => {
  const payload = {
    email: email,
    turnon: turnon,
  };
  apiCall("user/watch", "PUT", payload, () => {
    if (userId !== null) {
      showProfile(userId);
    }
    populateFeed(0, true);
  });
};

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
  if (populateDone) {
    populateFeed(currentFeedIndex, false);
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
// The start index you should give /job/feed to get next feed items
var currentFeedIndex = 0;
// Variable is stop scrolling from being triggered before finishing
// the first populateFeed, happens on slow browsers (VLAB Firefox)
var populateDone = false;
// Keep track of polling, clear the list to stop liveUpdates
var polls = [];
var currentPollId = 0;
// Whether notification permission has been granted, asked on user log in
var notificationGranted = false;
if (localStorage.getItem("token") && getUserId()) {
  doUserLoginActions();
  console.log(localStorage.getItem("token"));
}
const curr_date = new Date();
console.log(new Date().toISOString());
