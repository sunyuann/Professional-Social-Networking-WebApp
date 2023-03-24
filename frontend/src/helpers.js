import { BACKEND_PORT } from "./config.js";

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
  const validFileTypes = ["image/jpeg", "image/png", "image/jpg"];
  const valid = validFileTypes.find((type) => type === file.type);
  // Bad data, let's walk away.
  if (!valid) {
    return Promise.reject(
      new Error("provided file is not a png, jpg or jpeg image.")
    );
  }

  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });
  reader.readAsDataURL(file);
  return dataUrlPromise;
}

// api call function
export const apiCall = (path, method, body, success) => {
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

  return fetch(`http://localhost:${BACKEND_PORT}/` + path, options).then(
    (response) => {
      response.json().then((data) => {
        if (data.error) {
          if (getUserId()) {
            errorShow(data.error);
          } else {
            console.log("API call, but you logged out before it finished");
          }
        } else {
          if (success) {
            return Promise.resolve(success(data));
          }
        }
      });
    }
  );
};

export const clearChildren = (element) => {
  const children = element.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (!child.classList.contains("hide")) {
      element.removeChild(child);
    }
  }
};

// Deep clone and removes id, class "hide"
export const cloneNode = (element) => {
  const newElem = element.cloneNode(true);
  newElem.removeAttribute("id");
  newElem.classList.remove("hide");
  return newElem;
};

// show error
export const errorShow = (content) => {
  document.getElementById("error-popup").classList.remove("hide");
  document.getElementById("error-content").textContent = content;
};

// Returns [hours, minutes] where hours and minutes are ints
export const getHoursMinutesSince = (datetimestr) => {
  const ms = new Date() - new Date(datetimestr);
  let minutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes - hours * 60;
  return [hours, minutes];
};

// Returns GET /user dictionary response from server
export const getUserDetails = (userId) => {
  return new Promise((resolve, reject) => {
    apiCall("user", "GET", { userId: userId }, (data) => {
      resolve(data);
    });
  });
};

// Get userId
// localStorage converts things into string
export const getUserId = () => {
  return JSON.parse(localStorage.getItem("userId"));
};

// Returns true if viewport? is at bottom of window
export const isViewAtBottom = () => {
  return window.innerHeight + window.scrollY >= document.body.offsetHeight;
};

// Throttle an action, period is in milliseconds
// Returns a function to be passed to an event handler
export const throttle = (func, period) => {
  let timer = null;
  return () => {
    if (!timer) {
      func();
      timer = setTimeout(() => {
        timer = null;
      }, period);
    }
  };
};
