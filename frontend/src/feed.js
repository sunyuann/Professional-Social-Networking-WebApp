import {
  fileToDataUrl,
  apiCall,
  clearChildren,
  cloneNode,
  errorShow,
  getHoursMinutesSince,
  getNameFromId,
  getUserId,
  isViewAtBottom,
} from "./helpers.js";
import { hide, getNotificationGranted } from "./main.js";
import { showProfile } from "./profile.js";

///////////////////////////////////
// Functions related to the Feed //
///////////////////////////////////

// Updates a job node with info from jobDetail
const updateJob = (feedDom, jobDetail) => {
  // Update fields
  feedDom.querySelector(".feed-image").src = jobDetail.image;
  feedDom.querySelector(".feed-image").alt =
    "Image of job with title " + jobDetail.title;
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

// Clones the hidden node and edits to fit jobDetail
// If editable === true, Edit and Delete buttons are shown
export const createJobElement = (jobDetail, editable = false) => {
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
            errorShow("Provided profile image is not a png, jpg or jpeg.");
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
            if (getNotificationGranted()) {
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

// Fetch feed and populate, doesn't switch to feed page
// clear === true will remove existing feed items before adding new
export const populateFeed = (start, clear = true) => {
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
  });
};

//////////////////////
// Global variables //
//////////////////////

// The start index you should give /job/feed to get next feed items
var currentFeedIndex = 0;
export const getCurrentFeedIndex = () => {
  return currentFeedIndex;
};
// Keep track of polling, clear the list to stop liveUpdates
var polls = [];
export const clearPolls = () => {
  polls.length = 0;
};
var currentPollId = 0;
// Variable is stop scrolling from being triggered before finishing
// the first populateFeed, happens on slow browsers (VLAB Firefox)
var populateDone = false;
export const getPopulateDone = () => {
  return populateDone;
};
export const setPopulateDone = (bool) => {
  populateDone = bool;
};
