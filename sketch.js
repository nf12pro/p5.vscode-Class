var squarecanvax = 20;
var squarecanvay = 700;
var squareSize = 55;
var fillColor = 100;

var squarepressed = false;
// store persisted squares here
var placedSquares = [];

function setup(){
    createCanvas(1800, 1800);
}

function draw(){
    background(200);
    
    // draw the main square
    fill(fillColor);
    rect(squarecanvax, squarecanvay, squareSize, squareSize);

    // draw any squares the user has placed (persisted)
    for (var i = 0; i < placedSquares.length; i++) {
        var s = placedSquares[i];
        fill(s.color[0], s.color[1], s.color[2]);
        rect(s.x, s.y, s.size, s.size);
    }

    // check if mouse is pressed within the main square bounds
    if (mouseIsPressed && 
        mouseX > squarecanvax && mouseX < squarecanvax + squareSize &&
        mouseY > squarecanvay && mouseY < squarecanvay + squareSize) {
            // pressing inside the main square
            fillColor = 255;
            squarepressed = true;
    } else if (!mouseIsPressed) {
        // mouse released: if it was pressed inside the main square, place a new square
        if (squarepressed == true) {
            placedSquares.push({ x: mouseX, y: mouseY, size: squareSize, color: [255, 0, 0] });
            squarepressed = false;
        }
        // reset main square color when not pressed
        fillColor = 100;
    }
}
    }
