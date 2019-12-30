// neural network
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var testInterval, totalInput;
var output = [];
var input = [];
var canvas = document.getElementById('num');
var ctx = canvas.getContext('2d');
var canvasRes = document.getElementById('results');
var res = canvasRes.getContext('2d');
var canvasAll = document.getElementById('number-all');
var all = canvasAll.getContext('2d');
var testsRemaining = -1;
var totalSuccess = 0;
// net is used with the interactive html
var net;
var totalTests = 0;

// sizes argument is an array of the sizes of each layer
function Network(sizes) {
    
    // initialization
    this.sizes = sizes;
    this.numLayers = this.sizes.length;
    this.biases = Array(this.numLayers - 1);
        for (var i = 0; i < this.biases.length; i++) {
            this.biases[i] = math.matrix([]);
            this.biases[i].resize([this.sizes[i + 1], 1])
            for (var j = 0; j < this.sizes[i + 1]; j++) {
                this.biases[i]['_data'][j] = ([Math.random() * 2 - 1]);
            }
        }
    this.weights = Array(this.numLayers - 1);
        for (var i = 0; i < this.weights.length; i++) {
            this.weights[i] = math.matrix([]);
            this.weights[i].resize([this.sizes[i + 1], this.sizes[i]]);
            for (var j = 0; j < this.sizes[i + 1]; j++) {
                this.weights[i]['_data'][j] = [];
                for (var k = 0; k < this.sizes[i]; k++) {
                    this.weights[i]['_data'][j][k] = Math.random() * 2 - 1;
                }
            }
        }
    this.currentSet = [];
    this.currentLabels = [];
    this.currentTest = -1;
    this.avgCost = 0;
    this.costArr = [];
    this.successArr = [];
    this.gradient = [];
        for (var i = 0; i < this.numLayers - 1; i++) {
            this.gradient.push(math.zeros(this.sizes[i + 1], this.sizes[i]));
            this.gradient.push(math.zeros(this.sizes[i + 1], 1));
        }
    
    /* layer is an integer, input is a math.matrix. 
    feeds forward through a specified layer, with a given input (the previous layer), returning the new layer */
    this.feedForward = function(layer, input) {
        
        var final = math.add(math.multiply(this.weights[layer], input), this.biases[layer]);
        for (var i = 0; i < final['_data'].length; i++) {
            final['_data'][i][0] = sig(final['_data'][i][0]);
        }
        return final;
        
    }
    
    // index is index in currentSet
    this.test = function(index) {
        
        var layerValues = [math.multiply(this.currentSet[index], (1 / 255))];
        for (var i = 0; i < (this.numLayers - 1); i++) {
            layerValues.push(this.feedForward(i, layerValues[i]));
        }
        
        var final = layerValues[layerValues.length - 1];
        var verdict;
        var maxVal = 0;
        var cost = 0;
        for (var i = 0; i < final['_data'].length; i++) {
            
            cost += (i === this.currentLabels[index] ? Math.pow(final['_data'][i][0] - 1, 2) : Math.pow(final['_data'][i][0], 2));
            if (final['_data'][i][0] > maxVal) {
                
                verdict = i;
                maxVal = final['_data'][i][0];
                
            }
            
        }
        
        if (this.currentTest !== -1) {
            if (this.currentTest === 0) {
                this.avgCost = cost;
            } else {
                this.avgCost *= (this.currentTest / (this.currentTest + 1));
                this.avgCost += (cost / (this.currentTest + 1));
            }
        }
        
        if (verdict === this.currentLabels[index]) {totalSuccess++;}
        if (document.getElementById('display-visuals').checked) {
            document.getElementById('output').innerHTML = 
                'Output: <br><br>' + 
                'Verdict: this is ' + verdict + '<br>Expected: this is ' + this.currentLabels[index] + '<br>' + 
                (verdict === this.currentLabels[index] ? '<span style="color: lime;"><b>Correct!</b></span>' : '<span style="color: red;"><b>Incorrect...</b></span>') + 
                '<br>cost: ' + cost.toString().substr(0, 10);
            
            // "draw all"
            var pixels = this.currentSet[index];
            for (var i = 0; i < pixels["_data"].length; i++) {
                var colStr = pixels["_data"][i][0].toString(16);
                if (colStr.length === 1) {colStr = "0" + colStr;}
                
                all.fillStyle = (verdict === this.currentLabels[index] ? "#00" + colStr + "00" : "#" + colStr + "0000");
                all.fillRect(
                    28 * (index % 10) + (i % 28), 28 * Math.floor(index / 10) + Math.floor(i / 28), 1, 1
                );
            }
        }
        
        return layerValues;
        
    }
    
    // NOTE: this function is called through the html page, and because it is called through 'window', 
    // the 'this' keywork doesn't work until we call another function in 'net'.
    this.autoTest = function() {net.auto();}
    
    this.auto = function() {
        
        this.currentTest++
        
        if (this.currentTest < this.currentLabels.length) {
            if (document.getElementById('display-visuals').checked) {this.draw(this.currentTest);}
            var finalVals = this.test(this.currentTest);
            if (document.getElementById('learn').checked) {
                this.backprop(finalVals);
            }
        } else {
            if (document.getElementById('continue').checked === false) {
                clearInterval(testInterval);
            } else {
                this.selectSet(parseInt(document.getElementById("index-size").value));
            }
            this.currentTest = -1;
            if (document.getElementById('learn').checked === true) {
            
                for (var i = 0; i < net.numLayers - 1; i++) {
                    
                    this.weights[i] = math.add(this.weights[i], math.multiply(this.gradient[i * 2], -1 * document.getElementById('learn-speed').value));
                    this.biases[i] = math.add(this.biases[i], math.multiply(this.gradient[i * 2 + 1], -1 * document.getElementById('learn-speed').value));
                    
                }
            }
            if (document.getElementById('display-visuals').checked) {document.getElementById('output').innerHTML += '<br><br>Total Success: ' + totalSuccess;}
            
            // logging success
            console.log('success: ' + totalSuccess);
            this.successArr.push(totalSuccess);
            console.log('avg. cost: ' + this.avgCost);
            this.costArr.push(this.avgCost);
            totalSuccess = 0;
            totalTests++;
            console.log('test #: ' + totalTests);
            
            if (document.getElementById('display-visuals').checked) {this.drawGraph();}
        }
        
    }
    
    // backpropagation. takes array of activation values
    this.backprop = function(vals) {
        
        // elements come in triads. derivatives of cost w/ respect to weights, biases, and activation values respectively
        var currGrad = [];
        for (var i = 0; i < this.numLayers - 1; i++) {
            currGrad.push(math.zeros(this.sizes[i + 1], this.sizes[i]));
            currGrad.push(math.zeros(this.sizes[i + 1], 1));
            currGrad.push(math.zeros(this.sizes[i + 1], 1));
        }
        
        // initializing the final section (delC/delA(L))
        for (var i = 0; i < this.sizes[this.numLayers - 1]; i++) {
            currGrad[currGrad.length - 1]['_data'][i][0] = (i === this.currentLabels[this.currentTest] ? (vals[vals.length - 1]['_data'][i][0] - 1) : (vals[vals.length - 1]['_data'][i][0]));
        }
        
        // for each layer, we go back and find (delC/delW), (delC/delB), and finally, (delC/delA(L-1)) for recursion
        for (var i = this.numLayers - 2; i >= 0; i--) {
            
            for (var j = 0; j < this.sizes[i + 1]; j++) {
                
                // sigmoid' = sig * (1 - sig), sig(z) = a, so sig'(z) = a * (1 - a)
                var sigP = (vals[i + 1]['_data'][j][0]) * (1 - vals[i + 1]['_data'][j][0]);
                
                // finding (delC/delB)
                currGrad[i * 3 + 1]['_data'][j][0] = sigP * currGrad[i * 3 + 2]['_data'][j][0];
                
                // finding (delC/delW)
                for (var k = 0; k < this.sizes[i]; k++) {
                    currGrad[i * 3]['_data'][j][k] = vals[i]['_data'][k][0] * sigP * currGrad[i * 3 + 2]['_data'][j][0];
                }
                
                if (i === 0) {continue;}
                
                // finally, finding (delC/delA(L-1))
                for (var k = 0; k < this.sizes[i]; k++) {
                    // also, note the " ... += 5 * ... ". this is to keep the recursive layers further down the line from becoming too small
                    currGrad[i * 3 - 1]['_data'][k][0] += 1 * this.weights[i]['_data'][j][k] * sigP * currGrad[i * 3 + 2]['_data'][j][0];
                }
                
            }
            
        }
        
        // adding to averages
        for (var i = 0; i < this.gradient.length; i++) {
            this.gradient[i] = math.multiply(this.gradient[i], this.currentTest / (this.currentTest + 1));
        }
        for (var i = 0; i < this.numLayers - 1; i++) {
            this.gradient[i * 2] = math.add(this.gradient[i * 2], math.multiply(currGrad[i * 3], 1 / (this.currentTest + 1)));
            this.gradient[i * 2 + 1] = math.add(this.gradient[i * 2 + 1], math.multiply(currGrad[i * 3 + 1], 1 / (this.currentTest + 1)));
        }
        
    }
    
    // selects a new test set of some specified size
    this.selectSet = function(size) {
        
        this.currentSet = [];
        this.currentLabels = [];
        for (var i = 0; i < size; i++) {
            
            var curr = [];
            var posInit = Math.floor(Math.random() * totalInput) * this.sizes[0];
            for (var j = posInit; j < posInit + this.sizes[0]; j++) {
                curr.push([input[j]]);
            }
            
            this.currentSet.push(math.matrix(curr));
            this.currentLabels.push(output[posInit / this.sizes[0]]);
            
        }
        
    }
    
    // takes some index in currentSet, and draws it on the canvas
    this.draw = function(index) {
        
        var pixels = this.currentSet[index]['_data'];
        var currLabel = this.currentLabels[index];
        document.getElementById('label').textContent = 'Label: ' + currLabel;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 280, 280);
        
        for (var i = 0; i < pixels.length; i++) {
            
            var currColor = pixels[i][0].toString(16);
            if (currColor.length < 2) {currColor = '0' + currColor;}
            
            ctx.fillStyle = '#' + currColor + currColor + currColor;
            ctx.fillRect(10 * (i % 28), 10 * (Math.floor(i / 28)), 10, 10);
            
        }
        
    }
    
    this.drawGraph = function() {
        
        res.clearRect(0, 0, canvasRes.width, canvasRes.height);
        
        // getting scale
        var maxCost, posInit;
        maxCost = document.getElementById('graph-scale').value;
        if (document.getElementById('show-all').checked) {
            posInit = 0;
        } else if (document.getElementById('show-amount')) {
            posInit = (this.costArr.length > 100 ? this.costArr.length - 100 : 0);
            for (var i = posInit; i < this.costArr.length; i++) {
                if (this.costArr[i] > maxCost) {
                    maxCost = this.costArr[i];
                }
            }
        }
        
        // cost
        res.beginPath();
        res.moveTo(0, canvasRes.height - ((this.costArr[posInit] / maxCost) * canvasRes.height));
        res.strokeStyle = '#CC1111';
        for (var i = posInit + 1; i < this.costArr.length; i++) {
            res.lineTo(canvasRes.width / (this.costArr.length - posInit) * (i - posInit), canvasRes.height - ((this.costArr[i] / maxCost) * canvasRes.height));
        }
        res.stroke();
        
        // success
        res.beginPath();
        res.moveTo(0, canvasRes.height - (this.successArr[posInit] * 2))
        res.strokeStyle = '#1111CC';
        for (var i = posInit + 1; i < this.successArr.length; i++) {
            res.lineTo(canvasRes.width / (this.successArr.length - posInit) * (i - posInit), canvasRes.height - (this.successArr[i] * (canvasRes.height / document.getElementById('index-size').value)));
        }
        res.stroke();
        
    }
    
}

