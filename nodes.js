const fetchRate = 200;
const MessageDuration = 36000;
const colorBack = "rgb(54,57,63)";
const colorText = "rgb(255,255,255)";
const colorSubText = "rgb(114,118,128)";
const colorShadow = "rgba(0,0,0,.8)"
const fontWidth = 11;
const imageSize = 42;
const msgMargin = 10;
const msgMarginEnd = 3;
const embedMax = 400;
const textLineHeight = 22;
const shadowSize = 30;
const showFps = false;

const canvas = document.getElementById("CanvasMain");
let mousePos = [0,0];

let imgLoadingLoaded = false;
const imgLoading = new Image();
imgLoading.onload = () => {
	imgLoadingLoaded = true;
}
imgLoading.src = "MediaLoading.jpg"; 

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize, false); resize();
resize();

var mouseDown = 0;
var mouseClick = 0;
document.body.onmousedown = function() { 
  ++mouseDown;
  ++mouseClick;
}
document.body.onmouseup = function() {
  --mouseDown;
}

function onMouseUpdate(e) {
    mousePos = [e.pageX,e.pageY];
}
function getMp(mouseEvent) {
    return {
    	x: mousePos[0] - canvas.clientWidth/2,
    	y: mousePos[1] - canvas.clientHeight/2
    };
}
document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);

const apiUrl = "https://Rhonyx.cyberflixt.repl.co/Log"

function roundContext(ctx,x,y,width,height,radius){
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	ctx.clip();
}
function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET",url,false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}
function drawImageCrop(ctx,img,x,y,sx,sy){
	const ns = [img.naturalWidth,img.naturalHeight];
	ctx.save();
	roundContext(ctx,x,y,sx,sy,10);
	if (ns[0]/ns[1]>sx/sy){//wider in x
		const mar = ns[1]/sy*sx;
		ctx.drawImage(img,
			ns[0]*.5-mar*.5,0,
			mar,ns[1],
			x,y,
			sx,sy,
		);
	} else {//wider in y
		const mar = ns[0]/sx*sy;
		ctx.drawImage(img,
			0,ns[1]*.5-mar*.5,
			ns[0],mar,
			x,y,
			sx,sy,
		);
	}
	ctx.restore();
}

var imagesBuffer = {}

function drawImage(ctx,url,x,y,sx,sy) {
	function drawLoading(){
		if (imgLoadingLoaded){
			drawImageCrop(ctx,imgLoading,x,y,sx,sy);
		}
	}
	if (url in imagesBuffer) {
		const img = imagesBuffer[url];
		if (img!=0) { //loading
			ctx.save();
			roundContext(ctx,x,y,sx,sy,10);
			ctx.drawImage(img,x,y,sx,sy);
			ctx.restore();
		} else {
			drawLoading();
		}
	} else {
		imagesBuffer[url] = 0
		const img = new Image();
		img.onload = () => {
			imagesBuffer[url] = img;
		}
		img.src = url; 
		drawLoading();
	}
}
let oldMsgPos = {};
let msgPos = {};
let msgVel = {};
let ot = 0;
let dataArr = [];
let FetchErr = false;
let FetchTextInt = 0;
let fpsDel = [];
let lastFetchErr = 0;
for (let i=0;i<10;i++){
	fpsDel.push(0);
}

