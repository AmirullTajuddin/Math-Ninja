let questions=[],startTime,timerInterval,currentMode="";
const rankingKey="ranking";
const historyKey="sessionHistory";
const locksKey="lockedModes";
const parentPinKey="parentPin";
const questionCount=50;

const modeLabels={
 add1:"Tambah 1 digit + 1 digit",
 add2:"Tambah 2 digit + 2 digit",
 add3:"Tambah 3 digit + 3 digit",
 mul1:"Darab 1 x 1",
 mul2:"Darab 2 x 1",
 mul3:"Darab 2 x 2",
 div1:"Bahagi 2 digit / 1 digit",
 div2:"Bahagi 3 digit / 1 digit"
};

function readStorage(key,fallback){
 try{
  return JSON.parse(localStorage.getItem(key))??fallback;
 }catch(e){
  return fallback;
 }
}

function writeStorage(key,data){
 localStorage.setItem(key, JSON.stringify(data));
}

function getRanking(){
 return readStorage(rankingKey,{});
}

function saveRanking(data){
 writeStorage(rankingKey,data);
}

function getSessionHistory(){
 return readStorage(historyKey,[]);
}

function saveSessionHistory(data){
 writeStorage(historyKey,data);
}

function getLockedModes(){
 return readStorage(locksKey,{});
}

function saveLockedModes(data){
 writeStorage(locksKey,data);
}

function getParentPin(){
 return localStorage.getItem(parentPinKey)||"";
}

function setParentPin(pin){
 localStorage.setItem(parentPinKey,pin);
}

function getModeFamily(mode){
 if(mode.startsWith("add")) return "add";
 if(mode.startsWith("mul")) return "mul";
 return "div";
}

function formatTime(totalSeconds){
 let minutes=Math.floor(totalSeconds/60);
 let seconds=totalSeconds%60;
 return minutes?`${minutes}m ${seconds}s`:`${seconds}s`;
}

function recordAttempt(mode,perfect,timeTaken){
 let history=getSessionHistory();
 history.push({
  mode:mode,
  perfect:perfect,
  time:timeTaken,
  timestamp:Date.now()
 });
 saveSessionHistory(history);
 evaluateModeLock(mode);
}

function evaluateModeLock(mode){
 let history=getSessionHistory();
 let lastThree=history.slice(-3);
 if(lastThree.length<3) return;
 if(!lastThree.every(item=>item.mode===mode&&item.perfect)) return;

 let times=lastThree.map(item=>item.time);
 let maxTime=Math.max(...times);
 let minTime=Math.min(...times);
 let difference=maxTime-minTime;

 if(difference<=1){
  let lockedModes=getLockedModes();
  lockedModes[mode]=true;
  saveLockedModes(lockedModes);
  renderModeLocks();
 }
}

function unlockFamilyModes(mode){
 let family=getModeFamily(mode);
 let lockedModes=getLockedModes();

 Object.keys(lockedModes).forEach(key=>{
  if(getModeFamily(key)===family&&key!==mode){
   delete lockedModes[key];
  }
 });

 saveLockedModes(lockedModes);
 renderModeLocks();
}

function unlockMode(mode){
 let lockedModes=getLockedModes();
 delete lockedModes[mode];
 saveLockedModes(lockedModes);
 renderModeLocks();
 renderParentReport();
}

function unlockAllModes(){
 saveLockedModes({});
 renderModeLocks();
 renderParentReport();
}

function isModeLocked(mode){
 return !!getLockedModes()[mode];
}

function renderModeLocks(){
 document.querySelectorAll(".mode-btn").forEach(button=>{
  let mode=button.dataset.mode;
  button.classList.toggle("locked", isModeLocked(mode));
 });
}

function savePerfectScore(mode,timeTaken,name){
 let ranking=getRanking();
 if(!ranking[mode]) ranking[mode]=[];

 ranking[mode].push({
  name:name,
  time:timeTaken
 });

 ranking[mode].sort((a,b)=>a.time-b.time);
 ranking[mode]=ranking[mode].slice(0,10);
 saveRanking(ranking);
 unlockFamilyModes(mode);
}

function submitScore(){
 let nameInput=document.getElementById("playerName");
 if(!nameInput)return;
 if(nameInput.getAttribute("data-saved")==="yes") return;

 let name=nameInput.value.trim()||"Player";
 let mode=nameInput.getAttribute("data-mode");
 let timeTaken=Number(nameInput.getAttribute("data-time"));
 let saveButton=document.getElementById("saveRankingBtn");

 savePerfectScore(mode,timeTaken,name);
 nameInput.setAttribute("data-saved","yes");
 nameInput.disabled=true;
 if(saveButton){
  saveButton.disabled=true;
  saveButton.innerText="Saved";
 }
 openRanking();
}

function resetTimer(){
 clearInterval(timerInterval);
 let timer=document.getElementById("timer");
 if(timer) timer.innerText="0s";
}

