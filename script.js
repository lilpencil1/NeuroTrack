let startTime = null;
let walkingData = [];
let walkingListener = null;
let reactionTimeout = null;
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

  if (reactionTimeout !== null) {
    clearTimeout(reactionTimeout);
  }

  const delay = Math.random() * 3000 + 2000;

  reactionTimeout = setTimeout(() => {
    screen.style.background = "green";
    text.innerText = "TAP!";
    startTime = Date.now();
    reactionTimeout = null;
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
  const reactionStatus = getReactionStatus(currentCheck.reactionTime);
  const walkingStatus = getWalkingStatus(currentCheck.walkingScore);
  const overallStatus = getOverallStatus(reactionStatus, walkingStatus);

  let recommendation = "";

  if (overallStatus === "Alert") {
    recommendation = "Monitor symptoms and consider contacting your provider if this persists.";
  } else if (overallStatus === "Slight change") {
    recommendation = "Consider resting and monitoring changes.";
  } else if (overallStatus === "Stable") {
    recommendation = "No major deviation detected today.";
  } else {
    recommendation = "Baseline is still being built.";
  }

  if (reactionStatus === "Alert" && currentCheck.fatigue >= 7) {
  recommendation += "\nPerformance change may be influenced by fatigue."; 
  }
  
  if (currentCheck.fatigue >= 7 && overallStatus !== "Alert") {
  recommendation += "\nHigh fatigue reported — consider rest.";
}

if (currentCheck.balanceConfidence <= 3 && walkingStatus !== "Alert") {
  recommendation += "\nLow balance confidence — monitor stability closely.";
}

  document.getElementById("resultText").innerText =
    "Overall Status: " + overallStatus + "\n" +
    "Reaction: " + reactionStatus + "\n" +
    "Walking: " + walkingStatus + "\n" +
    "Fatigue: " + currentCheck.fatigue + "/10\n\n" +
    recommendation;

    
  showScreen("result");
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
      walkingText =
        "Walking: " + latestWalking + "/100 (baseline " + Math.round(walkingBaseline) + "/100)";
    }
  }

  badge.innerText = badgeLabel;
  badge.className = "badge " + badgeClass;
  summary.innerText = reactionText + "\n" + walkingText;
}

