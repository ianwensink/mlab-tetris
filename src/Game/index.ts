/* tslint:disable-next-line:no-var-requires */
const styles: any = require('./Game.css');

/**
 * Credits to http://htmltetris.com/
 */

export default class Game {
  private board: number[] = [];
  private sizeX: number;
  private sizeY: number;
  private xoff: number = 8;
  private yoff: number = 8;
  private xsize: number = 15;
  private ysize: number = 15;
  private gapsize: number = 2;
  private bordersize: number = 2;
  private score: number = 0;
  private colors: string[] = [ '#999', '#F00', '#0F0', '#22F', '#F0F', '#FF0', '#F70', '#0EE' ]; // None, Z, S, J, T, O, L, I
  private positionFromLeft: number = 10;
  private autoMoveDownInterval: number;
  private animationUpdateInterval: number;

  private animPositionX: number = 3;
  private animPositionY: number = 0;
  private animRotation: number = 0;
  private drawIndicators: boolean = false;

  // coordinate systems follow convention starting at top-left. order is that of clockwise rotation. row-major layout.
  // currently using SRS rotation; I am not satisfied with the S, Z, I having 4 states when they only need two, but I would need to have them rotate on an axis that changes location depending on orientation and cw vs ccw rotation.
  // TODO: Implement this :) --- hopefully without enumerating all possible cases
  private tetromino_Z: number[][][] = [ [ [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 0, 1 ], [ 0, 1, 1 ], [ 0, 1 ] ], [ [], [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 1 ], [ 1, 1 ], [ 1 ] ] ];
  private tetromino_S: number[][][] = [ [ [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 0, 2 ], [ 0, 2, 2 ], [ 0, 0, 2 ] ], [ [], [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 2 ], [ 2, 2 ], [ 0, 2 ] ] ];
  private tetromino_J: number[][][] = [ [ [ 3 ], [ 3, 3, 3 ] ], [ [ 0, 3, 3 ], [ 0, 3 ], [ 0, 3 ] ], [ [], [ 3, 3, 3 ], [ 0, 0, 3 ] ], [ [ 0, 3 ], [ 0, 3 ], [ 3, 3 ] ] ];
  private tetromino_T: number[][][] = [ [ [ 0, 4 ], [ 4, 4, 4 ] ], [ [ 0, 4 ], [ 0, 4, 4 ], [ 0, 4 ] ], [ [], [ 4, 4, 4 ], [ 0, 4 ] ], [ [ 0, 4 ], [ 4, 4 ], [ 0, 4 ] ] ];
  private tetromino_O: number[][][] = [ [ [ 5, 5 ], [ 5, 5 ] ] ];
  private tetromino_L: number[][][] = [ [ [ 0, 0, 6 ], [ 6, 6, 6 ] ], [ [ 0, 6 ], [ 0, 6 ], [ 0, 6, 6 ] ], [ [], [ 6, 6, 6 ], [ 6 ] ], [ [ 6, 6 ], [ 0, 6 ], [ 0, 6 ] ] ];
  private tetromino_I: number[][][] = [ [ [], [ 7, 7, 7, 7 ] ], [ [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ] ], [ [], [], [ 7, 7, 7, 7 ] ], [ [ 0, 7 ], [ 0, 7 ], [ 0, 7 ], [ 0, 7 ] ] ];
  // tetromino geometry data
  private tetrominos: number[][][][] = [ this.tetromino_Z, this.tetromino_S, this.tetromino_J, this.tetromino_T, this.tetromino_O, this.tetromino_L, this.tetromino_I ];
  // this is for the rotation animation -- must know where in local grid did the piece rotate around each coordinate is a triple, the first two are x,y, and the last is to indicate whether the point is in the center of the block or in the corner to the bottom right between blocks. These are the points which may be rotated around to retain block alignment, if that makes any sense.
  private tet_center_rot: Array<Array<number | boolean>> = [ [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 0, 0, false ], [ 1, 1, true ], [ 1, 1, false ] ];

  private pieceX: number = 3;
  private pieceY: number = 0;
  private curPiece: number = 0;
  private curRotation: number = 0;
  private shadowY: number = 0;

  private lockTimer: number;

  private freezeInteraction: boolean = false;
  private hardDropTimeout: number;

  private bc: HTMLCanvasElement;
  private ac: HTMLCanvasElement;
  private sc: HTMLCanvasElement;
  private scoreEl: HTMLElement;
  private bcc: CanvasRenderingContext2D;

