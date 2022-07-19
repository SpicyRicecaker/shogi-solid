import { For, Show } from "solid-js";
import {
  turn,
  selectedPiece,
  SelectedPiece,
  setSelectedPiece,
  reserve,
} from "./App";
import { Piece, Rank, Player, kanji, Square, Placement } from "./lib";
import { Component } from "solid-js";
import {
  createMutable,
  createStore,
  modifyMutable,
  reconcile,
} from "solid-js/store";
import { DoubledReserve, initReserve } from "./Reserve";

import styles from "./App.module.css";
import { initSquares } from "./squares";

// function takes in mutable reference to b and r, mutates them
const movePiece = (
  e: MouseEvent,
  p: SelectedPiece,
  x: number,
  y: number,
  b: (Piece | null)[][],
  r: DoubledReserve
): void => {
  // match statement here later TODO DEBUG ...
  // console.log("attemping to move piece");
  const temp = b[y][x];
  // if we actually took a piece, move it to the selected piece's player's reserve
  if (temp) {
    r[(b[p.y as number][p.x as number] as Piece).owner].find(
      (reservePiece) => reservePiece.type === temp.type
    )!.count += 1;
  }

  b[y][x] = b[p.y as number][p.x as number];

  // also need to handle promotions as well.
  b[p.y as number][p.x as number] = null;

  // add temp to `turn()`'s reserve
  // also implement take
};

const isSelected = (
  p: SelectedPiece,
  s: SelectedPiece | null,
  board: (Piece | null)[][]
): boolean => {
  if (!s) {
    return false;
  }

  if (p.placement !== s.placement) {
    return false;
  }

  if (p.placement === Placement.Board) {
    return s.x == p.x && s.y == p.y;
  } else {
    // ...todo!
    return false;
  }
};

export const BoardComponent: Component = () => {
  return (
    <div class={styles.board}>
      <For each={board}>
        {(row, y) => (
          <For each={row}>
            {(piece, x) => {
              return (
                <div
                  style="position: relative"
                  class={`${squares[y()][x()] ? styles.available : ""} ${
                    isSelected(
                      { placement: Placement.Board, x: x(), y: y() },
                      selectedPiece(),
                      board
                    )
                      ? styles.selectedSquare
                      : ""
                  }
                  ${
                    piece && piece.owner === turn()
                      ? styles.availablePiece
                      : "" /* change cursor if square is occupied*/
                  }
                  `}
                  onClick={(e) => {
                    // if it's an available square
                    if (squares[y()][x()]) {
                      // deep clone board, not sure how performant this is

                      movePiece(
                        e,
                        selectedPiece() as unknown as SelectedPiece,
                        x(),
                        y(),
                        board,
                        reserve
                      );

                      // remove all available pieces
                      setSquare(initSquares());
                      // disconnect selected piece after move, otherwise the next player could potentially move this player's piece
                      setSelectedPiece(null);
                    } else {
                      // add the ability to click on the square underneath a friendly piece to select it
                      if (piece && piece.owner === turn()) {
                        setSelectedPiece({
                          placement: Placement.Board,
                          x: x(),
                          y: y(),
                        });
                        showAvailable(e, piece as Piece, x(), y());
                      } else {
                        // add the ability to click on another square or unreachable enemy piece to deselect the currently selected piece
                        // remove selected piece
                        setSelectedPiece(null);
                        // remove all available squares
                        setSquare(initSquares());
                      }
                    }
                  }}
                >
                  <Show when={piece}>
                    <div
                      onClick={(e) => {
                        //  fix bug introduced by previous commit where clicking directly on an enemy piece with a selectedpiece doesn't capture it
                        if (
                          selectedPiece() &&
                          (piece as Piece).owner !== turn()
                        ) {
                          return;
                        }
                        e.stopPropagation();
                        if ((piece as Piece).owner !== turn()) {
                          return;
                        }

                        setSelectedPiece({
                          placement: Placement.Board,
                          x: x(),
                          y: y(),
                        });
                        showAvailable(e, piece as Piece, x(), y());
                      }}
                      style="position: absolute;"
                      class={
                        (piece as Piece).owner === turn()
                          ? styles.availablePiece
                          : ""
                      }
                    >
                      {kanji(
                        (piece as Piece).owner,
                        (piece as Piece).rank,
                        (piece as Piece).type
                      )}
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        )}
      </For>
    </div>
  );
};

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

  let lines = template.trim().split("\n");
  for (let y = 0; y < lines.length; y++) {
    let arr: (Piece | null)[] = [];
    let line: string = lines[y].trim();
    let owner = y <= 2 ? Player.Residing : Player.Challenging;
    for (let x = 0; x < line.length; x++) {
      if (line[x] !== ".") {
        arr.push({
          type: line[x],
          owner: owner,
          rank: Rank.Regular,
          placement: Placement.Board,
        });
      } else {
        arr.push(null);
      }
    }
    boardInit.push(arr);
  }

  return boardInit;
};

const board = createMutable(initBoard());
const [squares, setSquare] = createStore(initSquares());

const addAvailableTowards = (
  x: number,
  y: number,
  dx: number,
  dy: number,
  s: boolean[][]
): void => {
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
};

const addAvailable = (
  x: number,
  y: number,
  dx: number,
  dy: number,
  s: boolean[][]
): void => {
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
};

const showAvailable = (e: MouseEvent, p: Piece, x: number, y: number) => {
  let s = initSquares();

  // also need to handle if from reserve or if promoted
  switch (p.type) {
    case "l": {
      addAvailableTowards(x, y, 0, turn(), s);
      break;
    }
    case "n": {
      const dy = turn() * 2;
      [-1, 1].forEach((dx, _) => {
        addAvailable(x, y, dx, dy, s);
      });
      break;
    }
    case "s": {
      [
        [-1, 1],
        [0, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].forEach(([dx, dy]) => {
        addAvailable(x, y, dx, dy * turn(), s);
      });
      break;
    }
    case "g": {
      [
        [-1, 1],
        [0, 1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
      ].forEach(([dx, dy]) => {
        addAvailable(x, y, dx, dy * turn(), s);
      });
      break;
    }
    case "k": {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (!(dx == 0 && dy == 0)) {
            addAvailable(x, y, dx, dy, s);
          }
        }
      }
      break;
    }
    case "r": {
      [
        [1, 0],
        [-1, 0],
        [0, -1],
        [0, 1],
      ].forEach(([dx, dy]) => {
        addAvailableTowards(x, y, dx, dy, s);
      });
      break;
    }
    case "b": {
      [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dx, dy]) => {
        addAvailableTowards(x, y, dx, dy, s);
      });
      break;
    }
    case "p": {
      addAvailable(x, y, 0, turn(), s);
      break;
    }
    default: {
      console.log("fatal error: invalid piece selected");
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
};
