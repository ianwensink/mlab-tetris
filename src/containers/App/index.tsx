/* tslint:disable:no-let-requires */
import Tile from '../Tile/index';

const styles: any = require('./App.css');
/* tslint:enable:no-let-requires */

export default class App {
  private board: Tile[] = [];
  private size: number;
  private xoff: number = 8;
  private yoff: number = 8;
  private xsize: number = 15;
  private ysize: number = 15;
  private gapsize: number = 2;
  private bordersize: number = 2;
  private colors: string[] = [ '#999', '#F00', '#0F0', '#22F', '#F0F', '#FF0', '#F70', '#0EE' ];
  private positionFromLeft: number = 10;

  constructor(size: number = 240) {
    this.size = size;

    let i = 0;
    for(i = 0; i < size; i++) {
      this.board[ i ] = 0;
    }

    window.onselectstart = function(e) {
      return false;
    }
    // no IE
    window.onresize = function() {
      win_onresize();
    };
  }

  private drawBox(position, value, context) {
    let i = position % 10;
    let j = (position - i) / 10;
    drawBox2(i, j, value, context);
  }

  private drawBox2(posX, posY, value, context) {
    context.fillStyle = colors[ value ];
    context.fillRect(xoff + posX * (xsize + gapsize), yoff + posY * (ysize + gapsize), xsize, ysize);
  }

  private drawSingleBlock(x, y, context) {
    context.fillRect(x, y, xsize, ysize);
  }

  private drawBoard(boardArr, context) {
    let i;
    context.fillStyle = '#000';
    context.fillRect(0, 0, xoff * 2 + xsize * 10 + gapsize * 9, yoff * 2 + ysize * 24 + gapsize * 23);
    context.clearRect(xoff - bordersize, yoff - bordersize, (xsize + gapsize) * 10 - gapsize + bordersize * 2, (ysize + gapsize) * 24 - gapsize + bordersize * 2);
    context.strokeRect(xoff - .5, yoff - .5, (xsize + gapsize) * 10 - gapsize + 1, (ysize + gapsize) * 24 - gapsize + 1);
    context.fillStyle = '#888';
    context.fillRect(xoff, yoff, (xsize + gapsize) * 10 - gapsize, (ysize + gapsize) * 24 - gapsize);
    for(i = 0; i < 240; i++) {
      drawBox(i, board[ i ], context);
    }
  }

  private updateSizing() {
    xsize = ysize = Math.floor((window.innerHeight - 25 - yoff * 2 - 24 * gapsize) / 24.0);
    let bc = document.getElementById('board_canvas');
    let ac = document.getElementById('animated_canvas');
    let sc = document.getElementById('shadow_canvas');
    let score_el = document.getElementById('score').parentNode;
    bc.width = ac.width = sc.width = (xoff * 2 + xsize * 10 + gapsize * 9);
    bc.height = ac.height = sc.height = (yoff * 2 + ysize * 24 + gapsize * 23);

    document.getElementById('instructions').style.marginLeft = `${bc.width || 0}px`;

    bc.style.left = ac.style.left = sc.style.left = `${this.positionFromLeft}px`;

    score_el.style.left = `${this.positionFromLeft + bc.width + 10}px`;

    document.getElementById('instructions').style.top = `${score_el.clientHeight}px`;

    let ctx1 = document.getElementById('board_canvas').getContext('2d');
    this.drawBoard(this.board, ctx1);
    this.updatePiece();
    this.updateShadow();
  }

  private clearRowCheck(startrow, numrowsdown) {
    let i;
    let numRowsCleared = 0;
    for(i = 0; i < numrowsdown; i++) {
      let j;
      let full = true;
      for(j = 0; j < 10; j++) {
        if(!board[ (startrow + i) * 10 + j ]) full = false;
      }
      if(full) {
        numRowsCleared++;
        shiftDown(startrow + i);
        let ctx1 = document.getElementById('board_canvas').getContext('2d');
        drawBoard(board, ctx1);
      }
    }
    if(numRowsCleared == 1) {
      applyScore(100);
    }
    else if(numRowsCleared == 2) {
      applyScore(200);
    }
    else if(numRowsCleared == 3) {
      applyScore(400);
    }
    else if(numRowsCleared == 4) {
      applyScore(1000);
    }
  }

  // row is full
  private shiftDown(row) {
    let i;
    for(i = row * 10 - 1; i >= 0; i--) {
      board[ i + 10 ] = board[ i ];
    }
    for(i = 0; i < 10; i++) {
      board[ i ] = 0;
    }
  }

  let
  autoMoveDownInterval = '';
  let
  animationUpdateInterval = '';
  let
  mouseControlInterval = '';

