let startTime;
let walkingData = [];
let walkingListener = null;

// SCREEN NAVIGATION
function showScreen(screen) {
  document.getElementById("home").style.display = "none";
  document.getElementById("reaction").style.display = "none";
  document.getElementById("walking").style.display = "none";
  document.getElementById("result").style.display = "none";

  document.getElementById(screen).style.display = "block";
}

function goHome() {
  updateHomeStatus();
  updateReactionHistory();
  updateWalkingHistory();
  showScreen("home");
}

// RESET
function resetBaseline() {
  localStorage.removeItem("reaction");
  localStorage.removeItem("walking");
  updateHomeStatus();
  updateReactionHistory();
  updateWalkingHistory();
  location.reload();
}

// REACTION DATA
function getReactionData() {
  return JSON.parse(localStorage.getItem("reaction")) || [];
}

function saveReaction(time) {
  let data = getReactionData();
  data.push(time);
  localStorage.setItem("reaction", JSON.stringify(data));
}

function getReactionBaseline(windowSize = 5) {
  let data = getReactionData();
  let recent = data.slice(-windowSize);

  if (recent.length < 3) {
    return null;
  }

  let sum = recent.reduce((a, b) => a + b, 0);
  return sum / recent.length;
}

// WALKING DATA
function getWalkingData() {
  return JSON.parse(localStorage.getItem("walking")) || [];
}

function saveWalkingScore(score) {
  let data = getWalkingData();
  data.push(score);
  localStorage.setItem("walking", JSON.stringify(data));
}

function getWalkingBaseline(windowSize = 5) {
  let data = getWalkingData();
  let recent = data.slice(-windowSize);

  if (recent.length < 3) {
    return null;
  }

  let sum = recent.reduce((a, b) => a + b, 0);
  return sum / recent.length;
}

// HOME STATUS
function updateHomeStatus() {
  const badge = document.getElementById("statusBadge");
  const summary = document.getElementById("latestSummary");

  let reactionData = getReactionData();
  let walkingScores = getWalkingData();

  if (reactionData.length === 0 && walkingScores.length === 0) {
    badge.innerText = "No data yet";
    badge.className = "badge building";
    summary.innerText = "Complete a check to see your latest result.";
    return;
  }

  let reactionText = "No reaction data yet.";
  let walkingText = "No walking data yet.";
  let badgeLabel = "Building baseline";
  let badgeClass = "building";

  if (reactionData.length > 0) {
    let latestReaction = reactionData[reactionData.length - 1];
    let reactionBaseline = getReactionBaseline(5);

    if (reactionBaseline === null) {
      reactionText = "Reaction: building baseline";
    } else {
      let percentDiff = ((latestReaction - reactionBaseline) / reactionBaseline) * 100;
      reactionText =
        "Reaction: " + latestReaction + " ms (baseline " + Math.round(reactionBaseline) + " ms)";

      if (percentDiff <= 10) {
        badgeLabel = "Stable";
        badgeClass = "normal";
      } else if (percentDiff <= 20) {
        badgeLabel = "Slight change";
        badgeClass = "warning";
      } else {
        badgeLabel = "Alert";
        badgeClass = "alert";
      }
    }
  }

  if (walkingScores.length > 0) {
    let latestWalking = walkingScores[walkingScores.length - 1];
    let walkingBaseline = getWalkingBaseline(5);

    if (walkingBaseline === null) {
      walkingText = "Walking: building baseline";
    } else {
      let percentDiff = ((walkingBaseline - latestWalking) / walkingBaseline) * 100;
      walkingText =
        "Walking: " + latestWalking + "/100 (baseline " + Math.round(walkingBaseline) + "/100)";

      if (badgeClass === "building") {
        if (percentDiff <= 10) {
          badgeLabel = "Stable";
          badgeClass = "normal";
        } else if (percentDiff <= 20) {
          badgeLabel = "Slight change";
          badgeClass = "warning";
        } else {
          badgeLabel = "Alert";
          badgeClass = "alert";
        }
      }
    }
  }

  badge.innerText = badgeLabel;
  badge.className = "badge " + badgeClass;
  summary.innerText = reactionText + "\n" + walkingText;
}

// REACTION HISTORY
function updateReactionHistory() {
  const stats = document.getElementById("historyStats");
  const list = document.getElementById("historyList");

  let data = getReactionData();

  if (data.length === 0) {
    stats.innerText = "No results recorded yet.";
    list.innerHTML = "";
    return;
  }

  let avg = data.reduce((a, b) => a + b, 0) / data.length;
  let best = Math.min(...data);
  let worst = Math.max(...data);

  stats.innerText =
    "Total tests: " + data.length +
    "\nAverage: " + Math.round(avg) + " ms" +
    "\nBest: " + best + " ms" +
    "\nWorst: " + worst + " ms";

  list.innerHTML = "";

  let recent = [...data].reverse();
  recent.forEach((value, index) => {
    let item = document.createElement("div");
    item.className = "history-item";
    item.innerText = "Reaction Test " + (data.length - index) + ": " + value + " ms";
    list.appendChild(item);
  });
}