  // left, right
  private shiftorders: number[][] = [
    [ 0, 0 ], // initial
    [ -1, 0 ], [ -1, 1 ], [ -1, -1 ], [ 0, -1 ], // col 1 block left; directly above
    [ -1, 2 ], [ -1, -2 ], // col 1 block left, two away vertically
    [ -2, 0 ], [ -2, 1 ], [ -2, -1 ], [ -2, 2 ], [ -2, -2 ], // col 2 blocks left
    [ 0, -2 ], // directly above, two spaces

    // [0,2], // directly below, two spaces (can cause tunnelling perhaps? one space below certainly is not needed)
    // [-3,0],[-3,1],[-3,-1],[-3,2],[-3,-2], // col 3 blocks left -- this may be getting cheap
    [ 1, 0 ], [ 1, 1 ], [ 1, -1 ], [ 2, 0 ], [ 2, 1 ], [ 2, -1 ], [ 1, 2 ], [ 1, -2 ], // move left for wall kicking
  ];
  private shiftright: number = 0; // 0 = left, 1 = right
  private repeatRateInitial: number = 200;
  private repeatRate: number = 100;
  private repeatIntervals: number[] = [ 0, 0, 0, 0 ];
  private repeatInitPassed: boolean[] = [ false, false, false, false ];
  private buttonList: number[][] = [ [ 37, 74 ], [], [ 39, 76 ], [ 40, 75 ], [ 38, 73, 88, 82 ], [ 90, 84 ], [ 68, 32 ], [], [ 67 ], [ 77 ], [ 78 ] ];
  private buttonStates: number[] = new Array(this.buttonList.length);

  private moves: Array<() => void> = [
    // left
    () => {
      if(this.freezeInteraction) {
        return;
      }
      this.pieceX -= 1;
      if(this.isPieceInside()) {
        this.pieceX += 1;
      }
      this.shiftright = 0;
      this.updateShadow();
      this.clearLockTimer();
    },
    // up direction movement is a cheat in standard tetris
    () => {
      if(this.freezeInteraction) {
        return;
      }
      this.pieceY -= 1;
      if(this.isPieceInside()) {
        this.pieceY += 1;
      }
      this.clearLockTimer();
    },
    // right
    () => {
      if(this.freezeInteraction) {
        return;
      }
      this.pieceX += 1;
      if(this.isPieceInside()) {
        this.pieceX -= 1;
      }
      this.shiftright = 1;
      this.updateShadow();
      this.clearLockTimer();
    },
    // down key calls this -- moves stuff down, if at bottom, locks it
    () => {
      if(this.freezeInteraction) {
        return;
      }
      this.pieceY += 1;
      if(this.isPieceInside()) {
        this.pieceY -= 1;
        this.fixPiece();
      }
      this.clearLockTimer();
    },
    // rotate clockwise
    () => {
      if(this.freezeInteraction) {
        return;
      }
      const oldrot = this.curRotation;
      this.curRotation = (this.curRotation + 1) % (this.tetrominos[ this.curPiece ].length);
      if(this.kick()) {
        this.curRotation = oldrot;
      } else {
        this.animRotation = -Math.PI / 2.0;
      }
      this.updateShadow();
      this.clearLockTimer();
    },
    // rotate ccw
    () => {
      if(this.freezeInteraction) {
        return;
      }
      const oldrot = this.curRotation;
      const len = this.tetrominos[ this.curPiece ].length;
      this.curRotation = (this.curRotation - 1 + len) % len;
      if(this.kick()) {
        this.curRotation = oldrot;
      } else {
        this.animRotation = Math.PI / 2.0;
      }
      this.updateShadow();
      this.clearLockTimer();
    },
    // hard drop
    () => {
      if(this.freezeInteraction) {
        return;
      }
      let curY = 0;
      let traversed = 0;
      while(!this.isPieceInside()) {
        curY = this.pieceY;
        this.pieceY++;
        traversed++;
      }
      this.pieceY = curY;
      this.dropPiece();
      this.applyScore(traversed);
      this.clearLockTimer();
    },
    // timer based down
    () => {
      if(this.freezeInteraction) {
        return;
      }
      this.pieceY += 1;
      if(this.isPieceInside()) {
        this.pieceY -= 1;
        if(!this.lockTimer) {
          this.lockTimer = window.setTimeout(() => {
            this.moves[ 3 ]();
          }, 600);
        }
      }
    },
    () => {
      this.drawIndicators = !this.drawIndicators;
    },
  ];

  private get size(): number {
    return this.sizeX * this.sizeY;
  }

