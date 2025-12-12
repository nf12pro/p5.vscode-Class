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

var charge = 0;


let nucleusX, nucleusY;
let nucleusRadius = 80;
// offsets for the electron shells (pixels beyond nucleusRadius)
const shellOffsets = [40, 80, 120];
// capacities per shell (same order as shellOffsets). First shell 2, others 8 by default.
const shellCaps = [2, 8, 8];
// neutron capacity
const NEUTRON_CAP = 20;
// electron capacity (total)
const ELECTRON_CAP = 18;

// palette positions
const protonX = 80, protonY = 80, protonR = 26;
const neutronX = 180, neutronY = 80, neutronR = 26;
const electronX = 280, electronY = 80, electronR = 14

let selected = null; // 'proton' | 'neutron' | 'electron' | null

let protons = [];
let neutrons = [];
let electrons = [];

// stability tracking
var isUnstable = false;
// orbital base angles and speeds per shell
let shellBaseAngles = [];
let shellSpeeds = [];

function setup(){
    createCanvas(900, 600);
    nucleusX = width/2;
    nucleusY = height/2;
    textAlign(CENTER, CENTER);

    // initialize shell base angles and speeds
    for (let i = 0; i < shellOffsets.length; i++){
        shellBaseAngles[i] = random(TWO_PI);
        // slower for outer shells, alternate direction
        shellSpeeds[i] = (i % 2 === 0 ? 0.012 : -0.009) / (i + 1);
    }
}

