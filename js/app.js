// app.js - Shared logic and state for Civics App

// Audio context
var C = new (window.AudioContext || window.webkitAudioContext)();
var muted = false;

// Persisted State
var mistakes = new Set(JSON.parse(localStorage.getItem("civics_mistakes") || "[]"));
var successes = new Set(JSON.parse(localStorage.getItem("civics_successes") || "[]"));
var civics_stats = JSON.parse(localStorage.getItem("civics_stats") || '{"examsPassed":0, "openCorrect":0, "openWrong":0}');
if (!civics_stats.openCorrect) civics_stats.openCorrect = 0;
if (!civics_stats.openWrong) civics_stats.openWrong = 0;

function saveSets() {
  localStorage.setItem("civics_mistakes", JSON.stringify(Array.from(mistakes)));
  localStorage.setItem("civics_successes", JSON.stringify(Array.from(successes)));
  localStorage.setItem("civics_stats", JSON.stringify(civics_stats));
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function beep(f, t, vol) {
  if (muted) return;
  if (C.state === "suspended") C.resume();
  var o = C.createOscillator(), g = C.createGain();
  o.type = "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(vol, C.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, C.currentTime + t);
  o.connect(g); g.connect(C.destination);
  o.start(); o.stop(C.currentTime + t);
}

function playCorrect() { beep(600, 0.2, 0.2); setTimeout(function () { beep(800, 0.3, 0.2); }, 100); }
function playWrong() { beep(300, 0.4, 0.3); setTimeout(function () { beep(250, 0.4, 0.3); }, 150); }

function toggleMute() {
  muted = !muted;
  var muteBtn = document.getElementById("muteBtn");
  if(muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
}

function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

function openStats() {
  var ts = civics_stats;
  var html = '<div class="stat-row"><span>מבחנים שעברת בהצלחה (90%+):</span> <span class="stat-val">' + ts.examsPassed + '</span></div>';
  html += '<div class="stat-row" style="color:#d97706; font-weight:bold;"><span>שאלות פתוחות (שלב 2) נכונות:</span> <span class="stat-val" style="color:#b45309;">' + ts.openCorrect + '</span></div>';
  html += '<div class="stat-row" style="color:#d97706; font-weight:bold;"><span>שאלות פתוחות (שלב 2) שגויות:</span> <span class="stat-val" style="color:#b45309;">' + ts.openWrong + '</span></div>';
  html += '<hr style="border:1px solid #e2e8f0; margin:15px 0;">';
  
  // If we are on a page where QUESTIONS is loaded (stage1), show per-topic breakdowns
  if (typeof QUESTIONS !== 'undefined') {
    [1, 2, 3, 4].forEach(function (t) {
      var tQ = QUESTIONS.filter(function (q) { return q.topicId == t; });
      var tS = tQ.filter(function (q) { return successes.has(q.id); }).length;
      var pct = Math.round((tS / Math.max(1, tQ.length)) * 100);
      html += '<div class="stat-row"><span>נושא ' + t + ' הושלם:</span> <span class="stat-val">' + pct + '% (' + tS + '/' + tQ.length + ')</span></div>';
    });
  }
  
  var statsContent = document.getElementById("statsContent");
  if (statsContent) {
    statsContent.innerHTML = html;
    openModal("statsModal");
  }
}

function toggleHelp() {
  var box = document.getElementById("helpBox");
  if (box) box.style.display = box.style.display === "block" ? "none" : "block";
}

function resetAll() {
  if (!confirm("האם לאפס את כל הנתונים, הסטטיסטיקות וההצלחות? פעולה זו אינה הפיכה.")) return;
  mistakes.clear();
  successes.clear();
  civics_stats = { examsPassed: 0, openCorrect: 0, openWrong: 0 };
  saveSets();
  alert("הנתונים אופסו בהצלחה.");
  window.location.reload();
}
