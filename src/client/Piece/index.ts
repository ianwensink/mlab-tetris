import Game from '../Game/index';
import IControls from './IControls';
import IMoves from './IMoves';

export default class Piece {
  public pieceX: number = 0;
  public pieceY: number = 0;
  public curPiece: number = 0;
  public curRotation: number = 0;

  public get tetrominos() {
    return this._tetrominos;
  }

  private type: number;
  private game: Game;
  private color: string;
  private controls: IControls;
  private autoMoveDownInterval: number;
  private animationUpdateInterval: number;
  private animPositionX: number = 0;
  private animPositionY: number = 0;
  private animRotation: number = 0;

  private ac: HTMLCanvasElement;
  private acc: CanvasRenderingContext2D;
  private sc: HTMLCanvasElement;
  private scc: CanvasRenderingContext2D;

  // <editor-fold desc="Shapes">

  // coordinate systems follow convention starting at top-left. order is that of clockwise rotation. row-major layout.
  // currently using SRS rotation; I am not satisfied with the S, Z, I having 4 states when they only need two, but I would need to have them rotate on an axis that changes location depending on orientation and cw vs ccw rotation.
  private tetromino_Z: number[][][] = [ [ [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 0, 1 ], [ 0, 1, 1 ], [ 0, 1 ] ], [ [], [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 1 ], [ 1, 1 ], [ 1 ] ] ];
  private tetromino_S: number[][][] = [ [ [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 0, 2 ], [ 0, 2, 2 ], [ 0, 0, 2 ] ], [ [], [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 2 ], [ 2, 2 ], [ 0, 2 ] ] ];
  private tetromino_J: number[][][] = [ [ [ 3 ], [ 3, 3, 3 ] ], [ [ 0, 3, 3 ], [ 0, 3 ], [ 0, 3 ] ], [ [], [ 3, 3, 3 ], [ 0, 0, 3 ] ], [ [ 0, 3 ], [ 0, 3 ], [ 3, 3 ] ] ];
  private tetromino_T: number[][][] = [ [ [ 0, 4 ], [ 4, 4, 4 ] ], [ [ 0, 4 ], [ 0, 4, 4 ], [ 0, 4 ] ], [ [], [ 4, 4, 4 ], [ 0, 4 ] ], [ [ 0, 4 ], [ 4, 4 ], [ 0, 4 ] ] ];
  private tetromino_O: number[][][] = [ [ [ 5, 5 ], [ 5, 5 ] ] ];
  private tetromino_L: number[][][] = [ [ [ 0, 0, 6 ], [ 6, 6, 6 ] ], [ [ 0, 6 ], [ 0, 6 ], [ 0, 6, 6 ] ], [ [], [ 6, 6, 6 ], [ 6 ] ], [ [ 6, 6 ], [ 0, 6 ], [ 0, 6 ] ] ];
  private tetromino_I: number[][][] = [ [ [], [ 7, 7, 7, 7 ] ], [ [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ] ], [ [], [], [ 7, 7, 7, 7 ] ], [ [ 0, 7 ], [ 0, 7 ], [ 0, 7 ], [ 0, 7 ] ] ];
  // tetromino geometry data
  private _tetrominos: number[][][][] = [ this.tetromino_Z, this.tetromino_S, this.tetromino_J, this.tetromino_T, this.tetromino_O, this.tetromino_L, this.tetromino_I ];
  // this is for the rotation animation -- must know where in local grid did the piece rotate around each coordinate is a triple, the first two are x,y, and the last is to indicate whether the point is in the center of the block or in the corner to the bottom right between blocks. These are the points which may be rotated around to retain block alignment, if that makes any sense.
  private tet_center_rot: Array<Array<number | boolean>> = [ [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 0, 0, false ], [ 1, 1, true ], [ 1, 1, false ] ];

  // left, right
  private shiftOrders: number[][] = [
    [ 0, 0 ], // initial
    [ -1, 0 ], [ -1, 1 ], [ -1, -1 ], [ 0, -1 ], // col 1 block left; directly above
    [ -1, 2 ], [ -1, -2 ], // col 1 block left, two away vertically
    [ -2, 0 ], [ -2, 1 ], [ -2, -1 ], [ -2, 2 ], [ -2, -2 ], // col 2 blocks left
    [ 0, -2 ], // directly above, two spaces

    // [0,2], // directly below, two spaces (can cause tunnelling perhaps? one space below certainly is not needed)
    // [-3,0],[-3,1],[-3,-1],[-3,2],[-3,-2], // col 3 blocks left -- this may be getting cheap
    [ 1, 0 ], [ 1, 1 ], [ 1, -1 ], [ 2, 0 ], [ 2, 1 ], [ 2, -1 ], [ 1, 2 ], [ 1, -2 ], // move left for wall kicking
  ];
  private shiftRight: number = 0; // 0 = left, 1 = right

