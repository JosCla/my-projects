// Stock Predictor
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Let's predict some stocks!

var data, dateArr, stockArr, dayNum, money, stocks, open, high, low, close, playingGame;
var canvas = document.getElementById("graph");
var ctx = canvas.getContext("2d");

// XMLHttp / initialization
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function newStock() {
    
    if (document.getElementById("API-key").value !== 'key') {
        
        document.getElementById("input-api").style.display = 'none';
    
        var stock = stockArr[Math.floor(Math.random() * stockArr.length)];
        
        var request = new XMLHttpRequest();
        
        request.open('GET', 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + stock + '&apikey=' + document.getElementById("API-key").value, true);
        
        request.onload = function() {
            
            if (request.status >= 200 && request.status < 400) {
                
                data = JSON.parse(this.response);
                // Object.keys(obj) returns an array (in reverse order) of each property of obj
                dateArr = Object.keys(data['Time Series (Daily)']);
                
                // DOM Work
                document.getElementById("btn-step").disabled = false;
                document.getElementById("UI").style.display = '';
                document.getElementById("stock-used").textContent = 'Stock Used: ' + stock;
                
                init();
                
            } else {
                
                console.log('SORRY NOTHING');
                
            }
            
        };
        
        request.send();
        
    } else {
        
        alert('Please input API key.');
        
    }
    
}

function init() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dayNum = 4;
    money = 10000;
    stocks = 0;
    playingGame = true;
    document.getElementById("final").style.display = 'none';
    step();
    
}

// main functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function step() {

    dayNum++
    
    dispGraph();
    
    // checking if the user has finished
    if (dayNum === 100) {
        
        // turning off game
        document.getElementById("btn-step").disabled = true;
        playingGame = false;
        
        // displaying final stats
        var endTot = money + (stocks * close);
        document.getElementById("final").innerHTML = 'Final Stats: <br>Ending Total: $' + (Math.floor(100 * endTot) / 100) + 
            '<br>Percent Change: ' +  '<span style="color: ' + (endTot > 10000 ? 'green' : 'red') + ';">' + (Math.floor(((endTot - 10000) / 10000 * 100 * 1000)) / 1000) + '%</span><br>' + 
            (endTot > 10000 ? 'Great job!' : 'Better luck next time!');
        document.getElementById("final").style.display = '';
        
    }
    
}

function buy(amount) {
    
    if (playingGame && amount > 0) {
        
        // 10 dollar fee is needed to buy
        if (money >= (close * amount) + 10) {
            
            stocks += amount;
            money -= (close * amount + 10);
            updateUI();
            
        } else {
            
            alert('Insufficient funds for transaction.');
            
        }
        
    } else {
        
        alert('Please input amount of stocks to buy.');
        
    }
    
}

function sell(amount) {
    
    if (playingGame && amount > 0) {
        
        // 10 dollar fee is needed to sell
        // also you can sell more stocks than you have, known as selling short
        if (money >= 10) {
            
            stocks -= amount;
            money += (close * amount - 10);
            updateUI();
            
        } else {
            
            alert('Insufficient funds for transaction.');
            
        }
        
    } else {
        
        alert('Please input amount of stocks to sell.');
        
    }
    
}

function updateUI() {
    
    document.getElementById("output-day").innerHTML = 
        '<span style="font-size: 20pt">Day:</span><br>' + dayNum + ' / 100';
    document.getElementById("output-funds").innerHTML = 
        '<span style="font-size: 20pt">Funds:</span><br>$' + (Math.floor(money * 100) / 100) + '(' + (Math.floor((money + (stocks * close)) * 100) / 100) + ')';
    document.getElementById("output-stocks").innerHTML = 
        '<span style="font-size: 20pt">Stocks:</span><br>' + stocks
    document.getElementById("output-stockval").innerHTML = 
        '<span style="font-size: 20pt">Stock Value:</span><br>' + close + '(' + (Math.floor(stocks * close * 100) / 100) + ')';
    
}