function drawLineChart(canvasId, data, color, baseline = null, yLabel = "Value") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("No data yet", 20, 30);
    return;
  }

  const leftPad = 48;
  const rightPad = 18;
  const topPad = 20;
  const bottomPad = 34;

  let min = Math.min(...data);
  let max = Math.max(...data);

  if (baseline !== null) {
    min = Math.min(min, baseline);
    max = Math.max(max, baseline);
  }

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const range = max - min;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;

  function getX(index) {
    if (data.length === 1) return leftPad + chartWidth / 2;
    return leftPad + (index / (data.length - 1)) * chartWidth;
  }

  function getY(value) {
    return topPad + ((max - value) / range) * chartHeight;
  }

  // axes
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftPad, topPad);
  ctx.lineTo(leftPad, height - bottomPad);
  ctx.lineTo(width - rightPad, height - bottomPad);
  ctx.stroke();

  // x-axis label
  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Tests", leftPad + chartWidth / 2, height - 8);

  // y-axis label inside canvas so it doesn't get cut off
  ctx.save();
  ctx.translate(16, topPad + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // baseline line
  if (baseline !== null) {
    const baselineY = getY(baseline);

    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(leftPad, baselineY);
    ctx.lineTo(width - rightPad, baselineY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#f59e0b";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Baseline", width - rightPad - 4, baselineY - 6);
  }

  // main data line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  data.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // points
  data.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);

    ctx.fillStyle = index === data.length - 1 ? "#ef4444" : color;
    ctx.beginPath();
    ctx.arc(x, y, index === data.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
function updateReactionHistory() {
  const stats = document.getElementById("historyStats");
  const list = document.getElementById("historyList");

  const data = getReactionData();

  if (data.length === 0) {
    stats.innerText = "No results recorded yet.";
    list.innerHTML = "";
    drawLineChart("reactionChart", [], "#0d9488", null, "Reaction Time");
    return;
  }

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const best = Math.min(...data);
  const worst = Math.max(...data);
  const baseline = getReactionBaseline(5);

stats.innerText =
  "Total tests: " + data.length + "\n" +
  "Average: " + Math.round(avg) + " ms\n" +
  "Baseline: " + (baseline !== null ? Math.round(baseline) + " ms" : "Building") + "\n" +
  "Best: " + best + " ms\n" +
  "Worst: " + worst + " ms";

  let insight = "";

  if (baseline !== null) {
    const latest = data[data.length - 1];
    const percentDiff = ((latest - baseline) / baseline) * 100;

    if (percentDiff <= 10) {
      insight = "Status: Stable";
    } else if (percentDiff <= 20) {
      insight = "Status: Slight change";
    } else {
      insight = "Status: Alert";
    }
  } else {
    insight = "Status: Building baseline";
  }

  stats.innerText += "\n" + insight;

  drawLineChart("reactionChart", data, "#0d9488", baseline, "Reaction Time");

  list.innerHTML = "";
  const recent = [...data].reverse().slice(0, 3);

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
  const baseline = getWalkingBaseline(5);

  if (data.length === 0) {
    stats.innerText = "No walking tests recorded yet.";
    list.innerHTML = "";
    drawLineChart("walkingChart", [], "#7c3aed", null, "Walking Score");
    return;
  }

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const best = Math.max(...data);
  const worst = Math.min(...data);

  stats.innerText =
  "Total tests: " + data.length + "\n" +
  "Average: " + Math.round(avg) + "/100\n" +
  "Baseline: " + (baseline !== null ? Math.round(baseline) + "/100" : "Building") + "\n" +
  "Best: " + best + "/100\n" +
  "Lowest: " + worst + "/100";

  let insight = "";

  if (baseline !== null) {
    const latest = data[data.length - 1];
    const percentDiff = ((baseline - latest) / baseline) * 100;

    if (percentDiff <= 10) {
      insight = "Status: Stable";
    } else if (percentDiff <= 20) {
      insight = "Status: Slight change";
    } else {
      insight = "Status: Alert";
    }
  } else {
    insight = "Status: Building baseline";
  }

  stats.innerText += "\n" + insight;

  drawLineChart("walkingChart", data, "#7c3aed", baseline, "Walking Score");

  list.innerHTML = "";
  const recent = [...data].reverse();

  recent.forEach((value, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerText = "Walking Test " + (data.length - index) + ": " + value + "/100";
    list.appendChild(item);
  });
}

function downloadHistoryReportPDF() {
  const reactionData = getReactionData();
  const walkingData = getWalkingData();

  const reactionBaseline = getReactionBaseline(5);
  const walkingBaseline = getWalkingBaseline(5);

  let reactionRows = "";
  if (reactionData.length === 0) {
    reactionRows = "<tr><td colspan='3'>No reaction history available.</td></tr>";
  } else {
    reactionData.forEach((value, index) => {
      let status = "Building baseline";

      if (reactionBaseline !== null) {
        const percentDiff = ((value - reactionBaseline) / reactionBaseline) * 100;
        if (percentDiff <= 10) {
          status = "Stable";
        } else if (percentDiff <= 20) {
          status = "Slight change";
        } else {
          status = "Alert";
        }
      }

      reactionRows +=
        "<tr>" +
          "<td>" + (index + 1) + "</td>" +
          "<td>" + value + " ms</td>" +
          "<td>" + status + "</td>" +
        "</tr>";
    });
  }

  let walkingRows = "";
  if (walkingData.length === 0) {
    walkingRows = "<tr><td colspan='3'>No walking history available.</td></tr>";
  } else {
    walkingData.forEach((value, index) => {
      let status = "Building baseline";

      if (walkingBaseline !== null) {
        const percentDiff = ((walkingBaseline - value) / walkingBaseline) * 100;
        if (percentDiff <= 10) {
          status = "Stable";
        } else if (percentDiff <= 20) {
          status = "Slight change";
        } else {
          status = "Alert";
        }
      }

      walkingRows +=
        "<tr>" +
          "<td>" + (index + 1) + "</td>" +
          "<td>" + value + "/100</td>" +
          "<td>" + status + "</td>" +
        "</tr>";
    });
  }

  const today = new Date().toLocaleDateString();

  const reportHTML = `
    <html>
    <head>
      <title>NeuroTrack History Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 32px;
          color: #111827;
        }

        h1, h2 {
          margin-bottom: 8px;
        }

        p {
          margin-top: 4px;
          margin-bottom: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }

        th, td {
          border: 1px solid #d1d5db;
          padding: 10px;
          text-align: left;
        }

        th {
          background: #f3f4f6;
        }

        .section {
          margin-top: 24px;
        }

        .note {
          margin-top: 30px;
          font-size: 14px;
          color: #4b5563;
        }
      </style>
    </head>
    <body>
      <h1>NeuroTrack History Report</h1>
      <p><strong>Date:</strong> ${today}</p>

      <div class="section">
        <h2>Summary</h2>
        <p><strong>Reaction Baseline:</strong> ${
          reactionBaseline !== null ? Math.round(reactionBaseline) + " ms" : "Building baseline"
        }</p>
        <p><strong>Walking Baseline:</strong> ${
          walkingBaseline !== null ? Math.round(walkingBaseline) + "/100" : "Building baseline"
        }</p>
      </div>

      <div class="section">
        <h2>Reaction History</h2>
        <table>
          <tr>
            <th>Test</th>
            <th>Reaction Time</th>
            <th>Status</th>
          </tr>
          ${reactionRows}
        </table>
      </div>

      <div class="section">
        <h2>Walking History</h2>
        <table>
          <tr>
            <th>Test</th>
            <th>Walking Score</th>
            <th>Status</th>
          </tr>
          ${walkingRows}
        </table>
      </div>

      <div class="section">
        <h2>Latest Self-Report</h2>
        <p><strong>Fatigue:</strong> ${
          currentCheck.fatigue !== null ? currentCheck.fatigue + "/10" : "N/A"
        }</p>
        <p><strong>Balance Confidence:</strong> ${
          currentCheck.balanceConfidence !== null ? currentCheck.balanceConfidence + "/10" : "N/A"
        }</p>
      </div>

      <p class="note">
        Note: This tool provides self-monitoring insights and is not a medical diagnosis.
      </p>
    </body>
    </html>
  `;

  const reportWindow = window.open("", "_blank");
  reportWindow.document.open();
  reportWindow.document.write(reportHTML);
  reportWindow.document.close();

  reportWindow.focus();
  reportWindow.print();
}

document.addEventListener("DOMContentLoaded", function () {
  const reactionScreen = document.getElementById("reaction");
  const fatigueSlider = document.getElementById("fatigueSlider");
  const balanceSlider = document.getElementById("balanceSlider");

  fatigueSlider.addEventListener("input", updateSliderValues);
  balanceSlider.addEventListener("input", updateSliderValues);

  reactionScreen.addEventListener("click", function () {
    if (startTime === null) {
      const text = document.getElementById("reactionText");
      reactionScreen.style.background = "red";
      text.innerText = "Too early! Restarting...";

      if (reactionTimeout !== null) {
        clearTimeout(reactionTimeout);
        reactionTimeout = null;
      }

      setTimeout(() => {
        startReactionTest();
      }, 1000);

      return;
    }

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

