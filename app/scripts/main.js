/* jshint devel:true */
'use strict';
var 
	_zarr = function(len) {  // create len array with zero
		return new Array(len).join(0).split('').map(Number);
	},
	_rclarr = function(arr) {  // deep clone array
		return typeof arr === 'object' ? [].map.call(arr, _rclarr) : arr;
	},

	tetrisWidth = 20,
	tetrisHeight = 30,
	tetrisFigs = [
		[ [1,1,1],
			[0,1,0] ],

		[ [1,1,0],
			[0,1,1] ],

		[ [0,1,1],
			[1,1,0] ],

		[ [1,1,1],
			[0,0,1] ],

		[ [1,1,1],
			[1,0,0] ],

		[ [1,1],
			[1,1] ],

		[ [1,1,1,1] ]
	],
	
	tetris = {},
	viewwork = {};

tetris = {

	state: _zarr(tetrisHeight+4).map(function(){
		return _zarr(tetrisWidth+1);
	}),

	currPos: {x: null, y: null, dx: null, dy: null},
	currFig: null,
	possFig: _rclarr(tetrisFigs), 

	checkPos: function(x, y, fig) {
		var self = this;
		fig = fig || this.currFig;

		return fig.every(function(l,i){
			return l.every(function(e,j){
				return e + self.state[i + y][j + x] < 2;
			});
		});
	},
	calcState: function() {
		var self = this;

		this.state.forEach(function(l,i) {
			if (l.some(function(e){return e === 0;})) return;
			self.state.splice(i,1);
			self.state.push(_zarr(self.state[0].length + 1));
		});
	},
	showState: function() {
		var self = this;
		var res = _rclarr(this.state);

		if (this.currFig) {
			if (!this.checkPos(this.currPos.x, this.currPos.y)) return res;
			self.currFig.forEach(function(l,i){
				l.forEach(function(e,j){
					res[i + self.currPos.y][j + self.currPos.x] += e;
				});
			});
		}
		return res;
	},
	saveState: function() {
		this.state = this.showState();
		this.currFig = null;
		this.currPos = {x: null, y: null, dx: null, dy: null};
		this.calcState();
	},
	moveRL: function(s) {
		if (this.currPos.x + s < 0) return;

		if (this.currPos.x + this.currFig[0].length + s > this.state[0].length) return; 
		if (!this.checkPos(this.currPos.x + s, this.currPos.y)) return;
		this.currPos.x += s;
	},
	moveD: function() {
		if (!this.currFig) return;

		if (this.currPos.y - 1 < 0 || 
			 !this.checkPos(this.currPos.x, this.currPos.y - 1)) {
			this.saveState();	
		} else {
			this.currPos.y -= 1;
		}
	},
	fullD: function() {
		if (!this.currFig) return;

		this.moveD();
		this.fullD();
	},
	showTurn: function() {
		if (!this.currFig) return;
		var self = this;

		return _rclarr(self.currFig)[0].map(function(e,i){
			return _rclarr(self.currFig).map(function(l,j){
				return _rclarr(self.currFig)[j][self.currFig[0].length - i -1];
			});
		});
	},
	rotate: function() {
		if (!this.currFig) return;
		var self = this;
		var nf = self.showTurn();
		var dx = Math.floor((self.currFig[0].length - nf[0].length) / 2);
		var dy = Math.floor((self.currFig.length - nf.length) / 2);

		dx = self.currPos.dx === null ? dx : -self.currPos.dx;
		dy = self.currPos.dy === null ? dy : -self.currPos.dy;

		if (self.currPos.x + dx < 0) dx = -self.currPos.x;
		if (self.currPos.x + dx + nf[0].length > self.state[0].length) dx = self.state[0].length - self.currPos.x - nf[0].length;
		if (!self.checkPos(self.currPos.x + dx, self.currPos.y + dy, nf)) return;

		self.currFig = _rclarr(nf);
		self.currPos = {x: self.currPos.x + dx, y: self.currPos.y + dy, dx: dx, dy: dy};
	},
	newFig: function() {
		if (this.currFig) return;
		var self = this;
		var rnd = Math.max(Math.floor(Math.random()*this.possFig.length - 0.1), 0) ;

		this.currFig = _rclarr(this.possFig[rnd]);
		this.currPos.x = Math.floor(this.state[0].length / 2 - this.currFig[0].length / 2);
		this.currPos.y = this.state.length - this.currFig.length - 3;

		_zarr(Math.floor(Math.random()*4)).forEach(function(){
			self.rotate();
		});

	},
	out: function() {
		return this.showState().slice(0, this.showState().length - 3);
	}
};

viewwork = {

	init: function() {
      document.addEventListener('keyup', function(e){
			switch (e.keyCode) {
				case 37: // left
					tetris.moveRL(-1);
					break;
				case 39: // right
					tetris.moveRL(1);
					break;
				case 38: // up - rotate
					tetris.rotate();
					break;
				case 40: // down
					tetris.fullD();
					viewwork.iterate();
					break;
			}
		});
		viewwork.iterate();
	},

	draw: function() {
		var space = document.getElementById('space');
		var pole = document.createElement('div');

		pole.innerHTML = tetris.out().reverse().map(function(l){
			return '<div class="line">' + l.map(function(e){
				return (e ? '<div class="black">' : '<div class="white">') + e + '</div>';
			}).join('') + '</div>';
		}).join('');

		while (space.firstChild) {
			space.removeChild(space.firstChild); 
		}
		space.appendChild(pole);
	},

	iterate: function() {
		tetris.moveD();
		viewwork.draw();
    tetris.calcState();
		tetris.newFig();
		viewwork.draw();
	}
};

viewwork.init();
setInterval(function(){
  viewwork.iterate();
}, 500);