function draw(){
    background(240);

    // compute simple "full" flags and clear selection if user somehow still has a full type selected
    let protonFull = amountprotons >= 18;
    let neutronFull = amountneutrons >= NEUTRON_CAP;
    let electronFull = amountelectrons >= ELECTRON_CAP;
    if (protonFull && selected === 'proton') selected = null;
    if (neutronFull && selected === 'neutron') selected = null;
    if (electronFull && selected === 'electron') selected = null;

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

    // Check stability (unstable when |N - P| > 2)
    let neutronProtonDiff = abs(amountneutrons - amountprotons);
    isUnstable = neutronProtonDiff > 2;
    
    // Calculate shake amount if unstable
    let shakeX = 0, shakeY = 0;
    if (isUnstable) {
        shakeX = random(-2, 2);
        shakeY = random(-2, 2);
    }

    // draw placed protons and neutrons (inside nucleus) with shake
    noStroke();
    for (let p of protons){
        fill(200, 50, 50); // red
        circle(p.x + shakeX, p.y + shakeY, p.size);
    }
    for (let n of neutrons){
        fill(150); // grey
        circle(n.x + shakeX, n.y + shakeY, n.size);
    }

    // Orbital animation: update base angles and draw electrons evenly spaced per shell
    for (let i = 0; i < shells.length; i++) {
        shellBaseAngles[i] = (shellBaseAngles[i] || 0) + (shellSpeeds[i] || 0);
    }
    // group electrons by shell
    let electronsByShell = [];
    for (let i = 0; i < shells.length; i++) electronsByShell[i] = [];
    for (let i = 0; i < electrons.length; i++){
        let ee = electrons[i];
        if (ee && ee.shell !== undefined && ee.shell >= 0 && ee.shell < shells.length) {
            electronsByShell[ee.shell].push(ee);
        }
    }
    // draw electrons for each shell, evenly spaced and rotated by base angle
    for (let i = 0; i < shells.length; i++){
        let list = electronsByShell[i];
        if (!list || list.length === 0) continue;
        let s = shells[i];
        let spacing = TWO_PI / list.length;
        for (let j = 0; j < list.length; j++){
            let e = list[j];
            let angle = shellBaseAngles[i] + j * spacing;
            let ex = nucleusX + cos(angle) * s.radius + shakeX;
            let ey = nucleusY + sin(angle) * s.radius + shakeY;
            fill(50,100,255);
            circle(ex, ey, e.size);
        }
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
    text("Click a particle to select it. Click again to place.", width/2, 24);

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

    // draw stability label below nucleus
    let stabilityLabel = isUnstable ? "Unstable" : "Stable";
    let stabilityColor = isUnstable ? color(200, 50, 50) : color(50, 150, 50); // red if unstable, green if stable
    fill(stabilityColor);
    textSize(28);
    textAlign(CENTER, CENTER);
    text(stabilityLabel, nucleusX, nucleusY + nucleusRadius + 60);

    // draw identified element, charge and mass on middle-right
    textAlign(RIGHT, CENTER);
    textSize(16);
    fill(30);
    const marginX = 12;
    if (elementName && elementName.length > 0) {
        text(`Element: ${elementName}`, width - marginX, height / 2);
    }
    // also display charge below element (show '+' when positive)
    charge = amountprotons - amountelectrons;
    let displayCharge = (charge > 0) ? `+${charge}` : `${charge}`;
    textSize(14);
    text(`Charge: ${displayCharge}`, width - marginX, height / 2 + 28);
    // display mass (protons + neutrons) below charge
    let mass = amountprotons + amountneutrons;
    text(`Mass: ${mass}`, width - marginX, height / 2 + 48);
    textAlign(CENTER, CENTER);
}

function drawPalette(){
    // proton
    let protonFull = amountprotons >= 18;
    stroke(120);
    strokeWeight(1);
    if (protonFull) {
        fill(120, 140); // greyed
    } else {
        fill(200, 50, 50);
    }
    circle(protonX, protonY, protonR*2);
    if (!protonFull && selected === 'proton'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(protonX, protonY, protonR*2 + 6);
    }
    noStroke();
    fill(protonFull ? 200 : 255);
    textSize(12);
    text('Proton', protonX, protonY + protonR + 14);

    // neutron
    stroke(120);
    strokeWeight(1);
    // if neutron capacity reached, draw greyed-out palette
    let neutronFull = amountneutrons >= NEUTRON_CAP;
    if (neutronFull) {
        fill(120, 140); // greyed
    } else {
        fill(150);
    }
    circle(neutronX, neutronY, neutronR*2);
    if (!neutronFull && selected === 'neutron'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(neutronX, neutronY, neutronR*2 + 6);
    }
    noStroke();
    fill(neutronFull ? 200 : 255);
    text('Neutron', neutronX, neutronY + neutronR + 14);

    // electron (smaller)
    let electronFull = amountelectrons >= ELECTRON_CAP;
    stroke(120);
    strokeWeight(1);
    if (electronFull) {
        fill(120, 140);
    } else {
        fill(50,100,255);
    }
    circle(electronX, electronY, electronR*2);
    if (!electronFull && selected === 'electron'){
        stroke(0);
        strokeWeight(2);
        noFill();
        circle(electronX, electronY, electronR*2 + 6);
    }
    noStroke();
    fill(electronFull ? 200 : 255);
    text('Electron', electronX, electronY + electronR + 14);
}

function mouseClicked(){
    // check palette clicks first
    // prevent selecting a palette item if it's full
    let protonFull = amountprotons >= 18;
    let neutronFull = amountneutrons >= NEUTRON_CAP;
    let electronFull = amountelectrons >= ELECTRON_CAP;
    if (dist(mouseX, mouseY, protonX, protonY) <= protonR){
        if (!protonFull) {
            // toggle selection
            selected = selected === 'proton' ? null : 'proton';
        }
        return;
    }
    if (dist(mouseX, mouseY, neutronX, neutronY) <= neutronR){
        if (!neutronFull) {
            selected = selected === 'neutron' ? null : 'neutron';
        }
        return;
    }
    if (dist(mouseX, mouseY, electronX, electronY) <= electronR){
        if (!electronFull) {
            selected = selected === 'electron' ? null : 'electron';
        }
        return;
    }

    // if clicked elsewhere and a type is selected, place the particle
    if (selected === 'proton'){
        // only place a proton if the click was inside the nucleus
        let dClick = dist(mouseX, mouseY, nucleusX, nucleusY);
        if (dClick <= nucleusRadius) {
            // enforce maximum of 18 protons
            if (amountprotons >= 18) {
                selected = null;
                return;
            }
            let angle = random(TWO_PI);
            let r = random(0, nucleusRadius * 0.5);
            let x = nucleusX + cos(angle) * r;
            let y = nucleusY + sin(angle) * r;
            protons.push({ x: x, y: y, size: 20 });
            amountprotons += 1;
            elementIdentify();
            selected = null;
        }
        return;
    }
    if (selected === 'neutron'){
        // only place a neutron if the click was inside the nucleus
        let dClick = dist(mouseX, mouseY, nucleusX, nucleusY);
        if (dClick <= nucleusRadius) {
            // enforce maximum of NEUTRON_CAP
            if (amountneutrons >= NEUTRON_CAP) {
                selected = null;
                return;
            }
            let angle = random(TWO_PI);
            let r = random(0, nucleusRadius * 0.5);
            let x = nucleusX + cos(angle) * r;
            let y = nucleusY + sin(angle) * r;
            neutrons.push({ x: x, y: y, size: 20 });
            amountneutrons += 1;
            selected = null;
        }
        return;
    }
    if (selected === 'electron'){
        // place electron on the innermost shell that has capacity
        // enforce maximum of ELECTRON_CAP electrons total
        if (amountelectrons >= ELECTRON_CAP) {
            selected = null;
            return;
        }
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
        // store electron with shell reference; angle is computed dynamically for spacing/orbit
        let r = shells[targetShell].radius;
        let ex = nucleusX + cos(atan2(dy, dx)) * r;
        let ey = nucleusY + sin(atan2(dy, dx)) * r;
        electrons.push({ shell: targetShell, size: 10 });
        amountelectrons += 1;
        selected = null;
        return;
    }
}

// optional: keyboard shortcuts
function keyPressed(){
    if (key === 'c' || key === 'C'){
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