  constructor(sizeX: number = 10, sizeY: number = 24) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.startGame();
  }

  private startGame() {
    console.info('Start game');
    this.bc = document.getElementById('board_canvas') as HTMLCanvasElement;
    this.bcc = this.bc.getContext('2d') as CanvasRenderingContext2D;
    this.ac = document.getElementById('animated_canvas') as HTMLCanvasElement;
    this.sc = document.getElementById('shadow_canvas') as HTMLCanvasElement;
    this.scoreEl = document.getElementById('score') as HTMLElement;

    for(let i = 0; i < this.size; i++) {
      this.board[ i ] = 0;
    }

    for(let i = 0; i < this.buttonList.length; i++) {
      this.buttonStates[ i ] = 0;
    }

    document.onkeydown = (e) => this.keydownfunc(e);
    document.onkeyup = (e) => this.keyupfunc(e);

    clearInterval(this.autoMoveDownInterval);
    clearInterval(this.animationUpdateInterval);

    this.autoMoveDownInterval = window.setInterval(() => this.moveDownIntervalFunc(), 300);
    this.animationUpdateInterval = window.setInterval(() => this.animationUpdateIntervalFunc(), 16);
    this.nextPiece();
    this.applyScore(0); // to init

    this.updateSizing();
  }

  private generator: () => number = () => Math.floor(Math.random() * this.tetrominos.length);

  private drawBox(position: number, value: number, context: CanvasRenderingContext2D) {
    const posX = position % this.sizeX;
    const posY = (position - posX) / this.sizeX;

    context.fillStyle = this.colors[ value ];
    context.fillRect(this.xoff + posX * (this.xsize + this.gapsize), this.yoff + posY * (this.ysize + this.gapsize), this.xsize, this.ysize);
  }

  private drawBoard() {
    this.bcc.fillStyle = '#000';
    this.bcc.fillRect(0, 0, this.xoff * 2 + this.xsize * this.sizeX + this.gapsize * (this.sizeX - 1), this.yoff * 2 + this.ysize * this.sizeY + this.gapsize * (this.sizeY - 1));
    this.bcc.clearRect(this.xoff - this.bordersize, this.yoff - this.bordersize, (this.xsize + this.gapsize) * this.sizeX - this.gapsize + this.bordersize * 2, (this.ysize + this.gapsize) * this.sizeY - this.gapsize + this.bordersize * 2);
    this.bcc.strokeRect(this.xoff - 0.5, this.yoff - 0.5, (this.xsize + this.gapsize) * this.sizeX - this.gapsize + 1, (this.ysize + this.gapsize) * this.sizeY - this.gapsize + 1);
    this.bcc.fillStyle = '#888';
    this.bcc.fillRect(this.xoff, this.yoff, (this.xsize + this.gapsize) * this.sizeX - this.gapsize, (this.ysize + this.gapsize) * this.sizeY - this.gapsize);
    for(const [ i, boardItem ] of this.board.entries()) {
      this.drawBox(i, boardItem, this.bcc);
    }
  }

  private updateSizing() {
    this.xsize = this.ysize = Math.floor((window.innerHeight - 25 - this.yoff * 2 - this.sizeY * this.gapsize) / this.sizeY);
    this.bc.width = this.ac.width = this.sc.width = (this.xoff * 2 + this.xsize * this.sizeX + this.gapsize * (this.sizeX - 1));
    this.bc.height = this.ac.height = this.sc.height = (this.yoff * 2 + this.ysize * this.sizeY + this.gapsize * (this.sizeY - 1));

    this.bc.style.left = this.ac.style.left = this.sc.style.left = `${this.positionFromLeft}px`;

    const scoreElParent: HTMLElement = this.scoreEl.parentElement as HTMLElement;
    if(!scoreElParent) {
      return;
    }
    scoreElParent.style.left = `${this.positionFromLeft + this.bc.width + this.sizeX}px`;

    this.drawBoard();
    this.updatePiece();
    this.updateShadow();
  }

  private clearRowCheck(startrow: number, numrowsdown: number) {
    let numRowsCleared = 0;
    for(let i = 0; i < numrowsdown; i++) {
      let full = true;
      for(let j = 0; j < this.sizeX; j++) {
        if(!this.board[ (startrow + i) * this.sizeX + j ]) {
          full = false;
        }
      }
      if(full) {
        numRowsCleared++;
        this.shiftDown(startrow + i);
        this.drawBoard();
      }
    }
    switch(numRowsCleared) {
      case 3:
        this.applyScore(400);
        break;
      case 4:
        this.applyScore(1000);
        break;
      default:
        this.applyScore(numRowsCleared * 100);
    }
  }

  // row is full
  private shiftDown(row: number) {
    for(let i = row * this.sizeX - 1; i >= 0; i--) {
      this.board[ i + this.sizeX ] = this.board[ i ];
    }
    for(let i = 0; i < this.sizeX; i++) {
      this.board[ i ] = 0;
    }
  }

  private moveDownIntervalFunc() {
    this.moves[ 7 ]();
    this.updatePiece();
  }

  private animationUpdateIntervalFunc() {
    // move animPositions closer to their targets (piece positions)
    this.animPositionX += (this.pieceX - this.animPositionX) * 0.3;
    this.animPositionY += (this.pieceY - this.animPositionY) * 0.3;
    // move animRotation closer to zero
    this.animRotation -= this.animRotation * 0.3;
    this.updatePiece();
  }

  private gameWin() {
    // console.info('You Win!');
  }

  private gameOver() {
    console.info('Game Over');
  }

  private nextPiece() {
    this.pieceX = 3;
    this.pieceY = 0;
    this.animPositionX = this.pieceX;
    this.animPositionY = this.pieceY;
    this.curRotation = 0;
    this.curPiece = this.generator();
    // // if(this.kick()) {
    // //   this.gameOver();
    // // }
    this.updateShadow();
  }

  private fixPiece() {
    const tetk = this.tetrominos[ this.curPiece ][ this.curRotation ];
    for(const [ i, tetki ] of tetk.entries()) {
      for(const [ j, tetkij ] of tetki.entries()) {
        const pxi = this.pieceX + j;
        const pyj = this.pieceY + i;
        if(tetkij === 0) {
          continue;
        }
        this.board[ pyj * this.sizeX + pxi ] = tetkij;
      }
    }
    this.drawBoard();
    // will hardcode this behaviour for now
    this.clearRowCheck(this.pieceY, this.tetrominos[ this.curPiece ][ this.curRotation ].length);
    this.nextPiece();
  }

  private isPieceInside() {
    const tetk = this.tetrominos[ this.curPiece ][ this.curRotation ];
    for(let j = 0; j < tetk.length; j++) {
      const tetkj = tetk[ j ];
      for(let i = 0; i < tetkj.length; i++) {
        const tetkji = tetkj[ i ];
        const pxi = this.pieceX + i;
        const pyj = this.pieceY + j;
        if(tetkji && (pxi < 0 || pyj < 0 || pxi > (this.sizeX - 1) || pyj > (this.sizeY - 1))) {
          return 1;
        }
        if(tetkji && this.board[ pyj * this.sizeX + pxi ]) {
          return 2;
        }
      }
    }
    return 0;
  }

  private clearLockTimer() {
    if(this.lockTimer !== 0) {
      clearTimeout(this.lockTimer);
      this.lockTimer = 0;
    }
  }

  // sets up hard drop animation
  private dropPiece() {
    if(this.hardDropTimeout) {
      return;
    }
    this.freezeInteraction = true;
    this.hardDropTimeout = window.setTimeout(() => {
      this.freezeInteraction = false;
      this.fixPiece();
      this.clearLockTimer();
      this.hardDropTimeout = 0;
    }, 100);
  }

  // rotation nudge. Attempts to shift piece into a space that fits nearby, if necessary.
  // if such a position is found, it will be moved there.
  private kick() {
    // modify this array to change the order in which shifts are tested. To favor burying pieces into gaps below,
    // place negative y offset entries closer to the front.
    const oldpos = [ this.pieceX, this.pieceY ]; // for simplicity I reuse methods that actually modify piece position.
    for(const shiftOrder of this.shiftorders) {

      this.pieceX = oldpos[ 0 ];
      this.pieceY = oldpos[ 1 ]; // restore position
      if(this.shiftright) {
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

  private updatePiece() {
    const ctx = this.ac.getContext('2d') as CanvasRenderingContext2D;
    this.drawPiece(ctx);
  }

  // Does not need to be called every frame like updatePiece is.
  // will be called from left and right moves, also
  private updateShadow() {
    const ctx = this.sc.getContext('2d') as CanvasRenderingContext2D;
    this.drawShadow(ctx);
  }

  private setupRepeat(i: number) {
    if(i < 4) {
      if(this.repeatIntervals[ i ] === 0) {
        this.repeatIntervals[ i ] = window.setTimeout(
          () => {
            this.moves[ i ]();
            this.repeatIntervals[ i ] = window.setInterval(this.moves[ i ], this.repeatRate);
            this.repeatInitPassed[ i ] = true;
          }, this.repeatRateInitial);
      }
    }
  }

  private stopRepeat(i: number) {
    if(i < 4 && this.repeatIntervals[ i ] !== 0) {
      if(this.repeatInitPassed[ i ]) {
        clearInterval(this.repeatIntervals[ i ]);
      } else {
        clearTimeout(this.repeatIntervals[ i ]);
      }
      this.repeatIntervals[ i ] = 0;
    }
  }

  private keydownfunc(e: KeyboardEvent) {
    let keynum;
    if(!(e.which)) {
      keynum = e.keyCode;
    } else if(e.which) {
      keynum = e.which;
    }

    for(const [ i, button ] of this.buttonList.entries()) {
      for(const buttonKey of button) {
        if(keynum === buttonKey && !this.buttonStates[ i ]) {
          this.moves[ i ]();
          this.stopRepeat(i); // this is insurance
          this.setupRepeat(i);
          this.buttonStates[ i ] = 1;
        }
      }
    }

    this.updatePiece();
  }

  private keyupfunc(e: KeyboardEvent) {
    let keynum;
    if(!(e.which)) {
      keynum = e.keyCode;
    } else if(e.which) {
      keynum = e.which;
    }

    for(const [ i, button ] of this.buttonList.entries()) {
      for(const buttonKey of button) {
        if(keynum === buttonKey) {
          this.buttonStates[ i ] = 0;
          this.stopRepeat(i);
        }
      }
    }
  }

  private drawPiece(context: CanvasRenderingContext2D) {
    // drawing using geometry of current rotation
    const tetk = this.tetrominos[ this.curPiece ][ this.curRotation ];
    // translating (canvas origin) to the center,
    // rotating there, then drawing the boxes
    context.clearRect(0, 0, this.xoff * 2 + this.xsize * this.sizeX + this.gapsize * (this.sizeX - 1), this.yoff * 2 + this.ysize * this.sizeY + this.gapsize * (this.sizeY - 1));
    context.save();
    context.fillStyle = this.colors[ this.curPiece + 1 ];

    let centerX = (this.tet_center_rot[ this.curPiece ][ 0 ] as number) * (this.xsize + this.gapsize) + this.xsize / 2;
    let centerY = (this.tet_center_rot[ this.curPiece ][ 1 ] as number) * (this.ysize + this.gapsize) + this.ysize / 2;
    if(this.tet_center_rot[ this.curPiece ][ 2 ] === true) {
      centerX += this.xsize / 2 + this.gapsize;
      centerY += this.ysize / 2 + this.gapsize;
    }

    context.translate(this.xoff + this.animPositionX * (this.xsize + this.gapsize) + centerX, this.yoff + this.animPositionY * (this.ysize + this.gapsize) + centerY);
    context.rotate(this.animRotation);
    context.translate(-centerX, -centerY);

    // now in rotated coordinates, zeroed at piece origin
    for(const [ i, tetkj ] of tetk.entries()) {
      for(const [ j, tetkji ] of tetkj.entries()) {
        if(tetkji === 0) {
          continue;
        }
        context.fillRect(j * (this.xsize + this.gapsize), i * (this.ysize + this.gapsize), this.xsize, this.ysize);
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
    const tetk = this.tetrominos[ this.curPiece ][ this.curRotation ];
    context.clearRect(0, 0, this.xoff * 2 + this.xsize * this.sizeX + this.gapsize * (this.sizeX - 1), this.yoff * 2 + this.ysize * this.sizeY + this.gapsize * (this.sizeY - 1));
    context.save();
    context.fillStyle = '#777';
    context.translate(this.xoff + gridX * (this.xsize + this.gapsize), this.yoff + gridY * (this.ysize + this.gapsize));
    for(let j = 0; j < tetk.length; j++) {
      const tetkj = tetk[ j ];
      for(let i = 0; i < tetkj.length; i++) {
        const tetkji = tetkj[ i ];
        if(tetkji) {
          context.fillRect(i * (this.xsize + this.gapsize), j * (this.ysize + this.gapsize), this.xsize, this.ysize);
        }
      }
    }
    context.restore();
  }

  private applyScore(amount: number) {
    this.score += amount;
    if(this.score <= 0) { // reached zero
      this.gameWin();
      this.score = 0;
    }
    this.scoreEl.innerHTML = `${this.score}`;
  }
}
