// blackjack
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var suits = ['spades', 'clubs', 'hearts', 'diams'];
var values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var deck;

var playerCards = [];
var playerValue;
var dealerCards = [];
var dealerValue;

// html stuff
var playerHolder = document.getElementById('playerHolder');
var dealerHolder = document.getElementById('dealerHolder');
var playerTag = document.getElementById('playerTag');
var dealerTag = document.getElementById('dealerTag');
var output = document.getElementById('output');

// cash and current bet of player
var cash, bet;

// Gameplay
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// make a new game
function newGame() {
    cash = 100;
    deck = [];
    for (var i in suits) {
        for (var j in values) {
            deck.push(new Card(suits[i], values[j]));
        }
    }
    deck = shuffle(deck);
    output.innerHTML = 'Enter a bet, then press "Deal Hand" to deal the cards.';
    document.getElementById('btn-start').style.display = 'none';
    document.getElementById('bet').style.display = '';
}

// deal cards to player & dealer
function dealNew() {
    playerCards = [];
    dealerCards = [];
    for (var i = 0; i < 2; i++) {
        dealerCards.push(draw());
        playerCards.push(draw());
    }
    
    playerValue = getValue(playerCards);
    dealerValue = getValue(dealerCards);
    bet = Math.min(parseInt(document.getElementById('input-bet').value), cash);
    cash -= bet;
    
    document.getElementById('bet').style.display = 'none';
    document.getElementById('actions').style.display = '';
    output.innerHTML = 'Hit to draw a card, and Hold to stop. Get a higher value than the dealer without going over 21 to win!';
    
    playerTag.innerHTML = 'Player Hand: (Value: ' + playerValue + ') ';
    dealerTag.innerHTML = 'Dealer Hand: ';
    playerTag.style.color = 'black';
    dealerTag.style.color = 'black';
    disp();    
}

// performs an action (either hit/hold/double)
function action(act) {
    if (act === 'double') {
        var add = Math.min(cash, bet);
        bet += add;
        cash -= add;
        if (action('hit') !== 'bust') {action('hold');}
    }
    
    if (act === 'hit') {
        playerCards.push(draw());
        playerValue = getValue(playerCards);
        playerTag.innerHTML = 'Player Hand: (Value: ' + playerValue + ') ';
        disp();
        if (playerValue > 21) {
            dealerTag.innerHTML = 'Dealer Hand: (Value: ' + dealerValue + ') ';
            endHand('dealer');
            return 'bust';
        }
    }
    
    if (act === 'hold') {
        dealerValue = getValue(dealerCards);
        while (dealerValue < 17) {
            dealerCards.push(draw());
            dealerValue = getValue(dealerCards);
        }
        dealerTag.innerHTML = 'Dealer Hand: (Value: ' + dealerValue + ') ';
        
        // determine winner
        if (dealerValue > 21 || playerValue > dealerValue) {
            endHand('player');
        } else if (dealerValue > playerValue) {
            endHand('dealer');
        } else if (playerValue === dealerValue) {
            endHand('push');
        }
    }
}

// winner is either 'player' or 'dealer'. can also tie ('push')
function endHand(winner) {
    if (winner === 'player') {
        playerTag.style.color = 'green';
        playerTag.innerHTML += '(You won ' + bet + ')';
        
        cash += bet * 2;
        bet = 0;
        disp();
    } else if (winner === 'dealer') {
        dealerTag.style.color = 'green';
        dealerTag.innerHTML += '(Dealer won ' + bet + ')';
        
        bet = 0;
        disp();
    } else if (winner === 'push') {
        playerTag.innerHTML += '(Tie!)';
        dealerTag.innerHTML += '(Tie!)';
        
        cash += bet;
        bet = 0;
        disp();
    }
    
    if (parseInt(document.getElementById('input-bet').value) > cash) {document.getElementById('input-bet').value = cash;}
    document.getElementById('cover').style.display = 'none';
    document.getElementById('bet').style.display = '';
    document.getElementById('actions').style.display = 'none';
    output.innerHTML = 'Make a bet, then press "Deal Hand" to deal the cards.';
}

// Utilities
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// gets the value of an array of Card objects, returns value
function getValue(arr) {
    var val = 0;
    var ace = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].num === 'A') {
            ace++;
        } else if (arr[i].num === 'K' || arr[i].num === 'Q' || arr[i].num === 'J') {
            val += 10;
        } else {
            val += parseInt(arr[i].num);
        }
    }
    val += (ace * 11);
    for (var i = 0; i < ace; i++) {
        if (val > 21) {
            val -= 10;
        }
    }
    return val;
}

// displays current cards
function disp() {
    playerHolder.innerHTML = '';
    dealerHolder.innerHTML = '';
    for (var i = 0; i < playerCards.length; i++) {
        playerHolder.innerHTML += playerCards[i].outputhtml((i > 0 ? 30 + i * 60 : 30));
    }
    for (var i = 0; i < dealerCards.length; i++) {
        dealerHolder.innerHTML += dealerCards[i].outputhtml((i > 0 ? 30 + i * 60 : 30));
        if (i === 0) {
            dealerHolder.innerHTML += '<div id="cover"></div>';
        }
    }
    
    document.getElementById('disp-bet').innerHTML = 'Bet: ' + bet;
    document.getElementById('disp-cash').innerHTML = 'Cash: ' + cash;
}

// shuffles an array, returns shuffled array
function shuffle(arr) {
    var temp = [];
    for (var i in arr) {
        temp.splice(Math.floor(Math.random() * temp.length), 0, arr[i]);
    }
    return temp;
}

// draws a card
function draw() {
    var rand = Math.floor(Math.random() * deck.length);
    var ret = deck.splice(rand, 1)[0];
    if (deck.length === 0) {
        for (var i in suits) {
            for (var j in values) {
                deck.push(new Card(suits[i], values[j]));
            }
        }
        deck = shuffle(deck);
    }
    return ret;
}

// card object, with suit, number, and value
function Card(suit, num) {
    this.suit = suit;
    this.num = num;
    this.bgcolor = (suit === 'spades' || suit === 'clubs' ? 'black' : 'red');
    this.output = '<span style="color: ' + this.bgcolor + '">' + this.num + '&' + this.suit + ';</span>';
    this.outputhtml = function(left) {
        return '<div style="left: ' + left + 'px;" class="card ' + this.suit + '">' + 
        '<div class="card-top suit">' + this.num + '<br></div>' + 
        '<div class="card-middle suit"></div>' + 
        '<div class="card-bottom suit">' + this.num + '<br></div></div>';
    }
}

// DOM
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.getElementById('input-bet').onchange = function() {
    var currVal = this.value;
    if (currVal < this.min) {this.value = this.min;}
    if (currVal > cash) {this.value = cash;}
    this.value = Math.floor(this.value);
}
