let questions=[],startTime,timerInterval,currentMode="";
let history=JSON.parse(localStorage.getItem("history"))||[];
let ranking=JSON.parse(localStorage.getItem("ranking"))||{};

function setMode(m){
 currentMode=m;
 document.getElementById("selected").innerText="Selected: "+m;
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
 questions=[];for(let i=0;i<50;i++)questions.push(genQ(currentMode));
 document.getElementById("home").style.display="none";
 document.getElementById("quiz").style.display="block";
 renderQ();
 startTime=Date.now();
 timerInterval=setInterval(()=>document.getElementById("timer").innerText=Math.floor((Date.now()-startTime)/1000)+"s",1000);
}

function renderQ(){
 let html="";
 questions.forEach((q,i)=>{
  html+=`<div class="question" id="q${i}">
  ${i+1}. ${q.q}=<input inputmode="numeric" id="a${i}" onkeydown="next(event,${i})">
  </div>`;
 });
 document.getElementById("questions").innerHTML=html;
}

function next(e,i){
 if(e.key==="Enter"){
  let n=document.getElementById("a"+(i+1));
  if(n)n.focus(); else submitQuiz();
 }
}

function submitQuiz(){
 clearInterval(timerInterval);
 let t=Math.floor((Date.now()-startTime)/1000);
 let all=true,firstWrong=-1;

 // preserve values into attributes
 questions.forEach((q,i)=>{
  let input=document.getElementById("a"+i);
  let v=input.value;
  input.setAttribute("value", v);

  let el=document.getElementById("q"+i);
  if(v!=q.ans){
    el.classList.add("wrong");
    all=false;
    if(firstWrong==-1)firstWrong=i;
  }
 });

 history.push({date:new Date().toISOString().slice(0,10),mode:currentMode,time:t,perfect:all});
 localStorage.setItem("history",JSON.stringify(history));

 if(all){
  let name=prompt("Name:");
  ranking[currentMode]=ranking[currentMode]||[];
  ranking[currentMode].push({name,time:t});
  ranking[currentMode].sort((a,b)=>a.time-b.time);
  ranking[currentMode]=ranking[currentMode].slice(0,10);
  localStorage.setItem("ranking",JSON.stringify(ranking));
 }

 let html="<h2>Result</h2>";
 html+=all?`<h3>Perfect ${t}s</h3>`:`<h3>Not Perfect</h3>`;
 html+=document.getElementById("questions").innerHTML;

 if(all){
  html+="<h3>Top 10</h3>";
  ranking[currentMode].forEach(r=>html+=`<p>${r.name} - ${r.time}s</p>`);
 }

 html+=`<button onclick="retry()">Retry</button><button onclick="backMenu()">Menu</button>`;

 document.getElementById("quiz").style.display="none";
 document.getElementById("result").style.display="block";
 document.getElementById("result").innerHTML=html;

 if(firstWrong!=-1)setTimeout(()=>document.getElementById("q"+firstWrong).scrollIntoView({behavior:"smooth"}),100);
}

function retry(){document.getElementById("result").style.display="none";startQuiz();}
function backMenu(){document.getElementById("result").style.display="none";document.getElementById("report").style.display="none";document.getElementById("home").style.display="block";}

function openReport(){
 document.getElementById("home").style.display="none";
 document.getElementById("report").style.display="block";
 document.getElementById("report").innerHTML=`<h2>Report</h2>
 <button onclick="quick(0)">Today</button>
 <button onclick="quick(7)">7 Days</button>
 <button onclick="quick(30)">30 Days</button><br><br>
 <input type="date" id="s"><br><br>
 <input type="date" id="e"><br><br>
 <button onclick="genReport()">Generate</button><br><br>
 <button onclick="backMenu()">Back</button>`;
}

function quick(d){
 let t=new Date();
 let s=new Date();s.setDate(t.getDate()-d);
 document.getElementById("s").value=s.toISOString().slice(0,10);
 document.getElementById("e").value=t.toISOString().slice(0,10);
}

function genReport(){
 let s=document.getElementById("s").value;
 let e=document.getElementById("e").value;
 let data=history.filter(x=>x.date>=s && x.date<=e);

 let count={},perf={};

 data.forEach(d=>{
  count[d.mode]=(count[d.mode]||0)+1;
  perf[d.mode]=perf[d.mode]||[];
  perf[d.mode].push(d.time);
 });

 let html="<h3>Summary</h3>";
 for(let k in count){
  let arr=perf[k];
  let trend="No progress";
  if(arr.length>=2){
    if(arr[arr.length-1]<arr[0])trend="Improving";
    if(arr[arr.length-1]>arr[0])trend="Slower";
  }
  html+=`<p>${k} (${count[k]}x) - ${trend}</p>`;
 }

 document.getElementById("report").innerHTML+=html;
}
