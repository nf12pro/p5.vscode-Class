var fillColor = 100; // simple grey color, mainly used for early prototyping of editor

var squarecanvax = 50; 
var squarecanvay = 700;
var squareSize = 55; // all these variables were used for editor prototyping when placing squares, no longer in use

var amountprotons = 0;
var amountneutrons = 0;
var amountelectrons = 0; // keeps track of number of each particle

var squarepressed = false;
var squareplaced = false;
var squares_placed = []; // more variables from prototyping phase, no longer in use

var element = 0;
var elementName = ""; // keeps track of current element based on number of protons

var charge = 0; // overall charge of the atom by tracking protons and electrons

let nucleusX, nucleusY; // nucleus position
let nucleusRadius = 80; // nucleus properties
const shellOffsets = [40, 80, 120]; // distance from nucleus surface to shell
const shellCaps = [2, 8, 8]; // max electrons per shell
const NEUTRON_CAP = 20; // max neutrons cap
const ELECTRON_CAP = 18; // max electrons for 3 shells
const PROTON_CAP = 18; // max protons for first 18 elements

const protonX = 80, protonY = 80, protonR = 26; 
const neutronX = 180, neutronY = 80, neutronR = 26; 
const electronX = 280, electronY = 80, electronR = 14; // positions and sizes of particles

let selected = null; // tracks selected particle type

let protons = [];
let neutrons = [];
let electrons = []; // keeps track of placed particles for persistance

var isUnstable = false; // tracks wherter element is stable or not
let shellBaseAngles = [];
let shellSpeeds = []; // for electron orbit animation

function setup(){
	createCanvas(900, 600); //canvas size
	nucleusX = width / 2; // nucleus position in center
	nucleusY = height / 2; // nucleus position in center
	textAlign(CENTER, CENTER); // center align text/simple mode setup

	for (let i = 0; i < shellOffsets.length; i++){ // initialize shell animation variables (AI was used here)
		shellBaseAngles[i] = random(TWO_PI); // random starting angle
		shellSpeeds[i] = (i % 2 === 0 ? 0.012 : -0.009) / (i + 1); // alternating speeds for shells
	}
}

