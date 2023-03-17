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
    throw Error("provided file is not a png, jpg or jpeg image.");
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

  fetch(`http://localhost:${BACKEND_PORT}/` + path, options).then(
    (response) => {
      response.json().then((data) => {
        if (data.error) {
          errorShow(data.error);
        } else {
          if (success) {
            success(data);
          }
        }
      });
    }
  );
};

// Returns GET /user dictionary response from server
export const getUserDetails = (userId) => {
  return new Promise((resolve, reject) => {
    apiCall("user", "GET", { userId: userId }, (data) => {
      resolve(data);
    });
  });
};

// Returns [hours, minutes] where hours and minutes are ints
export const getHoursMinutesSince = (datetimestr) => {
  const ms = new Date() - new Date(datetimestr);
  let minutes = Math.floor(ms / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes - hours * 60;
  return [hours, minutes];
};
