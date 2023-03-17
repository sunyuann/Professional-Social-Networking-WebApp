import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

///////////////
// Functions //
///////////////
const errorShow = (content) => {
  document.getElementById('error-popup').classList.remove('hide');
  document.getElementById("error-content").textContent = content;
};

const isUserLoggedIn = () => {
  return false;
};

const show = (element) => {
  document.getElementById(element).classList.remove('hide');
};
const hide = (element) => {
  document.getElementById(element).classList.add('hide');
};

const populateFeed = () => {
  // TODO: remove start=0 path and dynamically change it, figure out a way to populate feed via get req
  apiCall('job/feed?start=0', 'GET', {}, (data) => {
    for (const feedItem of data) {
      const feedDom = document.createElement('div');
      feedDom.style.border = '1px solid black';
      feedDom.innerText = feedItem.title;
      document.getElementById('feed-items').appendChild(feedDom);
    }
    console.log('data', data);
  });
};

const setToken = (token) => {
  localStorage.setItem('token', token);
  show('section-logged-in');
  hide('section-logged-out');
  hide('error-popup');
  populateFeed();
};

// api call function
const apiCall = (path, method, body, success) => {
  const options = {
    method: method,
    headers: {
      'Content-type': 'application/json',
    },
  };
  if (method === 'GET') {
    // TODO: COME BACK TO THIS (don't add body but maybe start:0 optional) (append to end of the path)
  } else {
    options.body = JSON.stringify(body);
  }
  if (localStorage.getItem('token')) {
    options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }

  fetch('http://localhost:5005/' + path, options)
    .then((response) => {
      response.json()
        .then((data) => {
          if (data.error) {
            errorShow(data.error);
          } else {
            if (success) {
              success(data);
            }
          }
        })
    });
};

////////////////////////////////
// Add .addEventListener here //
////////////////////////////////

// Login page, login button
document.getElementById("login-login").addEventListener("click", () => {
  // login
  const payload = {
    email: document.getElementById('login-email').value,
    password: document.getElementById("login-password").value
  }
  apiCall('auth/login', 'POST', payload, (data) => {
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
} );

// Register page, register button
document.getElementById("register-register").addEventListener("click", () => {
  const registerPassword = document.getElementById("register-password").value;
  const registerPasswordConfirm = document.getElementById("register-password-confirm").value;
  // different password error checking
  if (registerPassword !== registerPasswordConfirm) {
    errorShow("Passwords do not match!");
    return;
  }
  // hide error if passwords match

  hide('error-popup');
  // register
  const payload = {
    email: document.getElementById('register-email').value,
    password: document.getElementById("register-password").value,
    name: document.getElementById('register-name').value
  }
  apiCall('auth/register', 'POST', payload, (data) => {
    setToken(data.token);
  });
  //document.getElementById("register-form").submit();
});

// Error popup, close button
document.getElementById("error-close").addEventListener("click", () => {
  hide('error-popup');
});

// Navbar register, show register page
document.getElementById('nav-register').addEventListener('click', () => {
  show('page-register');
  hide('page-login');
});

// Login register, show login page
document.getElementById('nav-login').addEventListener('click', () => {
  show('page-login');
  hide('page-register');
});

// if token does not exist, display logged out section
document.getElementById('logout').addEventListener('click', () => {
  show('section-logged-out');
  hide('section-logged-in');
  localStorage.removeItem('token');
})

document.getElementById('create-job-fake').addEventListener('click', () => {
  const payload = {
    "title": "TETS",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
    "start": "2011-10-05T14:48:00.000Z",
    "description": "Dedicated technical wizard with a passion and interest in human relationships"
  }
  apiCall('job', 'POST', payload);
})

////////////////
// Main logic //
////////////////
if (localStorage.getItem('token')) {
  show('section-logged-in');
  hide('section-logged-out');
  hide('error-popup');
  populateFeed();
  console.log(localStorage.getItem('token'));
}