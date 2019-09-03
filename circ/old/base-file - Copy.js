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
    this.grid = [];
    this.cursorMode = "W";
    this.cursorStart = -1;
    this.posX = 0;
    this.posY = 0;
    
    // initialize the circuit grid
    this.init = function() {
        
        document.getElementById("main").textContent = "";
        
        for (var i = 0; i < sizeY; i++) {
            
            this.grid.push(Array(sizeX).fill(0));
            
            var row = document.createElement("div");
            row.id = "row-" + i;
            document.getElementById("main").appendChild(row);
            
        }
        
        this.disp();
        
    }
    
    this.initC = function() {
        
        canv.width = this.sizeX * 20;
        canv.height = this.sizeY * 20;
        
    }
    
    // display the grid
    this.disp = function() {
        
        for (var i = 0; i < this.grid.length; i++) {
            
            var curr = document.getElementById("row-" + i);
            curr.textContent = "";
            
            for (var j = 0; j < this.grid[i].length; j++) {
                
                if (i == this.posY && j == this.posX) {
                    
                    curr.innerHTML += "<strong>" + this.grid[i][j] + "</strong>";
                    
                } else {
                    
                    curr.innerHTML += this.grid[i][j];
                    
                }
                
            }
            
        }
        
    }
    
    this.draw = function() {
        
        ctx.clearRect(0, 0, canv.width, canv.height);
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
                
        for (var i = 0; i < this.circuitList[0].joints.length; i++) {
            
            var currJoint = this.circuitList[0].joints[i];
            
            for (var j = 0; j < currJoint.out.length; j++) {
                
                ctx.moveTo(currJoint.x * 20 + 10, currJoint.y * 20 + 10);
                ctx.lineTo(this.circuitList[0].joints[this.circuitList[0].wires[currJoint.out[j]].end].x * 20 + 10, this.circuitList[0].joints[this.circuitList[0].wires[currJoint.out[j]].end].y * 20 + 10);
                
            }
            
        }
        
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        ctx.arc(this.posX * 20 + 10, this.posY * 20 + 10, 3, 0, Math.PI * 2);
        ctx.stroke();
        
        
    }
    
    this.calcVolt = function() {
        
        for (var i = 0; i < this.circuitList.length; i++) {
            
            var currCirc = this.circuitList[i];
            
            // first we appoint one joint as having V=0, since voltage is relative. let's make it the last one.
            this.circuitList[i].joints[currCirc.joints.length - 1].v = 0;
            
            // then we make a cool matrix, such that inv(a)*b = c, such that c has all relevant current and voltage values
            var a = math.zeros((currCirc.joints.length - 1 + currCirc.vSrc), (currCirc.joints.length - 1 + currCirc.vSrc));
            var b = math.zeros((currCirc.joints.length - 1 + currCirc.vSrc), 1);
            for (var j = 0; j < currCirc.vSrc; j++) {
                
                for (var k = 0; k < currCirc.wires.length; k++) {
                    
                    if (currCirc.wires[k].vSrc === j) {
                        
                        b["_data"][currCirc.joints.length - 1 + j][0] = currCirc.wires[k].v;
                        
                    }
                    
                }
                
            }
            
            // for the first rows of a, we will do kirchhoff's junction rule, using I = V / R
            for (var j = 0; j < currCirc.joints.length - 1; j++) {
                
                var currJoint = currCirc.joints[j];
                
                // for each wire entering the joint
                for (var k = 0; k < currJoint.in.length; k++) {
                    
                    var currWire = currCirc.wires[currJoint.in[k]];
                    
                    if (currWire.vSrc !== -1) {
                        // if it's a voltage source
                        a["_data"][j][currCirc.joints.length - 1 + currWire.vSrc] -= 1;
                        
                    } else {
                        
                        a["_data"][j][j] += 1/(currWire.r);
                        
                        var otherJoint = currWire.start;
                        
                        // since we made the voltage of the final joint 0, we only need to subtract it if it is not 0.
                        if (otherJoint !== currCirc.joints.length - 1) {
                            
                            a["_data"][j][otherJoint] -= 1/(currWire.r);
                            
                        }
                        
                    }
                    
                }
                
                // for each wire exiting the joint
                for (var k = 0; k < currJoint.out.length; k++) {
                    
                    var currWire = currCirc.wires[currJoint.out[k]];
                    
                    if (currWire.vSrc !== -1) {
                        // if it's a voltage source
                        a["_data"][j][currCirc.joints.length - 1 + currWire.vSrc] += 1;
                        
                    } else {
                        
                        a["_data"][j][j] += 1/(currWire.r);
                        
                        var otherJoint = currWire.end;
                        
                        // since we made the voltage of the final joint 0, we only need to subtract it if it is not 0.
                        if (otherJoint !== currCirc.joints.length - 1) {
                            
                            a["_data"][j][otherJoint] -= 1/(currWire.r);
                            
                        }
                        
                    }
                    
                }
                
            }
            
            // for the final rows of a, we will do simple voltage difference.
            for (var j = 0; j < currCirc.vSrc; j++) {
                
                var start, end;
                for (var k = 0; k < currCirc.wires.length; k++) {
                    if (currCirc.wires[k].vSrc === j) {
                        start = currCirc.wires[k].start;
                        end = currCirc.wires[k].end;
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
                
                this.circuitList[i].joints[j].v = c["_data"][j][0];
                
            }
            
            // copying new values into currCirc
            currCirc = this.circuitList[i];
            
            for (var j = 0; j < currCirc.wires.length; j++) {
                
                var currWire = currCirc.wires[j];
                
                if (currWire.vSrc !== -1) {
                    
                    this.circuitList[i].wires[j].i = c["_data"][currCirc.joints.length - 1 + currWire.vSrc][0];
                    
                } else {
                    
                    this.circuitList[i].wires[j].i = (currCirc.joints[currWire.start].v - currCirc.joints[currWire.end].v) / currWire.r;
                    
                }
                
            }
            
        }
        
    }
    
    // contains each circuit
    this.circuitList = [];
    this.circuit = function() {
        this.wires = [];
        this.joints = [];
        this.vSrc = 0;
    }
    
    // a wire segment. has some voltage (change), and some resistance. also starts and ends somewhere.
    this.wire = function() {
        this.v = 0;
        this.i = 0;
        this.r = 0.0001;
        this.vSrc = -1;
        
        this.start;
        this.end;
    }
    
    // a joint. has some wires going into it. has some wires going out of it. has some voltage that will later be determined. also has some x and y for drawing it on the grid
    this.joint = function(x, y) {
        this.in = [];
        this.out = [];
        
        this.v = 0;
        
        this.x = x;
        this.y = y;
    }
    
}

// user interaction
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var circ = new CircuitGrid(15, 15);
circ.init();
circ.circuitList.push(new circ.circuit());

document.onkeydown = function(e) {
    
    var key = e.key;
    console.log(key);
    var x = circ.posX;
    var y = circ.posY;
    
    switch (key) {
            // place objects
        case "0":
            if (circ.cursorStart === -1) {
                circ.cursorMode = "0";
            }
            break;
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
            
        case " ":
            if (circ.cursorStart === -1) {
                if (circ.grid[circ.posY][circ.posX] !== 0) {
                    circ.cursorStart = circ.grid[circ.posY][circ.posX] - 1;
                } else {
                    circ.cursorStart = circ.circuitList[0].joints.length;
                    circ.circuitList[0].joints.push(new circ.joint(circ.posX, circ.posY));
                    circ.grid[circ.posY][circ.posX] = circ.cursorStart + 1;
                }
            } else {
                var wire = new circ.wire();
                
                if (circ.cursorMode === "R") {
                    wire.r = parseFloat(prompt("Enter resistance:", "1"));
                } else if (circ.cursorMode === "B") {
                    wire.v = parseFloat(prompt("Enter voltage", "1"));
                    wire.vSrc = circ.circuitList[0].vSrc;
                    circ.circuitList[0].vSrc += 1;
                }
                
                var cursorEnd;
                if (circ.grid[circ.posY][circ.posX] !== 0) {
                    cursorEnd = circ.grid[circ.posY][circ.posX] - 1;
                } else {
                    cursorEnd = circ.circuitList[0].joints.length;
                    circ.circuitList[0].joints.push(new circ.joint(circ.posX, circ.posY));
                    circ.grid[circ.posY][circ.posX] = cursorEnd + 1;
                }
                
                wire.start = circ.cursorStart;
                wire.end = cursorEnd;
                var currWire = circ.circuitList[0].wires.length;
                circ.circuitList[0].wires.push(wire);
                
                circ.circuitList[0].joints[circ.cursorStart].out.push(currWire);
                circ.circuitList[0].joints[cursorEnd].in.push(currWire);
                
                circ.cursorStart = -1;
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
            
            // run simulation
        case "Enter":
            circ.start();
    }
    
    circ.disp();
    circ.draw();
    
}














