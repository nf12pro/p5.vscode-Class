var react_time = false;
//region Setup
function setup() {
  createCanvas(400, 400);
  noStroke();
  fill(0, 122, 255); // blue
}
//endregion

//region Draw 
function draw() {
  background(220);
  if (mouseIsPressed) and (not react_time) {
    fill(255, 0, 0); // red when pressed
  } else {
    fill(0, 122, 255); // blue otherwise
  }
  circle(200, 200, 50);

} 
//#endregion