const ORGANIC_ENERGY = 50;
const SUN_ENERGY = 50;
const SUN_LENGTH = 0.7;
const ENERGY_TO_DOUBLE = 400;
const DEAD_COLOR = "#404040";
const LIFE_COLOR = "#e0a040";
const MUTATION_KOOF = 0.001;
const TYPE_RENDER = 1; // 0 - просто клетки, 1 - их энергия

const width = 800;
const height = 600;

const mapWidth = 100;
const mapHeight = mapWidth * (height / width);

const dx = width / mapWidth;
const dy = height / mapHeight;

var map = new Array(mapWidth * mapHeight);

const cnv = document.getElementById("cnv");
cnv.width = width;
cnv.height = height;
const ctx = cnv.getContext("2d");

ctx.strokeStyle = "#000000";

const chCoord = function(x, y) {
	x = x < 0 ? mapWidth-1 : x % mapWidth;
	y = Math.min(mapHeight-1, Math.max(0, y));
	return [x, y];
}

const get = function(x, y) {
	[x, y] = chCoord(x, y);
	return map[x + y * mapWidth];
}

const set = function(x, y, v) {
	[x, y] = chCoord(x, y);
	map[x + y * mapWidth] = v;
	return [x, y];
}

const num2dir = function(d) {
	if (d == 0) return [0, 1];
	if (d == 1) return [1, 1];
	if (d == 2) return [1, 0];
	if (d == 3) return [1, -1];
	if (d == 4) return [0, -1];
	if (d == 5) return [-1, -1];
	if (d == 6) return [-1, 0];
	if (d == 7) return [-1, 1];
	return [0, 0];
}

const inInterval = function(a, b, c) {
	return a <= c && c <= b;
}

const isLike = function(a, b) {
	let distinctions = 0;
	for (let i = 0; i < a.dnk.length; i++) {
		if (a.dnk[i] != b.dnk[0]) distinctions++;
		if (distinctions > 8) break;
	}
	return distinctions <= 8;
}


class Cell {
	constructor(x, y, dnk, e) {
		this.x = x;
		this.y = y;
		this.dnk = dnk;
		this.dnk_offset = 0;
		this.energy = e;
		this.dir = Math.floor(Math.random()*8);
	}

	draw() {
		if (this.energy <= 0) ctx.fillStyle = DEAD_COLOR;
		else if (TYPE_RENDER == 0) ctx.fillStyle = LIFE_COLOR;
		else ctx.fillStyle = `rgb(${this.energy / ENERGY_TO_DOUBLE * 255}, 0, 0)`;
		ctx.fillRect(this.x * dx, this.y * dy, dx, dy);
		ctx.beginPath();
		ctx.moveTo(this.x * dx + dx / 2, this.y * dx + dy / 2);
		ctx.lineTo(this.x * dx + dx / 2 + num2dir(this.dir)[0] * (dx / 2), this.y * dx + dy / 2 + num2dir(this.dir)[1] * (dy / 2));
		ctx.stroke();
	}