  private moveDownIntervalFunc() {
    moves[ 7 ]();
    updatePiece();
  }

  private animationUpdateIntervalFunc() {
    // move animPositions closer to their targets (piece positions)
    animPositionX += (pieceX - animPositionX) * .3;
    animPositionY += (pieceY - animPositionY) * .3;
    // move animRotation closer to zero
    animRotation -= animRotation * 0.3;
    updatePiece();
  }

  let
  isMouseControl = false;
  let
  mouseControlX = 0; // use this to draw helper arrow
  private toggleMouseControl() {
    if(isMouseControl) {
      mouseControlFunc = function() {
      };
      document.oncontextmenu = null;
    }
    else {
      mouseControlFunc = function() {
        mouseControlX = (posx / window.innerWidth) * 11.5 - 2.5;
        if(pieceX > mouseControlX + .5) moves[ 0 ]();
        if(pieceX < mouseControlX - .5) moves[ 2 ]();

      };
      document.oncontextmenu = function() {
        return false;
      };
    }
    isMouseControl = !isMouseControl;
  }

  let
  control_accum = [ -1, -1 ];

  let
  xMoveThreshold = 30;
  let
  yMoveThreshold = 30;

  let
  hardDropYDistanceThreshold = 35; // 150 px seems reasonable
  let
  hardDropGestureTime = 300;
  let
  hardDropYAccAtPreviousTimes = []; // stores path

  private hardDropTest(x, y) {
    // only when user lifts control finger and the parameter thresholds are met
    // will the hard drop command be sent.
    if(hardDropYAccAtPreviousTimes.length > 2) {
      let now = new Date().getTime();
      if(now - lastFixTime > hardDropGestureTime) {
        for(let i = hardDropYAccAtPreviousTimes.length - 1; i >= 0; --i) {
          if((now - hardDropYAccAtPreviousTimes[ i ][ 1 ]) < hardDropGestureTime) {
            if((y - hardDropYAccAtPreviousTimes[ i ][ 0 ]) > hardDropYDistanceThreshold) {
              moves[ 6 ]();
              return;
            } //else { console.log("not enough dist "+(y - hardDropYAccAtPreviousTimes[i][0])); }
          } //else { console.log("too much time "+(now - hardDropYAccAtPreviousTimes[i][1])); }
        }
        //console.log("Not quite enough for hard drop: "+ flatten(hardDropYAccAtPreviousTimes)+" timediff = "+ (now-hardDropYAccAtPreviousTimes[0][1]) +" y = "+y);
      }
    }
    hardDropYAccAtPreviousTimes = [];
  }

// all of the control finger data has been handled for us in touchevent callbacks
// and this function is called only when necessary (control finger moved)
  private Control(newpos) {

    if(paused) return;

    let cl = control_location;
    let delta = [ newpos[ 0 ] - cl[ 0 ], newpos[ 1 ] - cl[ 1 ] ];
    control_accum = [ control_accum[ 0 ] + delta[ 0 ], control_accum[ 1 ] + delta[ 1 ] ];

    let thresh_sq = 50; // square of pixels travel which is to cancel tap.
    if(touchlist.length == 1 && control_accum[ 0 ] * control_accum[ 0 ] + control_accum[ 1 ] * control_accum[ 1 ] > thresh_sq) {
      lastTouchStartTime = 0; // cancel the tap "gesture"
    }
    // game control logic
    while(control_accum[ 0 ] > xMoveThreshold) {
      control_accum[ 0 ] -= xMoveThreshold;
      moves[ 2 ]();
      hardDropYAccAtPreviousTimes = [];
    }
    while(control_accum[ 0 ] < -xMoveThreshold) {
      control_accum[ 0 ] += xMoveThreshold;
      moves[ 0 ]();
      hardDropYAccAtPreviousTimes = [];
    }

    while(control_accum[ 1 ] > yMoveThreshold) {
      control_accum[ 1 ] -= yMoveThreshold;
      moves[ 3 ]();
    }

    hardDropYAccAtPreviousTimes.push([ newpos[ 1 ], new Date().getTime() ]);

    control_location[ 0 ] = newpos[ 0 ];
    control_location[ 1 ] = newpos[ 1 ];
  }

  let
  actually_draw_touches = false;

