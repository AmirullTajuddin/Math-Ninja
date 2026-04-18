let questions=[],startTime,timerInterval,currentMode="";
const rankingKey="ranking";
const questionCount=5;

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

function getRanking(){
 try{
  return JSON.parse(localStorage.getItem(rankingKey))||{};
 }catch(e){
  return {};
 }
}

function saveRanking(data){
 localStorage.setItem(rankingKey, JSON.stringify(data));
}

function formatTime(totalSeconds){
 let minutes=Math.floor(totalSeconds/60);
 let seconds=totalSeconds%60;
 return minutes?`${minutes}m ${seconds}s`:`${seconds}s`;
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
}

function submitScore(){
 let nameInput=document.getElementById("playerName");
 if(!nameInput)return;

 let name=nameInput.value.trim()||"Player";
 let mode=nameInput.getAttribute("data-mode");
 let timeTaken=Number(nameInput.getAttribute("data-time"));

 savePerfectScore(mode,timeTaken,name);
 openRanking();
}

function resetTimer(){
 clearInterval(timerInterval);
 document.getElementById("timer").innerText="0s";
}

function setMode(m,el){
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
 if(!currentMode)return alert("select mode");
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

 let html="<h2>Result</h2>";
 html+=all?"<h3>Perfect</h3>":"<h3>Not Perfect</h3>";
 if(all){
  html+=`<p>Masa: ${formatTime(timeTaken)}</p>`;
  html+=`
  <div class="save-score-box">
  <p class="ranking-note">Masukkan nama untuk simpan ke ranking.</p>
  <input id="playerName" data-mode="${currentMode}" data-time="${timeTaken}" maxlength="20" placeholder="Nama pemain">
  <button onclick="submitScore()">Simpan Ranking</button>
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
 document.getElementById("home").style.display="block";
}

function openReport(){
 document.getElementById("home").style.display="none";
 document.getElementById("ranking").style.display="none";
 document.getElementById("report").style.display="block";
 document.getElementById("report").innerHTML="<h2>Report</h2><button onclick='backMenu()'>Back</button>";
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
 let html=`<h2>Top 10 Ranking</h2><p class='ranking-note'>Ranking direkod hanya bila semua ${questionCount} jawapan betul.</p>`;
 html+="<div class='ranking-grid'>";
 modes.forEach(mode=>{
  html+=renderRankingMode(mode, ranking[mode]||[]);
 });
 html+="</div><button onclick='backMenu()'>Back</button>";

 document.getElementById("home").style.display="none";
 document.getElementById("report").style.display="none";
 document.getElementById("ranking").style.display="block";
 document.getElementById("ranking").innerHTML=html;
}
