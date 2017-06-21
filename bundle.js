/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Piece_PieceFactory__ = __webpack_require__(2);

__webpack_require__(1);
const socket = window.io ? window.io.connect('127.0.0.1:6006') : false;
/* tslint:enable:no-var-requires */
/**
 * Credits to http://htmltetris.com/
 */
class Game {
    constructor(sizeX = 10, sizeY = 24) {
        this.board = [];
        this.boardOffsetX = 8;
        this.boardOffsetY = 8;
        this.tileSizeX = 15;
        this.tileSizeY = 15;
        this.tileGapSize = 2;
        this.boardMargin = 10;
        this._state = Game.states.INTRO;
        this.borderSize = 2;
        this.score = 0;
        this.code = [5, 1, 9, 3];
        this.unlockCode = [3, 8, 4, 9];
        this.inputUnlockCode = [];
        this.unlocked = false;
        this.pieces = [];
        this.boardSizeX = sizeX;
        this.boardSizeY = sizeY;
        this.setUpGame();
    }
    get state() {
        return this._state;
    }
    set state(value) {
        this._state = value;
        this.update();
    }
    get size() {
        return this.boardSizeX * this.boardSizeY;
    }
    onFixPiece(piece) {
        this.drawBoard();
        this.clearRowCheck(piece.pieceY, piece.tetrominos[piece.curPiece][piece.curRotation].length);
    }
    gameOver() {
        this.state = Game.states.GAME_OVER;
    }
    finishGame() {
        this.state = Game.states.FINISHED;
    }
    setUpGame() {
        this.bc = document.getElementById('board_canvas');
        this.bcc = this.bc.getContext('2d');
        this.codeEl = document.getElementById('code');
        this.stateEl = document.getElementById('state-text');
        for (let i = 0; i < this.size; i++) {
            this.board[i] = 0;
        }
        document.addEventListener('keydown', (e) => this.onClickedKey(e));
        document.addEventListener('keyup', (e) => this.onClickedKey(e));
        if (socket) {
            socket.on('clickedKey', (data) => this.onClickedKey(data));
        }
        this.state = Game.states.INTRO;
        this.updateSizing();
        this.draw();
    }
    startGame() {
        this.unMount();
        for (let i = 0; i < this.size; i++) {
            this.board[i] = 0;
        }
        this.drawBoard();
        this.pieces.push(__WEBPACK_IMPORTED_MODULE_0__Piece_PieceFactory__["a" /* default */].getPiece(this, 1));
        this.addPieceTimeout = window.setTimeout(() => this.pieces.push(__WEBPACK_IMPORTED_MODULE_0__Piece_PieceFactory__["a" /* default */].getPiece(this, 2)), 3000);
        this.applyScore(0); // to init
        this.state = Game.states.STARTED;
        this.update();
    }
    unMount() {
        for (const piece of this.pieces) {
            piece.unMount();
        }
        this.pieces = [];
        clearTimeout(this.addPieceTimeout);
    }
    drawBoard() {
        this.bcc.fillStyle = '#000';
        this.bcc.fillRect(0, 0, this.boardOffsetX * 2 + this.tileSizeX * this.boardSizeX + this.tileGapSize * (this.boardSizeX - 1), this.boardOffsetY * 2 + this.tileSizeY * this.boardSizeY + this.tileGapSize * (this.boardSizeY - 1));
        this.bcc.clearRect(this.boardOffsetX - this.borderSize, this.boardOffsetY - this.borderSize, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize + this.borderSize * 2, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize + this.borderSize * 2);
        this.bcc.strokeRect(this.boardOffsetX - 0.5, this.boardOffsetY - 0.5, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize + 1, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize + 1);
        this.bcc.fillStyle = '#888';
        this.bcc.fillRect(this.boardOffsetX, this.boardOffsetY, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize);
        for (const [i, boardItem] of this.board.entries()) {
            this.drawBox(i, boardItem, this.bcc);
        }
    }
    drawBox(position, color, context) {
        const posX = position % this.boardSizeX;
        const posY = (position - posX) / this.boardSizeX;
        context.fillStyle = color === 0 ? '#999' : color;
        context.fillRect(this.boardOffsetX + posX * (this.tileSizeX + this.tileGapSize), this.boardOffsetY + posY * (this.tileSizeY + this.tileGapSize), this.tileSizeX, this.tileSizeY);
    }
    updateSizing() {
        this.tileSizeX = this.tileSizeY = Math.floor((window.innerHeight - 25 - this.boardOffsetY * 2 - this.boardSizeY * this.tileGapSize) / this.boardSizeY);
        this.canvasWidth = (this.boardOffsetX * 2 + this.tileSizeX * this.boardSizeX + this.tileGapSize * (this.boardSizeX - 1));
        this.canvasHeight = (this.boardOffsetY * 2 + this.tileSizeY * this.boardSizeY + this.tileGapSize * (this.boardSizeY - 1));
        this.bc.width = this.canvasWidth;
        this.bc.height = this.canvasHeight;
        for (const piece of this.pieces) {
            piece.updateSizing();
        }
        this.bc.style.left = `${this.boardMargin}px`;
        this.drawBoard();
        this.updatePieces();
    }
    clearRowCheck(startrow, numrowsdown) {
        let numRowsCleared = 0;
        for (let i = 0; i < numrowsdown; i++) {
            let full = true;
            for (let j = 0; j < this.boardSizeX; j++) {
                if (!this.board[(startrow + i) * this.boardSizeX + j]) {
                    full = false;
                }
            }
            if (full) {
                numRowsCleared++;
                this.shiftDown(startrow + i);
                this.drawBoard();
            }
        }
        if (numRowsCleared) {
            this.applyScore(numRowsCleared * 100);
        }
    }
    // row is full
    shiftDown(row) {
        for (let i = row * this.boardSizeX - 1; i >= 0; i--) {
            this.board[i + this.boardSizeX] = this.board[i];
        }
        for (let i = 0; i < this.boardSizeX; i++) {
            this.board[i] = 0;
        }
    }
    updatePieces() {
        for (const piece of this.pieces) {
            piece.update();
        }
    }
    update() {
        this.updatePieces();
        this.draw();
    }
    draw() {
        this.drawStateText();
        this.drawCode();
    }
    onClickedKey(e) {
        let key = e;
        const event = e;
        if (typeof event.which !== 'undefined') {
            key = `${event.which}:${event.type === 'keydown' ? '1' : '0'}`;
        }
        switch (key) {
            case '82:0':
                this.reset();
                break;
            case '48:0':
                this.addUnlockCode(0);
                break;
            case '49:0':
                this.addUnlockCode(1);
                break;
            case '50:0':
                this.addUnlockCode(2);
                break;
            case '51:0':
                this.addUnlockCode(3);
                break;
            case '52:0':
                this.addUnlockCode(4);
                break;
            case '53:0':
                this.addUnlockCode(5);
                break;
            case '54:0':
                this.addUnlockCode(6);
                break;
            case '55:0':
                this.addUnlockCode(7);
                break;
            case '56:0':
                this.addUnlockCode(8);
                break;
            case '57:0':
                this.addUnlockCode(9);
                break;
            case '8:0':
                this.removeUnlockCode();
                break;
            default:
                for (const piece of this.pieces) {
                    piece.onClickedKey(key);
                }
        }
    }
    addUnlockCode(which) {
        if (this.inputUnlockCode.length < this.unlockCode.length) {
            this.inputUnlockCode.push(which);
            this.draw();
        }
    }
    removeUnlockCode() {
        this.inputUnlockCode.pop();
        this.draw();
    }
    reset() {
        if (this.unlock()) {
            this.startGame();
        }
    }
    unlock() {
        if (this.unlocked) {
            return true;
        }
        let correct = true;
        this.inputUnlockCode.forEach((code, i) => {
            if (correct) {
                correct = code === this.unlockCode[i];
            }
        });
        return this.inputUnlockCode.length === this.unlockCode.length && correct;
    }
    applyScore(amount) {
        this.score += amount;
        if (this.score >= 400) {
            this.finishGame();
        }
        if (this.state === Game.states.STARTED) {
            this.setHelpTimer();
        }
        this.drawCode();
    }
    setHelpTimer() {
        clearTimeout(this.helpTimeout);
        this.helpTimeout = window.setTimeout(() => this.applyScore(100), 1000 * 120);
    }
    drawCode() {
        let length = 0;
        if (this.score >= 400) {
            length = 4;
        }
        else if (this.score >= 300) {
            length = 3;
        }
        else if (this.score >= 200) {
            length = 2;
        }
        else if (this.score >= 100) {
            length = 1;
        }
        this.codeEl.innerHTML = this.code.slice(0, length).map((c) => `<span class='code-item'>${c}</span>`).join('') + ('<span class="code-item asterisk">*</span>'.repeat(this.code.length - length));
    }
    drawStateText() {
        switch (this.state) {
            case Game.states.GAME_OVER:
                this.stateEl.innerHTML = '<span class="game-over heading">Game Over</span><span class="description">Druk op de witte knop om opnieuw te beginnen.</span>';
                this.stateEl.classList.remove('hidden');
                break;
            case Game.states.INTRO:
                this.stateEl.innerHTML = `<span class="intro heading">Gefeliciteerd!</span><span class="description">Jullie laatste obstakel is het vinden van de code voor de kluis! Je krijgt de code door dit spel te spelen. Let op: samenwerking is hier het belangrijkst! Druk op de witte knop om het spel te starten.</span><span class="description">(===&===)</span><span class="code" id="code" style='display:block;'>${this.inputUnlockCode.map((c) => `<span class='code-item'>${c}</span>`).join('') + ('<span class="code-item asterisk">*</span>'.repeat(this.unlockCode.length - this.inputUnlockCode.length))}</span>`;
                this.stateEl.classList.remove('hidden');
                break;
            case Game.states.FINISHED:
                this.stateEl.innerHTML = `<span class="intro heading">Wow!</span><span class="description">Goed gedaan! Jullie hebben succesvol de code vrijgespeeld en kunnen nu de kluis open maken.</span><div><h1 class="code-heading">De code is:</h1><span class="code" id="code">${this.code.map((c) => `<span class='code-item'>${c}</span>`).join('')}</span></div>`;
                this.stateEl.classList.remove('hidden');
                break;
            default:
                this.stateEl.innerHTML = '';
                this.stateEl.classList.add('hidden');
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Game;

Game.states = {
    INTRO: 'INTRO',
    STARTED: 'STARTED',
    FINISHED: 'FINISHED',
    GAME_OVER: 'GAME_OVER',
};


/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__index__ = __webpack_require__(3);

class PieceFactory {
    static getPiece(game, player) {
        switch (player) {
            case 2:
                return new __WEBPACK_IMPORTED_MODULE_0__index__["a" /* default */](2, game, '#32cc1a', 'rgba(50, 204, 26, 0.3)', { left: 65, rotate: 87, right: 68 });
            case 1:
            default:
                return new __WEBPACK_IMPORTED_MODULE_0__index__["a" /* default */](1, game, '#ffeb21', 'rgba(255, 235, 33, 0.3)', { left: 37, rotate: 38, right: 39 });
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = PieceFactory;



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Game_index__ = __webpack_require__(0);

class Piece {
    constructor(type, game, color, shadowColor, controls) {
        this.pieceX = 0;
        this.pieceY = 0;
        this.curPiece = 0;
        this.curRotation = 0;
        this.animPositionX = 0;
        this.animPositionY = 0;
        this.animRotation = 0;
        // <editor-fold desc="Shapes">
        // coordinate systems follow convention starting at top-left. order is that of clockwise rotation. row-major layout.
        // currently using SRS rotation; I am not satisfied with the S, Z, I having 4 states when they only need two, but I would need to have them rotate on an axis that changes location depending on orientation and cw vs ccw rotation.
        this.tetromino_Z = [[[1, 1], [0, 1, 1]], [[0, 0, 1], [0, 1, 1], [0, 1]], [[], [1, 1], [0, 1, 1]], [[0, 1], [1, 1], [1]]];
        this.tetromino_S = [[[0, 2, 2], [2, 2]], [[0, 2], [0, 2, 2], [0, 0, 2]], [[], [0, 2, 2], [2, 2]], [[2], [2, 2], [0, 2]]];
        this.tetromino_J = [[[3], [3, 3, 3]], [[0, 3, 3], [0, 3], [0, 3]], [[], [3, 3, 3], [0, 0, 3]], [[0, 3], [0, 3], [3, 3]]];
        this.tetromino_T = [[[0, 4], [4, 4, 4]], [[0, 4], [0, 4, 4], [0, 4]], [[], [4, 4, 4], [0, 4]], [[0, 4], [4, 4], [0, 4]]];
        this.tetromino_O = [[[5, 5], [5, 5]]];
        this.tetromino_L = [[[0, 0, 6], [6, 6, 6]], [[0, 6], [0, 6], [0, 6, 6]], [[], [6, 6, 6], [6]], [[6, 6], [0, 6], [0, 6]]];
        this.tetromino_I = [[[], [7, 7, 7, 7]], [[0, 0, 7], [0, 0, 7], [0, 0, 7], [0, 0, 7]], [[], [], [7, 7, 7, 7]], [[0, 7], [0, 7], [0, 7], [0, 7]]];
        // tetromino geometry data
        // private _tetrominos: number[][][][] = [ this.tetromino_Z, this.tetromino_S, this.tetromino_J, this.tetromino_T, this.tetromino_O, this.tetromino_L, this.tetromino_I ];
        this._tetrominos = [this.tetromino_J, this.tetromino_T, this.tetromino_O, this.tetromino_L, this.tetromino_I];
        // this is for the rotation animation -- must know where in local grid did the piece rotate around each coordinate is a triple, the first two are x,y, and the last is to indicate whether the point is in the center of the block or in the corner to the bottom right between blocks. These are the points which may be rotated around to retain block alignment, if that makes any sense.
        this.tet_center_rot = [[1, 1, true], [1, 1, true], [1, 1, true], [1, 1, true], [0, 0, false], [1, 1, true], [1, 1, false]];
        // left, right
        this.shiftOrders = [
            [0, 0],
            [-1, 0], [-1, 1], [-1, -1], [0, -1],
            [-1, 2], [-1, -2],
            [-2, 0], [-2, 1], [-2, -1], [-2, 2], [-2, -2],
            [0, -2],
            // [0,2], // directly below, two spaces (can cause tunnelling perhaps? one space below certainly is not needed)
            // [-3,0],[-3,1],[-3,-1],[-3,2],[-3,-2], // col 3 blocks left -- this may be getting cheap
            [1, 0], [1, 1], [1, -1], [2, 0], [2, 1], [2, -1], [1, 2], [1, -2],
        ];
        this.shiftRight = 0; // 0 = left, 1 = right
        // </editor-fold>
        this.shadowY = 0;
        this.fallInterval = 400;
        this.repeatRateInitial = 300;
        this.repeatRate = 300;
        this.repeatIntervals = { left: 0, rotate: 0, right: 0 };
        this.repeatInitPassed = { left: 0, rotate: 0, right: 0 };
        this.buttonStates = { left: 0, rotate: 0, right: 0 };
        this.moves = {
            left: () => {
                this.pieceX -= 1;
                if (this.isPieceInside()) {
                    this.pieceX += 1;
                }
                this.shiftRight = 0;
                this.clearLockTimer();
            },
            right: () => {
                this.pieceX += 1;
                if (this.isPieceInside()) {
                    this.pieceX -= 1;
                }
                this.shiftRight = 1;
                this.clearLockTimer();
            },
            rotate: () => {
                const oldrot = this.curRotation;
                this.curRotation = (this.curRotation + 1) % (this._tetrominos[this.curPiece].length);
                if (this.kick()) {
                    this.curRotation = oldrot;
                }
                else {
                    this.animRotation = -Math.PI / 2.0;
                }
                this.clearLockTimer();
            },
            // up direction movement is a cheat in standard tetris
            up: () => {
                this.pieceY -= 1;
                if (this.isPieceInside()) {
                    this.pieceY += 1;
                }
                this.clearLockTimer();
            },
            // down key calls this -- moves stuff down, if at bottom, locks it
            down: () => {
                this.pieceY += 1;
                if (this.isPieceInside()) {
                    this.pieceY -= 1;
                    this.fixPiece();
                }
                this.clearLockTimer();
            },
            // timer based down
            timer: () => {
                this.pieceY += 1;
                if (this.isPieceInside()) {
                    this.pieceY -= 1;
                    if (!this.lockTimer) {
                        // this.lockTimer = window.setTimeout(() => {
                        this.moves.down();
                        // }, 600);
                    }
                }
            },
        };
        this.generator = () => Math.floor(Math.random() * this._tetrominos.length);
        this.type = type;
        this.game = game;
        this.color = color;
        this.shadowColor = shadowColor;
        this.controls = controls;
        this.ac = document.getElementById(`animated_canvas${this.type}`);
        this.sc = document.getElementById(`animated_shadow_canvas${this.type}`);
        if (!this.ac) {
            const canvas = document.createElement('canvas');
            canvas.id = `animated_canvas${this.type}`;
            canvas.className = 'animated_canvas';
            document.getElementById('board_canvas').insertAdjacentElement('afterEnd', canvas);
            this.ac = document.getElementById(`animated_canvas${this.type}`);
            const shadowCanvas = document.createElement('canvas');
            shadowCanvas.id = `animated_shadow_canvas${this.type}`;
            shadowCanvas.className = 'animated_shadow_canvas';
            this.ac.insertAdjacentElement('beforeBegin', shadowCanvas);
            this.sc = document.getElementById(`animated_shadow_canvas${this.type}`);
        }
        this.acc = this.ac.getContext('2d');
        this.scc = this.sc.getContext('2d');
        this.autoMoveDownInterval = window.setInterval(() => this.moveDownIntervalFunc(), this.fallInterval);
        this.animationUpdateIntervalFunc();
        this.updateSizing();
        this.nextPiece();
    }
    get tetrominos() {
        return this._tetrominos;
    }
    update() {
        if (this.game.state === __WEBPACK_IMPORTED_MODULE_0__Game_index__["a" /* default */].states.STARTED) {
            this.draw();
        }
    }
    draw() {
        this.drawPiece(this.acc);
        this.drawShadow(this.scc);
    }
    onClickedKey(data) {
        const onIndex = data.indexOf(':1');
        const offIndex = data.indexOf(':0');
        if (onIndex > -1) {
            this.keyDownFactory(parseInt(data.slice(0, onIndex), 0));
        }
        else if (offIndex > -1) {
            this.keyUpFactory(parseInt(data.slice(0, offIndex), 0));
        }
    }
    updateSizing() {
        this.ac.width = this.game.canvasWidth;
        this.ac.height = this.game.canvasHeight;
        this.sc.width = this.game.canvasWidth;
        this.sc.height = this.game.canvasHeight;
    }
    unMount() {
        clearInterval(this.autoMoveDownInterval);
        clearTimeout(this.animationUpdateTimeout);
        this.animationUpdateTimeout = 0;
        this.acc.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
        this.acc.save();
        this.scc.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
        this.scc.save();
    }
    moveDownIntervalFunc() {
        this.moves.timer();
        this.update();
    }
    animationUpdateIntervalFunc(now = 16) {
        this.animationUpdateTimeout = window.setTimeout(() => {
            window.requestAnimationFrame((time) => {
                // move animPositions closer to their targets (piece positions)
                this.animPositionX += (this.pieceX - this.animPositionX) * 0.3;
                this.animPositionY += (this.pieceY - this.animPositionY) * 0.3;
                // move animRotation closer to zero
                this.animRotation -= this.animRotation * 0.3;
                this.update();
                if (this.animationUpdateTimeout) {
                    this.animationUpdateIntervalFunc(time);
                    this.animationUpdateLastCall = time;
                }
            });
        }, 24);
    }
    nextPiece() {
        if (this.game.state !== __WEBPACK_IMPORTED_MODULE_0__Game_index__["a" /* default */].states.STARTED) {
            return;
        }
        this.pieceX = this.game.boardSizeX / 2 - 2;
        this.pieceY = 0;
        this.animPositionX = this.pieceX;
        this.animPositionY = this.pieceY;
        this.curRotation = 0;
        this.curPiece = this.generator();
        if (this.kick()) {
            this.game.gameOver();
        }
    }
    fixPiece() {
        if (this.game.state !== __WEBPACK_IMPORTED_MODULE_0__Game_index__["a" /* default */].states.STARTED) {
            return;
        }
        const tetk = this._tetrominos[this.curPiece][this.curRotation];
        for (const [i, tetki] of tetk.entries()) {
            for (const [j, tetkij] of tetki.entries()) {
                const pxi = this.pieceX + j;
                const pyj = this.pieceY + i;
                if (tetkij === 0) {
                    continue;
                }
                this.game.board[pyj * this.game.boardSizeX + pxi] = this.color;
            }
        }
        this.game.onFixPiece(this);
        this.nextPiece();
    }
    isPieceInside() {
        const tetk = this._tetrominos[this.curPiece][this.curRotation];
        for (let j = 0; j < tetk.length; j++) {
            const tetkj = tetk[j];
            for (let i = 0; i < tetkj.length; i++) {
                const tetkji = tetkj[i];
                const pxi = this.pieceX + i;
                const pyj = this.pieceY + j;
                if (tetkji && (pxi < 0 || pyj < 0 || pxi > (this.game.boardSizeX - 1) || pyj > (this.game.boardSizeY - 1))) {
                    return 1;
                }
                if (tetkji && this.game.board[pyj * this.game.boardSizeX + pxi]) {
                    return 2;
                }
            }
        }
        return 0;
    }
    // rotation nudge. Attempts to shift piece into a space that fits nearby, if necessary.
    // if such a position is found, it will be moved there.
    kick() {
        // modify this array to change the order in which shifts are tested. To favor burying pieces into gaps below,
        // place negative y offset entries closer to the front.
        const oldpos = [this.pieceX, this.pieceY]; // for simplicity I reuse methods that actually modify piece position.
        for (const shiftOrder of this.shiftOrders) {
            this.pieceX = oldpos[0];
            this.pieceY = oldpos[1]; // restore position
            if (this.shiftRight) {
                this.pieceX -= shiftOrder[0];
            }
            else {
                this.pieceX += shiftOrder[0];
            }
            this.pieceY += shiftOrder[1];
            if (!this.isPieceInside()) {
                return 0;
            }
        }
        this.pieceX = oldpos[0];
        this.pieceY = oldpos[1]; // restore position
        return 1; // return failure
    }
    setupRepeat(control) {
        if (this.repeatIntervals[control] === 0) {
            this.repeatIntervals[control] = window.setTimeout(() => {
                this.moves[control]();
                this.repeatIntervals[control] = window.setInterval(this.moves[control], this.repeatRate);
                this.repeatInitPassed[control] = 1;
            }, this.repeatRateInitial);
        }
    }
    stopRepeat(control) {
        if (this.repeatIntervals[control] !== 0) {
            if (this.repeatInitPassed[control]) {
                clearInterval(this.repeatIntervals[control]);
            }
            else {
                clearTimeout(this.repeatIntervals[control]);
            }
            this.repeatIntervals[control] = 0;
        }
    }
    keyDownFactory(key) {
        for (const [control, buttonKey] of Object.entries(this.controls)) {
            if (key === buttonKey && !this.buttonStates[control]) {
                this.moves[control]();
                this.stopRepeat(control); // this is insurance
                this.setupRepeat(control);
                this.buttonStates[control] = 1;
            }
        }
        this.update();
    }
    keyUpFactory(key) {
        for (const [control, buttonKey] of Object.entries(this.controls)) {
            if (key === buttonKey) {
                this.buttonStates[control] = 0;
                this.stopRepeat(control);
            }
        }
    }
    drawPiece(context) {
        // console.trace('draw');
        // drawing using geometry of current rotation
        const tetk = this._tetrominos[this.curPiece][this.curRotation];
        // translating (canvas origin) to the center,
        // rotating there, then drawing the boxes
        context.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
        context.save();
        context.fillStyle = this.color;
        let centerX = this.tet_center_rot[this.curPiece][0] * (this.game.tileSizeX + this.game.tileGapSize) + this.game.tileSizeX / 2;
        let centerY = this.tet_center_rot[this.curPiece][1] * (this.game.tileSizeY + this.game.tileGapSize) + this.game.tileSizeY / 2;
        if (this.tet_center_rot[this.curPiece][2] === true) {
            centerX += this.game.tileSizeX / 2 + this.game.tileGapSize;
            centerY += this.game.tileSizeY / 2 + this.game.tileGapSize;
        }
        context.translate(this.game.boardOffsetX + this.animPositionX * (this.game.tileSizeX + this.game.tileGapSize) + centerX + this.game.tileGapSize, this.game.boardOffsetY + this.animPositionY * (this.game.tileSizeY + this.game.tileGapSize) + centerY);
        context.rotate(this.animRotation);
        context.translate(-centerX, -centerY);
        // now in rotated coordinates, zeroed at piece origin
        for (const [i, tetkj] of tetk.entries()) {
            for (const [j, tetkji] of tetkj.entries()) {
                if (tetkji === 0) {
                    continue;
                }
                context.fillRect(j * (this.game.tileSizeX + this.game.tileGapSize), i * (this.game.tileSizeY + this.game.tileGapSize), this.game.tileSizeX, this.game.tileSizeY);
            }
        }
        context.restore();
    }
    drawShadow(context) {
        let curY = 0;
        let count = 0;
        const origY = this.pieceY;
        while (!this.isPieceInside()) {
            curY = this.pieceY;
            this.pieceY++;
            count++;
        }
        this.pieceY = origY;
        this.shadowY = curY;
        if (!count) {
            return;
        }
        this.drawShadowPieceAt(context, this.pieceX, curY);
    }
    drawShadowPieceAt(context, gridX, gridY) {
        const tetk = this._tetrominos[this.curPiece][this.curRotation];
        context.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
        context.save();
        context.fillStyle = this.shadowColor;
        context.translate(this.game.boardOffsetX + gridX * (this.game.tileSizeX + this.game.tileGapSize) + this.game.tileGapSize, this.game.boardOffsetY + gridY * (this.game.tileSizeY + this.game.tileGapSize));
        for (let j = 0; j < tetk.length; j++) {
            const tetkj = tetk[j];
            for (let i = 0; i < tetkj.length; i++) {
                const tetkji = tetkj[i];
                if (tetkji) {
                    context.fillRect(i * (this.game.tileSizeX + this.game.tileGapSize), j * (this.game.tileSizeY + this.game.tileGapSize), this.game.tileSizeX, this.game.tileSizeY);
                }
            }
        }
        context.restore();
    }
    clearLockTimer() {
        if (this.lockTimer !== 0) {
            clearTimeout(this.lockTimer);
            this.lockTimer = 0;
        }
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Piece;



/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Game_index__ = __webpack_require__(0);
/*
  Main App Container
 */

const game = new __WEBPACK_IMPORTED_MODULE_0__Game_index__["a" /* default */](20);


/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map