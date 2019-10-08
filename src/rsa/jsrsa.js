// RSA Encryption
////////////////////////////////////////////////////////////////////////////////////////////////////
// revised as of 28 Sept. 2019 to account for new JS bigInt type
var PQLEN = 200; var ELEN = 5;

// generate a key and display it
function dispNewKey() {
    var edn = genKeyFrom();
    e = edn[0];
    d = edn[1];
    n = edn[2];
    
    // outputting values
    document.getElementById("output").innerHTML = "Output:<br>" +
        "Private Key:<br>d:<br> " + d.toString() + "<br>n:<br> " + n.toString() + "<br><br>" + 
        "Public Key:<br>e:<br> " + e.toString() + "<br>n:<br> " + n.toString();
}

// generate a key from these parameters (p, q, n, totN, e; all are optional) and return arr [e, d, n].
function genKeyFrom(p, q, n, totN, e, dispProg) {
    // accounting for factors not input by the user
    if ((p === undefined || q === undefined) && n !== undefined) {
        if (dispProg === true) {console.log("Generating q...");}
        if (p !== undefined && q === undefined) {
            q = n / p;
        } else if (q !== undefined && p === undefined) {
            p = n / q;
        }
    }
    if (totN === undefined || n === undefined) {
        if (p === undefined || q === undefined) {
            if (dispProg === true) {console.log("Generating p and q... (no key match found!)");}
            p = primeGen(PQLEN);
            q = primeGen(PQLEN);
        }
        if (dispProg === true) {console.log("Generating n and totN...");}
        n = p * q;
        totN = (p - 1n) * (q - 1n);
        if (e === undefined) {
            if (dispProg === true) {console.log("Generating e... (no key match found!)");}
            e = genE(totN);
        }
    }
    if (e === undefined) {
        if (dispProg === true) {console.log("Generating e... (no key match found!)");}
        e = genE(totN);
    }
    
    // generating d
    if (dispProg === true) {console.log("Generating d...");}
    d = MMI(e, totN);
    while (d < 0n) {d = d + totN;}
    
    // returning values
    if (dispProg === true) {console.log([p, q, totN]);}
    return [e, d, n];
}

function genE(totN) {
    e = 1n;
    while (totN % e === 0n) {
        e = primeGen(ELEN);
    }
    return e;
}

function encrypt(e, n) {
    var message = bigInt(document.getElementById("message").value.toString()).value; 
    var cipherNum = modExp(message, e, n);    
    document.getElementById("output").innerHTML = "Output:<br>Ciphertext: " + cipherNum.toString();
}

function decrypt(d, n) {
    var cipherText = bigInt(document.getElementById("enc-message").value.toString()).value;
    var messageNum = modExp(cipherText, d, n);
    document.getElementById("output").innerHTML = "Output:<br>Message: " + messageNum.toString();
}

// generates a prime with a specified number of digits
function primeGen(digits) {
    var numStr = Math.floor(Math.random() * 9 + 1).toString();
    for (var i = 0; i < (digits - 1); i++) {
        numStr += Math.floor(Math.random() * 10).toString();
    }
    
    var prime = bigInt(numStr);
    while (prime.isProbablePrime(10) === false) { 
        prime = prime.add(1);
    }
    return prime.value;
}

// multiplicative modular inverse generator (number, followed by modulus)
function MMI(a, b) {
    // sOld will be the MMI of a (mod b), tOld will be MMI of b (mod a)
    // uses euler's extended algorithm
    var rOld = a; var r = b;
    var sOld = 1n; var s = 0n;
    var tOld = 0n; var t = 1n;
    
    while (r !== 0n) {
        var div = rOld / r;
        var rNew = rOld - (div * r); rOld = r; r = rNew;
        var sNew = sOld - (div * s); sOld = s; s = sNew;
        var tNew = tOld - (div * t); tOld = t; t = tNew;
    }
    
    //console.log("MMI of a (mod b) = " + sOld);
    //console.log("MMI of b (mod a) = " + tOld);
    //console.log("GCD: " + rOld);
    
    return sOld;
}

// takes the modulo of a number with a very large exponent recursively ((a ^ b) % c)
function modExp(a, b, c) {
    // if a mod c = 0, a^b mod c = 0
    if (a % c === 0n) {return 0n;}
    
    var bBin = b.toString(2);
    var modTable = tableGen(a, b, c);
    var prod = 1n;
    
    for (var i = 0; i < bBin.length; i++) {
        if (bBin[i] === "1") {
            prod = prod * (modTable[modTable.length - 1 - i]);
        }
    }
    return prod % c;
}

// for some a, b, and c, generates a table that gives (a ^ (2 ^ i)) mod c with enough elements to cover all of toBinary(b)
// works because (a * b) mod c = ((a mod c) * (b mod c)) mod c
function tableGen(a, b, c) {
    var table = [1n];
    table[1] = a % c;
    for (var i = 2; i <= b.toString(2).length; i++) {
        table[i] = (table[i - 1]*table[i - 1]) % c;
    }
    
    return table;
}

// warning: doesn't work with big primes
// warning: also doesn't work well with small primes
function getPrimes(int) {
    var primes = [];
    var curr = 2n;
    
    while (curr < int) {
        if ((int / curr) * curr === int) {
            int /= curr;
            primes.push(curr);
            console.log(curr);
        } else {
            curr += 1n;
        }
    }
    primes.push(int);
    
    return primes;
}










