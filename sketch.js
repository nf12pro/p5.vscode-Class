function setup() {
  createCanvas(400, 400);
  noStroke();
}

function draw() {
  // clear each frame
  background(220);

  // static circle for reference
  fill(150);
  circle(200, 200, 100);

  // circle that follows the mouse; change fill when mouse is pressed
  if (mouseIsPressed) {
    fill(255, 0, 0); // red while pressed
  } else {
    fill(255); // white when not pressed
  }
  // draw the circle at the current mouse position every frame
  circle(mouseX, mouseY, 100);
}