function setMode(m,el){
 if(isModeLocked(m)){
  alert("Set ini sudah dikuasai. Cuba set lain dahulu ya.");
  return;
 }

 currentMode=m;
 document.getElementById("selected").innerText="Mode dipilih: "+(modeLabels[m]||m);
 document.querySelectorAll(".mode-btn").forEach(b=>b.classList.remove("selected"));
 el.classList.add("selected");
}

function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}

function genQ(m){
 let a,b;
 if(m.startsWith("add")){a=rand(10**(m[3]-1),10**m[3]-1);b=rand(10**(m[3]-1),10**m[3]-1);return{q:`${a}+${b}`,ans:a+b};}
 if(m.startsWith("mul")){a=rand(10**(m[3]-1),10**m[3]-1);b=rand(10**(m[3]-1),10**m[3]-1);return{q:`${a}×${b}`,ans:a*b};}
 let d=rand(2,9),ans=rand(2,20);return{q:`${d*ans}÷${d}`,ans:ans};
}

function next(e,i){
 if(e.key==="Enter"){
  let nextInput=document.getElementById("a"+(i+1));
  if(nextInput){
    nextInput.focus();
  } else {
    submitQuiz();
  }
 }
}

function startQuiz(){
 if(!currentMode)return alert("Select a mode first.");
 if(isModeLocked(currentMode))return alert("Set ini sudah dikuasai. Cuba set lain dahulu ya.");

 resetTimer();
 questions=[];
 for(let i=0;i<questionCount;i++)questions.push(genQ(currentMode));

 document.getElementById("home").style.display="none";
 document.getElementById("quiz").style.display="block";

 let html="";
 questions.forEach((q,i)=>{
  html+=`<div class="question" id="q${i}">
  ${i+1}. ${q.q}=<input inputmode="numeric" id="a${i}" onkeydown="next(event, ${i})">
  </div>`;
 });
 document.getElementById("questions").innerHTML=html;

 startTime=Date.now();
 timerInterval=setInterval(()=>{
  document.getElementById("timer").innerText=Math.floor((Date.now()-startTime)/1000)+"s";
 },1000);
}

function submitQuiz(){
 clearInterval(timerInterval);
 let all=true,firstWrong=-1;
 let timeTaken=Math.floor((Date.now()-startTime)/1000);

 questions.forEach((q,i)=>{
  let input=document.getElementById("a"+i);
  let v=input.value;
  input.setAttribute("value",v);

  if(v!=q.ans){
    document.getElementById("q"+i).classList.add("wrong");
    all=false;
    if(firstWrong===-1) firstWrong=i;
  }
 });

 recordAttempt(currentMode,all,timeTaken);

 let html="<h2>Result</h2>";
 html+=all?"<h3>Perfect</h3>":"<h3>Not Perfect</h3>";
 if(all){
  html+=`<p>Masa: ${formatTime(timeTaken)}</p>`;
  html+=`
  <div class="save-score-box">
  <p class="ranking-note">Masukkan nama untuk simpan ke ranking.</p>
  <input id="playerName" data-mode="${currentMode}" data-time="${timeTaken}" data-saved="no" maxlength="20" placeholder="Nama pemain">
  <button id="saveRankingBtn" onclick="submitScore()">Simpan Ranking</button>
  </div>
  `;
 }
 html+=document.getElementById("questions").innerHTML;

 html+=`
 <button onclick="retry()">Retry</button>
 <button onclick="backMenu()">Menu</button>
 `;

 document.getElementById("quiz").style.display="none";
 document.getElementById("result").style.display="block";
 document.getElementById("result").innerHTML=html;

 if(firstWrong!==-1){
  setTimeout(()=>{
    document.getElementById("q"+firstWrong).scrollIntoView({behavior:"smooth"});
  },100);
 }
}

function retry(){
 document.getElementById("result").style.display="none";
 startQuiz();
}

function backMenu(){
 resetTimer();
 document.getElementById("result").style.display="none";
 document.getElementById("report").style.display="none";
 document.getElementById("ranking").style.display="none";
 document.getElementById("quiz").style.display="none";
 document.getElementById("home").style.display="block";
 renderModeLocks();
}

function buildParentSummary(){
 let history=getSessionHistory();
 if(!history.length){
  return "<p class='empty-state'>Belum ada data latihan lagi.</p>";
 }

 let perfectCount=history.filter(item=>item.perfect).length;
 return `
 <div class="report-summary">
 <div class="summary-card"><strong>${history.length}</strong><span>Jumlah sesi</span></div>
 <div class="summary-card"><strong>${perfectCount}</strong><span>Sesi perfect</span></div>
 </div>
 `;
}

