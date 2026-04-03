let startTime = null;
let walkingData = [];
let walkingListener = null;

let currentCheck = {
  fatigue: null,
  balanceConfidence: null,
  reactionTime: null,
  walkingScore: null
};

function showScreen(screen) {
  document.getElementById("home").style.display = "none";
  document.getElementById("checkin").style.display = "none";
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

function resetBaseline() {
  localStorage.removeItem("reaction");
  localStorage.removeItem("walking");
  currentCheck = {
    fatigue: null,
    balanceConfidence: null,
    reactionTime: null,
    walkingScore: null
  };
  updateHomeStatus();
  updateReactionHistory();
  updateWalkingHistory();
  goHome();
}

function getReactionData() {
  return JSON.parse(localStorage.getItem("reaction")) || [];
}

function saveReaction(time) {
  const data = getReactionData();
  data.push(time);
  localStorage.setItem("reaction", JSON.stringify(data));
}

function getWalkingData() {
  return JSON.parse(localStorage.getItem("walking")) || [];
}

function saveWalkingScore(score) {
  const data = getWalkingData();
  data.push(score);
  localStorage.setItem("walking", JSON.stringify(data));
}

function getReactionBaseline(windowSize = 5) {
  const data = getReactionData();
  const recent = data.slice(-windowSize);
  if (recent.length < 3) return null;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function getWalkingBaseline(windowSize = 5) {
  const data = getWalkingData();
  const recent = data.slice(-windowSize);
  if (recent.length < 3) return null;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function startDailyCheck() {
  currentCheck = {
    fatigue: 5,
    balanceConfidence: 5,
    reactionTime: null,
    walkingScore: null
  };

  document.getElementById("fatigueSlider").value = 5;
  document.getElementById("balanceSlider").value = 5;
  updateSliderValues();

  showScreen("checkin");
}

function updateSliderValues() {
  document.getElementById("fatigueValue").innerText =
    document.getElementById("fatigueSlider").value;
  document.getElementById("balanceValue").innerText =
    document.getElementById("balanceSlider").value;
}

function continueToReaction() {
  currentCheck.fatigue = Number(document.getElementById("fatigueSlider").value);
  currentCheck.balanceConfidence = Number(document.getElementById("balanceSlider").value);
  startReactionTest();
}

function startReactionTest() {
  showScreen("reaction");

  const screen = document.getElementById("reaction");
  const text = document.getElementById("reactionText");

  screen.style.background = "red";
  text.innerText = "Wait...";
  startTime = null;

  const delay = Math.random() * 3000 + 2000;

  setTimeout(() => {
    screen.style.background = "green";
    text.innerText = "TAP!";
    startTime = Date.now();
  }, delay);
}

function startWalkingTest() {
  const instruction = document.getElementById("walkingInstruction");
  walkingData = [];
  instruction.innerText = "Tracking... Walk now for 10 seconds.";

  const startTracking = () => beginMotionTracking(instruction);

  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === "granted") {
          startTracking();
        } else {
          showScreen("result");
          document.getElementById("resultText").innerText =
            "Motion permission denied.\nPlease allow motion access to run the walking test.";
        }
      })
      .catch(() => {
        showScreen("result");
        document.getElementById("resultText").innerText =
          "Motion permission error.\nUnable to access motion sensors.";
      });
  } else {
    startTracking();
  }
}

function beginMotionTracking(instruction) {
  walkingListener = function (event) {
    const x = event.accelerationIncludingGravity?.x || 0;
    const y = event.accelerationIncludingGravity?.y || 0;
    const z = event.accelerationIncludingGravity?.z || 0;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    walkingData.push(magnitude);
  };

  window.addEventListener("devicemotion", walkingListener);

  setTimeout(() => {
    window.removeEventListener("devicemotion", walkingListener);

    if (walkingData.length < 10) {
      showScreen("result");
      document.getElementById("resultText").innerText =
        "No motion data detected.\nPlease run the walking test on your phone and allow motion access.";
      instruction.innerText = "Put your phone in your pocket and walk for 10 seconds.";
      return;
    }

    const score = calculateStabilityScore(walkingData);
    currentCheck.walkingScore = score;
    saveWalkingScore(score);

    instruction.innerText = "Put your phone in your pocket and walk for 10 seconds.";
    showCombinedResults();
  }, 10000);
}

function calculateStabilityScore(data) {
  if (data.length < 10) return null;

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / data.length;

  const score = Math.max(0, Math.min(100, 100 - variance * 5));
  return Math.round(score);
}

function getReactionStatus(reactionTime) {
  const baseline = getReactionBaseline(5);
  if (baseline === null) return "Building baseline";

  const percentDiff = ((reactionTime - baseline) / baseline) * 100;
  if (percentDiff <= 10) return "Stable";
  if (percentDiff <= 20) return "Slight change";
  return "Alert";
}

function getWalkingStatus(score) {
  const baseline = getWalkingBaseline(5);
  if (baseline === null) return "Building baseline";

  const percentDiff = ((baseline - score) / baseline) * 100;
  if (percentDiff <= 10) return "Stable";
  if (percentDiff <= 20) return "Slight change";
  return "Alert";
}