function dispGraph() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    
    // determining how large the graph must be
    var max = parseFloat(data['Time Series (Daily)'][dateArr[99]]['2. high']);
    var min = parseFloat(data['Time Series (Daily)'][dateArr[99]]['3. low']);
    
    for (var j = 1; j < dayNum; j++) {
        
        if (parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['2. high']) > max) {
            
            max = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['2. high']);
            
        }
        
        if (parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['3. low']) < min) {
            
            min = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['3. low']);
            
        }
        
    }
    
    // Getting everything displayed
    ctx.strokeStyle = '#888888';
    for (var j = 0; j < dayNum; j++) {
        
        // getting relevant values for the current day
        open = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['1. open']);
        high = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['2. high']);
        low = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['3. low']);
        close = parseFloat(data['Time Series (Daily)'][dateArr[99 - j]]['4. close']);
        
        // calculating totals for current day
        updateUI();
        
        // drawing japanese candlestick style stock graph
        if (open < close) {
            
            ctx.fillStyle = "#11EE11";
            ctx.fillRect((j * canvas.width / dayNum), canvas.height - ((close - min) * (canvas.height / (max - min))), canvas.width / dayNum, (close - open) * (canvas.height / (max - min)));
            
        } else if (close < open) {
            
            ctx.fillStyle = "#EE1111";
            ctx.fillRect((j * canvas.width / dayNum), canvas.height - ((open - min) * (canvas.height / (max - min))), canvas.width / dayNum, (open - close) * (canvas.height / (max - min)));
            
        }
        ctx.moveTo((j * canvas.width / dayNum) + (canvas.width / (2 * dayNum)), canvas.height - (high - min) * (canvas.height / (max - min)));
        ctx.lineTo((j * canvas.width / dayNum) + (canvas.width / (2 * dayNum)), canvas.height - (low - min) * (canvas.height / (max - min)));
        ctx.stroke();
        
    }
    
    // drawing in graph axes
    ctx.beginPath();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#AAAAAA';
    for (var i = 0; i < 4; i++) {
        
        ctx.moveTo(0, i * canvas.height / 4);
        ctx.lineTo(canvas.width, i * canvas.height / 4);
        ctx.fillText((Math.floor(100 * (max + (i / 4) * (min - max))) / 100).toString(), 0, 10 + i * (canvas.height) / 4);
        
    }
    ctx.stroke();
    ctx.fillText((Math.floor(100 * min) / 100).toString(), 0, canvas.height);
    
}

stockArr = ['VNET', 'AKAM', 'ANF', 'BIDU', 'BCOR', 'WIFI', 'CARB', 'JRJC', 'CCIH', 'CCOI', 'CXDO', 'ENV', 'FB', 'GDDY', 'IAC', 'IIJI', 'JCOM', 'LLNW', 'MOMO', 'NTES', 'EGOV', 'SIFY', 'SINA', 'TCTZF', 'TCEHY', 'TCX', 'XNET', 'YAHOY', 'YNDX', 'TWTR', 'AAPL', 'MSFT', 'RCA', 'GLD', 'GOOG', 'BAC', 'ABT', 'XOM', 'AMZN', 'ALL', 'AMD', 'AET', 'CELG', 'MMM', 'LUV', 'ABBV', 'IBM', 'INTC', 'ADBE', 'AVP', 'AXP', 'AEE', 'APD', 'ACB', 'AZO', 'AGN', 'AVY', 'AAN', 'MRO', 'ACN', 'ARW', 'AAC', 'WMT', 'ADM', 'AYI', 'TXN', 'TGT', 'ADSK', 'ATU', 'AKS', 'AEM', 'WHR', 'SBUX', 'AHC', 'ABX', 'CSCO', 'ALTR', 'A', 'BABA', 'B', 'BA', 'C', 'CGC', 'D', 'DIS', 'E', 'F', 'G', 'GE', 'H', 'HAS', 'HD', 'I', 'IQ', 'QQQ', 'JD', 'JPM', 'JNJ', 'JCP', 'K', 'KHC', 'KO', 'KMI', 'L', 'M', 'MU', 'T', 'NVDA', 'NFLX', 'O', 'OLED', 'P', 'QCOM', 'QRVO', 'QD', 'R', 'S', 'SQ', 'SPY', 'TSLA', 'UTX', 'UVXY', 'V', 'VZ', 'W', 'WTW', 'WFC', 'X', 'XXII', 'XPO', 'Y', 'YECO', 'Z', 'ZNGA', 'ZYNE', 'ZS', 'ZUO', 'AMRN', 'ACBFF', 'BRK-B', 'BHC', 'BV', 'CHK', 'DGAZ', 'DWDP', 'DXC', 'DNR', 'DBX', 'EVER', 'EQ', 'FTACU', 'FTR', 'FEYE', 'GERN', 'GSKY', 'HCLP', 'HON', 'HAL', 'HEAR', 'INFN', 'INGN', 'VXX', 'JNUG', 'JAZZ', 'JBGS', 'JKS', 'JNPR', 'KR', 'KTOS', 'KSHB', 'LMT', 'LLY', 'LOW', 'LITE', 'MSC', 'MYL', 'MCD', 'NMCI', 'NKTR', 'NBEV', 'ORCL', 'OPK', 'OXY', 'OAS', 'PCB', 'PFE', 'PG', 'QID', 'QUAD', 'QLD', 'QBIO', 'QEP', 'RRI', 'RAD', 'REGN', 'RF', 'RDS-A', 'SWI', 'TLSA', 'UNH', 'UA', 'UPS', 'TVIX', 'VCEL', 'VLO', 'WYNN', 'WBA', 'WB', 'WATT', 'XLE', 'XLF', 'XBI', 'XRX', 'AUY', 'YY', 'YINN', 'YUM', 'ZN', 'ZTS', 'ZIOP'];

