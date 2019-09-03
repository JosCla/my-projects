// Epicycle Drawing Tool
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// A tool to add together a bunch of rotating lines to make a pretty picture.
// This tool makes use of the discrete fourier transform to find a function to describe an ordered list of points.

// Epicycle Object
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pts are the points (in order) to be drawn. order determines number of total epicycles (2*order+1).
var Epicycle = function(pts, order) {
    this.pts = pts;
    this.order = math.max(order, 0);
    this.amps = [];
    
    // discrete fourier transform, amps is the phase/amplitude output
    this.dft = function() {
        // making all of pts into complex numbers
        var cpts = [];
        for (var i = 0; i < this.pts.length; i++) {
            cpts[i] = math.complex(this.pts[i].x, this.pts[i].y);
        }
        
        // the transform itself
        this.amps = [];
        for (var i = -this.order; i <= this.order; i++) {
            this.amps[i] = math.complex(0, 0);
            
            // this.amps[i] = (1/n) * sum(point[j]*e^(-2*Pi*I*i*j/n))
            for (var j = 0; j < cpts.length; j++) {
                this.amps[i] = math.add(this.amps[i], math.multiply(cpts[j], math.exp(math.complex(0, -2 * math.PI * i * j / cpts.length))));
            }
            this.amps[i] = math.divide(this.amps[i], cpts.length);
        }
    }
    
    // gets the value of the function at a specific time t
    this.getValue = function(t) {
        var pos = new Point(0, 0);
        for(var i = -this.order; i <= this.order; i++) {
            // the change caused by one vector: this.amps[i] * e^kit
            var change = math.multiply(this.amps[i], math.exp(math.complex(0, i * t)));
            pos.x += change.re;
            pos.y += change.im;
        }
        return pos;
    }
    
    // calling this.dft to define this.amps and make this.getValue callable
    this.dft();
}

var Point = function(x, y) {
    this.x = x;
    this.y = y;
}

// DOM Interaction
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// canvasT: Trace canvas, canvasE: Epicycle canvas, canvasP: Point canvas
var canvasE = document.getElementById("epicycle");
var ctxE = canvasE.getContext("2d");
var canvasT = document.getElementById("trace");
var ctxT = canvasT.getContext("2d");
var canvasP = document.getElementById("points");
var ctxP = canvasP.getContext("2d");
init();

var posLast, cycle, drawInt, time;
var points = [];
var fps = 60;
var slowMult = 1;
var zoomMult = 1;

// instructions to run at runtime
function init() {
    ctxP.textAlign = "center";
    ctxP.fillText("Click on the canvas to place points!", canvasP.width / 2, canvasP.height / 2);
}

function incTime() {
    time += (1 / (fps * slowMult));
    if (document.getElementById("input-center").checked) {
        drawFrameZoom(time);
    } else {
        drawFrame(time);
    }
}

document.getElementById("input-center").onchange = function() {
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
}

// draws a frame for some time t
function drawFrameZoom(t) {
    var end = cycle.getValue(t);
    var pos = new Point(0, 0);
    
    // setting up canvas, translating the center of it to the endpoint
    ctxE.clearRect(0, 0, canvasE.width, canvasE.height);
    ctxE.translate(-end.x * zoomMult, -end.y * zoomMult);
    ctxE.strokeStyle = "#000000";
    ctxE.beginPath();
    
    // drawing the epicycle
    ctxE.moveTo(pos.x * zoomMult + canvasE.width / 2, pos.y * zoomMult + canvasE.height / 2);
    pos.x += cycle.amps[0].re;
    pos.y += cycle.amps[0].im;
    ctxE.lineTo(pos.x * zoomMult + canvasE.width / 2, pos.y * zoomMult + canvasE.height / 2);
    
    for (var i = 1; i <= cycle.order; i++) {
        var change = math.multiply(cycle.amps[i], math.exp(math.complex(0, i * t)));
        pos.x += change.re;
        pos.y += change.im;
        ctxE.lineTo(pos.x * zoomMult + canvasE.width / 2, pos.y * zoomMult + canvasE.height / 2);
        var change = math.multiply(cycle.amps[-i], math.exp(math.complex(0, -i * t)));
        pos.x += change.re;
        pos.y += change.im;
        ctxE.lineTo(pos.x * zoomMult + canvasE.width / 2, pos.y * zoomMult + canvasE.height / 2);
    }    
    ctxE.stroke();
    // resetting translation of canvas
    ctxE.translate(end.x * zoomMult, end.y * zoomMult);
    
    var pos = cycle.getValue(t - (6 / zoomMult));
    
    // setting up canvas, translating center to the endpoint
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
    ctxT.translate(-end.x * zoomMult, -end.y * zoomMult);
    ctxT.beginPath();
    ctxT.moveTo(pos.x * zoomMult + canvasT.width / 2, pos.y * zoomMult + canvasT.height / 2);
    
    // drawing a trace that follows the endpoint
    for (var i = (t - (6 / zoomMult)); i <= t; i += (.025 / zoomMult)) {
        pos = cycle.getValue(i);
        ctxT.lineTo(pos.x * zoomMult + canvasT.width / 2, pos.y * zoomMult + canvasT.height / 2);
    }
    ctxT.lineTo(end.x * zoomMult + canvasT.width / 2, end.y * zoomMult + canvasT.height / 2)
    ctxT.stroke();
    // resetting translation of canvas
    ctxT.translate(end.x * zoomMult, end.y * zoomMult);
}

