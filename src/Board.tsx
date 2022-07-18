import { For, Show } from "solid-js";
import { turn, selectedPiece, SelectedPiece, setSelectedPiece } from './App';
import { Piece, Rank, Player, kanji, Square, Placement } from './lib';
import { Component } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

import styles from './App.module.css';
import { initSquares } from "./squares";

const movePiece = (e: MouseEvent, p: SelectedPiece, x: number, y: number, b: (Piece | null)[][]): (Piece | null)[][] => {

  // match statement here later TODO DEBUG ...

  console.log('attemping to move piece');
  const _temp = b[y][x];
  b[y][x] = b[p.y as number][p.x as number];
  // also need to handle promotions as well. 
  b[p.y as number][p.x as number] = null;
  return b;

  // add temp to `turn()`'s reserve
  // also implement take
}

export const BoardComponent: Component = () => {
  return <div class={styles.board}>
    <For each={board}>
      {(row, y) =>
        <For each={row}>
          {(piece, x) => (
            <div
              style={
                {
                  "position": "relative",
                  "background-color": squares[y()][x()] ? "blue" : "white"
                }
              }
              onClick={(e) => {
                if (squares[y()][x()]) {
                  // deep clone board, not sure how performant this is
                  const b = JSON.stringify(board);
                  setBoard(movePiece(e, selectedPiece() as unknown as SelectedPiece, x(), y(), JSON.parse(b) as (null | Piece)[][]));

                  // remove all available pieces
                  setSquare(initSquares());
                  // disconnect selected piece after move, otherwise the next player could potentially move this player's piece
                  setSelectedPiece(null);
                }
              }}
            >
              <Show when={piece}>
                <div
                  onClick={(e) => {
                    setSelectedPiece({
                      placement: Placement.Board,
                      x: x(),
                      y: y()
                    });
                    showAvailable(e, piece as Piece, x(), y())
                  }}
                  style="position: absolute;">{kanji(piece as Piece)}</div>
              </Show>
            </div>
          )}
        </For>
      }
    </For>
  </div>;
}

export const initBoard = (): (Piece | null)[][] => {
  const boardInit: (Piece | null)[][] = [];
  let template = `
  lnsgkgsnl
  .r.....b.
  ppppppppp
  .........
  .........
  .........
  ppppppppp
  .b.....r.
  lnsgkgsnl
  `;

  let lines = template.trim().split('\n');
  for (let y = 0; y < lines.length; y++) {
    let arr: (Piece | null)[] = [];
    let line: string = lines[y].trim();
    let owner = y <= 2 ? Player.Residing : Player.Challenging;
    for (let x = 0; x < line.length; x++) {
      if (line[x] !== '.') {
        arr.push({
          type: line[x],
          owner: owner,
          rank: Rank.Regular,
          placement: Placement.Board
        });
      } else {
        arr.push(null);
      }
    }
    boardInit.push(arr);
  }

  return boardInit;
}

const [board, setBoard] = createStore(initBoard());
const [squares, setSquare] = createStore(initSquares());

const addAvailableTowards = (x: number, y: number, dx: number, dy: number, s: boolean[][]): void => {
  x += dx;
  y += dy;
  // while within board
  while (x >= 0 && x < 9 && y >= 0 && y < 9) {
    // check the board
    const piece = board[y][x];
    if (piece) {
      // if the piece is not of the player, add it as available and break;
      // otherwise just break
      if (piece.owner != turn()) {
        s[y][x] = true;
      }
      break;
    } else {
      s[y][x] = true;
      x += dx;
      y += dy;
    }
  }
}

const addAvailable = (x: number, y: number, dx: number, dy: number, s: boolean[][]): void => {
  x += dx;
  y += dy;
  if (x >= 0 && x < 9 && y >= 0 && y < 9) {
    const piece = board[y][x];
    if (piece) {
      if (piece.owner != turn()) {
        s[y][x] = true;
      }
    } else {
      s[y][x] = true;
    }
  }
}

const showAvailable = (e: MouseEvent, p: Piece, x: number, y: number) => {
  let s = initSquares();

  // also need to handle if from reserve or if promoted
  switch (p.type) {
    case 'l': {
      addAvailableTowards(x, y, 0, turn(), s);
      break;
    }
    case 'n': {
      const dy = turn() * 2;
      [-1, 1].forEach((dx, _) => {
        addAvailable(x, y, dx, dy, s);
      });
      break;
    }
    case 's': {
      [[-1, 1], [0, 1], [1, 1], [-1, -1], [1, -1]].forEach(([dx, dy]) => {
        addAvailable(x, y, dx, dy * turn(), s);
      });
      break;
    }
    case 'g': {
      [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => {
        addAvailable(x, y, dx, dy * turn(), s);
      });
      break;
    }
    case 'k': {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (!(dx == 0 && dy == 0)) {
            addAvailable(x, y, dx, dy, s);
          }
        }
      }
      break;
    }
    case 'r': {
      [[1, 0], [-1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        addAvailableTowards(x, y, dx, dy, s);
      });
      break;
    }
    case 'b': {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
        addAvailableTowards(x, y, dx, dy, s);
      });
      break;
    }
    case 'p': {
      addAvailable(x, y, 0, turn(), s);
      break;
    }
    default: {
      console.log('fatal error: invalid piece selected');
      break;
    }
  }
  // match the piece
  // for now just show every square as available
  // for (let k = 0; k < squares.length; k++) {
  //   for (let j = 0; j < squares[k].length; j++) {
  //     setBoard(
  //       (boardPrev) => {
  //         (boardPrev[k][j] as Square).available = true;
  //         return boardPrev;
  //       }
  //     )
  //   }
  // }
  setSquare(s);
}
