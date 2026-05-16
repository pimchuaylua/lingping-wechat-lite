const lingpingQuotes = [
    "He who knows only his own side of the case knows little of that. — J.S. Mill",
    "Just have fun! Language is for communication, not perfection. - Pim",
    "The only way in which a human being can make some approach to knowing the whole of a subject is by hearing what can be said about it by persons of every variety of opinion. — J.S. Mill",
    "He who knows only his own side of the case knows little of that. — J.S. Mill",
    "Stay Hungry. Stay Foolish. - Steve Jobs",
    "Your time is limited, so don’t waste it living someone else’s life. - Steve Jobs",
    "You can’t connect the dots looking forward; you can only connect them looking backward. - Steve Jobs",
    "Don't settle - Steve Jobs",
    "The only way to be truly satisfied is to do what you believe is great work. And the only way to do great work is to love what you do. - Steve Jobs",
    "Knowledge is the food of the soul. - Plato",
    "The only true wisdom is in knowing you know nothing. - Socrates",
    "The essential skill is the ability to see people deeply and accurately. — David Brooks",
    "If you pay attention to people, you will find their lives are far more interesting than you expect. — David Brooks",
    "It is better to be Socrates dissatisfied than a fool satisfied. — J.S. Mill"
];

function getRandomQuote() {
    return lingpingQuotes[Math.floor(Math.random() * lingpingQuotes.length)];
}