import {
  apiCall,
  clearChildren,
  cloneNode,
  getNameFromId,
  getUserDetails,
  getUserId,
  getDefaultPicture,
} from "./helpers.js";
import { show, hideAll } from "./main.js";
import { createJobElement, populateFeed } from "./feed.js";

//////////////////////////////////////
// Functions related to the Profile //
//////////////////////////////////////

// Watch profile
// Email is string, turnon is boolean
// userId: a number (will show this profile, null won't redirect to profile)
// Refreshes the feed as well
export const watchClick = (email, turnon, userId) => {
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

// Switches to the profile page with information of userId
export const showProfile = (userId) => {
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
    pp.querySelector("#profile-image").alt = "Profile image of " + user.name;
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
    // Add Sort by event listener
    // Profile jobs sort order
    pp.querySelector("#profile-job-sort").onchange = (event) => {
      console.log("CHANGE ", event);
      localStorage.setItem("sort", event.target.value);
      showProfile(userId);
    };
    const jobs = pp.querySelector("#profile-jobs");
    const jobsText = pp.querySelector("#profile-jobs-text");
    if (user.jobs.length === 0) {
      jobsText.innerText = "No jobs.";
    } else {
      jobsText.innerText = "Jobs: loading...";
      // Sort jobs
      if (localStorage.getItem("sort") === "old") {
        user.jobs.sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      } else {
        user.jobs.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }
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
        jobsText.innerText = "Jobs:";
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
