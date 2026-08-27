/* 暮色狂奔 · 幽灵竞速联机服务器
   用法: node dusk-server.js  (默认端口 8765)
   协议(JSON over WebSocket):
   客户端→服务器: {t:'create',name}|{t:'join',room,name}|{t:'state',...游戏状态}|{t:'dead',score,dist}|{t:'leave'}
   服务器→客户端: {t:'created',room}|{t:'joined',room,peer}|{t:'peer-join',name}
                  |{t:'state',...}|{t:'peer-dead',score,dist}|{t:'peer-leave'}|{t:'full'}|{t:'no-room'} */
const http=require('http');
const fs=require('fs');
const path=require('path');
const {WebSocketServer}=require('ws');
const crypto=require('crypto');

const PORT=process.env.PORT||8765;
const rooms=new Map(); // room -> {p1:{ws,...},p2:{ws,...},seed}

const server=http.createServer((req,res)=>{
  // 同时托管游戏页面：访问 http://主机:8765/ 直接玩，别的电脑不用下载文件
  let fp=req.url.split('?')[0];
  if(fp==='/'||fp==='/index.html')fp='/dusk-runner.html';
  const file=path.join(__dirname,path.normalize(fp).replace(/^([.][.][/\\])+/,''));
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return;}
    const ext=path.extname(file).toLowerCase();
    res.writeHead(200,{'Content-Type':
      ext==='.html'?'text/html; charset=utf-8':
      ext==='.js'?'text/javascript; charset=utf-8':'application/octet-stream',
      'Access-Control-Allow-Origin':'*'});
    res.end(data);});
});
const wss=new WebSocketServer({server});

function mkRoom(){
  // 生成不重复的6位房间码
  let code;
  do{code=crypto.randomInt(0,1000000).toString().padStart(6,'0');}
  while(rooms.has(code));
  return code;
}
function send(ws,obj){if(ws&&ws.readyState===1)try{ws.send(JSON.stringify(obj));}catch(e){}}
function roomOf(ws){
  for(const[code,r]of rooms){
    if(r.p1&&r.p1.ws===ws)return{r,slot:'p1',other:r.p2};
    if(r.p2&&r.p2.ws===ws)return{r,slot:'p2',other:r.p1};}
  return null;
}

wss.on('connection',ws=>{
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch(e){return;}
    const found=roomOf(ws);

    if(m.t==='create'){
      // 支持自定义房间码：create 带自定义 room 字段；空/缺省则自动分配
      let code=String(m.room||'').trim();
      if(code){
        code=code.slice(0,12).replace(/[^\w-]/g,''); // 只留字母数字下划线短横
        if(!code){send(ws,{t:'bad-room'});return;}
        if(rooms.has(code)){send(ws,{t:'full',room:code});return;}
      }else code=mkRoom();
      rooms.set(code,{p1:{ws,name:(m.name||'P1').slice(0,12)},p2:null,
        seed:crypto.randomInt(1,1e9)});
      send(ws,{t:'created',room:code,seed:rooms.get(code).seed});
      console.log('[room] created',code);
    }
    else if(m.t==='join'){
      const r=rooms.get(m.room);
      if(!r){send(ws,{t:'no-room',room:m.room});return;}
      if(r.p2){send(ws,{t:'full',room:m.room});return;}
      r.p2={ws,name:(m.name||'P2').slice(0,12)};
      send(ws,{t:'joined',room:m.room,seed:r.seed,peerName:r.p1.name});
      send(r.p1.ws,{t:'peer-join',name:r.p2.name});
      console.log('[room]',m.room,'joined by',r.p2.name);
    }
    else if(m.t==='state'){ // 游戏状态：直接转发给对手
      if(found&&found.other)send(found.other.ws,{t:'state',
        x:m.x,y:m.y,sl:m.sl,d:m.d||0,sc:m.sc,dx:m.dx,ch:m.ch,nm:m.nm});
    }
    else if(m.t==='dead'){
      if(found&&found.other)send(found.other.ws,
        {t:'peer-dead',score:m.score,dist:m.dist});
    }
    else if(m.t==='lobby'){ // 大厅角色同步
      if(found&&found.other)send(found.other.ws,{t:'lobby',ch:m.ch});
    }
    else if(m.t==='start'){ // 开赛信号：转发给对手(带seed)
      if(found&&found.other)send(found.other.ws,{t:'start',seed:m.seed});
    }
    else if(m.t==='leave'||m.t==='close'){
      cleanup(ws);
    }
  });
  ws.on('close',()=>cleanup(ws));
  ws.on('error',()=>cleanup(ws));
});

function cleanup(ws){
  const found=roomOf(ws);
  if(!found)return;
  const{r,slot,other}=found;
  if(other&&other.ws.readyState===1)send(other.ws,{t:'peer-leave'});
  if(slot==='p1')r.p1=null;else r.p2=null;
  if(!r.p1&&!r.p2)rooms.delete(roomCode(r));
  console.log('[room] peer left, rooms=',rooms.size);
}
function roomCode(r){for(const[c,x]of rooms)if(x===r)return c;}

server.listen(PORT,()=>{
  console.log('DUSK RUNNER 联机服务器已启动: ws://localhost:'+PORT);
});