function animate(time) {
    const mp = getMp()
	canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(20,0,30)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const unix = Date.now()*.001
    dataArr.map(data => {
    	const Time = data["Time"];
    	const a = (unix-Time)/MessageDuration;
    	const Id = data["Id"];
    	if (a<1) {
    		const Content = data["Content"];
    		const AuthorName = data["AuthorName"];
    		const AvatarUrl = data["AvatarUrl"];
    		const Color = data["Color"];
    		const EmbedsImages = data["EmbedsImages"];

    		let pos = 0
    		let vel = 0
    		if (Id in msgPos){
    			pos = msgPos[Id];
    			vel = msgVel[Id];
    		}else{
    			pos = [Math.random()*canvas.clientWidth,Math.random()*canvas.clientHeight];
    			vel = [0,0];
    			msgPos[Id] = pos;
    			msgVel[Id] = vel;
    		}
	    	let x = pos[0];
	    	let y = pos[1];
			
			const date = new Date(Time*1000);
			const hours = date.getHours();
			const minutes = ("0" + date.getMinutes()).substr(-2);
			const textTime = "Today at "+hours+":"+minutes;

	    	let msgWidth = (AuthorName.length+textTime.length*.85)*fontWidth; //upper line length
	    	let msgHeight = 25;
	    	//content calc
	    	let lines = [];
	    	const sp = Content.split("\n");
	    	if (sp.length>0){
	    		lines = sp;
	    	}
	    	var lineHeight = 0;
	    	if (lines.length>1){
	    		lineHeight = lines.length*textLineHeight;
	    	} else {
	    		if (lines[0]!="" & lines[0]!=" "){
	    			lineHeight = textLineHeight;
	    		}
	    	}
	    	lines.map(l => {
	    		const s = l.length*fontWidth;
	    		if (s>msgWidth){
	    			msgWidth = s;
	    		}
	    	})
	    	msgHeight+=lineHeight;

	    	//embeds calc
	    	EmbedsImages.map(embed => {
	    		const EmbedWidth = embed["Width"];
	    		const EmbedHeight = embed["Height"];
	    		msgHeight+=embedMax/(EmbedWidth/EmbedHeight)+6;
	    		if (embedMax>msgWidth){
	    			msgWidth = embedMax;
	    		}
	    	})
	    	msgWidth+=imageSize+msgMargin+msgMarginEnd;

	    	//matrix
	    	if (false) {
		    	ctx.setTransform(1, 0, 0, 1, 0, 0);
		    	ctx.translate(msgWidth*.5+x,msgHeight*.5+y);
				ctx.rotate(Math.PI*a*.1);
				ctx.translate(msgWidth*-.5-x,msgHeight*-.5-y);
	    	}

	    	// ------- MOVEMENT --------
	    	//vel
	    	const velSpeed = 1;
	    	const velDamp = .99;
	    	const velBounce = 1;
	    	const velAttract = .001;
	    	const velAttractDistX = msgWidth*2;

	    	const intoldMsgPos = Object.keys(oldMsgPos).length;
	    	for (const Id0 in oldMsgPos) {
	    		if (Id0!=Id){
	    			p0 = oldMsgPos[Id0];
	    			let xdir = (p0[0]-x)/Math.abs((p0[0]-x));
	    			let ydir = (p0[1]-y)/Math.abs((p0[1]-y));
	    			if (Math.abs(xdir)<1 || isNaN(xdir)){
	    				xdir = 1
	    			}
	    			if (Math.abs(ydir)<1 || isNaN(ydir)){
	    				ydir = 1
	    			}
	    			vel[0] += (Math.abs(p0[0]-x)-msgWidth*2)*xdir*velAttract/intoldMsgPos;
	    			vel[1] += (Math.abs(p0[1]-y)-msgHeight*2)*ydir*velAttract/intoldMsgPos;
	    		}
	    	}
	    	if (mouseClick>0){
	    		if (mousePos[0]>x & mousePos[0]<x+msgWidth & mousePos[1]>y & mousePos[1]<y+msgHeight){
	    			vel = [Math.random()*100,Math.random()*100];
	    		}
	    	}
	    	vel[0]*=velDamp;
	    	vel[1]*=velDamp;
	    	x+=vel[0]*velSpeed;
	    	y+=vel[1]*velSpeed;
	    	//clipping
	    	let off = (x+msgWidth+msgMargin)-canvas.clientWidth;
	    	if (off>0){
	    		x-=off;
	    		vel = [Math.abs(vel[0])*-velBounce,vel[1]];
	    	}
	    	off = (y+msgHeight+msgMargin)-canvas.clientHeight;
	    	if (off>0){
	    		y-=off;
	    		vel = [vel[0],Math.abs(vel[1])*-velBounce];
	    	}
	    	if (x<0){
	    		x=0;
	    		vel = [Math.abs(vel[0])*velBounce,vel[1]];
	    	}
	    	if (y<0){
	    		y=0;
	    		vel = [vel[0],Math.abs(vel[1])*velBounce];
	    	}
	    	msgVel[Id] = vel;
	    	msgPos[Id] = [x,y];

	    	// -------- RENDER --------
	    	//shadow
	    	ctx.filter = "blur(16px)";
			ctx.fillStyle = colorShadow;
	    	ctx.fillRect(x-shadowSize,y-shadowSize,msgWidth+shadowSize*2,msgHeight+shadowSize*2);
	    	ctx.filter = "none";

	    	//back
	    	ctx.fillStyle = colorBack;
	    	ctx.strokeStyle = colorBack;
	    	ctx.lineJoin = 'round';
			ctx.lineWidth = 15;
	    	ctx.fillRect(x,y,msgWidth,msgHeight);
	    	ctx.strokeRect(x,y,msgWidth,msgHeight);

	    	// username
	    	ctx.font = '20px monospace';
	    	ctx.fillStyle = "rgb("+Color[0]+","+Color[1]+","+Color[2]+")";;
	    	ctx.fillText(AuthorName, x+imageSize+msgMargin, y+15, msgWidth);
	    	// time
			ctx.font = '15px monospace';
	    	ctx.fillStyle = colorSubText;
	    	ctx.fillText(textTime, x+imageSize+msgMargin+AuthorName.length*fontWidth+msgMargin, y+14, msgWidth);
	    	drawImage(ctx, AvatarUrl, x, y, imageSize ,imageSize);

	    	//embeds
	    	let embi = 0;
	    	EmbedsImages.map(embed => {
	    		const EmbedUrl = embed["Url"];
	    		const EmbedWidth = embed["Width"];
	    		const EmbedHeight = embed["Height"];
	    		const ratio = EmbedWidth/EmbedHeight;
	    		drawImage(ctx, EmbedUrl, x+imageSize+msgMargin, y+25+lineHeight+5+embi*embedMax+embi*5, embedMax,embedMax/ratio);
	    		embi+=1;
	    	})

	    	// content
	    	lineHeight = 0;
	    	lines.map(l => {
	    		if (l!=""){
	    			ctx.font = '20px monospace';
	    			ctx.fillStyle = colorText;
	    			ctx.fillText(l, x+imageSize+msgMargin, y+lineHeight+40, msgWidth);
	    		}
	    		lineHeight += textLineHeight;
	    	})
    	} else {
    		if (Id in msgPos){
    			delete msgPos[Id];
    			delete msgVel[Id];
    		}
    	};
    })
	oldMsgPos = {}
	dataArr.map(data => {
		const Time = data["Time"];
    	const a = (unix-Time)/MessageDuration;
    	const Id = data["Id"];
    	if (a<1) {
    		if (Id in msgPos) {
    			oldMsgPos[Id] = msgPos[Id]
    		}
    	}
	})
    if (showFps){
    	const d = (time-ot)*.001;
	    ot = time;
	    fpsDel.pop();
	    fpsDel.splice(0,0,1/d);
	    let total = 0;
	    fpsDel.map(f => {
	    	total += f;
	    })
	    ctx.font = '20px monospace';
	    ctx.fillStyle = colorText;
	    ctx.fillText(Math.floor(total/fpsDel.length),10,canvas.clientHeight-30);
    }
    if (FetchErr) {
    	ctx.font = '20px monospace';
	    ctx.fillStyle = colorText;
	    let text = "Fetching [";
	    let hidden = "CYBERFLIXT"
	    for (let i=0;i<hidden.length;i++){
	    	if (i==FetchTextInt%hidden.length || i==(FetchTextInt+1)%hidden.length){
	    		text += hidden[i];
	    	} else {
	    		text += ".";
	    	}
	    }
	    ctx.fillText(text+"]",10,canvas.clientHeight-10);
	    FetchTextInt+=1;
    }
    mouseClick = 0;
    requestAnimationFrame(animate);
}
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
            lastFetchErr = 0;
        } else {
        	if (lastFetchErr==0){
        		lastFetchErr = Date.now();
        	} else if (Date.now()-lastFetchErr>1000) {
        		FetchErr = true;
        	}
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}
function refreshData(){
	httpGetAsync(apiUrl, function(get){
		const js = JSON.parse(get);
    	dataArr = js;
    	FetchErr = false;
	})
    setTimeout(refreshData,fetchRate);
}
refreshData();
animate(0);