  private drawTouches() { // Not really drawing so much as managing and moving a list of DOM elems so they match touchlist -- it *functions* like drawing
    // This function serves to transparently create and manage the
    // touch visualization elements requiring only trivial processing
    // of events in a separate part of code

    if(!actually_draw_touches) return;

    let indicator_container = document.getElementById('indicatorcontainer');

    // removes any DOM indicator which is not (no longer) in touchlist
    for(let i = 0; i < indicator_container.childNodes.length; i++) {
      let found = false;
      for(let j = 0; j < touchlist.length; ++j) {
        if(touchlist[ j ].identifier == indicator_container.childNodes[ i ].innerHTML.replace(/^(.*)@.*$/, '$1')) {
          found = true;
        }
      }
      if(!found) {
        indicator_container.removeChild(indicator_container.childNodes[ i ]);
        i--;
        //console.log("removed finger child #"+(i+1));
      }
    }

    // updates the remaining DOM indicators with updated positioning
    for(let i = 0; i < touchlist.length; ++i) {
      // the touchlist caches the quickly updated data
      // TODO: store efficient touchlist
      let found = false;
      for(let j = 0; j < indicator_container.childNodes.length; j++) {
        let thisf = indicator_container.childNodes[ j ];
        //console.log(thisf.innerHTML.replace(/(.*)@.*/,'$1'))
        if(thisf.innerHTML.replace(/^(.*)@.*$/, '$1') == touchlist[ i ].identifier) {
          thisf.style.webkitTransform = 'translate(' + touchlist[ i ].clientX + 'px, ' + touchlist[ i ].clientY + 'px)';
          thisf.innerHTML = touchlist[ i ].identifier + '@ ' + touchlist[ i ].clientX + ', ' + touchlist[ i ].clientY;
          found = true;
          if(touchlist[ i ].identifier == control_finger_id) {
            thisf.setAttribute('class', 'finger-indicator control');
          }
        }

      }
      // creates new DOM indicators if there are new fingers
      if(!found) {
        let new_indicator = document.createElement('span');
        new_indicator.innerHTML = touchlist[ i ].identifier + '@ ' + touchlist[ i ].clientX + ', ' + touchlist[ i ].clientY;
        new_indicator.style.webkitTransform = 'translate(' + touchlist[ i ].clientX + 'px, ' + touchlist[ i ].clientY + 'px)';
        new_indicator.setAttribute('class', 'finger-indicator');
        if(touchlist[ i ].identifier == control_finger_id) {
          new_indicator.setAttribute('class', 'finger-indicator control');
        }
        indicator_container.appendChild(new_indicator);
        //console.log("adding finger child #"+(indicator_container.childNodes.length-1));
      }
    }

  }

  window
.
  onload = function() {
    win_onload();
  };

  private win_onload() {
    next();
    applyScore(0); // to init
    setPause(false);
    unPause();

    let animCtx = document.getElementById('animated_canvas').getContext('2d');
    set_textRenderContext(animCtx);
    if(check_textRenderContext(animCtx)) {

    } else {
      //alert("No text available");
    }

    // required to make the range actually settable
    document.getElementById('sens_range').ontouchmove = function(e) {
      e.stopPropagation();
    }
    updateSizing();
  }

// coordinate systems follow convention starting at top-left.
// order is that of clockwise rotation.
// row-major layout.
// currently using SRS rotation; I am not satisfied with
// the S, Z, I having 4 states when they only need two,
// but I would need to have them rotate on an axis that changes
// location depending on orientation and cw vs ccw rotation.
// todo: Implement this :) --- hopefully without enumerating
// all possible cases
  let
  tetromino_Z = [ [ [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 0, 1 ], [ 0, 1, 1 ], [ 0, 1 ] ], [ [], [ 1, 1 ], [ 0, 1, 1 ] ], [ [ 0, 1 ], [ 1, 1 ], [ 1 ] ] ];
  let
  tetromino_S = [ [ [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 0, 2 ], [ 0, 2, 2 ], [ 0, 0, 2 ] ], [ [], [ 0, 2, 2 ], [ 2, 2 ] ], [ [ 2 ], [ 2, 2 ], [ 0, 2 ] ] ];
  let
  tetromino_J = [ [ [ 3 ], [ 3, 3, 3 ] ], [ [ 0, 3, 3 ], [ 0, 3 ], [ 0, 3 ] ], [ [], [ 3, 3, 3 ], [ 0, 0, 3 ] ], [ [ 0, 3 ], [ 0, 3 ], [ 3, 3 ] ] ];
  let
  tetromino_T = [ [ [ 0, 4 ], [ 4, 4, 4 ] ], [ [ 0, 4 ], [ 0, 4, 4 ], [ 0, 4 ] ], [ [], [ 4, 4, 4 ], [ 0, 4 ] ], [ [ 0, 4 ], [ 4, 4 ], [ 0, 4 ] ] ];
  let
  tetromino_O = [ [ [ 5, 5 ], [ 5, 5 ] ] ];
  let
  tetromino_L = [ [ [ 0, 0, 6 ], [ 6, 6, 6 ] ], [ [ 0, 6 ], [ 0, 6 ], [ 0, 6, 6 ] ], [ [], [ 6, 6, 6 ], [ 6 ] ], [ [ 6, 6 ], [ 0, 6 ], [ 0, 6 ] ] ];
  let
  tetromino_I = [ [ [], [ 7, 7, 7, 7 ] ], [ [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ], [ 0, 0, 7 ] ], [ [], [], [ 7, 7, 7, 7 ] ], [ [ 0, 7 ], [ 0, 7 ], [ 0, 7 ], [ 0, 7 ] ] ];
// tetromino geometry data
  let
  tetrominos = [ tetromino_Z, tetromino_S, tetromino_J, tetromino_T, tetromino_O, tetromino_L, tetromino_I ];
// this is for the rotation animation -- must know where in local
// grid did the piece rotate around
// each coordinate is a triple, the first two are x,y, and
// the last is to indicate whether the point is in the center
// of the block or in the corner to the bottom right between
// blocks. These are the points which may be rotated around
// to retain block alignment, if that makes any sense.
  let
  tet_center_rot = [ [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 1, 1, true ], [ 0, 0, false ], [ 1, 1, true ], [ 1, 1, false ] ];