	step() {
        this.energy = Math.min(this.energy, ENERGY_TO_DOUBLE)
		
		this.energy-=0.1;

		//фотоситез
		if (inInterval(0, 7, this.dnk[this.dnk_offset]) == true) {
			this.energy += Math.max(0, (height * SUN_LENGTH - this.y * dy) / height * 2) * SUN_ENERGY;
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			return;
		}

		//поворот
		if (inInterval(8, 15, this.dnk[this.dnk_offset]) == true) {
			this.dir = (this.dir + 1) % 8;
			this.energy -= 1;
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			return;
		}

		//проверка спереди (ничего - 1, клетка - 2, органика - 3)
		if (inInterval(16, 23, this.dnk[this.dnk_offset]) == true) {
			let d = num2dir(this.dir);
			let c = get(this.x + d[0], this.y + d[1]);
			let offset = 1;
			if (c != void 0 && c.energy > 0) offset = 2;
			else if (c != void 0 && c.energy <= 0) offset = 3;
			offset = this.dnk[(this.dnk_offset + offset) % this.dnk.length];
			this.dnk_offset = (this.dnk_offset + offset) % this.dnk.length;
			this.energy -= 1;
			return;
		}

		//движение (ничего - 1, клетка - 2, органика - 3)
		if (inInterval(24, 31, this.dnk[this.dnk_offset]) == true) {
			let d = num2dir(this.dir);
			let c = get(this.x + d[0], this.y + d[1]);
			let offset = 1;
			if (c == void 0) {
				set(this.x, this.y, null);
				[this.x, this.y] = set(this.x + d[0], this.y + d[1], this);
			}
			else if (c.energy > 0) offset = 2;
			else if (c.energy <= 0) offset = 3;
			offset = this.dnk[(this.dnk_offset + offset) % this.dnk.length];
			this.dnk_offset = (this.dnk_offset + offset) % this.dnk.length;
			this.energy -= 3;
			return;
		}

		//съесть спереди (ничего - 1, клетка - 2, органика - 3)
		if (inInterval(32, 39, this.dnk[this.dnk_offset]) == true) {
			let d = num2dir(this.dir);
			let c = get(this.x + d[0], this.y + d[1]);
			let offset = 1;
			set(this.x, this.y, null);
			[this.x, this.y] = set(this.x + d[0], this.y + d[1], this);
			if (c != void 0 && c.energy > 0) {
				offset = 2;
				this.energy += c.energy;
			}
			else if (c != void 0 && c.energy <= 0) {
				offset = 3;
				this.energy += ORGANIC_ENERGY;
			}
			offset = this.dnk[(this.dnk_offset + offset) % this.dnk.length];
			this.dnk_offset = (this.dnk_offset + offset) % this.dnk.length;
			return;
		}

		//спереди свой? (да - 1, нет - 2)
		if (inInterval(	40, 47, this.dnk[this.dnk_offset]) == true) {
			let d = num2dir(this.dir);
			let c = get(this.x + d[0], this.y + d[1]);
			let offset = 2;
			if (c != void 0) {
				if (isLike(this, c) == true) offset = 1;
			}
			offset = this.dnk[(this.dnk_offset + offset) % this.dnk.length];
			this.dnk_offset = (this.dnk_offset + offset) % this.dnk.length;
			this.energy -= 1;
			return;
		}

		//поделится энергией с соседями
		if (inInterval(48, 55, this.dnk[this.dnk_offset]) == true) {
			let n = [];
			for (let i = 0; i < 8; i++) {
				let [x,y] = num2dir(i);
				x += this.x; y += this.y;
				let c = get(x, y);
				if (c != void 0 && c.energy > 0) n.push(c);
			}

			if (n.length > 0) {
				this.energy /= n.length;
				for (let i = 0; i < n.length; i++) {
					n[i].energy += this.energy;
				}
			}
		}

		//безусловный перех.
		if (inInterval(56, 63, this.dnk[this.dnk_offset]) == true) {
			let offset = this.dnk[(this.dnk_offset + 1) % this.dnk.length];
			this.dnk_offset = (this.dnk_offset + offset) % this.dnk.length;
			return;
		}
	}

	mutate() {
		if (Math.random() < MUTATION_KOOF)
			this.dnk[Math.floor(Math.random() * this.dnk.length)] = Math.floor(Math.random()*64);
	}

	double() {
		if (this.energy >= ENERGY_TO_DOUBLE) {
			let d;
			for (let i = 0; i < 8; i++) {
				d = num2dir((this.dir + i) % 8);
				if (get(this.x + d[0], this.y + d[1]) == null) {
					this.energy /= 2;
					let [x, y] = chCoord(this.x + d[0], this.y + d[1])
					set(x, y, new Cell(x, y, this.dnk, this.energy));
					return;
				}
			}

			//this.energy = 0;
		}
	}
}

let dnk = [];	

for (let i = 0; i < 64; i++) dnk.push(0)//Math.floor(Math.random()*64));

map[0] = new Cell(0, 0, dnk, ENERGY_TO_DOUBLE/2);

const mix = function(a, b, c) {
	return (a * c) + (b * (1 - c));
}

const update = function() {
	let lively = 0;

	for (let i = 0; i < height; i++) {
		let c = Math.max(0, (height * SUN_LENGTH - i) / height * 2);
		let r = mix(255, 30, c);
		let g = mix(255, 60, c);
		let b = mix(0, 200, c);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(0, i, width, 1);
	}

	let nmap = map.slice(0, map.length); // против копирования

	for (let i = 0; i < nmap.length; i++) {
		if (nmap[i] == void 0) continue;

		if (nmap[i].energy > 0) {
			nmap[i].step();
			nmap[i].double();
			nmap[i].mutate();
			lively++;
		}
		
		nmap[i].draw();
	}

	if (lively > 0)
		requestAnimationFrame(update);
	else
		document.location.reload();
}

update();