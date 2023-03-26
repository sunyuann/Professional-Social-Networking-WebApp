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

  return fetch(`http://localhost:${BACKEND_PORT}/` + path, options)
    .then((response) => {
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
    })
    .catch(() => {
      console.log("Failed to fetch, have you started the backend?");
    });
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

// Returns a promise with the name
var nameDB = {};
export const getNameFromId = (id) => {
  return new Promise((resolve, reject) => {
    if (nameDB[id]) {
      resolve(nameDB[id]);
    } else {
      getUserDetails(id).then((data) => {
        nameDB[id] = data.name;
        resolve(data.name);
      });
    }
  });
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

export const getDefaultPicture = () => {
  return "data:image/jpeg;base64,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";
};
