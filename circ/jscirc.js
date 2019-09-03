// circuit
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this circuit simulator is meant to mimic real-life circuits
// modified nodal analysis (mna) will be used to calculate voltages, currents, and whatnot.
// https://lpsa.swarthmore.edu/Systems/Electrical/mna/MNA2.html

var canv = document.getElementById("circuit");
var ctx = canv.getContext("2d");
var d = [[-1, 0], [0, -1], [1, 0], [0, 1]];

// overarching circuit grid
function CircuitGrid(sizeX, sizeY) {
    
    // sizes and grid itself
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.cursorMode = "W";
    this.cursorStart = -1;
    this.posX = 0;
    this.posY = 0;
    
    // joints and wires on the grid
    this.joints = [];
    this.wires = [];
    
    // contains each circuit
    this.circuitList = [];
    
    // a circuit within circuitList. joints and wires will only contain values, representing the contained wires/joints.
    this.circuit = function() {
        this.joints = [];
        this.wires = [];
        this.vSrc = 0;
    }
    
    // a wire segment. has some voltage (change), and some resistance. also starts and ends somewhere.
    this.wire = function(type) {
        this.type = type;
        this.v = 0;
        this.i = 0;
        this.r = 0.000000001;
        this.vSrc = -1;
        this.switch = -1;
        
        this.start;
        this.end;
        this.seen = false;
    }
    
    // a joint. has some wires going into it. has some wires going out of it. has some voltage that will later be determined. also has some x and y for drawing it on the grid
    this.joint = function(x, y) {
        this.in = [];
        this.out = [];
        
        this.v = 0;
        
        this.x = x;
        this.y = y;
        this.seen = false;
    }
    
    // initialize the canvas
    this.init = function() {
        
        canv.width = this.sizeX * 40;
        canv.height = this.sizeY * 40;
        
        this.draw();
        
    }
    
    // groups the wires and joints into different circuits
    this.group = function() {
        
        this.circuitList = [];
        
        for (var i = 0; i < this.joints.length; i++) {this.joints[i].seen = false;}
        for (var i = 0; i < this.wires.length; i++) {this.wires[i].seen = false;}
        
        for (var i = 0; i < this.joints.length; i++) {
            
            if (this.joints[i].seen === false && (this.joints[i].in.length + this.joints[i].out.length) > 0) {
                
                this.circuitList.push(new this.circuit());
                this.pathFind(this.circuitList.length - 1, i);
                
            }
            
        }
        
    }
    
    // recursive function to map a circuit
    this.pathFind = function(currCirc, currJoint) {
        
        if (this.joints[currJoint].seen === true) {return;}
        this.joints[currJoint].seen = true;
        this.circuitList[currCirc].joints.push(currJoint);
        
        var curr = this.joints[currJoint];
        for (var i = 0; i < curr.out.length; i++) {
            if (this.wires[curr.out[i]].seen === true) {continue;}
            this.wires[curr.out[i]].seen = true;
            if (this.wires[curr.out[i]].v !== 0) {
                this.wires[curr.out[i]].vSrc = this.circuitList[currCirc].vSrc;
                this.circuitList[currCirc].vSrc += 1;
            }
            
            this.circuitList[currCirc].wires.push(curr.out[i]);
            this.pathFind(currCirc, this.wires[curr.out[i]].end);
        }
        for (var i = 0; i < curr.in.length; i++) {
            if (this.wires[curr.in[i]].seen === true) {continue;}
            this.wires[curr.in[i]].seen = true;
            if (this.wires[curr.in[i]].v !== 0) {
                this.wires[curr.in[i]].vSrc = this.circuitList[currCirc].vSrc;
                this.circuitList[currCirc].vSrc += 1;
            }
            
            this.circuitList[currCirc].wires.push(curr.in[i]);
            this.pathFind(currCirc, this.wires[curr.in[i]].start);
        }
        
    }
    
    this.calcVolt = function() {
        
        for (var i = 0; i < this.circuitList.length; i++) {
            
            var currCirc = this.circuitList[i];
            
            // first we assume one joint as having V=0, since voltage is relative. let's make it the last one.
            this.joints[this.circuitList[i].joints[this.circuitList[i].joints.length - 1]].v = 0;
            
            // then we make a cool matrix, such that inv(a)*b = c, such that c has all relevant current and voltage values
            var a = math.zeros((currCirc.joints.length - 1 + currCirc.vSrc), (currCirc.joints.length - 1 + currCirc.vSrc));
            var b = math.zeros((currCirc.joints.length - 1 + currCirc.vSrc), 1);
            for (var j = 0; j < currCirc.vSrc; j++) {
                
                for (var k = 0; k < currCirc.wires.length; k++) {
                    
                    if (this.wires[currCirc.wires[k]].vSrc === j) {
                        
                        b["_data"][currCirc.joints.length - 1 + j][0] = this.wires[currCirc.wires[k]].v;
                        
                    }
                    
                }
                
            }
            
            // for the first rows of a, we will do kirchhoff's junction rule, using I = V / R
            for (var j = 0; j < currCirc.joints.length - 1; j++) {
                
                var currJoint = this.joints[currCirc.joints[j]];
                
                // for each wire entering the joint
                for (var k = 0; k < currJoint.in.length; k++) {
                    
                    var currWire = this.wires[currJoint.in[k]];
                    
                    if (currWire.vSrc !== -1) {
                        // if it's a voltage source
                        a["_data"][j][currCirc.joints.length - 1 + currWire.vSrc] -= 1;
                        
                    } else {
                        
                        a["_data"][j][j] += 1/(currWire.r);
                        
                        var otherJoint = currWire.start;
                        
                        // since we made the voltage of the final joint 0, we only need to subtract it if it is not 0.
                        if (otherJoint !== currCirc.joints[currCirc.joints.length - 1]) {
                            
                            for (var l = 0; l < currCirc.joints.length; l++) {
                                if (otherJoint === currCirc.joints[l]) {
                                    otherJoint = l;
                                    break;
                                }
                            }
                            
                            a["_data"][j][otherJoint] -= 1/(currWire.r);
                            
                        }
                        
                    }
                    
                }
                
                // for each wire exiting the joint
                for (var k = 0; k < currJoint.out.length; k++) {
                    
                    var currWire = this.wires[currJoint.out[k]];
                    
                    if (currWire.vSrc !== -1) {
                        // if it's a voltage source
                        a["_data"][j][currCirc.joints.length - 1 + currWire.vSrc] += 1;
                        
                    } else {
                        
                        a["_data"][j][j] += 1/(currWire.r);
                        
                        var otherJoint = currWire.end;
                        
                        // since we made the voltage of the final joint 0, we only need to subtract it if it is not 0.
                        if (otherJoint !== currCirc.joints[currCirc.joints.length - 1]) {
                            
                            for (var l = 0; l < currCirc.joints.length; l++) {
                                if (otherJoint === currCirc.joints[l]) {
                                    otherJoint = l;
                                    break;
                                }
                            }
                            
                            a["_data"][j][otherJoint] -= 1/(currWire.r);
                            
                        }
                        
                    }
                    
                }
                
            }
            
            // for the final rows of a, we will do simple voltage difference.
            for (var j = 0; j < currCirc.vSrc; j++) {
                
                var start, end;
                for (var k = 0; k < currCirc.wires.length; k++) {
                    if (this.wires[currCirc.wires[k]].vSrc === j) {
                        var currWire = this.wires[currCirc.wires[k]];
                        for (var l = 0; l < currCirc.joints.length; l++) {
                            if (currCirc.joints[l] === currWire.start) {start = l;}
                            if (currCirc.joints[l] === currWire.end) {end = l;}
                        }
                    }
                }
                
                if (end !== currCirc.joints.length - 1) {
                    a["_data"][currCirc.joints.length - 1 + j][end] += 1;
                }
                if (start !== currCirc.joints.length - 1) {
                    a["_data"][currCirc.joints.length - 1 + j][start] -= 1;
                }
                
            }
            
            var c = math.multiply(math.inv(a), b);
            
            for (var j = 0; j < currCirc.joints.length - 1; j++) {
                
                this.joints[this.circuitList[i].joints[j]].v = c["_data"][j][0];
                
            }
            
            // copying new values into currCirc
            currCirc = this.circuitList[i];
            
            for (var j = 0; j < currCirc.wires.length; j++) {
                
                var currWire = this.wires[currCirc.wires[j]];
                
                if (currWire.vSrc !== -1) {
                    
                    this.wires[this.circuitList[i].wires[j]].i = c["_data"][currCirc.joints.length - 1 + currWire.vSrc][0];
                    
                } else {
                    
                    this.wires[this.circuitList[i].wires[j]].i = (this.joints[currWire.start].v - this.joints[currWire.end].v) / currWire.r;
                    
                }
                
            }
            
        }
        
    }
    
    // draw the grid to the canvas
    this.draw = function() {
        
        ctx.clearRect(0, 0, canv.width, canv.height);
        var a = canv.width / this.sizeX;
        var b = a / 2;
        
        ctx.beginPath();
        ctx.strokeStyle = "#888888";
        for (var i = 0; i < this.sizeY; i++) {
            for (var j = 0; j < this.sizeX; j++) {
                ctx.moveTo(j * a + b, i * a + b);
                ctx.arc(j * a + b, i * a + b, 1, 0, Math.PI * 2);
            }
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = "#000000";  
        ctx.fillStyle = "#FFFF0055";
        for (var i = 0; i < this.joints.length; i++) {
            
            var currJoint = this.joints[i];
            ctx.moveTo(currJoint.x * a + b, currJoint.y * a + b);
            ctx.arc(currJoint.x * a + b, currJoint.y * a + b, 3, 0, Math.PI * 2);
            
            for (var j = 0; j < currJoint.out.length; j++) {
                
                var currWire = this.wires[currJoint.out[j]];
                var start = [currJoint.x * a + b, currJoint.y * a + b];
                var end = [this.joints[currWire.end].x * a + b, this.joints[currWire.end].y * a + b];
                ctx.moveTo(start[0], start[1]);
                ctx.lineTo(end[0], end[1]);
                
                var type = this.wires[currJoint.out[j]].type;
                if (type === "R" || type === "B" || type === "L" || type === "SO" || type === "SC") {
                    ctx.stroke();
                    ctx.beginPath();
                    var img = new Image();
                    img.src = "./img/" + type + ".png";
                    rotImage(img, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2, 40, 20, Math.atan((end[1] - start[1]) / (end[0] - start[0])) + (end[0] < start[0] ? Math.PI : 0));
                }
                
                if (type === "L") {  
                    ctx.stroke();
                    ctx.beginPath();
                    var p = Math.pow(currWire.i, 2) * currWire.r;
                    ctx.arc((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, Math.min(Math.sqrt(p) * 10, 300), 0, Math.PI * 2);
                    ctx.fill();
                }
                
            }
            
        }
        ctx.stroke();
        
        if (document.getElementById("showI").checked) {
            ctx.fillStyle = "#FF0000";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            for (var i = 0; i < this.wires.length; i++) {
                
                var currWire = this.wires[i];
                var startJoint = this.joints[currWire.start];
                var endJoint = this.joints[currWire.end];
                
                ctx.fillText((Math.round(currWire.i * 100) / 100).toString() + "A", (startJoint.x + endJoint.x) / 2 * a + b, (startJoint.y + endJoint.y) / 2 * a + b);
                
            }
        }
        
        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        ctx.arc(this.posX * a + b, this.posY * a + b, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        if (this.cursorStart !== -1) {
            ctx.beginPath();
            ctx.strokeStyle = "#0000FF";
            ctx.arc(this.joints[this.cursorStart].x * a + b, this.joints[this.cursorStart].y * a + b, 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
    }
    
}

// user interaction
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var circ = new CircuitGrid(15, 15);
circ.init();
circ.circuitList.push(new circ.circuit());

document.onkeydown = function(e) {
    
    var key = e.key;
    var x = circ.posX;
    var y = circ.posY;
    
    switch (key) {
            // place objects
        case "w":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "W";
            }
            break;
        case "b":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "B";
            }
            break;
        case "r":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "R";
            }
            break;
        case "l":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "L";
            }
            break;
        case "s":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "SC";
            }
            break;
        case "v":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "V";
            }
            break;
        case "d":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "D";
            }
            break;
            
        case " ":
            if (circ.cursorStart === -1) {
                for (var i = 0; i < circ.joints.length; i++) {
                    if (circ.joints[i].x === x && circ.joints[i].y === y) {
                        circ.cursorStart = i;
                    }
                }
                
                if (circ.cursorStart === -1) {
                    if (circ.cursorMode === "V" || circ.cursorMode === "D") {
                        document.getElementById("output").innerHTML = "Output: <br>Please select an existing node pair.";
                    } else {
                        circ.cursorStart = circ.joints.length;
                        circ.joints.push(new circ.joint(x, y));
                    }
                }
            } else {
                if (circ.cursorMode !== "V" && circ.cursorMode !== "D") {
                    var wire = new circ.wire(circ.cursorMode);
                    
                    if (circ.cursorMode === "R" || circ.cursorMode === "L") {
                        wire.r = Math.max(parseFloat(prompt("Enter resistance:", "1")), 0.000000001);
                    } else if (circ.cursorMode === "B") {
                        wire.v = Math.max(parseFloat(prompt("Enter voltage", "1")), 0.000000001);
                    } else if (circ.cursorMode === "SC") {
                        wire.switch = 0;
                    }
                    
                    var cursorEnd = -1;
                    for (var i = 0; i < circ.joints.length; i++) {
                        if (circ.joints[i].x === x && circ.joints[i].y === y) {
                            cursorEnd = i;
                        }
                    }
                    if (cursorEnd === -1) {
                        cursorEnd = circ.joints.length;
                        circ.joints.push(new circ.joint(x, y));
                    }
                    
                    var currWire = circ.wires.length;
                    wire.start = circ.cursorStart;
                    wire.end = cursorEnd;
                    circ.joints[circ.cursorStart].out.push(currWire);
                    circ.joints[cursorEnd].in.push(currWire);
                    circ.wires.push(wire);
                    
                    circ.cursorStart = -1;
                    circ.group();
                    circ.calcVolt();
                } else if (circ.cursorMode === "V") {
                    var cursorEnd = -1;
                    for (var i = 0; i < circ.joints.length; i++) {
                        if (circ.joints[i].x === x && circ.joints[i].y === y) {
                            cursorEnd = i;
                        }
                    }
                    
                    if (cursorEnd === -1) {
                        document.getElementById("output").innerHTML = "Output: <br>Please select an existing node pair.";
                    } else {
                        document.getElementById("output").innerHTML = "Output: <br>V: " + Math.round((circ.joints[circ.cursorStart].v - circ.joints[cursorEnd].v) * 100) / 100;
                    }
                    circ.cursorStart = -1;
                } else {
                    var cursorEnd = -1;
                    for (var i = 0; i < circ.joints.length; i++) {
                        if (circ.joints[i].x === x && circ.joints[i].y === y) {
                            cursorEnd = i;
                        }
                    }
                    
                    if (cursorEnd === -1) {
                        document.getElementById("output").innerHTML = "Output: <br>Please select an existing node pair.";
                    } else {
                        var currS = circ.joints[circ.cursorStart];
                        var currE = circ.joints[cursorEnd];
                        for (var i = 0; i < currS.in.length; i++) {
                            var temp = currE.out.findIndex(x => x === currS.in[i]);
                            if (temp !== -1) {
                                circ.joints[circ.cursorStart].in.splice(i, 1);
                                var temp = circ.joints[cursorEnd].out.splice(temp, 1)[0];
                                circ.wires.splice(temp, 1);
                                shiftBack(temp);
                                i--;
                            }
                        }
                        for (var i = 0; i < currS.out.length; i++) {
                            var temp = currE.in.findIndex(x => x === currS.out[i]);
                            if (temp !== -1) {
                                circ.joints[circ.cursorStart].out.splice(i, 1);
                                var temp = circ.joints[cursorEnd].in.splice(temp, 1)[0];
                                circ.wires.splice(temp, 1);
                                shiftBack(temp);
                                i--;
                            }
                        }
                    }
                    circ.group();
                    circ.calcVolt();
                    circ.draw();
                    circ.cursorStart = -1;
                }
            }
            break;
            
            // move cursor
        case "ArrowUp":
            if (y > 0) {
                circ.posY--;
            }
            break;
        case "ArrowDown":
            if (y < (circ.sizeY - 1)) {
                circ.posY++;
            }
            break;
        case "ArrowLeft":
            if (x > 0) {
                circ.posX--;
            }
            break;
        case "ArrowRight":
            if (x < (circ.sizeX - 1)) {
                circ.posX++;
            }
            break;
            
            // switches
        case "0":
            for (var i = 0; i < circ.wires.length; i++) {
                if (circ.wires[i].switch === 0) {
                    circ.wires[i].type = (circ.wires[i].type === "SC" ? "SO" : "SC");
                    if (circ.wires[i].type === "SC") {
                        circ.wires[i].r = 0.000000001;
                    } else {
                        circ.wires[i].r = 10000000;
                    }
                    circ.group();
                    circ.calcVolt();
                    circ.draw();
                }
            }
            break;
            
    }
    
    circ.draw();
    
}

function rotImage(img, x, y, w, h, rot) {
    
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    ctx.drawImage(img, -(w/2), -(h/2), w, h);
    
    ctx.rotate(-rot);
    ctx.translate(-x, -y);
    
}

function shiftBack(index) {
    for (var i = 0; i < circ.joints.length; i++) {
        for (var j = 0; j < circ.joints[i].in.length; j++) {
            if (circ.joints[i].in[j] > index) {circ.joints[i].in[j]--;}
        }
        for (var j = 0; j < circ.joints[i].out.length; j++) {
            if (circ.joints[i].out[j] > index) {circ.joints[i].out[j]--;}
        }
    }
}