  // </editor-fold>

  private shadowY: number = 0;

  private lockTimer: number;

  private fallInterval: number = 200;
  private repeatRateInitial: number = 100;
  private repeatRate: number = 200;
  private repeatIntervals: IControls = { left: 0, rotate: 0, right: 0 };
  private repeatInitPassed: IControls = { left: 0, rotate: 0, right: 0 };

  private buttonStates: IControls = { left: 0, rotate: 0, right: 0 };

  private moves: IMoves = {
    left: () => {
      this.pieceX -= 1;
      if(this.isPieceInside()) {
        this.pieceX += 1;
      }
      this.shiftRight = 0;
      this.clearLockTimer();
    },
    right: () => {
      this.pieceX += 1;
      if(this.isPieceInside()) {
        this.pieceX -= 1;
      }
      this.shiftRight = 1;
      this.clearLockTimer();
    },
    rotate: () => {
      const oldrot = this.curRotation;
      this.curRotation = (this.curRotation + 1) % (this._tetrominos[ this.curPiece ].length);
      if(this.kick()) {
        this.curRotation = oldrot;
      } else {
        this.animRotation = -Math.PI / 2.0;
      }
      this.clearLockTimer();
    },
    // up direction movement is a cheat in standard tetris
    up: () => {
      this.pieceY -= 1;
      if(this.isPieceInside()) {
        this.pieceY += 1;
      }
      this.clearLockTimer();
    },
    // down key calls this -- moves stuff down, if at bottom, locks it
    down: () => {
      this.pieceY += 1;
      if(this.isPieceInside()) {
        this.pieceY -= 1;
        this.fixPiece();
      }
      this.clearLockTimer();
    },
    // timer based down
    timer: () => {
      this.pieceY += 1;
      if(this.isPieceInside()) {
        this.pieceY -= 1;
        if(!this.lockTimer) {
          this.lockTimer = window.setTimeout(() => {
            this.moves.down();
          }, 600);
        }
      }
    },
  };

  constructor(type: number, game: Game, color: string, controls: IControls) {
    this.type = type;
    this.game = game;
    this.color = color;
    this.controls = controls;

    this.ac = document.getElementById(`animated_canvas${this.type}`) as HTMLCanvasElement;
    this.sc = document.getElementById(`animated_shadow_canvas${this.type}`) as HTMLCanvasElement;
    if(!this.ac) {
      const canvas = document.createElement('canvas');
      canvas.id = `animated_canvas${this.type}`;
      canvas.className = 'animated_canvas';
      (document.getElementById('board_canvas') as HTMLElement).insertAdjacentElement('afterEnd', canvas);
      this.ac = document.getElementById(`animated_canvas${this.type}`) as HTMLCanvasElement;

      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.id = `animated_shadow_canvas${this.type}`;
      shadowCanvas.className = 'animated_shadow_canvas';
      this.ac.insertAdjacentElement('beforeBegin', shadowCanvas);
      this.sc = document.getElementById(`animated_shadow_canvas${this.type}`) as HTMLCanvasElement;
    }
    this.acc = this.ac.getContext('2d') as CanvasRenderingContext2D;
    this.scc = this.sc.getContext('2d') as CanvasRenderingContext2D;

    this.autoMoveDownInterval = window.setInterval(() => this.moveDownIntervalFunc(), this.fallInterval);
    this.animationUpdateInterval = window.setInterval(() => this.animationUpdateIntervalFunc(), 16);

    this.updateSizing();

    this.nextPiece();
  }

  public update() {
    if(this.game.state === Game.states.STARTED) {
      this.drawPiece(this.acc);
      this.drawShadow(this.scc);
    }
  }

  public onClickedKey(data: string) {
    const onIndex = data.indexOf(':1');
    const offIndex = data.indexOf(':0');
    if(onIndex > -1) {
      this.keyDownFactory(parseInt(data.slice(0, onIndex), 0));
    } else if(offIndex > -1) {
      this.keyUpFactory(parseInt(data.slice(0, offIndex), 0));
    }
  }

  public updateSizing() {
    this.ac.width = this.game.canvasWidth;
    this.ac.height = this.game.canvasHeight;
    this.sc.width = this.game.canvasWidth;
    this.sc.height = this.game.canvasHeight;
  }

