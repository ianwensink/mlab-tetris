import Game from '../Game/index';
import Piece from './index';

export default class PieceFactory {
  public static getPiece(game: Game, player: number): Piece {
    switch(player) {
      case 2:
        return new Piece(2, game, '#32cc1a', 'rgba(50, 204, 26, 0.3)', { left: 65, rotate: 87, right: 68 });
      case 1:
      default:
        return new Piece(1, game, '#ffeb21', 'rgba(255, 235, 33, 0.3)', { left: 37, rotate: 38, right: 39 });
    }
  }
}
