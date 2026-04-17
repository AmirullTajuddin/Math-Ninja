let questions=[],startTime,timerInterval,currentMode="";
function resetTimer(){
 clearInterval(timerInterval);
 document.getElementById("timer").innerText="0s";
}

function setMode(m,el){
 currentMode=m;
 document.getElementById("selected").innerText="Selected: "+m;
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

function startQuiz(){
 if(!currentMode)return alert("select mode");
 resetTimer();
 questions=[];
 for(let i=0;i<50;i++)questions.push(genQ(currentMode));

 document.getElementById("home").style.display="none";
 document.getElementById("quiz").style.display="block";

 let html="";
 questions.forEach((q,i)=>{
  html+=`<div class="question" id="q${i}">
  ${i+1}. ${q.q}=<input inputmode="numeric" id="a${i}">
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
 let all=true;
 questions.forEach((q,i)=>{
  let v=document.getElementById("a"+i).value;
  if(v!=q.ans){
    document.getElementById("q"+i).classList.add("wrong");
    all=false;
  }
 });
 document.getElementById("quiz").style.display="none";
 document.getElementById("result").style.display="block";
 document.getElementById("result").innerHTML=all?"<h2>Perfect</h2>":"<h2>Not Perfect</h2>";
}

function openReport(){
 document.getElementById("home").style.display="none";
 document.getElementById("report").style.display="block";
 document.getElementById("report").innerHTML="<h2>Report</h2><button onclick='backMenu()'>Back</button>";
}

function backMenu(){
 resetTimer();
 document.getElementById("result").style.display="none";
 document.getElementById("report").style.display="none";
 document.getElementById("home").style.display="block";
}