  let
  pieceX = 3;
  let
  pieceY = 0;
  let
  curPiece = 0;
  let
  curRotation = 0;

  private drawMessage(messageString, size) {
    let ctx = document.getElementById('animated_canvas').getContext('2d');
    let offset = xoff;
    let size = (xsize + gapsize * .9) * size;
    let yoffset = yoff + (xsize + gapsize) * 10;
    ctx.strokeStyle = '#FFF';
    ctx.strokeText(messageString, offset, yoffset, size, 160);
    ctx.strokeStyle = '#000';
    ctx.strokeText(messageString, offset, yoffset, size, 100);
  }

  private clearContext(ctx, width, height) {
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Restore the transform
    ctx.restore();
  }

  private gameWin() {
    let sc = document.getElementById('shadow_canvas');
    clearContext(sc.getContext('2d'), sc.width, sc.height);
    let ac = document.getElementById('animated_canvas');
    clearContext(ac.getContext('2d'), ac.width, ac.height);
    drawMessage('You Win!', 1.45);
    setPause(true);
  }

  private gameOver() {
    drawMessage('Game Over', 1.45);
    setPause(true);
    //Cleanup

  }

  let
  objPos = { x: 0, y: 0 };
  let
  lockTimer = '';
  let
  generator = random_perm_single(Math.floor((new Date()).getTime() / 1000));

  private next() {
    pieceX = 3;
    pieceY = 0;
    animPositionX = pieceX;
    animPositionY = pieceY;
    curRotation = 0;
    curPiece = generator();
    if(kick()) {
      gameOver();
    }
    updateShadow();
  }

  let
  lastFixTime = 0;

  private fixPiece() {
    lastFixTime = new Date().getTime();
    let i, j;
    let tetk = tetrominos[ curPiece ][ curRotation ];
    for(j = 0; j < tetk.length; j++) {
      let tetkj = tetk[ j ];
      for(i = 0; i < tetkj.length; i++) {
        let tetkji = tetkj[ i ];
        let pxi = pieceX + i;
        let pyj = pieceY + j;
        if(tetkji) {
          board[ pyj * 10 + pxi ] = tetkji;
        }
      }
    }
    drawBoard(board, document.getElementById('board_canvas').getContext('2d'));
    // will hardcode this behavior for now
    clearRowCheck(pieceY, tetrominos[ curPiece ][ curRotation ].length);
    next();
  }

  private isPieceInside() {
    let i, j;
    let tetk = tetrominos[ curPiece ][ curRotation ];
    for(j = 0; j < tetk.length; j++) {
      let tetkj = tetk[ j ];
      for(i = 0; i < tetkj.length; i++) {
        let tetkji = tetkj[ i ];
        let pxi = pieceX + i;
        let pyj = pieceY + j;
        if(tetkji && (pxi < 0 || pyj < 0 || pxi > 9 || pyj > 23)) {
          //document.getElementById('msg').innerHTML += "<br>pxi,pyj="+pxi+","+pyj+"i,j="+i+","+j+"tetkji="+tetkji;
          return 1;
        }
        if(tetkji && board[ pyj * 10 + pxi ]) {
          return 2;
        }
      }
    }
    return 0;
  }

