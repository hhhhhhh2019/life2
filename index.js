const ORGANIC_ENERGY = 50;
const SUN_ENERGY = 50;
const SUN_LENGTH = 0.5;
const ENERGY_TO_DOUBLE = 200;
const DEAD_COLOR = "#808080";
const LIFE_COLOR = "#e0a040";
const MUTATION_KOOF = 0.001;
var DRAW_DIRS = false;
const TYPE_RENDER = 1; // 0 - просто клетки, 1 - их энергия

const width = 600;
const height = 280;

const mapWidth = 100;
const mapHeight = Math.round(mapWidth * (height / width));

const dx = width / mapWidth;
const dy = height / mapHeight;

var map = new Array(mapWidth * mapHeight);

const cnv = document.getElementById("cnv");
cnv.width = width;
cnv.height = height;
const ctx = cnv.getContext("2d");

ctx.strokeStyle = "#ffffff";

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

/* комманда, интевал, кол-во преходов, усл. перех		p - параметр
	фотосинтез, 0..5, 0,
	поворот, 6..10, 0,
	посмотреть, 11..16, 4, пусто органика враг друг
	шаг, 17..22, 4, пусто органика враг друг
	съесть, 23..28, 0,
	поделится энергией, 29..33, 0,
	преобр. минералы в енергию, 35..39, 0,
	окружен ли я, 40..45, 2, да(нету хотя-бы одной пустой клетки рядом) нет
	сколько у меня энергии, 46..50, 2, больше(чем p * 15) меньше
	размножится, 51..56, 0,
	без усл. перех, 57..63
*/


class Cell {
	constructor(x, y, dnk, e, ls=-1) {
		this.x = x;
		this.y = y;
		this.dnk = dnk;
		this.dnk_offset = 0;
		this.energy = e;
		this.dir = Math.floor(Math.random()*8);
		this.children = 0;
	}

	draw() {
		if (this.energy <= 0) ctx.fillStyle = DEAD_COLOR;
		else if (TYPE_RENDER == 0) ctx.fillStyle = LIFE_COLOR;
		else ctx.fillStyle = `rgb(${this.energy / ENERGY_TO_DOUBLE * 255}, 0, 0)`;
		ctx.fillRect(this.x * dx, this.y * dy, dx, dy);
		if (DRAW_DIRS) {
			ctx.beginPath();
			ctx.moveTo(this.x * dx + dx / 2, this.y * dy + dy / 2);
			ctx.lineTo(this.x * dx + dx / 2 + num2dir(this.dir)[0] * (dx / 2), this.y * dy + dy / 2 + num2dir(this.dir)[1] * (dy / 2));
			ctx.stroke();
		}
	}