function getOverallStatus(reactionStatus, walkingStatus) {
  if (reactionStatus === "Alert" || walkingStatus === "Alert") return "Alert";
  if (reactionStatus === "Slight change" || walkingStatus === "Slight change") return "Slight change";
  if (reactionStatus === "Building baseline" || walkingStatus === "Building baseline") return "Building baseline";
  return "Stable";
}

function showCombinedResults() {
  const reactionBaseline = getReactionBaseline(5);
  const walkingBaseline = getWalkingBaseline(5);

  const reactionStatus = getReactionStatus(currentCheck.reactionTime);
  const walkingStatus = getWalkingStatus(currentCheck.walkingScore);
  const overallStatus = getOverallStatus(reactionStatus, walkingStatus);

  let message = "";
  message += "Fatigue: " + currentCheck.fatigue + "/10\n";
  message += "Balance Confidence: " + currentCheck.balanceConfidence + "/10\n\n";

  message += "Reaction Time: " + currentCheck.reactionTime + " ms\n";
  message += "Reaction Status: " + reactionStatus + "\n";
  if (reactionBaseline !== null) {
    message += "Reaction Baseline: " + Math.round(reactionBaseline) + " ms\n";
  }

  message += "\nWalking Stability: " + currentCheck.walkingScore + "/100\n";
  message += "Walking Status: " + walkingStatus + "\n";
  if (walkingBaseline !== null) {
    message += "Walking Baseline: " + Math.round(walkingBaseline) + "/100\n";
  }

  message += "\nOverall Status: " + overallStatus;

  showScreen("result");
  document.getElementById("resultText").innerText = message;
}

function updateHomeStatus() {
  const badge = document.getElementById("statusBadge");
  const summary = document.getElementById("latestSummary");

  const reactionData = getReactionData();
  const walkingScores = getWalkingData();

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
    const latestReaction = reactionData[reactionData.length - 1];
    const reactionBaseline = getReactionBaseline(5);

    if (reactionBaseline === null) {
      reactionText = "Reaction: building baseline";
    } else {
      const percentDiff = ((latestReaction - reactionBaseline) / reactionBaseline) * 100;
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
    const latestWalking = walkingScores[walkingScores.length - 1];
    const walkingBaseline = getWalkingBaseline(5);

    if (walkingBaseline === null) {
      walkingText = "Walking: building baseline";
    } else {
      const percentDiff = ((walkingBaseline - latestWalking) / walkingBaseline) * 100;
      walkingText =
        "Walking: " + latestWalking + "/100 (baseline " + Math.round(walkingBaseline) + "/100)";
    }
  }

  badge.innerText = badgeLabel;
  badge.className = "badge " + badgeClass;
  summary.innerText = reactionText + "\n" + walkingText;
}

function updateReactionHistory() {
  const stats = document.getElementById("historyStats");
  const list = document.getElementById("historyList");

  const data = getReactionData();

  if (data.length === 0) {
    stats.innerText = "No results recorded yet.";
    list.innerHTML = "";
    return;
  }

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const best = Math.min(...data);
  const worst = Math.max(...data);

  stats.innerText =
    "Total tests: " + data.length +
    "\nAverage: " + Math.round(avg) + " ms" +
    "\nBest: " + best + " ms" +
    "\nWorst: " + worst + " ms";

  list.innerHTML = "";
  const recent = [...data].reverse();

  recent.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerText = "Reaction Test " + (data.length - index) + ": " + value + " ms";
    list.appendChild(item);
  });
}

function updateWalkingHistory() {
  const stats = document.getElementById("walkingHistoryStats");
  const list = document.getElementById("walkingHistoryList");

  const data = getWalkingData();

  if (data.length === 0) {
    stats.innerText = "No walking tests recorded yet.";
    list.innerHTML = "";
    return;
  }

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const best = Math.max(...data);
  const worst = Math.min(...data);

  stats.innerText =
    "Total tests: " + data.length +
    "\nAverage: " + Math.round(avg) + "/100" +
    "\nBest: " + best + "/100" +
    "\nLowest: " + worst + "/100";

  list.innerHTML = "";
  const recent = [...data].reverse();

  recent.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerText = "Walking Test " + (data.length - index) + ": " + value + "/100";
    list.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const reactionScreen = document.getElementById("reaction");
  const fatigueSlider = document.getElementById("fatigueSlider");
  const balanceSlider = document.getElementById("balanceSlider");

  fatigueSlider.addEventListener("input", updateSliderValues);
  balanceSlider.addEventListener("input", updateSliderValues);

  reactionScreen.addEventListener("click", function () {
    if (!startTime) return;

    const reactionTime = Date.now() - startTime;
    currentCheck.reactionTime = reactionTime;
    saveReaction(reactionTime);

    startTime = null;
    showScreen("walking");
  });

  updateSliderValues();
  updateHomeStatus();
  updateReactionHistory();
  updateWalkingHistory();
});