function buildLockedModesList(){
 let lockedModes=Object.keys(getLockedModes());
 if(!lockedModes.length){
  return "<p class='empty-state'>Tiada set yang sedang diblock.</p>";
 }

 return lockedModes.map(mode=>`
 <div class="report-row">
 <span>${modeLabels[mode]||mode}</span>
 <button onclick="unlockMode('${mode}')">Unblock</button>
 </div>
 `).join("");
}

function renderParentReport(){
 let html=`
 <div class="report-header">
 <h2>Parent Report</h2>
 <button onclick="backMenu()">Back</button>
 </div>
 <div class="report-panel password-room">
 <h3>Parent PIN</h3>
 <p class="ranking-note">PIN 4 digit sedang aktif. Anda boleh tukar PIN di bawah.</p>
 <div class="pin-row">
 <input id="newParentPin" inputmode="numeric" maxlength="4" placeholder="New 4-digit PIN">
 <button onclick="changeParentPin()">Save PIN</button>
 </div>
 </div>
 <div class="report-panel">
 <h3>Ringkasan</h3>
 ${buildParentSummary()}
 </div>
 <div class="report-panel">
 <div class="report-actions">
 <h3>Blocked Sets</h3>
 <button onclick="unlockAllModes()">Unlock All</button>
 </div>
 ${buildLockedModesList()}
 </div>
 `;

 document.getElementById("home").style.display="none";
 document.getElementById("ranking").style.display="none";
 document.getElementById("report").style.display="block";
 document.getElementById("report").innerHTML=html;
}

function openReport(){
 let pin=getParentPin();
 if(!pin){
  document.getElementById("home").style.display="none";
  document.getElementById("ranking").style.display="none";
  document.getElementById("report").style.display="block";
  document.getElementById("report").innerHTML=`
  <div class="report-header">
  <h2>Set Parent PIN</h2>
  <button onclick="backMenu()">Back</button>
  </div>
  <div class="report-panel">
  <p class="ranking-note">Buat PIN 4 digit untuk buka parent report.</p>
  <input id="setupParentPin" inputmode="numeric" maxlength="4" placeholder="4-digit PIN">
  <input id="confirmParentPin" inputmode="numeric" maxlength="4" placeholder="Confirm PIN">
  <button onclick="setupParentPin()">Save PIN</button>
  </div>
  `;
  return;
 }

 document.getElementById("home").style.display="none";
 document.getElementById("ranking").style.display="none";
 document.getElementById("report").style.display="block";
 document.getElementById("report").innerHTML=`
 <div class="report-header">
 <h2>Enter Parent PIN</h2>
 <button onclick="backMenu()">Back</button>
 </div>
 <div class="report-panel">
 <p class="ranking-note">Masukkan PIN untuk buka parent report.</p>
 <input id="parentPinEntry" inputmode="numeric" maxlength="4" placeholder="4-digit PIN">
 <button onclick="verifyParentPin()">Open Report</button>
 </div>
 `;
}

function setupParentPin(){
 let pin=document.getElementById("setupParentPin").value.trim();
 let confirm=document.getElementById("confirmParentPin").value.trim();
 if(!/^\d{4}$/.test(pin)) return alert("PIN mesti 4 digit.");
 if(pin!==confirm) return alert("PIN tidak sama.");
 setParentPin(pin);
 renderParentReport();
}

function verifyParentPin(){
 let pin=document.getElementById("parentPinEntry").value.trim();
 if(pin!==getParentPin()) return alert("PIN tidak betul.");
 renderParentReport();
}

function changeParentPin(){
 let newPin=document.getElementById("newParentPin").value.trim();
 if(!/^\d{4}$/.test(newPin)) return alert("PIN mesti 4 digit.");
 setParentPin(newPin);
 alert("PIN berjaya dikemaskini.");
 renderParentReport();
}

function renderRankingMode(mode,list){
 let rows=list.length
  ? list.map((item,index)=>`<div class="rank-row"><span>${index+1}. ${item.name}</span><strong>${formatTime(item.time)}</strong></div>`).join("")
  : "<p class='empty-state'>Belum ada rekod lagi.</p>";

 return `
 <div class="ranking-card">
 <h3>${modeLabels[mode]||mode}</h3>
 ${rows}
 </div>
 `;
}

function openRanking(){
 let ranking=getRanking();
 let modes=Object.keys(modeLabels);
 let html=`<div class="report-header"><h2>Top 10 Ranking</h2><button onclick="backMenu()">Back</button></div><p class='ranking-note'>Ranking direkod hanya bila semua ${questionCount} jawapan betul.</p>`;
 html+="<div class='ranking-grid'>";
 modes.forEach(mode=>{
  html+=renderRankingMode(mode, ranking[mode]||[]);
 });
 html+="</div>";

 document.getElementById("home").style.display="none";
 document.getElementById("report").style.display="none";
 document.getElementById("ranking").style.display="block";
 document.getElementById("ranking").innerHTML=html;
}

renderModeLocks();