	step() {
		this.energy -= 0.1;
		// фотосинтез
        if (inInterval(0, 5, this.dnk[this.dnk_offset])) {
			this.energy += Math.max(0, ((height * SUN_LENGTH - this.y * dy) / height * 2) * SUN_ENERGY);
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			return;
		}
		// поворот
		if (inInterval(6, 10, this.dnk[this.dnk_offset])) {
			this.dir = (this.dir + this.dnk[(this.dnk_offset + 1) % this.dnk.length]) % 8;
			this.dnk_offset = (this.dnk_offset + 2) % this.dnk.length;
			this.energy -= 0.5;
			return;
		}
		// посмотреть
		if (inInterval(11, 16, this.dnk[this.dnk_offset])) {
			let dir = num2dir((this.dir+this.dnk[(this.dnk_offset + 1) % this.dnk.length])%8);
			let c = get(this.x + dir[0], this.y + dir[1]);
			if (this.x + dir[0] < 0 || this.x + dir[0] >= mapWidth) return;
			if (this.y + dir[1] < 0 || this.y + dir[1] >= mapHeight) return;
			this.energy -= 1;
			if (c == null) {
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 1) % this.dnk.length]) % this.dnk.length;
				return;
			}
			if (c.energy <= 0) {
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 2) % this.dnk.length]) % this.dnk.length;
				return;
			}
			if (isLike(this,c)) {
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 3) % this.dnk.length]) % this.dnk.length;
				return;
			}
			this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 4) % this.dnk.length]) % this.dnk.length;
			return;
		}
		// шаг
		if (inInterval(17, 22, this.dnk[this.dnk_offset])) {
			let dir = num2dir((this.dir+this.dnk[(this.dnk_offset + 1) % this.dnk.length])%8);
			let c = get(...chCoord(this.x + dir[0], this.y + dir[1]));
			if (c == null) {
				set(this.x,this.y,null);
				this.x += dir[0]; this.y += dir[1];
				set(this.x,this.y,this);
				this.energy -= 3;
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 1) % this.dnk.length]) % this.dnk.length;
				return;
			}
			if (c.energy <= 0) {
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 2) % this.dnk.length]) % this.dnk.length;
				return;
			}
			if (isLike(this,c)) {
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 3) % this.dnk.length]) % this.dnk.length;
				return;
			}
			this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 4) % this.dnk.length]) % this.dnk.length;
			return;
		}
		// съесть
		if (inInterval(23, 28, this.dnk[this.dnk_offset])) {
			let dir = num2dir((this.dir+this.dnk[(this.dnk_offset + 1) % this.dnk.length])%8);
			let c = get(...chCoord(this.x + dir[0], this.y + dir[1]));
			if (c == null || c == this) return;
			set(this.x,this.y,null);
			this.x += dir[0]; this.y += dir[1];
			set(this.x,this.y,this);
			if (c.energy <= 0) {
				this.energy += ORGANIC_ENERGY
				return;
			}
			this.energy += c.energy - 5;
			return;
		}
		// поделится энергией
		if (inInterval(29, 34, this.dnk[this.dnk_offset])) {
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			let n = [];
			for (let i = 0; i < 8; i++) {
				let [x,y] = num2dir(i);
				let c = get(this.x + x, this.y + y);
				if (c != void 0 && c.energy > 0 && c != this) n.push(c);
			}

			this.energy /= n.length + 1;
			for (let i = 0; i < n.length; i++) {
				n[i].energy += this.energy;
			}
		}
		// преобр. минералы в енергию
		if (inInterval(35, 39, this.dnk[this.dnk_offset])) {
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			return;
		}
		// окружен ли я
		if (inInterval(40, 45, this.dnk[this.dnk_offset])) {
			let n = [];
			for (let i = 0; i < 8; i++) {
				let [x,y] = num2dir(i);
				let c = get(this.x + x, this.y + y);
				if (c != null && c.energy > 0) n.push(c);
			}

			if (n == 8)
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 1) % this.dnk.length]) % this.dnk.length;
			else
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 2) % this.dnk.length]) % this.dnk.length;
		}
		// сколько у меня энергии
		if (inInterval(46, 50, this.dnk[this.dnk_offset])) {
			if (this.energy < this.dnk[(this.dnk_offset + 1) % this.dnk.length] * 15)
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 2) % this.dnk.length]) % this.dnk.length;
			else
				this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 3) % this.dnk.length]) % this.dnk.length;
		}
		// размножится
		if (inInterval(51, 56, this.dnk[this.dnk_offset])) {
			this.double();
			this.dnk_offset = (this.dnk_offset + 1) % this.dnk.length;
			return;
		}
		// без усл. перех.
		if (inInterval(57, 63, this.dnk[this.dnk_offset])) {
			this.dnk_offset = (this.dnk_offset + this.dnk[(this.dnk_offset + 1) % this.dnk.length]) % this.dnk.length;
			return;
		}
	}

	mutate() {
		this.dnk[Math.floor(Math.random() * this.dnk.length)] = Math.floor(Math.random()*64);
	}

	double() {
		if (this.energy < ORGANIC_ENERGY) return;
		let d;
		for (let i = 0; i < 8; i++) {
			d = num2dir((this.dir + i) % 8);
			if (get(this.x + d[0], this.y + d[1]) == null) {
				this.energy /= 2;
				let [x, y] = chCoord(this.x + d[0], this.y + d[1])
				set(x, y, new Cell(x, y, this.dnk.slice(0, this.dnk.length), this.energy, this.last_step));
				if (this.children % 4 == 0) get(x, y).mutate();
				this.children++;
				return;
			}
		}

		this.energy = 0;
	}
}

let dnk = [];	

for (let i = 0; i < 64; i++) dnk.push(0);

map[0] = new Cell(0, 0, dnk, ENERGY_TO_DOUBLE/2);

const mix = function(a, b, c) {
	return (a * c) + (b * (1 - c));
}

const update = function() {
	let lively = 0;

	for (let i = 0; i < height; i++) {
		let c = Math.max(0, (height * SUN_LENGTH - i) / height * 5);
		let r = mix(255, 200, c);
		let g = mix(255, 230, c);
		let b = mix(0, 255, c);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(0, i, width, 1);
	}

	let nmap = map.slice(0, map.length);

	for (let i = 0; i < nmap.length; i++) {
		if (nmap[i] == null) continue;

		nmap[i].draw();

		if (nmap[i].energy > 0) {
			nmap[i].step();
			if (Math.random() < MUTATION_KOOF)
				nmap[i].mutate();
			if (nmap[i].energy >= ENERGY_TO_DOUBLE)
				nmap[i].double();
			lively++;
		} else if (get(nmap[i].x, nmap[i].y+1) == null) {
			set(nmap[i].x, nmap[i].y+1, nmap[i]);
			set(nmap[i].x, nmap[i].y, null);
			nmap[i].y++;
		}
	}

	if (lively > 0)
		requestAnimationFrame(update);
	else
		document.location.reload();
}

update();