  moves = [
    // left
    function() {
      if(freezeInteraction) return;
      pieceX -= 1;
      if(isPieceInside()) pieceX += 1;
      shiftright = 0;
      updateShadow();
      clearLockTimer();
    },
    // up direction movement is a cheat in standard tetris
    function() {
      if(freezeInteraction) return;
      pieceY -= 1;
      if(isPieceInside()) pieceY += 1;
      clearLockTimer();
    },
    // right
    function() {
      if(freezeInteraction) return;
      pieceX += 1;
      if(isPieceInside()) pieceX -= 1;
      shiftright = 1;
      updateShadow();
      clearLockTimer();
    },
    // down key calls this -- moves stuff down, if at bottom, locks it
    function() {
      if(freezeInteraction) return;
      pieceY += 1;
      if(isPieceInside()) {
        pieceY -= 1;
        fixPiece();
      }
      clearLockTimer();
    },
    // rotate clockwise
    function() {
      if(freezeInteraction) return;
      let oldrot = curRotation;
      curRotation = (curRotation + 1) % (tetrominos[ curPiece ].length);
      if(kick()) curRotation = oldrot;
      else animRotation = -Math.PI / 2.0;
      updateShadow();
      clearLockTimer();
    },
    // rotate ccw
    function() {
      if(freezeInteraction) return;
      let oldrot = curRotation;
      let len = tetrominos[ curPiece ].length;
      curRotation = (curRotation - 1 + len) % len;
      if(kick()) curRotation = oldrot;
      else animRotation = Math.PI / 2.0;
      updateShadow();
      clearLockTimer();
    },
    // hard drop
    function() {
      if(freezeInteraction) return;
      let curY;
      let traversed = 0;
      while(!isPieceInside()) {
        curY = pieceY;
        pieceY++;
        traversed++;
      }
      pieceY = curY;
      dropPiece();
      applyScore(traversed);
      clearLockTimer();
    },
    // timer based down
    function() {
      if(freezeInteraction) return;
      pieceY += 1;
      if(isPieceInside()) {
        pieceY -= 1;
        if(lockTimer == '') {
          lockTimer = setTimeout(function() {
            moves[ 3 ]();
          }, 600);
        }
      }
    },
    // hold feature
    function() {
      //alert("hold unimplemented.");
    },
    function() {
      toggleMouseControl();
    },
    function() {
      drawIndicators = !drawIndicators;
    }
  ];
  private clearLockTimer() {
    if(lockTimer != '') {
      clearTimeout(lockTimer);
      lockTimer = '';
    }
  }

  let
  freezeInteraction = false;
  let
  hardDropTimeout = '';
// sets up hard drop animation
  private dropPiece() {
    if(hardDropTimeout != '') return;
    freezeInteraction = true;
    hardDropTimeout = setTimeout(function() {
      freezeInteraction = false;
      fixPiece();
      clearLockTimer();
      hardDropTimeout = '';
    }, 100);
  }

// left, right
  let
  shiftorders = [
    [ 0, 0 ], // initial
    [ -1, 0 ], [ -1, 1 ], [ -1, -1 ], [ 0, -1 ], // col 1 block left; directly above
    [ -1, 2 ], [ -1, -2 ], // col 1 block left, two away vertically
    [ -2, 0 ], [ -2, 1 ], [ -2, -1 ], [ -2, 2 ], [ -2, -2 ], // col 2 blocks left
    [ 0, -2 ], // directly above, two spaces

//	[0,2], // directly below, two spaces (can cause tunnelling perhaps? one space below certainly is not needed)
//	[-3,0],[-3,1],[-3,-1],[-3,2],[-3,-2], // col 3 blocks left -- this may be getting cheap
    [ 1, 0 ], [ 1, 1 ], [ 1, -1 ], [ 2, 0 ], [ 2, 1 ], [ 2, -1 ], [ 1, 2 ], [ 1, -2 ] // move left for wall kicking
  ];
  let
  shiftright = 0; // 0 = left, 1 = right

// rotation nudge. Attempts to shift piece into a space that fits nearby, if necessary.
// if such a position is found, it will be moved there.
  private kick() {
    let i;
    // modify this array to change the order in which shifts are tested. To favor burying pieces into gaps below,
    // place negative y offset entries closer to the front.

    let oldpos = [ pieceX, pieceY ]; // for simplicity I reuse methods that actually modify piece position.
    for(i = 0; i < shiftorders.length; i++) {
      pieceX = oldpos[ 0 ];
      pieceY = oldpos[ 1 ]; // restore position
      if(shiftright) pieceX -= shiftorders[ i ][ 0 ];
      else pieceX += shiftorders[ i ][ 0 ];
      pieceY += shiftorders[ i ][ 1 ];
      if(!isPieceInside())
        return 0;
    }
    pieceX = oldpos[ 0 ];
    pieceY = oldpos[ 1 ]; // restore position
    return 1; // return failure
  }