// draws a frame for some time t
function drawFrame(t) {
    // center of the canvas represents (0, 0)
    var pos = new Point(canvasE.width / 2, canvasE.height / 2);
    
    // prepare canvasE
    ctxE.clearRect(0, 0, canvasE.width, canvasE.height);
    ctxE.strokeStyle = "#000000";
    ctxE.beginPath();
    
    // move to first point
    ctxE.moveTo(pos.x, pos.y);
    pos.x += cycle.amps[0].re;
    pos.y += cycle.amps[0].im;
    ctxE.lineTo(pos.x, pos.y);
    
    // move to rest of points
    for (var i = 1; i <= cycle.order; i++) {
        var change = math.multiply(cycle.amps[i], math.exp(math.complex(0, i * t)));
        pos.x += change.re;
        pos.y += change.im;
        ctxE.lineTo(pos.x, pos.y);
        var change = math.multiply(cycle.amps[-i], math.exp(math.complex(0, -i * t)));
        pos.x += change.re;
        pos.y += change.im;
        ctxE.lineTo(pos.x, pos.y);
    }    
    ctxE.stroke();
    
    // draw trace
    ctxT.strokeStyle = "#0000DD";
    ctxT.beginPath();
    if (posLast === undefined) {
        ctxT.moveTo(pos.x, pos.y);
        posLast = new Point(pos.x, pos.y);
    } else {
        ctxT.moveTo(posLast.x, posLast.y);
        ctxT.lineTo(pos.x, pos.y);
    }
    posLast.x = pos.x;
    posLast.y = pos.y;
    ctxT.stroke();
}

// start the simulation from the beginning
function start() {
    ctxE.clearRect(0, 0, canvasT.width, canvasT.height);
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
    posLast = undefined;
    time = 0;
    ptdraw();
    
    cycle = new Epicycle(points, parseInt(document.getElementById("input-degree").value));
    
    if (drawInt !== undefined) {
        clearInterval(drawInt);
    }
    
    if (document.getElementById("input-inst").checked === false) {
        // without insta-draw, we use a setInterval to draw each frame
        drawInt = setInterval(incTime, 1000 / fps);
    } else {
        // for insta-draw, we just draw the whole shape instantly, without setInterval
        for (var i = 0; i < (math.PI * 2) * fps; i++) {
            drawFrame(i / fps);
        }
        
        // drawing final frame at time 2PI to complete the shape
        drawFrame(math.PI * 2);
    }
}

// draw all of the points in the points array on canvasP
function ptdraw() {
    ctxP.clearRect(0, 0, canvasP.width, canvasP.height);
    
    for (var i = 0; i < points.length; i++) {
        ctxP.beginPath();
        ctxP.strokeStyle = "#FF0000";
        ctxP.rect(canvasP.width / 2 + points[i].x, canvasP.height / 2 + points[i].y, 1, 1);
        ctxP.stroke();
        ctxP.beginPath();
        ctxP.strokeStyle = "#000000";
        ctxP.strokeText((i + 1).toString(), canvasP.width / 2 + points[i].x, canvasP.height / 2 + points[i].y);
        ctxP.stroke();
    }
}

// click canvas to add points
canvasE.onclick = function(e) {
    points.push(new Point(e.layerX - (canvasE.width / 2), e.layerY - (canvasE.height / 2)));
    
    var maxDeg = math.floor((points.length - 1) / 2);
    document.getElementById("input-degree").max = maxDeg;
    
    ptdraw();
    start();
}

// changing degree
document.getElementById("input-degree").addEventListener("change", changeDegree);
document.getElementById("btn-left").onclick = function() {
    document.getElementById('input-degree').value--;
    changeDegree();
}
document.getElementById("btn-right").onclick = function() {
    document.getElementById('input-degree').value++;
    changeDegree();
}
function changeDegree() {
    document.getElementById("txt-degree").innerHTML = "Degree: " + document.getElementById("input-degree").value;
    start();
}

// checkboxes
document.getElementById("input-pts").onchange = function() {
    canvasP.style.display = (document.getElementById("input-pts").checked ? "" : "none");
}

document.getElementById("input-inst").onchange = function() {
    start();
}

document.getElementById("input-center").onchange = function() {
    toggleCenter();
}
function toggleCenter() {
    var center = document.getElementById("input-center").checked;
    posLast = undefined;
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
    
    // no zooming if camera is not centered on endpoint
    document.getElementById("tr-zoom").style.display = (center ? "" : "none");
    
    // also disable point display when checked
    if (center) {
        canvasP.style.display = "none";
        document.getElementById("input-pts").checked = false;
        document.getElementById("tr-pts").style.display = "none";
    } else {
        document.getElementById("tr-pts").style.display = "";
    }
}

// clear canvas button
document.getElementById("input-clear").onclick = function() {
    if (drawInt !== undefined) {
        clearInterval(drawInt);
    }
    points = [];
    cycle = undefined;
    
    ctxE.clearRect(0, 0, canvasE.width, canvasE.height);
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height);
    ctxP.clearRect(0, 0, canvasP.width, canvasP.height);
    
    if (document.getElementById("input-center").checked) {
        document.getElementById("input-center").checked = false;
        toggleCenter();
    }
    canvasP.style.display = "";
    document.getElementById("input-pts").checked = true;
    
    document.getElementById("input-degree").max = 0;
    document.getElementById("txt-degree").innerHTML = "Degree: 0";
    
    init();
}