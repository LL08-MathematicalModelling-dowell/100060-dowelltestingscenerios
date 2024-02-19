const popup = document.querySelector(".popup");
const wifiIcon = document.querySelector(".icon i");
const popupTitle = document.querySelector(".popup .title");
const popupDesc = document.querySelector(".desc");
const reconnectBtn = document.querySelector(".reconnect");

let isOnline = true;
let timer = 10;
let intervalId;

const checkConnection = async () => {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    isOnline = response.status >= 200 && response.status < 300;
  } catch (error) {
    isOnline = false;
  }
  timer = 5;
  handlePopup(isOnline);
}

const handlePopup = (status) => {
  if (status) {
    wifiIcon.className = "uil uil-wifi";
    popupTitle.innerText = "Restored Connection";
    popupDesc.innerHTML = "Your device is now successfully connected to the internet.";
    popup.classList.add("online");
    setTimeout(() => popup.classList.remove("show"), 2000);
  } else {
    wifiIcon.className = "uil uil-wifi-slash";
    popupTitle.innerText = "Lost Connection";
    popupDesc.innerHTML = `Your network is unavailable. We will attempt to reconnect you in <b>${timer}</b> seconds.`;
    popup.className = "popup show";
    intervalId = setInterval(updateTimer, 1000);
  }
}

const updateTimer = () => {
  timer--;
  if (timer === 0) {
    clearInterval(intervalId);
    checkConnection();
  }
  popup.querySelector(".desc b").innerText = timer;
}

const throttledCheckConnection = throttle(checkConnection, 3000); // Throttle checkConnection function

// Initial check and subsequent checks every 3 seconds
throttledCheckConnection();
setInterval(throttledCheckConnection, 2000);

// Event listener for manual reconnection
reconnectBtn.addEventListener("click", checkConnection);

// Throttle function to limit the frequency of function calls
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
