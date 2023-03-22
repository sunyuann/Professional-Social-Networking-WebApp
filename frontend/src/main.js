// A helper you may want to use when uploading new images to the server.
import {
  fileToDataUrl,
  apiCall,
  cloneNode,
  getHoursMinutesSince,
  getUserDetails,
} from "./helpers.js";

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
      const feedDom = cloneNode(baseFeedItem);
      // Update fields
      feedDom.querySelector(".feed-image").innerText = feedItem.image;
      feedDom.querySelector(".feed-title").innerText = feedItem.title;
      feedDom.querySelector(".feed-start").innerText = feedItem.start;
      feedDom.querySelector(".feed-description").innerText =
        feedItem.description;
      feedDom.querySelector(".feed-likes").innerText =
        "Likes: " + feedItem.likes.length;
      // get liked list
      const likedList = feedDom.querySelector(".feed-likes-list");
      let likeStart = "";
      if (feedItem.likes.length === 0) {
        likeStart += "Liked by no one";
      } else {
        likeStart += "Liked by ";
        const likeName = feedDom.querySelector(".feed-likes-name");
        const likeSep = feedDom.querySelector(".feed-likes-sep");
        // Add the list
        for (let i = 0; i < feedItem.likes.length; i++) {
          if (i > 0) {
            const dupSep = cloneNode(likeSep);
            likedList.appendChild(dupSep);
          }
          const dupName = cloneNode(likeName);
          dupName.innerText = feedItem.likes[i].userName;
          dupName.addEventListener("click", () => {
            showProfile(feedItem.likes[i].userId);
          });
          likedList.appendChild(dupName);
        }
      }
      feedDom.querySelector(".feed-likes-start").innerText = likeStart;
      feedDom
        .querySelector(".feed-likes-list")
        .setAttribute("id", "feed-likes-list_" + feedItem.id);
      // toggling show and hide feed likes list
      feedDom.querySelector(".feed-likes").addEventListener("click", () => {
        // toggling show and hide feed likes list
        if (
          document
            .getElementById("feed-likes-list_" + feedItem.id)
            .classList.contains("hide")
        ) {
          show("feed-likes-list_" + feedItem.id);
        } else {
          hide("feed-likes-list_" + feedItem.id);
        }
      });

      let likeButtonTurnOn = true;
      // console.log(feedItem.likes[0].userId);
      for (var i = 0; i < feedItem.likes.length; i++) {
        if (feedItem.likes[0].userId === 65687) {
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
        .setAttribute("id", "feed-like-button_" + feedItem.id);
      feedDom
        .querySelector(".feed-like-button")
        .addEventListener("click", () => {
          // like/dislike button
          const payload = {
            id: feedItem.id,
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
        "Comments: " + feedItem.comments.length;
      // get comment list
      let comments_list = "";
      if (feedItem.comments.length === 0) {
        comments_list += "No comments yet";
      } else {
        for (var i = 0; i < feedItem.comments.length; i++) {
          comments_list =
            comments_list +
            feedItem.comments[i].userName +
            ": " +
            feedItem.comments[i].comment +
            "\n";
        }
        comments_list = comments_list.substring(0, comments_list.length);
      }
      feedDom.querySelector(".feed-comments-list").innerText = comments_list;
      feedDom
        .querySelector(".feed-comments-list")
        .setAttribute("id", "feed-comments-list_" + feedItem.id);
      // toggling show and hide feed comments list
      feedDom.querySelector(".feed-comments").addEventListener("click", () => {
        // toggling show and hide feed likes list
        if (
          document
            .getElementById("feed-comments-list_" + feedItem.id)
            .classList.contains("hide")
        ) {
          show("feed-comments-list_" + feedItem.id);
        } else {
          hide("feed-comments-list_" + feedItem.id);
        }
      });

      // post comment
      feedDom
        .querySelector(".feed-comment")
        .setAttribute("id", "feed-comment_" + feedItem.id);
      feedDom
        .querySelector(".feed-comment-button")
        .addEventListener("click", () => {
          // post comment button
          if (
            document.getElementById("feed-comment_" + feedItem.id).value !== ""
          ) {
            const payload = {
              id: feedItem.id,
              comment: document.getElementById("feed-comment_" + feedItem.id)
                .value,
            };
            apiCall("job/comment", "POST", payload, () => {
              document.getElementById("feed-comment_" + feedItem.id).value = "";
            });
            hide("error-popup");
          } else {
            // case if comment box empty
            errorShow("Comment can't be empty, please try again.");
          }
        });

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

const showProfile = (userId) => {
  // TODO Hide everything else

  // Populate profile-page
  getUserDetails(userId)
    .then((user) => {
      const pp = document.getElementById("profile-page");
      pp.querySelector("#profile-email").innerText = user.email;
      pp.querySelector("#profile-name").innerText = user.name;
      pp.querySelector("#profile-image").innerText = user.image;
      let watchString = `Watched by ${user.watcheeUserIds.length} users`;
      const numWatchers = user.watcheeUserIds.length;
      watchString += `${numWatchers > 0 ? ":" : "."}`;
      pp.querySelector("#profile-watched-start").innerText = watchString;
      const watchList = pp.querySelector("#profile-watched-list");
      const watchName = pp.querySelector(".profile-watched-name");
      const watchSep = pp.querySelector(".profile-watched-sep");
      for (let i = 0; i < numWatchers; i++) {
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
    })
    .catch((error) => {
      console.log("TODO showProfile getUserDetails ERROR! ", error);
    });
  show("profile-page");
};

const setToken = (token) => {
  localStorage.setItem("token", token);
  show("section-logged-in");
  hide("section-logged-out");
  hide("error-popup");
  populateFeed();
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