document.onkeydown = function(e) {
    
    if (e.keyCode === 83 && playingGame) {
        
        step();
        
    }
    
}

// for getting new stocks
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var newStocks = [];
var i = 0;

function findStocks() {
    
    document.getElementById('input-api').style.display = 'none';
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('btn-step').style.display = 'none';

    getSomeStocks();
    var getStocksInterval = setInterval(getSomeStocks, 15000);
    
    function getSomeStocks() {
        
        var currChar = alphabet[i];
        
        var request = new XMLHttpRequest();
        
        request.open('GET', 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + currChar + '&apikey=WMH5EOMQB15Z7COE', true);
        
        request.onload = function() {
            
            if (request.status >= 200 && request.status < 400) {
                
                var data = JSON.parse(this.response);
                
                for (var j = 5; j < 10; j++) {
                    
                    console.log(currChar + ' | ' + data['bestMatches'][j]['1. symbol']);
                    newStocks.push(data['bestMatches'][j]['1. symbol']);
                    for (var k = 0; k < stockArr.length; k++) {
                        
                        if (stockArr[k] === data['bestMatches'][j]['1. symbol']) {
                            
                            newStocks.pop();
                            console.log(data['bestMatches'][j]['1. symbol'] + ' was already in stockArr.');
                            
                        }
                        
                    }
                    for (var k = 0; k < (newStocks.length - 1); k++) {
                        
                        if (newStocks[k] === data['bestMatches'][j]['1. symbol']) {
                            
                            newStocks.pop();
                            console.log(data['bestMatches'][j]['1. symbol'] + ' was already in newStocks.');
                            
                        }
                        
                    }
                    
                }
                
            } else {
                
                console.log('SORRY NOTHING');
                
            }
            
        }
        
        request.send();
        
        i++
        if (i === 26) {
            
            i = 0;
            clearInterval(getStocksInterval);
            var testInterval = setInterval(test, 15000);
            
        }
        
    }
    
}

var stock, increment;

function test() {
    
    stock = newStocks[i];
    
    var request = new XMLHttpRequest();
    
    request.open('GET', 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + stock + '&apikey=WMH5EOMQB15Z7COE', true);
    
    request.onload = function() {
        
        // increment tells us whether to increment i, because if an element is spliced, i needs not be incremented
        increment = true;
        
        console.log(stock + request.status);
        
        if (request.status >= 200 && request.status < 400) {
            
            var data = JSON.parse(this.response);
            
            if (Object.keys(data["Time Series (Daily)"]).length < 100) {
                
                console.log(stock + ' does not have sufficient data.');
                newStocks.splice(newStocks.findIndex(wishIHadArrowFunctions), 1);
                increment = false;
                
            } else if (data["Time Series (Daily)"]["2018-11-02"]["4. close"] < 1) {
                
                console.log(stock + ' is too small in value.');
                console.log(data["Time Series (Daily)"]["2018-11-02"]["4. close"] + ' is its closing value.');
                newStocks.splice(newStocks.findIndex(wishIHadArrowFunctions), 1);
                increment = false;
                
            } else {
                
                document.getElementById("stock-used").textContent += (stock + ' ' + i + ' | ');
                
            }
            
        } else {
            
            console.log('SORRY NOTHING');
            
        }
        
    }
    
    request.send();
    
    if (increment) {i++;}
    if (i >= newStocks.length) {
        
        clearInterval(testInterval);
        console.log(newStocks);
        stockArr = stockArr.concat(newStocks);
        console.log(stockArr);
        
    }
    
}

function wishIHadArrowFunctions(x) {
    
    return x === stock;
    
}
*/