  public unMount() {
    clearInterval(this.autoMoveDownInterval);
    clearInterval(this.animationUpdateInterval);

    this.acc.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
    this.acc.save();
  }

  private generator: () => number = () => Math.floor(Math.random() * this._tetrominos.length);

  private moveDownIntervalFunc() {
    this.moves.timer();
    this.update();
  }

  private animationUpdateIntervalFunc() {
    // move animPositions closer to their targets (piece positions)
    this.animPositionX += (this.pieceX - this.animPositionX) * 0.3;
    this.animPositionY += (this.pieceY - this.animPositionY) * 0.3;
    // move animRotation closer to zero
    this.animRotation -= this.animRotation * 0.3;
    this.update();
  }

  private nextPiece() {
    if(this.game.state !== Game.states.STARTED) {
      return;
    }
    this.pieceX = this.game.boardSizeX / 2 - 2;
    this.pieceY = 0;
    this.animPositionX = this.pieceX;
    this.animPositionY = this.pieceY;
    this.curRotation = 0;
    this.curPiece = this.generator();
    if(this.kick()) {
      this.game.gameOver();
    }
  }

  private fixPiece() {
    const tetk = this._tetrominos[ this.curPiece ][ this.curRotation ];
    for(const [ i, tetki ] of tetk.entries()) {
      for(const [ j, tetkij ] of tetki.entries()) {
        const pxi = this.pieceX + j;
        const pyj = this.pieceY + i;
        if(tetkij === 0) {
          continue;
        }
        this.game.board[ pyj * this.game.boardSizeX + pxi ] = this.color;
      }
    }
    this.game.onFixPiece(this);
    this.nextPiece();
  }

  private isPieceInside() {
    const tetk = this._tetrominos[ this.curPiece ][ this.curRotation ];
    for(let j = 0; j < tetk.length; j++) {
      const tetkj = tetk[ j ];
      for(let i = 0; i < tetkj.length; i++) {
        const tetkji = tetkj[ i ];
        const pxi = this.pieceX + i;
        const pyj = this.pieceY + j;
        if(tetkji && (pxi < 0 || pyj < 0 || pxi > (this.game.boardSizeX - 1) || pyj > (this.game.boardSizeY - 1))) {
          return 1;
        }
        if(tetkji && this.game.board[ pyj * this.game.boardSizeX + pxi ]) {
          return 2;
        }
      }
    }
    return 0;
  }

  // rotation nudge. Attempts to shift piece into a space that fits nearby, if necessary.
  // if such a position is found, it will be moved there.
  private kick() {
    // modify this array to change the order in which shifts are tested. To favor burying pieces into gaps below,
    // place negative y offset entries closer to the front.
    const oldpos = [ this.pieceX, this.pieceY ]; // for simplicity I reuse methods that actually modify piece position.
    for(const shiftOrder of this.shiftOrders) {

      this.pieceX = oldpos[ 0 ];
      this.pieceY = oldpos[ 1 ]; // restore position
      if(this.shiftRight) {
        this.pieceX -= shiftOrder[ 0 ];
      } else {
        this.pieceX += shiftOrder[ 0 ];
      }
      this.pieceY += shiftOrder[ 1 ];
      if(!this.isPieceInside()) {
        return 0;
      }
    }
    this.pieceX = oldpos[ 0 ];
    this.pieceY = oldpos[ 1 ]; // restore position
    return 1; // return failure
  }

  private setupRepeat(control: string) {
    if(this.repeatIntervals[ control ] === 0) {
      this.repeatIntervals[ control ] = window.setTimeout(() => {
        this.moves[ control ]();
        this.repeatIntervals[ control ] = window.setInterval(this.moves[ control ], this.repeatRate);
        this.repeatInitPassed[ control ] = 1;
      }, this.repeatRateInitial);
    }
  }

  private stopRepeat(control: string) {
    if(this.repeatIntervals[ control ] !== 0) {
      if(this.repeatInitPassed[ control ]) {
        clearInterval(this.repeatIntervals[ control ]);
      } else {
        clearTimeout(this.repeatIntervals[ control ]);
      }
      this.repeatIntervals[ control ] = 0;
    }
  }

  private keyDownFunc(e: KeyboardEvent) {
    let keynum;
    if(!(e.which)) {
      keynum = e.keyCode;
    } else if(e.which) {
      keynum = e.which;
    }

    this.keyDownFactory(keynum as number);
  }