  private updatePiece() {
    let ctx = document.getElementById('animated_canvas').getContext('2d');
    drawPiece(ctx);
  }

// Does not need to be called every frame like updatePiece is.
// will be called from left and right moves, also
  private updateShadow() {
    let ctx = document.getElementById('shadow_canvas').getContext('2d');
    drawShadow(ctx);
  }

  let
  repeatRateInitial = 200;
  let
  repeatRate = 100;
  let
  repeatIntervals = [ '', '', '', '' ];
  let
  repeatInitPassed = [ false, false, false, false ];

  private setupRepeat(i) {
    if(i < 4) {
      if(repeatIntervals[ i ] == '') {
        repeatIntervals[ i ] = setTimeout(
          function() {
            moves[ i ]();
            repeatIntervals[ i ] = setInterval(moves[ i ], repeatRate);
            repeatInitPassed[ i ] = true;
          }, repeatRateInitial
        );
      }
    }
  }

  private stopRepeat(i) {
    if(i < 4 && repeatIntervals[ i ] != '') {
      if(repeatInitPassed[ i ]) {
        clearInterval(repeatIntervals[ i ]);
      }
      else clearTimeout(repeatIntervals[ i ]);
      repeatIntervals[ i ] = '';
    }
  }

  let
  buttonList = [ [ 37, 74 ], [], [ 39, 76 ], [ 40, 75 ], [ 38, 73, 88, 82 ], [ 90, 84 ], [ 68, 32 ], [], [ 67 ], [ 77 ], [ 78 ] ];
  let
  buttonStates = new Array(buttonList.length);

  for(i = 0;

  i < buttonList

.
  length;
++
  i
)
  buttonStates
  [ i ] = 0;

//let directionalButtonStates = [0,0,0,0]; // left up right down
//let rotationButtonStates = [0,0] // cw, ccw
//let dropButtonState = 0;
//let holdButtonState = 0;
// these letiables keep track of button state in order to customize
// key repeat rates

  private keydownfunc(e) {
    let keynum;
    if(!(e.which)) keynum = e.keyCode;
    else if(e.which) keynum = e.which;
    else return;
    let keychar = String.fromCharCode(keynum);
    //document.title = keynum;

    if(keychar == 'P') {
      if(paused) unPause();
      else {
        setPause(false);
        return;
      }
    }
    if(paused) return;

    let i;
    for(i = 0; i < buttonList.length; i++) {
      let j;
      for(j = 0; j < buttonList[ i ].length; j++) {
        if(keynum == buttonList[ i ][ j ] && !buttonStates[ i ]) {
          moves[ i ]();
          stopRepeat(i); // this is insurance
          setupRepeat(i);
          buttonStates[ i ] = 1;
        }
      }
    }

    //document.getElementById('msg').innerHTML = "last key pressed: "+ keynum + "inside:"+isPieceInside();
    updatePiece();
  }

  private keyupfunc(e) {
    let keynum;
    if(!(e.which)) keynum = e.keyCode;
    else if(e.which) keynum = e.which;
    else return;
    let keychar = String.fromCharCode(keynum);
    if(paused) return;

    let i;
    for(i = 0; i < buttonList.length; i++) {
      let j;
      for(j = 0; j < buttonList[ i ].length; j++) {
        if(keynum == buttonList[ i ][ j ]) {
          buttonStates[ i ] = 0;
          stopRepeat(i);
        }
      }
    }

  }

  let
  animPositionX = 3;
  let
  animPositionY = 0;
  let
  animRotation = 0;

  /*
  function drawPieceOld(context) {
    let i,j;
    let tetk = tetrominos[curPiece][curRotation];
    for (j=0;j<tetk.length;j++) {
      let tetkj = tetk[j];
      for (i=0;i<tetkj.length;i++) {
        let tetkji = tetkj[i];
        if (tetkji) {
        context.save();
      context.rotate(10.0*3.1415926/180.0);
          drawBox2(animPositionX+i,animPositionY+j,tetkji,context);
      context.restore();
        }
      }
    }
  }
  */
  let
  drawIndicators = false;

