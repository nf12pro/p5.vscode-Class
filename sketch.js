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

var element = 0;
var elementName = "";



let nucleusX, nucleusY;
let nucleusRadius = 80;
// offsets for the electron shells (pixels beyond nucleusRadius)
const shellOffsets = [40, 80, 120];
// capacities per shell (same order as shellOffsets). First shell 2, others 8 by default.
const shellCaps = [2, 8, 8];

// palette positions
const protonX = 80, protonY = 80, protonR = 26;
const neutronX = 180, neutronY = 80, neutronR = 26;
const electronX = 280, electronY = 80, electronR = 14

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

    // compute shell objects and draw shells
    let shells = getShells();
    stroke(180, 100);
    strokeWeight(1);
    noFill();
    for (let s of shells) {
        circle(nucleusX, nucleusY, s.radius * 2);
    }

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

    // draw electrons (outside) - electrons store shell index + angle for stable layout
    for (let e of electrons){
        let s = shells[e.shell];
        if (!s) continue;
        let ex = nucleusX + cos(e.angle) * s.radius;
        let ey = nucleusY + sin(e.angle) * s.radius;
        fill(50,100,255); // blue
        circle(ex, ey, e.size);
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
        // snap preview to the innermost shell that has capacity
        let px = mouseX;
        let py = mouseY;
        let dx = px - nucleusX;
        let dy = py - nucleusY;
        let d = dist(px, py, nucleusX, nucleusY);
        // recompute shell counts from current electrons
        for (let s of shells) s.count = 0;
        for (let e of electrons) if (shells[e.shell]) shells[e.shell].count++;

        // find the first (innermost) shell with available capacity
        let targetShell = null;
        for (let i = 0; i < shells.length; i++){
            if (shells[i].count < shells[i].capacity){ targetShell = i; break; }
        }
        if (targetShell === null){
            // no capacity: show preview at mouse but dimmed
            circle(px, py, 12);
        } else {
            if (d === 0) { dx = 1; dy = 0; d = 1; }
            let angle = atan2(dy, dx);
            let r = shells[targetShell].radius;
            px = nucleusX + cos(angle) * r;
            py = nucleusY + sin(angle) * r;
            circle(px, py, 12);
        }
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

    // draw identified element on middle-right
    if (elementName && elementName.length > 0) {
        textAlign(RIGHT, CENTER);
        textSize(16);
        fill(30);
        const marginX = 12;
        text(`Element: ${elementName}`, width - marginX, height / 2);
        textAlign(CENTER, CENTER);
    }
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
        elementIdentify();
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
        // place electron on the innermost shell that has capacity
        let px = mouseX;
        let py = mouseY;
        let dx = px - nucleusX;
        let dy = py - nucleusY;
        let dClick = dist(px, py, nucleusX, nucleusY);
        // compute shells and counts
        let shells = getShells();
        for (let s of shells) s.count = 0;
        for (let e of electrons) if (shells[e.shell]) shells[e.shell].count++;

        // find first (innermost) shell with room
        let targetShell = null;
        for (let i = 0; i < shells.length; i++){
            if (shells[i].count < shells[i].capacity){ targetShell = i; break; }
        }
        if (targetShell === null){
            // no capacity available; do nothing
            return;
        }
        // compute angle and snap to that shell radius
        if (dClick === 0) { dx = 1; dy = 0; dClick = 1; }
        let angle = atan2(dy, dx);
        let r = shells[targetShell].radius;
        let ex = nucleusX + cos(angle) * r;
        let ey = nucleusY + sin(angle) * r;
        electrons.push({ shell: targetShell, angle: angle, size: 10 });
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
        elementName = "";
    }
}

// helper: build shell objects from offsets/capacities so adding more shells is easy
function getShells(){
    let res = [];
    for (let i = 0; i < shellOffsets.length; i++){
        let r = nucleusRadius + shellOffsets[i];
        let cap = (shellCaps[i] !== undefined) ? shellCaps[i] : 8;
        res.push({ radius: r, capacity: cap, count: 0 });
    }
    return res;
}

function elementIdentify(){
    element = amountprotons;
    // map proton count to element name
    switch (element) {
        case 1: elementName = "Hydrogen"; break;
        case 2: elementName = "Helium"; break;
        case 3: elementName = "Lithium"; break;
        case 4: elementName = "Beryllium"; break;
        case 5: elementName = "Boron"; break;
        case 6: elementName = "Carbon"; break;
        case 7: elementName = "Nitrogen"; break;
        case 8: elementName = "Oxygen"; break;
        case 9: elementName = "Fluorine"; break;
        case 10: elementName = "Neon"; break;
        case 11: elementName = "Sodium"; break;
        case 12: elementName = "Magnesium"; break;
        case 13: elementName = "Aluminum"; break;
        case 14: elementName = "Silicon"; break;
        case 15: elementName = "Phosphorus"; break;
        case 16: elementName = "Sulfur"; break;
        case 17: elementName = "Chlorine"; break;
        case 18: elementName = "Argon"; break;
        default: elementName = "Element not identified"; break;
    }
} 