  private keyDownFactory(key: number) {
    for(const [ control, buttonKey ] of Object.entries(this.controls)) {
      if(key === buttonKey && !this.buttonStates[ control ]) {
        this.moves[ control ]();
        this.stopRepeat(control); // this is insurance
        this.setupRepeat(control);
        this.buttonStates[ control ] = 1;
      }
    }

    this.update();
  }

  private keyUpFunc(e: KeyboardEvent) {
    let keynum;
    if(!(e.which)) {
      keynum = e.keyCode;
    } else if(e.which) {
      keynum = e.which;
    }

    this.keyUpFactory(keynum as number);
  }

  private keyUpFactory(key: number) {
    for(const [ control, buttonKey ] of Object.entries(this.controls)) {
      if(key === buttonKey) {
        this.buttonStates[ control ] = 0;
        this.stopRepeat(control);
      }
    }
  }

  private drawPiece(context: CanvasRenderingContext2D) {
    // drawing using geometry of current rotation
    const tetk = this._tetrominos[ this.curPiece ][ this.curRotation ];
    // translating (canvas origin) to the center,
    // rotating there, then drawing the boxes
    context.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
    context.save();
    context.fillStyle = this.color;

    let centerX = (this.tet_center_rot[ this.curPiece ][ 0 ] as number) * (this.game.tileSizeX + this.game.tileGapSize) + this.game.tileSizeX / 2;
    let centerY = (this.tet_center_rot[ this.curPiece ][ 1 ] as number) * (this.game.tileSizeY + this.game.tileGapSize) + this.game.tileSizeY / 2;
    if(this.tet_center_rot[ this.curPiece ][ 2 ] === true) {
      centerX += this.game.tileSizeX / 2 + this.game.tileGapSize;
      centerY += this.game.tileSizeY / 2 + this.game.tileGapSize;
    }

    context.translate(this.game.boardOffsetX + this.animPositionX * (this.game.tileSizeX + this.game.tileGapSize) + centerX + this.game.tileGapSize, this.game.boardOffsetY + this.animPositionY * (this.game.tileSizeY + this.game.tileGapSize) + centerY);
    context.rotate(this.animRotation);
    context.translate(-centerX, -centerY);

    // now in rotated coordinates, zeroed at piece origin
    for(const [ i, tetkj ] of tetk.entries()) {
      for(const [ j, tetkji ] of tetkj.entries()) {
        if(tetkji === 0) {
          continue;
        }
        context.fillRect(j * (this.game.tileSizeX + this.game.tileGapSize), i * (this.game.tileSizeY + this.game.tileGapSize), this.game.tileSizeX, this.game.tileSizeY);
      }
    }
    context.restore();
  }

  private drawShadow(context: CanvasRenderingContext2D) {
    let curY = 0;
    let count = 0;
    const origY = this.pieceY;
    while(!this.isPieceInside()) {
      curY = this.pieceY;
      this.pieceY++;
      count++;
    }
    this.pieceY = origY;
    this.shadowY = curY;
    if(!count) {
      return;
    }
    this.drawShadowPieceAt(context, this.pieceX, curY);
  }

  private drawShadowPieceAt(context: CanvasRenderingContext2D, gridX: number, gridY: number) {
    const tetk = this._tetrominos[ this.curPiece ][ this.curRotation ];
    context.clearRect(0, 0, this.game.boardOffsetX * 2 + this.game.tileSizeX * this.game.boardSizeX + this.game.tileGapSize * (this.game.boardSizeX - 1), this.game.boardOffsetY * 2 + this.game.tileSizeY * this.game.boardSizeY + this.game.tileGapSize * (this.game.boardSizeY - 1));
    context.save();
    context.fillStyle = '#777';
    context.translate(this.game.boardOffsetX + gridX * (this.game.tileSizeX + this.game.tileGapSize) + this.game.tileGapSize, this.game.boardOffsetY + gridY * (this.game.tileSizeY + this.game.tileGapSize));
    for(let j = 0; j < tetk.length; j++) {
      const tetkj = tetk[ j ];
      for(let i = 0; i < tetkj.length; i++) {
        const tetkji = tetkj[ i ];
        if(tetkji) {
          context.fillRect(i * (this.game.tileSizeX + this.game.tileGapSize), j * (this.game.tileSizeY + this.game.tileGapSize), this.game.tileSizeX, this.game.tileSizeY);
        }
      }
    }
    context.restore();
  }

  private clearLockTimer() {
    if(this.lockTimer !== 0) {
      clearTimeout(this.lockTimer);
      this.lockTimer = 0;
    }
  }
}