// initializes the neural net
function init() {
    
    net = new Network([Math.pow(28, 2), 16, 16, 10]);
    net.selectSet(100);
    
}

function sig(x) {
    return (1 / (1 + Math.pow(Math.E, -1 * x)));
}

// getting and receiving text files
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var ready = 0;

// getting input
var request = new XMLHttpRequest();
request.responseType = 'arraybuffer';
request.open('GET', 'train-images.idx3-ubyte', true);
request.onreadystatechange = function() {
    
    if (this.readyState === 4) {
        
        var arrayBuffer = this.response;
        var byteArr = new Uint8Array(arrayBuffer);
        
        input = [];
        for (var i = 0; i < byteArr.length; i++) {input.push(byteArr[i]);}
        input.splice(0, 16);
        
        console.log('Request complete. (input)');
        ready++;
        if (ready === 2) {document.body.style.display = '';}
        
    }
    
}
request.send();

// getting output
var request = new XMLHttpRequest();
request.responseType = 'arraybuffer';
request.open('GET', 'train-labels.idx1-ubyte', true);
request.onreadystatechange = function() {
    
    if (this.readyState === 4) {
        
        var arrayBuffer = this.response;
        var byteArr = new Uint8Array(arrayBuffer);
        
        for (var i = 0; i < byteArr.length; i++) {output.push(byteArr[i]);}
        
        output.splice(0, 4);
        var temp = output.splice(0, 4);
        totalInput = ((temp[3]) + (Math.pow(2, 8) * temp[2]) + (Math.pow(2, 16) * temp[1]) + (Math.pow(2, 24) * temp[0]));
        console.log('Request complete. (output)');
        ready++;
        if (ready === 2) {document.body.style.display = '';}
        
    }
    
}
request.send();

