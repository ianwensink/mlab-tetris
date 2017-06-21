/* tslint:disable:no-var-requires */
import Piece from '../Piece/index';
import PieceFactory from '../Piece/PieceFactory';

require('./Game.css');
const socket = (window as any).io ? (window as any).io.connect('127.0.0.1:6006') : false;
/* tslint:enable:no-var-requires */

/**
 * Credits to http://htmltetris.com/
 */

export default class Game {
  public static states = {
    INTRO: 'INTRO',
    STARTED: 'STARTED',
    FINISHED: 'FINISHED',
    GAME_OVER: 'GAME_OVER',
  };

  public board: Array<number | string> = [];
  public boardSizeX: number;
  public boardSizeY: number;
  public boardOffsetX: number = 8;
  public boardOffsetY: number = 8;
  public tileSizeX: number = 15;
  public tileSizeY: number = 15;
  public tileGapSize: number = 2;
  public boardMargin: number = 10;
  public canvasWidth: number;

  public canvasHeight: number;
  public bc: HTMLCanvasElement;

  public get state() {
    return this._state;
  }

  public set state(value) {
    this._state = value;
    this.update();
  }

  private _state: string = Game.states.INTRO;

  private bcc: CanvasRenderingContext2D;
  private codeEl: HTMLElement;
  private stateEl: HTMLElement;
  private borderSize: number = 2;
  private score: number = 0;

  private addPieceTimeout: number;

  private code: number[] = [ 5, 1, 9, 3 ];
  private unlockCode: number[] = [ 3, 8, 4, 9 ];
  private inputUnlockCode: number[] = [];
  private unlocked = false;

  private pieces: Piece[] = [];

  private helpTimeout: number;

  private get size(): number {
    return this.boardSizeX * this.boardSizeY;
  }

  constructor(sizeX: number = 10, sizeY: number = 24) {
    this.boardSizeX = sizeX;
    this.boardSizeY = sizeY;

    this.setUpGame();
  }

  public onFixPiece(piece: Piece) {
    this.drawBoard();
    this.clearRowCheck(piece.pieceY, piece.tetrominos[ piece.curPiece ][ piece.curRotation ].length);
  }

  public gameOver() {
    this.state = Game.states.GAME_OVER;
  }

  private finishGame() {
    this.state = Game.states.FINISHED;
  }

  private setUpGame() {
    this.bc = document.getElementById('board_canvas') as HTMLCanvasElement;
    this.bcc = this.bc.getContext('2d') as CanvasRenderingContext2D;
    this.codeEl = document.getElementById('code') as HTMLElement;
    this.stateEl = document.getElementById('state-text') as HTMLElement;

    for(let i = 0; i < this.size; i++) {
      this.board[ i ] = 0;
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => this.onClickedKey(e));
    document.addEventListener('keyup', (e: KeyboardEvent) => this.onClickedKey(e));
    if(socket) {
      socket.on('clickedKey', (data: string) => this.onClickedKey(data));
    }

    this.state = Game.states.INTRO;

    this.updateSizing();
    this.draw();
  }

  private startGame() {
    this.unMount();

    for(let i = 0; i < this.size; i++) {
      this.board[ i ] = 0;
    }
    this.drawBoard();

    this.pieces.push(PieceFactory.getPiece(this, 1));
    this.addPieceTimeout = window.setTimeout(() => this.pieces.push(PieceFactory.getPiece(this, 2)), 3000);

    this.applyScore(0); // to init

    this.state = Game.states.STARTED;

    this.update();
  }

  private unMount() {
    for(const piece of this.pieces) {
      piece.unMount();
    }

    this.pieces = [];

    clearTimeout(this.addPieceTimeout);
  }

  private drawBoard() {
    this.bcc.fillStyle = '#000';
    this.bcc.fillRect(0, 0, this.boardOffsetX * 2 + this.tileSizeX * this.boardSizeX + this.tileGapSize * (this.boardSizeX - 1), this.boardOffsetY * 2 + this.tileSizeY * this.boardSizeY + this.tileGapSize * (this.boardSizeY - 1));
    this.bcc.clearRect(this.boardOffsetX - this.borderSize, this.boardOffsetY - this.borderSize, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize + this.borderSize * 2, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize + this.borderSize * 2);
    this.bcc.strokeRect(this.boardOffsetX - 0.5, this.boardOffsetY - 0.5, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize + 1, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize + 1);
    this.bcc.fillStyle = '#888';
    this.bcc.fillRect(this.boardOffsetX, this.boardOffsetY, (this.tileSizeX + this.tileGapSize) * this.boardSizeX - this.tileGapSize, (this.tileSizeY + this.tileGapSize) * this.boardSizeY - this.tileGapSize);
    for(const [ i, boardItem ] of this.board.entries()) {
      this.drawBox(i, boardItem, this.bcc);
    }
  }