function draw(){
	background(240); // light background

	let protonFull = amountprotons >= PROTON_CAP; // check if proton cap is reached
	let neutronFull = amountneutrons >= NEUTRON_CAP; // check if neutron cap is reached
	let electronFull = amountelectrons >= ELECTRON_CAP; // check if electron cap is reached
	if (protonFull && selected === 'proton') selected = null; 
	if (neutronFull && selected === 'neutron') selected = null;
	if (electronFull && selected === 'electron') selected = null; // if cap reached, deselect particle

	noFill(); 
	stroke(180);
	strokeWeight(2);
	circle(nucleusX, nucleusY, nucleusRadius * 2); // draw nucleus

	let shells = getShells(); // get shell data
	stroke(180, 100);
	strokeWeight(1);
	noFill();
	for (let s of shells){ // draw shells (persistent)
		circle(nucleusX, nucleusY, s.radius * 2); 
	}

	let neutronProtonDiff = abs(amountneutrons - amountprotons); // determine difference
	isUnstable = neutronProtonDiff > 0; // check if stable or unstable depending on difference

	let shakeX = 0, shakeY = 0; // shake effect for unstable elements (AI assistance)
	if (isUnstable){
		shakeX = random(-2, 2); // random shake
		shakeY = random(-2, 2); 
	}

	noStroke();
	for (let p of protons){ // draw protons (persistent)
		fill(200, 50, 50);
		circle(p.x + shakeX, p.y + shakeY, p.size); // draw protons with shake if unstable
	}
	for (let n of neutrons){ // draw neutrons (persistent)
		fill(150);
		circle(n.x + shakeX, n.y + shakeY, n.size); // draw neutrons with shake if unstable
	}

	for (let i = 0; i < shells.length; i++){ // update shell base angles for animation
		shellBaseAngles[i] = (shellBaseAngles[i] || 0) + (shellSpeeds[i] || 0);
	}

	let electronsByShell = [];
	for (let i = 0; i < shells.length; i++) electronsByShell[i] = []; // organize electrons by shell
	for (let i = 0; i < electrons.length; i++){
		let ee = electrons[i];
		if (ee && ee.shell !== undefined && ee.shell >= 0 && ee.shell < shells.length){
			electronsByShell[ee.shell].push(ee);
		}
	}

	for (let i = 0; i < shells.length; i++){ // draw electrons in their shells (persistent)
		let list = electronsByShell[i];
		if (!list || list.length === 0) continue;
		let s = shells[i];
		let spacing = TWO_PI / list.length;
		for (let j = 0; j < list.length; j++){
			let angle = shellBaseAngles[i] + j * spacing;
			let ex = nucleusX + cos(angle) * s.radius + shakeX;
			let ey = nucleusY + sin(angle) * s.radius + shakeY; // add shake if unstable
			fill(50, 100, 255);
			circle(ex, ey, list[j].size);
		}
	}

	drawPalette();

	if (selected === 'proton'){ // draw preview of selected particle at mouse for overlay
		fill(200, 50, 50, 140);
		noStroke();
		circle(mouseX, mouseY, 24);
	} else if (selected === 'neutron'){
		fill(150, 140);
		noStroke();
		circle(mouseX, mouseY, 24);
	} else if (selected === 'electron'){
		fill(50, 100, 255, 140);
		noStroke();

		let px = mouseX; // position at mouseX
		let py = mouseY; // position at mouseY
		let dx = px - nucleusX; 
		let dy = py - nucleusY;
		let d = dist(px, py, nucleusX, nucleusY); // distance from nucleus

		for (let s of shells) s.count = 0;
		for (let e of electrons) if (shells[e.shell]) shells[e.shell].count++;

		let targetShell = null;
		for (let i = 0; i < shells.length; i++){
			if (shells[i].count < shells[i].capacity){
				targetShell = i;
				break;
			}
		}

		if (targetShell === null){ // no available shell
			circle(px, py, 12);
		} else {
			if (d === 0){
				dx = 1;
				dy = 0;
				d = 1;
			}
			let angle = atan2(dy, dx);
			let r = shells[targetShell].radius;
			px = nucleusX + cos(angle) * r;
			py = nucleusY + sin(angle) * r;
			circle(px, py, 12);
		}
	}

	fill(80);
	textSize(13); //simple text/font settings
	text("Click a particle to select it. Click again to place. Press R to restart", width / 2, 24); // instructions at top center

	fill(0);
	textSize(14); // shows numbers of each particle at bottom right
	const margin = 12;
	const lineHeight = 18;
	const topY = height - margin - 2 * lineHeight;
	textAlign(RIGHT, TOP);
	text(`Protons: ${amountprotons}`, width - margin, topY); 
	text(`Neutrons: ${amountneutrons}`, width - margin, topY + lineHeight);
	text(`Electrons: ${amountelectrons}`, width - margin, topY + 2 * lineHeight);
	textAlign(CENTER, CENTER);

	let stabilityLabel = isUnstable ? "Unstable" : "Stable"; // shows whether element is stable or not through text
	let stabilityColor = isUnstable ? color(200, 50, 50) : color(50, 150, 50);
	fill(stabilityColor);
	textSize(28);
	text(stabilityLabel, nucleusX, nucleusY + nucleusRadius + 60);

	textAlign(RIGHT, CENTER);
	textSize(16);
	fill(30);
	const marginX = 12;
	if (elementName){
		text(`Element: ${elementName}`, width - marginX, height / 2); // shows element name
	}

	charge = amountprotons - amountelectrons; // charge obtained by difference
	let displayCharge = charge > 0 ? `+${charge}` : `${charge}`;
	textSize(14);
	text(`Charge: ${displayCharge}`, width - marginX, height / 2 + 28); // shows charge
	let mass = amountprotons + amountneutrons; // mass is sum of protons and neutrons
	text(`Mass: ${mass}`, width - marginX, height / 2 + 48); // shows mass
	textAlign(CENTER, CENTER);
}