// WALKING HISTORY
function updateWalkingHistory() {
  const stats = document.getElementById("walkingHistoryStats");
  const list = document.getElementById("walkingHistoryList");

  let data = getWalkingData();

  if (data.length === 0) {
    stats.innerText = "No walking tests recorded yet.";
    list.innerHTML = "";
    return;
  }

  let avg = data.reduce((a, b) => a + b, 0) / data.length;
  let best = Math.max(...data);
  let worst = Math.min(...data);

  stats.innerText =
    "Total tests: " + data.length +
    "\nAverage: " + Math.round(avg) + "/100" +
    "\nBest: " + best + "/100" +
    "\nLowest: " + worst + "/100";

  list.innerHTML = "";

  let recent = [...data].reverse();
  recent.forEach((value, index) => {
    let item = document.createElement("div");
    item.className = "history-item";
    item.innerText = "Walking Test " + (data.length - index) + ": " + value + "/100";
    list.appendChild(item);
  });
}

// REACTION MESSAGE
function buildReactionMessage(reactionTime) {
  let data = getReactionData();
  let baseline = getReactionBaseline(5);

  let message = "Your Reaction Time: " + reactionTime + " ms";

  if (baseline === null) {
    let completed = data.length + 1;
    let needed = Math.max(0, 3 - completed);

    message += "\nBuilding reaction baseline";
    message += "\nRecorded tests: " + completed + "/3";

    if (needed > 0) {
      message += "\nNeed " + needed + " more test";
      if (needed !== 1) {
        message += "s";
      }
    } else {
      message += "\nBaseline will begin on your next check";
    }

    return message;
  }

  let percentDiff = ((reactionTime - baseline) / baseline) * 100;

  message += "\nBaseline: " + Math.round(baseline) + " ms";

  if (percentDiff <= 10) {
    message += "\nStatus: Within your normal range";
  } else if (percentDiff <= 20) {
    message += "\nStatus: Slightly slower than normal";
  } else {
    message += "\nStatus: Notably slower than your normal";
  }

  return message;
}

// WALKING MESSAGE
function buildWalkingMessage(score) {
  let data = getWalkingData();
  let baseline = getWalkingBaseline(5);

  let message = "Your Stability Score: " + score + "/100";

  if (baseline === null) {
    let completed = data.length + 1;
    let needed = Math.max(0, 3 - completed);

    message += "\nBuilding walking baseline";
    message += "\nRecorded tests: " + completed + "/3";

    if (needed > 0) {
      message += "\nNeed " + needed + " more test";
      if (needed !== 1) {
        message += "s";
      }
    } else {
      message += "\nBaseline will begin on your next check";
    }

    return message;
  }

  let percentDiff = ((baseline - score) / baseline) * 100;

  message += "\nBaseline: " + Math.round(baseline) + "/100";

  if (percentDiff <= 10) {
    message += "\nStatus: Within your normal range";
  } else if (percentDiff <= 20) {
    message += "\nStatus: Slightly less stable than normal";
  } else {
    message += "\nStatus: Notably less stable than normal";
  }

  return message;
}

// REACTION TEST
function startReactionTest() {
  showScreen("reaction");

  const screen = document.getElementById("reaction");
  const text = document.getElementById("reactionText");

  screen.style.background = "red";
  text.innerText = "Wait...";
  startTime = null;

  let delay = Math.random() * 3000 + 2000;

  setTimeout(function () {
    screen.style.background = "green";
    text.innerText = "TAP!";
    startTime = Date.now();
  }, delay);
}

document.getElementById("reaction").onclick = function () {
  if (!startTime) return;

  let reactionTime = Date.now() - startTime;
  let message = buildReactionMessage(reactionTime);

  saveReaction(reactionTime);

  showScreen("result");
  document.getElementById("resultText").innerText = message;

  startTime = null;
};

// WALKING TEST
function startWalkingTest() {
  const instruction = document.getElementById("walkingInstruction");

  walkingData = [];
  instruction.innerText = "Tracking... Walk now for 10 seconds.";

  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === "granted") {
          beginMotionTracking(instruction);
        } else {
          instruction.innerText = "Motion permission denied.";
        }
      })
      .catch(() => {
        instruction.innerText = "Motion permission error.";
      });
  } else {
    beginMotionTracking(instruction);
  }
}

function beginMotionTracking(instruction) {
  walkingListener = function(event) {
    let x = event.accelerationIncludingGravity?.x || 0;
    let y = event.accelerationIncludingGravity?.y || 0;
    let z = event.accelerationIncludingGravity?.z || 0;

    let magnitude = Math.sqrt(x * x + y * y + z * z);
    walkingData.push(magnitude);
  };

  window.addEventListener("devicemotion", walkingListener);

  setTimeout(() => {
    window.removeEventListener("devicemotion", walkingListener);

    let score = calculateStabilityScore(walkingData);
    let message = buildWalkingMessage(score);

    saveWalkingScore(score);

    showScreen("result");
    document.getElementById("resultText").innerText = message;

    instruction.innerText = "Put your phone in your pocket and walk for 10 seconds.";
  }, 10000);
}

function calculateStabilityScore(data) {
  if (data.length === 0) {
    return 0;
  }

  let avg = data.reduce((a, b) => a + b, 0) / data.length;

  let variance =
    data.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / data.length;

  let score = Math.max(0, Math.min(100, 100 - variance * 5));
  return Math.round(score);
}

// INIT
updateHomeStatus();
updateReactionHistory();
updateWalkingHistory();