  private drawBox(position: number, color: (number | string), context: CanvasRenderingContext2D) {
    const posX = position % this.boardSizeX;
    const posY = (position - posX) / this.boardSizeX;

    context.fillStyle = color === 0 ? '#999' : color as string;
    context.fillRect(this.boardOffsetX + posX * (this.tileSizeX + this.tileGapSize), this.boardOffsetY + posY * (this.tileSizeY + this.tileGapSize), this.tileSizeX, this.tileSizeY);
  }

  private updateSizing() {
    this.tileSizeX = this.tileSizeY = Math.floor((window.innerHeight - 25 - this.boardOffsetY * 2 - this.boardSizeY * this.tileGapSize) / this.boardSizeY);

    this.canvasWidth = (this.boardOffsetX * 2 + this.tileSizeX * this.boardSizeX + this.tileGapSize * (this.boardSizeX - 1));
    this.canvasHeight = (this.boardOffsetY * 2 + this.tileSizeY * this.boardSizeY + this.tileGapSize * (this.boardSizeY - 1));
    this.bc.width = this.canvasWidth;
    this.bc.height = this.canvasHeight;

    for(const piece of this.pieces) {
      piece.updateSizing();
    }

    this.bc.style.left = `${this.boardMargin}px`;

    this.drawBoard();
    this.updatePieces();
  }

  private clearRowCheck(startrow: number, numrowsdown: number) {
    let numRowsCleared = 0;
    for(let i = 0; i < numrowsdown; i++) {
      let full = true;
      for(let j = 0; j < this.boardSizeX; j++) {
        if(!this.board[ (startrow + i) * this.boardSizeX + j ]) {
          full = false;
        }
      }
      if(full) {
        numRowsCleared++;
        this.shiftDown(startrow + i);
        this.drawBoard();
      }
    }
    if(numRowsCleared) {
      this.applyScore(numRowsCleared * 100);
    }
  }

  // row is full
  private shiftDown(row: number) {
    for(let i = row * this.boardSizeX - 1; i >= 0; i--) {
      this.board[ i + this.boardSizeX ] = this.board[ i ];
    }
    for(let i = 0; i < this.boardSizeX; i++) {
      this.board[ i ] = 0;
    }
  }

  private updatePieces() {
    for(const piece of this.pieces) {
      piece.update();
    }
  }

  private update() {
    this.updatePieces();
    this.draw();
  }

  private draw() {
    this.drawStateText();
    this.drawCode();
  }

  private onClickedKey(e: string|KeyboardEvent) {
    let key: string = e as string;
    const event = e as KeyboardEvent;

    if(typeof event.which !== 'undefined') {
      key = `${event.which}:${event.type === 'keydown' ? '1' : '0'}`;
    }

    switch(key) {
      case '82:0': // R-key:UP
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
        for(const piece of this.pieces) {
          piece.onClickedKey(key);
        }
    }
  }

  private addUnlockCode(which: number) {
    if(this.inputUnlockCode.length < this.unlockCode.length) {
      this.inputUnlockCode.push(which);
      this.draw();
    }
  }

  private removeUnlockCode() {
    this.inputUnlockCode.pop();
    this.draw();
  }

  private reset() {
    if(this.unlock()) {
      this.startGame();
    }
  }

  private unlock() {
    if(this.unlocked) {
       return true;
    }

    let correct = true;

    this.inputUnlockCode.forEach((code, i) => {
      if(correct) {
        correct = code === this.unlockCode[i];
      }
    });

    return this.inputUnlockCode.length === this.unlockCode.length && correct;
  }

  private applyScore(amount: number) {
    this.score += amount;

    if(this.score >= 400) {
      this.finishGame();
    }

    if(this.state === Game.states.STARTED) {
      this.setHelpTimer();
    }

    this.drawCode();
  }

  private setHelpTimer() {
    clearTimeout(this.helpTimeout);

    this.helpTimeout = window.setTimeout(() => this.applyScore(100), 1000 * 120);
  }

  private drawCode() {
    let length = 0;
    if(this.score >= 400) {
      length = 4;
    } else if(this.score >= 300) {
      length = 3;
    } else if(this.score >= 200) {
      length = 2;
    } else if(this.score >= 100) {
      length = 1;
    }
    this.codeEl.innerHTML = this.code.slice(0, length).map((c) => `<span class='code-item'>${c}</span>`).join('') + ('<span class="code-item asterisk">*</span>'.repeat(this.code.length - length));
  }

  private drawStateText() {
    switch(this.state) {
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