function drawPalette(){ // draws the particle selection palette
	let protonFull = amountprotons >= PROTON_CAP; // check if proton cap is reached
	stroke(120);
	strokeWeight(1);
	fill(protonFull ? color(120, 140) : color(200, 50, 50));
	circle(protonX, protonY, protonR * 2);
	if (!protonFull && selected === 'proton'){ 
		noFill();
		stroke(0);
		strokeWeight(2);
		circle(protonX, protonY, protonR * 2 + 6);
	}
	noStroke();
	fill(protonFull ? 200 : 255);
	textSize(12);
	text('Proton', protonX, protonY + protonR + 14); // label

	let neutronFull = amountneutrons >= NEUTRON_CAP; // simple copy and paste with variable change from protons
	stroke(120);
	strokeWeight(1);
	fill(neutronFull ? color(120, 140) : 150);
	circle(neutronX, neutronY, neutronR * 2);
	if (!neutronFull && selected === 'neutron'){
		noFill();
		stroke(0);
		strokeWeight(2);
		circle(neutronX, neutronY, neutronR * 2 + 6);
	}
	noStroke();
	fill(neutronFull ? 200 : 255);
	text('Neutron', neutronX, neutronY + neutronR + 14);

	let electronFull = amountelectrons >= ELECTRON_CAP;
	stroke(120);
	strokeWeight(1);
	fill(electronFull ? color(120, 140) : color(50, 100, 255));
	circle(electronX, electronY, electronR * 2);
	if (!electronFull && selected === 'electron'){
		noFill();
		stroke(0);
		strokeWeight(2);
		circle(electronX, electronY, electronR * 2 + 6);
	}
	noStroke();
	fill(electronFull ? 200 : 255);
	text('Electron', electronX, electronY + electronR + 14);
}

function mouseClicked(){ // checks mouse clicks 
	let protonFull = amountprotons >= PROTON_CAP; // check if particle cap is reached
	let neutronFull = amountneutrons >= NEUTRON_CAP;
	let electronFull = amountelectrons >= ELECTRON_CAP;

	if (dist(mouseX, mouseY, protonX, protonY) <= protonR){ // click on proton in palette
		if (!protonFull) selected = selected === 'proton' ? null : 'proton';
		return;
	}
	if (dist(mouseX, mouseY, neutronX, neutronY) <= neutronR){ // click on neutron in palette
		if (!neutronFull) selected = selected === 'neutron' ? null : 'neutron';
		return;
	}
	if (dist(mouseX, mouseY, electronX, electronY) <= electronR){ // click on electron in palette
		if (!electronFull) selected = selected === 'electron' ? null : 'electron';
		return;
	}

	if (selected === 'proton'){ // placing proton
		let dClick = dist(mouseX, mouseY, nucleusX, nucleusY);
		if (dClick <= nucleusRadius && amountprotons < PROTON_CAP){
			let angle = random(TWO_PI);
			let r = random(0, nucleusRadius * 0.5);
			protons.push({
				x: nucleusX + cos(angle) * r,
				y: nucleusY + sin(angle) * r,
				size: 20
			});
			amountprotons++;
			elementIdentify(); // update element
			selected = null;
		}
		return;
	}

	if (selected === 'neutron'){ //placing neutron
		let dClick = dist(mouseX, mouseY, nucleusX, nucleusY);
		if (dClick <= nucleusRadius && amountneutrons < NEUTRON_CAP){
			let angle = random(TWO_PI);
			let r = random(0, nucleusRadius * 0.5);
			neutrons.push({
				x: nucleusX + cos(angle) * r,
				y: nucleusY + sin(angle) * r,
				size: 20
			});
			amountneutrons++;
			selected = null;
		}
		return;
	}

	if (selected === 'electron'){ // placing electron
		if (amountelectrons >= ELECTRON_CAP){
			selected = null;
			return;
		}

		let dx = mouseX - nucleusX;
		let dy = mouseY - nucleusY;
		let dClick = dist(mouseX, mouseY, nucleusX, nucleusY);

		let shells = getShells();
		for (let s of shells) s.count = 0;
		for (let e of electrons) if (shells[e.shell]) shells[e.shell].count++;

		let targetShell = null;
		for (let i = 0; i < shells.length; i++){
			if (shells[i].count < shells[i].capacity){
				targetShell = i;
				break;
			}
		}
		if (targetShell === null) return;

		if (dClick === 0){
			dx = 1;
			dy = 0;
			dClick = 1;
		}

		electrons.push({ shell: targetShell, size: 10 });
		amountelectrons++;
		selected = null;
	}
}

function keyPressed(){ // restart on R pressed
	if (key === 'r' || key === 'R'){
		protons = [];
		neutrons = [];
		electrons = [];
		amountprotons = 0;
		amountneutrons = 0;
		amountelectrons = 0;
		elementName = "";
	}
}

function getShells(){ // returns array of shell data
	let res = [];
	for (let i = 0; i < shellOffsets.length; i++){
		let r = nucleusRadius + shellOffsets[i];
		let cap = shellCaps[i] !== undefined ? shellCaps[i] : 8;
		res.push({ radius: r, capacity: cap, count: 0 });
	}
	return res;
}

function elementIdentify(){ // identifies element based on number of protons
	element = amountprotons;
	switch (element){
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
