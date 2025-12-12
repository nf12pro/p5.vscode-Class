// general variables
var fillColor = 100;

// square variables
var squarecanvax = 50;
var squarecanvay = 700;
var squareSize = 55;

var amountprotons = 0;
var amountneutrons = 0;
var amountelectrons = 0;

var squarepressed = false;
var squareplaced = false;
var squares_placed = [];

// Simple particle placement sketch
// - Click the red circle (proton) or grey circle (neutron) to select.
//   Clicking again places one in the nucleus center (with a small random jitter).
// - Click the small blue circle (electron) to select.
//   When placing an electron, it is guaranteed to be outside the nucleus.

let nucleusX, nucleusY;
let nucleusRadius = 80;

// palette positions
const protonX = 80, protonY = 80, protonR = 26;
const neutronX = 180, neutronY = 80, neutronR = 26;
const electronX = 280, electronY = 80, electronR = 14;

let selected = null; // 'proton' | 'neutron' | 'electron' | null

let protons = [];
let neutrons = [];
let electrons = [];

function setup(){
    createCanvas(900, 600);
    nucleusX = width/2;
    nucleusY = height/2;
    textAlign(CENTER, CENTER);
}

function draw(){
    background(240);

    // draw nucleus outline
    noFill();
    stroke(180);
    strokeWeight(2);
    circle(nucleusX, nucleusY, nucleusRadius*2);

    // draw placed protons and neutrons (inside nucleus)
    noStroke();
    for (let p of protons){
        fill(200, 50, 50); // red
        circle(p.x, p.y, p.size);
    }
    for (let n of neutrons){
        fill(150); // grey
        circle(n.x, n.y, n.size);
    }

    // draw electrons (outside)
    for (let e of electrons){
        fill(50,100,255); // blue
        circle(e.x, e.y, e.size);
    }

    // draw palette
    drawPalette();

    // preview overlay follows mouse when a type is selected
    if (selected === 'proton'){
        push();
        fill(200, 50, 50, 140);
        noStroke();
        circle(mouseX, mouseY, 24);
        pop();
    } else if (selected === 'neutron'){
        push();
        fill(150, 140);
        noStroke();
        circle(mouseX, mouseY, 24);
        pop();
    } else if (selected === 'electron'){
        push();
        fill(50,100,255,140);
        noStroke();
        // ensure preview shows outside the nucleus visually
        let px = mouseX;
        let py = mouseY;
        let dx = px - nucleusX;
        let dy = py - nucleusY;
        let d = dist(px, py, nucleusX, nucleusY);
        let minDist = nucleusRadius + 20;
        if (d < minDist){
            if (d === 0) { dx = 1; dy = 0; d = 1; }
            px = nucleusX + dx / d * minDist;
            py = nucleusY + dy / d * minDist;
        }
        circle(px, py, 12);
        pop();
    }

    // small instructions
    noStroke();
    fill(80);
    textSize(13);
    text("Click a palette item to select. Click again to place.", width/2, 24);

    // draw counters in the bottom-right corner
    fill(0);
    textSize(14);
    const margin = 12;
    const lineHeight = 18;
    const lines = 3;
    // compute top Y for the block so the block is anchored to bottom margin
    const topY = height - margin - (lines - 1) * lineHeight;
    textAlign(RIGHT, TOP);
    text(`Protons: ${amountprotons}`, width - margin, topY);
    text(`Neutrons: ${amountneutrons}`, width - margin, topY + lineHeight);
    text(`Electrons: ${amountelectrons}`, width - margin, topY + 2 * lineHeight);
    // restore center alignment used elsewhere
    textAlign(CENTER, CENTER);
}

function drawPalette(){
    // proton
    stroke(120);
    strokeWeight(1);
    fill(200, 50, 50);
    circle(protonX, protonY, protonR*2);
    if (selected === 'proton'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(protonX, protonY, protonR*2 + 6);
    }
    noStroke();
    fill(255);
    textSize(12);
    text('Proton', protonX, protonY + protonR + 14);

    // neutron
    stroke(120);
    strokeWeight(1);
    fill(150);
    circle(neutronX, neutronY, neutronR*2);
    if (selected === 'neutron'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(neutronX, neutronY, neutronR*2 + 6);
    }
    noStroke();
    fill(255);
    text('Neutron', neutronX, neutronY + neutronR + 14);

    // electron (smaller)
    stroke(120);
    strokeWeight(1);
    fill(50,100,255);
    circle(electronX, electronY, electronR*2);
    if (selected === 'electron'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(electronX, electronY, electronR*2 + 6);
    }
    noStroke();
    fill(255);
    text('Electron', electronX, electronY + electronR + 14);
}

function mouseClicked(){
    // check palette clicks first
    if (dist(mouseX, mouseY, protonX, protonY) <= protonR){
        // toggle selection
        selected = selected === 'proton' ? null : 'proton';
        return;
    }
    if (dist(mouseX, mouseY, neutronX, neutronY) <= neutronR){
        selected = selected === 'neutron' ? null : 'neutron';
        return;
    }
    if (dist(mouseX, mouseY, electronX, electronY) <= electronR){
        selected = selected === 'electron' ? null : 'electron';
        return;
    }

    // if clicked elsewhere and a type is selected, place the particle
    if (selected === 'proton'){
        // place proton in nucleus center with small jitter
        let angle = random(TWO_PI);
        let r = random(0, nucleusRadius * 0.5);
        let x = nucleusX + cos(angle) * r;
        let y = nucleusY + sin(angle) * r;
        protons.push({ x: x, y: y, size: 20 });
        amountprotons += 1;
        selected = null;
        return;
    }
    if (selected === 'neutron'){
        let angle = random(TWO_PI);
        let r = random(0, nucleusRadius * 0.5);
        let x = nucleusX + cos(angle) * r;
        let y = nucleusY + sin(angle) * r;
        neutrons.push({ x: x, y: y, size: 20 });
        amountneutrons += 1;
        selected = null;
        return;
    }
    if (selected === 'electron'){
        // place electron outside nucleus: if clicked inside nucleus, push it out
        let px = mouseX;
        let py = mouseY;
        let d = dist(px, py, nucleusX, nucleusY);
        let minDist = nucleusRadius + 20; // place just outside
        if (d < minDist){
            if (d === 0) { px = nucleusX + minDist; py = nucleusY; }
            else {
                px = nucleusX + (px - nucleusX) / d * minDist;
                py = nucleusY + (py - nucleusY) / d * minDist;
            }
        }
        electrons.push({ x: px, y: py, size: 10 });
        amountelectrons += 1;
        selected = null;
        return;
    }
}

// optional: keyboard shortcuts
function keyPressed(){
    if (key === 'c' || key === 'C'){
        // clear all
        protons = [];
        neutrons = [];
        electrons = [];
        // reset counters
        amountprotons = 0;
        amountneutrons = 0;
        amountelectrons = 0;
    }
}
