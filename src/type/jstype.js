// typepacer
/////////////////////////////////////////////////////////////////////////////////////////////////////

var startTime, endTime, timeTaken, wordsPerMinute, totalWords, text, position, mistakes, winCondition, textArr;
defineTextArr();
var attempts = 1;
var resultArray = [[40, 0]];

// defining the canvas and drawing horizontal lines
var canvas = document.getElementById("graph").getContext("2d");
canvas.strokeStyle = "#CCCCCC";
canvas.lineWidth = 1;
for (var i = 0; i < 7; i++) {
    
    canvas.beginPath();
    canvas.moveTo(0, 20 * i + 10);
    canvas.lineTo(150, 20 * i + 10);
    canvas.stroke();
    
}

newGame();

document.onkeydown = function(e) {
    
    if (text.substr(position, 1) === e.key) {
        // if the correct key has been pressed
        
        if (position === 0) {
            
            startTime = new Date().getTime();
            document.getElementById("start-text").style.display = 'none';
            
        }
        
        position++;
        dispText();
        
        if (position == text.length) {winCondition = true;}
        
    } else if (e.key === 'Escape') {
        // if the player presses Esc, to restart
        
        newGame();
        
    } else if ((e.key !== 'Shift') && (e.key !== 'Backspace')) {
        // if the player has made a mistake and pressed the wrong key
        
        mistakes++
        
    }
    
    if (winCondition) {
        // if the player has finished
        
        endTime = new Date().getTime();
        timeTaken = endTime - startTime;
        wordsPerMinute = (60000 * totalWords) / timeTaken;
        
        resultArray.push([wordsPerMinute, mistakes]);
        
        document.getElementById("results-text").innerHTML += '<br>Attempt ' + attempts + ': ' + Math.floor(wordsPerMinute) + ' WPM / ' + mistakes + ' mistakes';
        document.getElementById("text").innerHTML += '<br><span style="font-size: 20pt;">Press <mark>Esc</mark> to try again.</span>';
        
        if (wordsPerMinute >= 100) {
            
            alert('Wow! Incredible!');
            
        } else if (wordsPerMinute >= 80) {
            
            alert('Wow! Great job!');
            
        } else if (wordsPerMinute >= 70) {
            
            alert('Good job!');
            
        }
        
        // canvas drawing
        canvas.strokeStyle = '#0000FF';
        canvas.beginPath();
        canvas.moveTo((attempts - 1) * 5, 150 - resultArray[attempts - 1][0]);
        canvas.lineTo(attempts * 5, 150 - wordsPerMinute);
        canvas.stroke();
        
        canvas.strokeStyle = '#FF0000';
        canvas.beginPath();
        canvas.moveTo((attempts - 1) * 5, 150 - (resultArray[attempts - 1][1] * 4));
        canvas.lineTo(attempts * 5, 150 - (mistakes * 4));
        canvas.stroke();
        
        attempts++;
        
    }
    
};

function dispText() {
    
    document.getElementById("text").innerHTML = "<span style='color: lightgray'>" + text.substr(0, position) + "</span><mark>" + text.substr(position, 1) + "</mark>" + text.substr(position + 1);
    
}

function newGame() {
    
    position = 0;
    mistakes = 0;
    winCondition = false;
    document.getElementById("start-text").style.display = '';
    
    selectText();
    dispText();
    
}

function selectText() {
    // selects a text from textArr and assigns variables accordingly
    
    text = textArr[Math.floor(Math.random() * textArr.length)];
    // takes a random element of textArr, and stores it in the text variable
    
    totalWords = text.match(/ [a-zA-Z0-9]/g).length;
    if (text.match(/"[a-zA-Z0-9]/g)) {totalWords += text.match(/"[a-zA-Z0-9]/g).length;}
    if (text.match(/ '[a-zA-Z0-9]/g)) {totalWords += text.match(/ '[a-zA-Z0-9]/g).length;}
    if ((text[0] !== '"') && (text[0] !== "'")) {totalWords++;}
    // match finds all occurrences of a certain regexp, then puts them in an array. to find word count, we find all occurrences of a space or quote or apostrophe followed by a letter, then add one if we need to account for the first word.
    
}

function defineTextArr() {
    // this is put at the bottom so that the user doesn't have to scroll a while to find the actual code
    
    textArr = [
        "This is a paragraph that you are required to type. When you type it, try to type quickly, but accurately. After all, if many mistakes are made, then that's bound to reduce your speed. But, on the other hand, don't stress too much about having few errors. That may reduce your speed as well.",
        "When making a typing test, it is important to use many different texts to make the test. If the user is allowed to type the same sentence many times over, then it is inevitable that their speed will trend upwards, and the test will slowly become less and less accurate.",
        "I've always wondered just how many different quotes can be typed on different typing test sites. Will I ever type a repeat quote? Have I already done so, without realizing it?",
        "It's likely that if you have used this site for any reasonable amount of time, this is not the first time you have typed this quote. It's not like there are that many quotes to choose from. That would take a lot of work to gather that many quotes.",
        "This is the last quote that I will put in for now. I was considering putting in some other quotes from books and whatnot, but amongst these other quotes, those book quotes - as well written as they are - would look quite out of place.",
        "\"Can we put quotes in our typing tests?\" asked the naive student. Little did they know, it was totally possible. As possible as the word 'coolguy2018.'",
        "The current world population is about 7.6 billion. This figure would appear to mark a certain point in time, such that if someone wanted to, they could track the approximate time that I typed this. But, a number like that could mark many points, from past to future.",
        "This quote is very long, and may not be particularly pleasant to type. But, these typing tests are all a little inaccurate, in that they all give a short quote to type. It wouldn't be fun to type a whole page or two just to get some results, but in the real world, typing papers and long documents is what typing is generally used for. Online typing tests are like 50 meter sprints, but in reality we're trying to prepare ourselves for a marathon. So why not make the typing tests require some endurance, as well? It might do us some good."
    ]
    
}