  private drawPiece(context) {
    let i, j;
    // drawing using geometry of current rotation
    let tetk = tetrominos[ curPiece ][ curRotation ];
    // translating (canvas origin) to the center,
    // rotating there, then drawing the boxes
    context.clearRect(0, 0, xoff * 2 + xsize * 10 + gapsize * 9, yoff * 2 + ysize * 24 + gapsize * 23);
    if(isMouseControl && drawIndicators) {
      context.save();
      context.translate(xoff + (xsize + gapsize) * (mouseControlX + 1.5), yoff);

      context.fillStyle = 'rgba(0,0,255,' + (Math.abs((mouseControlX) - Math.floor(mouseControlX + 0.5)) * 0.2 + 0.2) + ')';
      context.fillRect(-xsize / 4, 0, xsize / 2, ysize * 24 + gapsize * 23);
      context.restore();
    }
    context.save();
    context.fillStyle = colors[ curPiece + 1 ];
    let centerX = tet_center_rot[ curPiece ][ 0 ] * (xsize + gapsize) + xsize / 2 + (!tet_center_rot[ curPiece ][ 2 ]) * (xsize / 2 + gapsize);
    let centerY = tet_center_rot[ curPiece ][ 1 ] * (ysize + gapsize) + ysize / 2 + (!tet_center_rot[ curPiece ][ 2 ]) * (ysize / 2 + gapsize);

    context.translate(xoff + animPositionX * (xsize + gapsize) + centerX, yoff + animPositionY * (ysize + gapsize) + centerY);
    context.rotate(animRotation);
    context.translate(-centerX, -centerY);

    // now in rotated coordinates, zeroed at piece origin
    for(j = 0; j < tetk.length; j++) {
      let tetkj = tetk[ j ];
      for(i = 0; i < tetkj.length; i++) {
        let tetkji = tetkj[ i ];
        if(tetkji) {
          context.fillRect(i * (xsize + gapsize), j * (ysize + gapsize), xsize, ysize);
        }
      }
    }
    context.restore();
    if(isMouseControl && drawIndicators) {
      context.save();
      context.translate(xoff + (animPositionX + 1.5) * (xsize + gapsize), yoff);
      context.fillStyle = 'rgba(255,0,0,0.3)';
      context.fillRect(-xsize / 4, 0, xsize / 2, ysize * 24 + gapsize * 23);
      context.restore();
    }

  }

  let
  shadowY = 0;

  private drawShadow(context) {
    let curY;
    let count = 0;
    let origY = pieceY;
    while(!isPieceInside()) {
      curY = pieceY;
      pieceY++;
      count++;
    } // This is a little bad --
    // I am modifying critical program state
    // when it is not necessary.
    // This is done to increase code reuse
    pieceY = origY;
    shadowY = curY;
    if(!count) return;
    drawShadowPieceAt(context, pieceX, curY);
  }

  private drawShadowPieceAt(context, gridX, gridY) {
    tetk = tetrominos[ curPiece ][ curRotation ];
    context.clearRect(0, 0, xoff * 2 + xsize * 10 + gapsize * 9, yoff * 2 + ysize * 24 + gapsize * 23);
    context.save();
    context.fillStyle = '#777';
    context.translate(xoff + gridX * (xsize + gapsize), yoff + gridY * (ysize + gapsize));
    for(j = 0; j < tetk.length; j++) {
      let tetkj = tetk[ j ];
      for(i = 0; i < tetkj.length; i++) {
        let tetkji = tetkj[ i ];
        if(tetkji) {
          context.fillRect(i * (xsize + gapsize), j * (ysize + gapsize), xsize, ysize);
        }
      }
    }
    context.restore();
  }

  let
  posx = 0;
  let
  posy = 0;

  private mousemovefunc(e) {
    if(!e) let e = window.event;
    if(e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    }
    else if(e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop
        + document.documentElement.scrollTop;
    }
    /*if (!e) e = event;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop
      + document.documentElement.scrollTop;
    } */

    //if (!(Math.floor((posx/5-100-(xsize+gapsize)*pieceX)/(xsize+gapsize)) <= 0)) moves[2]();
    //if (Math.floor((posx/5-100-(xsize+gapsize)*pieceX)/(xsize+gapsize))< 0) moves[0]();
    //updatePiece();
    if(!paused)
      mouseControlFunc();
  }

  let
  pausedBecauseLostFocus = false;

  private losefocusfunc() {
    if(paused) return;
    setPause(false);
    pausedBecauseLostFocus = true;
  }

  private gainfocusfunc() {
    if(paused && pausedBecauseLostFocus) {
      unPause();
    }
  }

  private mousedownfunc(e) {
    if(isMouseControl) {
      if(e.which == 1) {
        moves[ 4 ]();
      }
      else if(e.which == 3) {
        moves[ 6 ]();
      }
    }
  }

  let
  score = 1000;
  let
  isScoreIncreasing = false;

  let
  scoreCallback = function(val) {
  }; // I get called when score changes.

  private applyScore(amount) {
    if(isScoreIncreasing) {
      increaseScore(amount);
    } else {
      subtractScore(amount);
    }
    scoreCallback(score);
  }

  private increaseScore(amount) {
    score += amount;
    document.getElementById('score').innerHTML = score;
  }