// save net
/*
function save() {
    
    var str = '';
    str += net.sizes + ' | ';
    str += net.weights + ' | ';
    str += net.biases;
    
    // https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript
    var textFile = null,
        makeTextFile = function (text) {
            
            var data = new Blob([text], {type: 'text/plain'});
            
            // If we are replacing a previously generated file we need to
            // manually revoke the object URL to avoid memory leaks.
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }
            
            textFile = window.URL.createObjectURL(data)
            // returns a URL you can use as a href
            
            return textFile;
            
        };
    
    var name = document.getElementById('name').value;
    
    document.getElementById('file-cont').innerHTML = '';
    
    var link = document.createElement('a');
    link.setAttribute('download', name + '.txt');
    link.href = makeTextFile(str);
    link.textContent = name + '.txt'
    document.getElementById('file-cont').appendChild(link);
    
}

function load(loadpath) {
    
    var request = new XMLHttpRequest();
    request.open('GET', './save-file/' + loadpath, true);
    request.onreadystatechange = function() {
        
        if (this.readyState === 4) {
            
            var x = this.response.split(/ \| /);
            
            var sizes = x[0].split(/,/);
            for (var i = 0; i < sizes.length; i++) {sizes[i] = parseInt(sizes[i]);}
            net = new Network(sizes);
            
            var weights = x[1].substr(2).split(/\], \[|\]\],\[\[/);
            var curr;
            var disp = 0;
            for (var i = 1; i < sizes.length; i++) {
                curr = [];
                for (var j = disp; j < disp + sizes[i]; j++) {
                    var temp = weights[j].split(/, /);
                    for (var k = 0; k < temp.length; k++) {temp[k] = parseFloat(temp[k]);}
                    
                    curr.push(temp);
                }
                net.weights[i - 1] = math.matrix(curr);
                disp += sizes[i];
            }
            
            var biases = x[2].substr(2).split(/\],\[/);
            for (var i = 1; i < sizes.length; i++) {
                curr = biases[i - 1].split(/\], \[/);
                if (i > 1) {curr[0] = curr[0].substr(1);}
                for (var j = 0; j < curr.length; j++) {
                    curr[j] = [parseFloat(curr[j])];
                }
                net.biases[i - 1] = math.matrix(curr);
            }
            
            net.selectSet(100);
            
            console.log('Load complete.');
            
        }
        
    }
    request.send();
    
}
*/

// changing tabs in UI
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function changeTab(tab) {
    document.getElementById('open-test').classList.remove('selected');
    document.getElementById('open-save').classList.remove('selected');
    document.getElementById('open-graph').classList.remove('selected');
    
    document.getElementById('open-' + tab).classList.add('selected');
    
    document.getElementById('div-test').style.display = 'none';
    document.getElementById('div-save').style.display = 'none';
    document.getElementById('div-graph').style.display = 'none';
    
    document.getElementById('div-' + tab).style.display = '';
}