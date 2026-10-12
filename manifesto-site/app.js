'use strict';
const $ = (id) => document.getElementById(id);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const safe = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimeout;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').classList.remove('show'), 2600); }
let storageAvailable = true;
function read(key, fallback) { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch { storageAvailable = false; return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageAvailable = false; return false; } }
const details = [
{label:'TYPOGRAPHY / 字体与层级', title:'以红色书名，\n建立第一眼的力量。', text:'书名以深红色大字呈现，形成封面的视觉中心。宋体风格的字形呼应经典阅读的气质；作者信息采用较小的黑字，让标题、作者与图像各有清晰的位置。', meta:'辨识度 · 层次 · 庄重'},
{label:'PAPER / 色彩与纸感', title:'用温润米白，\n留住阅读的呼吸。', text:'米白底色与细腻的纸张纹理，为经典文本创造温和的阅读氛围。留白让视觉节奏更从容，也给书名、作者与线描插图留出彼此独立的空间。这里的纸感来自效果图，实物可按打印条件选择相近纸张。', meta:'温度 · 留白 · 阅读感'},
{label:'ILLUSTRATION / 书籍线描', title:'让打开的书，\n成为思想的入口。', text:'展开的书本、叠放的书籍与散落的纸页共同组成线描图像。黑白线条呼应文献与阅读的视觉联想，把“研读经典”的主题转化为具象画面，并与红色标题形成主次关系。', meta:'阅读 · 文献 · 思想积累'},
{label:'BELLY BAND / 腰封与主题', title:'以深红与金色，\n让实践主题发声。', text:'深红腰封将金色主题文字托起：“从经典出发，在实践中思考。”这句话是本次设计的主题表达。腰封可以独立拆取，使作品在完整展示与纯粹阅读之间自然切换。', meta:'主题表达 · 视觉焦点 · 可拆取'}
];
function setDetail(index) { const d = details[index]; $('detailNo').textContent = String(index+1).padStart(2,'0'); $('detailLabel').textContent = d.label; $('detailTitle').innerHTML = safe(d.title).replace('\n','<br>'); $('detailText').textContent = d.text; $('detailMeta').textContent = '设计关键词　/　' + d.meta; $$('[data-detail]').forEach(b => { const active = Number(b.dataset.detail) === index; b.classList.toggle('active',active); b.setAttribute('aria-pressed', String(active)); }); }
$$('[data-detail]').forEach(b => b.addEventListener('click', () => setDetail(Number(b.dataset.detail))));
$('compareRange').addEventListener('input', (e) => { const v = Number(e.target.value); $('compareBefore').style.clipPath = `inset(0 ${100-v}% 0 0)`; $('compareLine').style.left = v + '%'; });
$$('[data-color]').forEach(b => b.addEventListener('click', async () => { const value = b.dataset.color; try { await navigator.clipboard.writeText(value); toast('已复制配色：'+value); } catch { toast('色值：'+value+'，可手动复制'); } }));
const folds = [
['后勒口 · 补充经典背景','介绍经典的历史意义，为封底信息提供延伸阅读空间。'],
['封底 · 作品信息的延伸','以内容简介补充书籍信息，布局与封面的字体、颜色保持统一。'],
['书脊 · 书架上的识别','集中呈现书名与作者，让书籍侧面也具有清晰的辨识度。书脊厚度应按真实书芯测量。'],
['封面 · 阅读的入口','以书名、作者和书籍线描建立信息层级，是读者认识作品的第一视角。'],
['前勒口 · 阅读的邀请','用阅读说明与阅读导引，为进入经典文本提供思路。']
];
$$('[data-fold]').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.fold); $('foldTitle').textContent = folds[n][0]; $('foldText').textContent = folds[n][1]; $$('[data-fold]').forEach(x => { const active = x===b; x.classList.toggle('active',active); x.setAttribute('aria-pressed',String(active)); }); }));
let zoom = 100;
function changeZoom(value) { zoom = Math.max(100,Math.min(250,value)); $('boardFull').style.width = zoom+'%'; $('zoomValue').textContent = zoom+'%'; $('zoomOut').disabled = zoom===100; $('zoomIn').disabled = zoom===250; }
function openBoard() { changeZoom(100); $('boardDialog').showModal(); $('boardScroll').scrollTo(0,0); }
$('openBoard').addEventListener('click',openBoard); $('boardImageButton').addEventListener('click',openBoard);
$('closeBoard').addEventListener('click', () => $('boardDialog').close());
$('zoomIn').addEventListener('click', () => changeZoom(zoom+25)); $('zoomOut').addEventListener('click', () => changeZoom(zoom-25)); $('zoomReset').addEventListener('click', () => { changeZoom(100); $('boardScroll').scrollTo(0,0); });
$('boardDialog').addEventListener('click',e=> { if(e.target === $('boardDialog')) { const r = e.target.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) e.target.close(); } });
const defaultRoles = ['文本研读与主题提炼','封面视觉与排版设计','腰封设计与实物制作','演示整理与课堂讲解'];
let savedTeam = read('manifesto-team-v1',null);
let team = Array.isArray(savedTeam) && savedTeam.length>=3 && savedTeam.length<=5 ? savedTeam.map((m,i)=>({name:typeof m?.name==='string'?m.name.slice(0,30):'',role:typeof m?.role==='string'?m.role.slice(0,70):defaultRoles[i]||''})) : defaultRoles.map(role=>({name:'',role}));
function teamStatus() { const complete = team.filter(m=>m.name.trim()&&m.role.trim()).length; $('teamStatus').textContent = (storageAvailable?'已保存在当前浏览器':'浏览器无法保存，请导出备份')+' · '+complete+' / '+team.length+' 位成员信息完整'; }
function saveTeam() { write('manifesto-team-v1',team); teamStatus(); }
function renderTeam() { $('teamRows').innerHTML = team.map((m,i)=>`<div class="member-row"><span>${String(i+1).padStart(2,'0')}</span><input aria-label="第${i+1}位成员姓名" data-member="${i}" data-field="name" maxlength="30" placeholder="成员姓名" value="${safe(m.name)}"><input aria-label="第${i+1}位成员分工" data-member="${i}" data-field="role" maxlength="70" placeholder="填写分工" value="${safe(m.role)}"><button data-remove="${i}" aria-label="移除第${i+1}位成员" ${team.length<=3?'disabled':''}>×</button></div>`).join(''); $('addMember').disabled = team.length>=5; teamStatus(); }
$('teamRows').addEventListener('input',e=> { const input = e.target; if(!input.matches('[data-member]')) return; team[Number(input.dataset.member)][input.dataset.field] = input.value; saveTeam(); });
$('teamRows').addEventListener('click',e=> { const button = e.target.closest('[data-remove]'); if(!button||team.length<=3) return; team.splice(Number(button.dataset.remove),1); saveTeam(); renderTeam(); $('addMember').focus(); });
$('addMember').addEventListener('click',()=> { if(team.length>=5) return; team.push({name:'',role:''}); saveTeam(); renderTeam(); $('teamRows').querySelector(`[data-member="${team.length-1}"]`).focus(); });
$('exportTeam').addEventListener('click',()=> { const content = '《共产党宣言》书封设计｜小组成员与分工\n\n'+team.map((m,i)=>`${i+1}. ${m.name.trim()||'（待填写姓名）'}：${m.role.trim()||'（待填写分工）'}`).join('\n')+'\n\n请将姓名和分工同步标注在书封电子稿及纸质实物上。'; const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'})); const a=document.createElement('a'); a.href=url; a.download='共产党宣言_小组成员与分工.txt'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('成员与分工已导出'); });
renderTeam();
let checks = read('manifesto-checks-v1',[false,false,false,false]); if(!Array.isArray(checks)||checks.length!==4) checks = [false,false,false,false];
function updateChecks() { $('checkStatus').textContent = '已完成 '+checks.filter(Boolean).length+' / 4 项'+(checks.every(Boolean)?' · 可以开始试讲了':''); }
$$('[data-check]').forEach(input=> { input.checked = Boolean(checks[Number(input.dataset.check)]); input.addEventListener('change',()=> { checks[Number(input.dataset.check)]=input.checked; write('manifesto-checks-v1',checks); updateChecks(); }); }); updateChecks();
const slides = [
{label:'01 / 作品开篇',title:'让经典\n被重新看见。',body:'《共产党宣言》书封设计\n红色经典 · 视觉表达 · 实践探索',image:'band',note:'各位老师、同学，大家好。今天我们展示的是《共产党宣言》书封设计。我们的主题是“从经典出发，在实践中思考”。接下来，我们将从文本理解、视觉元素、腰封设计和纸质制作四个方面，说明如何把阅读思考转化为设计语言。建议用时：35 秒。'},
{label:'02 / 文本与主题',title:'从阅读出发，\n把思考带回现实。',body:'以经典研读作为设计起点，关注文本中的社会历史视角，再将思考转化为面向读者的视觉表达。',list:['先理解文本，再提炼主题','用视觉元素表达阅读与思考','让书封成为走近经典的入口'],image:'cover',note:'我们先从阅读与理解开始。《共产党宣言》由马克思、恩格斯共同撰写，讨论社会历史发展、阶级关系等问题。我们的设计并不试图在一张封面上概括所有思想，而是抓住“经典研读与现实思考”这一线索，邀请读者进入文本。建议用时：50 秒。'},
{label:'03 / 设计理念',title:'克制的形式，\n承载思想的厚度。',body:'我们希望书封既有经典阅读的气质，也有清晰、易读的当代视觉层次。米白、深红与金色，构成整套设计的色彩语言。',palette:true,image:'band',note:'这套设计选择了米白、深红和金色。米白让画面温和、安静；深红为书名建立辨识度，呼应红色经典的主题；金色集中出现在腰封，突出我们提炼的设计口号。颜色数量较少，可以让读者更集中地注意书名和主题。建议用时：45 秒。'},
{label:'04 / 封面视觉',title:'书名、作者、线描，\n建立阅读顺序。',body:'大字号书名形成第一层级，较小的作者信息构成第二层级。展开的书籍与纸页线描，引导视线从文字走向阅读意象。',image:'cover',note:'请看封面：深红书名首先抓住视线，作者信息随后补充作品身份，再往下是书籍线描。展开的书、叠放的书籍和纸页，使“阅读经典”成为一个具体的画面。我们用留白分隔这些信息，让封面保持清晰。此时可拿起纸质书封，指示标题和插图的位置。建议用时：50 秒。'},
{label:'05 / 腰封设计',title:'从经典出发，\n在实践中思考。',body:'深红腰封搭配金色主题文字，为封面增加一个独立的表达层。拆下腰封后，书封回到简洁的阅读状态。',video:'assets/motion-band.mp4',note:'腰封上的“从经典出发，在实践中思考”，是我们对本次设计主题的概括。深红纸面和金色文字形成鲜明的焦点；腰封独立制作，又能在阅读时拆取。我们希望它既承担主题传播的作用，也不妨碍读者欣赏原本的封面。此时展示腰封的拆取方式。建议用时：50 秒。'},
{label:'06 / 展开结构',title:'每一个版面，\n都参与完整表达。',body:'后勒口、封底、书脊、封面、前勒口共同构成书封。设计板标注比例为 80 : 170 : 28 : 170 : 80，高 240；制作时需按真实书芯校核。',image:'board',className:'board-slide',note:'这是整体展开图。正面以书名和图像为核心；书脊负责侧面识别；封底补充内容简介；两个勒口延伸经典背景和阅读导引。所有版面保持一致的字体、颜色和细线装饰。图示比例只是设计参考，实际打印前应核对书芯尺寸、书脊厚度以及出血。建议用时：45 秒。'},
{label:'07 / 装帧工艺',title:'让视觉质感，\n走向真实触感。',body:'自然纸感、布纹精装、书名压凹与哑金腰封，是设计板提出的工艺设想。课堂样品可依现有条件采用平面印刷，真实展示制作效果。',image:'board',className:'board-slide',note:'设计板提出了四个工艺方向：自然纸感、布纹精装、书名压凹和哑金腰封。这些设想帮助我们理解纸张、字体与工艺如何配合。它们与课堂实际制作需要区分开：如果采用普通打印，就如实介绍平面样品，不把效果图当作已经完成的工艺成品。建议用时：45 秒。'},
{label:'08 / 纸质制作',title:'从屏幕到纸张，\n完成设计的最后一步。',body:'课堂展示同时准备电子版与纸质实物。腰封独立输出，打印前核对尺寸与文字，裁切、折叠后进行套合测试。',list:['保留电子原稿，核对书名与作者','按书芯测量尺寸，试印并套合','同步标注小组姓名与分工'],image:'band',note:'根据活动要求，我们需要电子版，也需要纸质实物。制作时，先核对文字和尺寸，再试印、裁切、折叠、套合，腰封单独制作更方便展示。请根据真实进度介绍成品；此时可以把纸质书封和腰封拿给大家看，并说明制作中遇到的具体调整。建议用时：50 秒。'},
{label:'09 / 小组协作',title:'每一份分工，\n共同构成一件作品。',body:'文本研读、视觉排版、腰封制作与课堂讲解相互配合。请在网页中填写真实姓名与分工，并同步标注到书封作品。',team:true,note:'下面介绍小组成员和分工。请按屏幕中填写的真实信息依次说明：谁负责文本研读与主题提炼，谁负责视觉排版，谁负责腰封和实物制作，谁负责整理展示与讲解。也可以简要讲一次小组讨论如何改变了最终设计。建议用时：35 秒。'},
{label:'10 / 结束与交流',title:'设计止于书封，\n思考继续翻页。',body:'书封是一次阅读邀请。\n愿我们从经典中提出问题，\n也在实践中继续寻找答案。\n\n谢谢大家，欢迎交流。',image:'cover',className:'closing-slide',note:'最后，我们希望这件作品能够成为一次阅读邀请：通过书封走近经典，通过阅读形成思考，再把思考带入实践。对我们而言，这次活动既是视觉设计练习，也是一次合作学习。我们的展示到这里结束，谢谢老师和同学们，欢迎提出意见。建议用时：35 秒。'}
];
let slideIndex = 0;
let elapsedMs = 0, startedAt = null, timerInterval = null;
function renderSlide() { const s=slides[slideIndex]; $('slideContent').className='slide-content '+(s.className||''); let html=`<div class="slide-text"><p class="eyebrow">${safe(s.label)}</p><h2>${safe(s.title).replaceAll('\n','<br>')}</h2><p>${safe(s.body).replaceAll('\n','<br>')}</p>`; if(s.list) html+='<ul>'+s.list.map(x=>`<li>${safe(x)}</li>`).join('')+'</ul>'; if(s.palette) html+='<div class="slide-palette" aria-label="米白、深红、金色配色"><span style="background:#f2eddf"></span><span style="background:#841f27"></span><span style="background:#d8bc7a"></span></div>'; html+='</div>'; if(s.team) html+='<div class="slide-team"><h3>小组成员与分工</h3>'+team.map((m,i)=>`<div class="slide-team-row"><strong>${safe(m.name.trim()||'成员 '+(i+1)+'（待填）')}</strong><span>${safe(m.role.trim()||'待填写分工')}</span></div>`).join('')+'</div>'; else if(s.video) html+=`<video class="slide-image" src="${safe(s.video)}" controls autoplay loop muted playsinline></video>`; else html+=`<img class="slide-image" src="assets/${s.image}.jpg" alt="${s.image==='board'?'完整书封与腰封设计展开图':s.image==='cover'?'无腰封书封效果图':'带腰封书封效果图'}">`; $('slideContent').innerHTML=html; $('noteText').textContent=s.note; $('slideCount').textContent=String(slideIndex+1).padStart(2,'0')+' / 10'; $('prevSlide').disabled=slideIndex===0; $('nextSlide').disabled=slideIndex===slides.length-1; $$('#slideTrack button').forEach((b,i)=>{b.classList.toggle('active',i===slideIndex);b.setAttribute('aria-current',i===slideIndex?'step':'false');}); }
function goSlide(index) { slideIndex=Math.max(0,Math.min(slides.length-1,index)); renderSlide(); }
function updateTimer() { const total=elapsedMs+(startedAt===null?0:Date.now()-startedAt); const seconds=Math.floor(total/1000); $('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'); $('timer').style.color=seconds>=600?'#b24326':''; }
function pauseTimer() { if(startedAt!==null) { elapsedMs+=Date.now()-startedAt; startedAt=null; clearInterval(timerInterval); timerInterval=null; } $('timerToggle').textContent=elapsedMs?'继续计时':'开始计时'; updateTimer(); }
$('timerToggle').addEventListener('click',()=> { if(startedAt!==null) pauseTimer(); else { startedAt=Date.now(); timerInterval=setInterval(updateTimer,500); $('timerToggle').textContent='暂停计时'; updateTimer(); } });
$('timerReset').addEventListener('click',()=> { pauseTimer(); elapsedMs=0; updateTimer(); $('timerToggle').textContent='开始计时'; });
$('slideTrack').innerHTML=slides.map((s,i)=>`<button data-slide="${i}" aria-label="第${i+1}页：${safe(s.title.replace('\n',''))}"></button>`).join(''); $('slideTrack').addEventListener('click',e=> { const b=e.target.closest('[data-slide]'); if(b) goSlide(Number(b.dataset.slide)); });
function toggleNotes() { const show=$('speakerNotes').hidden; $('speakerNotes').hidden=!show; $('notesToggle').textContent=show?'隐藏讲稿':'显示讲稿'; $('notesToggle').setAttribute('aria-expanded',String(show)); }
$('notesToggle').addEventListener('click',toggleNotes); $('prevSlide').addEventListener('click',()=>goSlide(slideIndex-1)); $('nextSlide').addEventListener('click',()=>goSlide(slideIndex+1));
$$('[data-present]').forEach(b=>b.addEventListener('click',()=> { goSlide(0); $('fullscreenStatus').hidden=true; syncFullscreenButton(); $('presentation').showModal(); }));
$('closePresentation').addEventListener('click',()=> $('presentation').close());
function getFullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
function syncFullscreenButton() {
  const active=Boolean(getFullscreenElement());
  $('fullscreen').textContent=active?'退出全屏':'全屏';
  $('fullscreen').setAttribute('aria-pressed',String(active));
  if(active) $('fullscreenStatus').hidden=true;
}
function showFullscreenStatus(message) {
  $('fullscreenStatus').textContent=message;
  $('fullscreenStatus').hidden=false;
}
function exitPageFullscreen() {
  const exit=document.exitFullscreen || document.webkitExitFullscreen;
  return exit ? Promise.resolve(exit.call(document)) : Promise.reject(new Error('Fullscreen exit unavailable'));
}
$('presentation').addEventListener('close',()=> {
  pauseTimer();
  if(getFullscreenElement()===document.documentElement) exitPageFullscreen().catch(()=>{});
});
$('fullscreen').addEventListener('click',async()=> {
  const button=$('fullscreen');
  if(button.disabled) return;
  button.disabled=true;
  $('fullscreenStatus').hidden=true;
  try {
    if(getFullscreenElement()) await exitPageFullscreen();
    else {
      // Modal dialogs are not eligible fullscreen targets. The document root
      // keeps the open presentation in the top layer while fullscreening the page.
      const root=document.documentElement;
      const request=root.requestFullscreen || root.webkitRequestFullscreen;
      if(!request) {
        showFullscreenStatus('此浏览器不支持网页全屏，请在电脑上的 Chrome、Edge 或 Safari 中打开网页。');
        return;
      }
      await request.call(root);
    }
  } catch {
    showFullscreenStatus('浏览器未允许全屏。请在独立浏览器标签页打开网页，再点击“全屏”。');
  } finally {
    syncFullscreenButton();
    button.disabled=false;
  }
});
document.addEventListener('fullscreenchange',syncFullscreenButton);
document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
syncFullscreenButton();
document.addEventListener('keydown',e=> { if(!$('presentation').open||e.ctrlKey||e.metaKey||e.altKey) return; if(e.target.matches('input,textarea,select')) return; if(e.key==='ArrowRight'||e.key==='PageDown') { e.preventDefault(); goSlide(slideIndex+1); } else if(e.key==='ArrowLeft'||e.key==='PageUp') { e.preventDefault(); goSlide(slideIndex-1); } else if(e.key==='Home') {e.preventDefault();goSlide(0);} else if(e.key==='End') {e.preventDefault();goSlide(slides.length-1);} else if(e.key.toLowerCase()==='n') {e.preventDefault();toggleNotes();} });
function scrollProgress() { const max=document.documentElement.scrollHeight-innerHeight; $('readingBar').style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%'; }
let scrollQueued=false; window.addEventListener('scroll',()=> { if(scrollQueued) return; scrollQueued=true; requestAnimationFrame(()=> {scrollProgress();scrollQueued=false;}); },{passive:true}); window.addEventListener('resize',scrollProgress); scrollProgress();
if('IntersectionObserver' in window) { const navObserver=new IntersectionObserver(entries=> {entries.forEach(entry=> { if(entry.isIntersecting) $$('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id)); }); },{rootMargin:'-20% 0px -55% 0px'}); ['concept','explore','craft'].forEach(id=>navObserver.observe($(id))); if(!matchMedia('(prefers-reduced-motion: reduce)').matches) { const revealObserver=new IntersectionObserver(entries=> { entries.forEach(entry=> { if(entry.isIntersecting) {entry.target.classList.add('visible');revealObserver.unobserve(entry.target);} }); },{threshold:.12}); $$('.section-title-row,.concept-layout,.craft-list,.studio-grid,.editorial-note').forEach(el=> {el.dataset.reveal='';revealObserver.observe(el);}); } }

/* --- 腰封动态短片：滚动自动播放 + 全屏 --- */
(function motionSection(){
  const video = $('motionVideo'); if(!video) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ if(video.paused) video.play().catch(()=>{}); }
      else if(!video.paused){ video.pause(); }
    });
  },{threshold:.35});
  io.observe(video);
  const btn = $('motionFullscreen');
  if(btn) btn.addEventListener('click', ()=> {
    const full = document.createElement('div');
    full.className = 'motion-full';
    const clone = video.cloneNode(true);
    clone.removeAttribute('id'); clone.autoplay = true; clone.controls = true;
    full.appendChild(clone);
    document.body.appendChild(full);
    clone.play().catch(()=>{});
    const close = ()=>{ if(document.body.contains(full)) document.body.removeChild(full); document.removeEventListener('keydown', onKey); video.focus?.(); };
    const onKey = (e)=>{ if(e.key==='Escape') close(); };
    document.addEventListener('keydown', onKey);
    full.addEventListener('click', close);
  });
})();