  private subtractScore(amount) {
    score -= amount;
    if(score <= 0) { // reached zero
      gameWin();
      score = 0;
    }
    document.getElementById('score').innerHTML = score;
  }

  document
.
  onkeydown = function(e) {
    keydownfunc(e);
  };
  document
.
  onkeyup = function(e) {
    keyupfunc(e);
  };
  document
.
  onmousemove = function(e) {
    mousemovefunc(e);
  };
  window
.
  onblur = function() {
    losefocusfunc();
  };
  window
.
  onfocus = function() {
    gainfocusfunc();
  };
  document
.
  onmousedown = function(e) {
    mousedownfunc(e);
  };

// for iOS preventing default scroll
  document
.
  ontouchmove = function(e) {
    doc_otm(e);
  };

  private doc_otm(e) {

    drawTouches(); // presumably some fingers need to be updated
    if(control_finger_id != -1) { // control finger active
      for(let i = 0; i < e.changedTouches.length; ++i) { // search moved fingers for control finger
        if(e.changedTouches[ i ].identifier == control_finger_id) { // found it
          // verify a past position exists (it should)
          if(control_location[ 0 ] < 0 || control_location[ 1 ] < 0) {
            alert('control_location not set!');
          }
          Control([ e.changedTouches[ i ].clientX, e.changedTouches[ i ].clientY ]);
        }
      }
    }
    e.preventDefault();

  };

  let
  touchlist = [];

  let
  lastTouchID = -1; // used for tracking potential taps
  let
  lastTouchStartTime = 0;

  document
.
  ontouchstart = function(e) {
    doc_ots(e);
  };

  private doc_ots(e) {
    touchlist = (e.touches);
//	for (let i =0;i<touchlist.length;++i) {
//		console.log(i+": "+touchlist[i].identifier+" at "+touchlist[i].clientX+","+touchlist[i].clientY);
//	}

    if(e.touches.length == 1) { // set this finger as control
      control_finger_id = e.touches[ 0 ].identifier;
      // initialize control_location
      control_location = [ e.touches[ 0 ].clientX, e.touches[ 0 ].clientY ];
      // initialize control_accum
      control_accum = [ 0, 0 ];
    }

    if(e.changedTouches.length == 1) {
      lastTouchID = e.changedTouches[ 0 ].identifier;
      lastTouchStartTime = new Date().getTime();
    }

    drawTouches();

  };

  let
  control_finger_id = -1;
  let
  control_location = [ -1, -1 ]; // last location: -1 indicates undefined

  document
.
  ontouchend = function(e) {
    doc_ote(e);
  };
  private doc_ote(e) {
    touchlist = e.touches;
    for(let i = 0; i < e.changedTouches.length; i++) {
      if(e.changedTouches[ i ].identifier == control_finger_id) {
        // Easy way out: defer control to first of remaining fingers
        if(e.touches.length > 0) {
          control_finger_id = e.touches[ 0 ].identifier;
          control_location = [ e.touches[ 0 ].clientX, e.touches[ 0 ].clientY ];
        } else {
          control_finger_id = -1;
          control_location = control_accum = [ -1, -1 ];
        }
        //break;
        //entry point for hard drop
        hardDropTest(e.changedTouches[ i ].clientX, e.changedTouches[ i ].clientY);
      }
      if(!paused && e.changedTouches[ i ].identifier == lastTouchID && new Date().getTime() - lastTouchStartTime < 300) {
        moves[ 4 ]();
      }
    }
    drawTouches();
  };

// document.ontouchend  document.ontouch

  private flatten(obj, levels) {
    if(levels == 0) return '';
    let empty = true;
    if(obj instanceof Array) {
      str = '[';
      empty = true;
      for(let i = 0; i < obj.length; i++) {
        empty = false;
        str += flatten(obj[ i ], levels - 1) + ', ';
      }
      return (empty ? str : str.slice(0, -2)) + ']';
    } else if(obj instanceof Object) {
      str = '{';
      empty = true;
      for(i in obj) {
        empty = false;
        str += i + '->' + flatten(obj[ i ], levels - 1) + ', ';
      }
      return (empty ? str : str.slice(0, -2)) + '}';
    } else {
      return obj; // not an obj, don't stringify me
    }
  }

  private win_onresize() {
    updateSizing();
  };

  private setTouchSensitivity(value) {
    yMoveThreshold = xMoveThreshold = 30.0 / value;
  }

  // returns touch_draw setting
  private toggle_touch_draw() {
    actually_draw_touches = !actually_draw_touches;
    return actually_draw_touches;
  }

  private setScoreIncreasing() {
    isScoreIncreasing = true;
    score = 0;
  }

  private scoreChangeCallback(cb) {
    scoreCallback = cb;
  }
}
