import { For, Show, batch } from "solid-js";
import {
  turn,
  setTurn,
  selectedPiece,
  SelectedPiece,
  setSelectedPiece,
  reserve,
  setRunning,
} from "./App";
import { Piece, Rank, Player, kanji, Placement } from "./lib";
import { Component } from "solid-js";
import { createMutable, createStore } from "solid-js/store";
import { DoubledReserve } from "./Reserve";

import styles from "./App.module.css";
import { initSquares } from "./squares";

export const getKingCoords = (
  o: Player,
  b: (Piece | null)[][]
): [number, number] => {
  for (let y = 0; y < b.length; y++) {
    for (let x = 0; x < b.length; x++) {
      const piece = b[y][x];
      if (!piece) {
        continue;
      }
      if (piece.type === "k" && piece.owner === o) {
        return [x, y];
      }
    }
  }
  // unreachable
  return [0, 0];
};

// function takes in mutable reference to b and r, mutates them
const movePiece = (
  p: SelectedPiece,
  x: number,
  y: number,
  b: (Piece | null)[][],
  r: DoubledReserve
): void => {
  if (p.placement === Placement.Board) {
    // match statement here later TODO DEBUG ...
    const temp = b[y][x];

    batch(() => {
      // if we actually took a piece, move it to the selected piece's player's reserve
      if (temp) {
        // console.log(r, b, p, temp.type);
        r[b[p.y!][p.x!]!.owner].find(
          (reservePiece) => reservePiece.type === temp.type
        )!.count += 1;
      }
      b[y][x] = b[p.y!][p.x!];
      b[p.y!][p.x!] = null;
    });
    // also need to handle promotions as well.

    // add temp to `turn()`'s reserve
    // also implement take
  } else {
    batch(() => {
      b[y][x] = {
        type: p.type!,
        owner: p.owner!,
        rank: Rank.Regular,
        placement: Placement.Board,
      };
      r[p.owner!].find(
        (reservePiece) => reservePiece.type === p.type
      )!.count -= 1;
      // decrement counter
    });
  }
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

export const initBoard = (): (Piece | null)[][] => {
  const boardInit: (Piece | null)[][] = [];
  const template = `
  rrrrkrrrr
  ppp......
  .........
  .........
  .........
  .........
  .........
  ......ppp
  rrrrkrrrr
  `;
  // const template = `
  // lnsgkgsnl
  // .r.....b.
  // ppppppppp
  // .........
  // .........
  // .........
  // ppppppppp
  // .b.....r.
  // lnsgkgsnl
  // `;

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

export const boardStore = createMutable(initBoard());
export const [squaresStore, setSquare] = createStore(initSquares());

const addAvailableTowards = (
  x: number,
  y: number,
  o: Player,
  dx: number,
  dy: number,
  s: boolean[][],
  b: (Piece | null)[][]
): void => {
  x += dx;
  y += dy;
  // while within board
  while (x >= 0 && x < 9 && y >= 0 && y < 9) {
    // check the board
    const piece = b[y][x];
    if (piece) {
      // if the piece is not of the player, add it as available and break;
      // otherwise just break
      if (piece.owner != o) {
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
  o: Player,
  dx: number,
  dy: number,
  s: boolean[][],
  b: (Piece | null)[][]
): void => {
  x += dx;
  y += dy;
  if (x >= 0 && x < 9 && y >= 0 && y < 9) {
    const piece = b[y][x];
    if (piece) {
      if (piece.owner != o) {
        s[y][x] = true;
      }
    } else {
      s[y][x] = true;
    }
  }
};

// only allow piece moves if the (king) selected piece is not under check
const isUnderCheck = (
  xSel: number,
  ySel: number,
  b: (Piece | null)[][],
  reserve: DoubledReserve
): boolean => {
  // if the available squares of all the selected pieces that are not of the
  // same turn as the player exists on a square that the selected square is on,
  // then return true basically
  const availableSquares = initSquares();

  const checkPc = b[ySel][xSel]!;

  for (let y = 0; y < b.length; y++) {
    for (let x = 0; x < b[y].length; x++) {
      const piece = b[y][x];
      if (!piece) {
        continue;
      }
      if (piece.owner !== checkPc.owner) {
        // edit our available Squares
        setAvailable(
          { placement: Placement.Board, x: x, y: y },
          b,
          reserve,
          availableSquares
        );
      }
    }
  }
  return availableSquares[ySel][xSel];
};

// keep in mind that board and reserve are direct mutable references to stores
export const getAvailableFromStore = (
  selectedPiece: SelectedPiece | null,
  board: (Piece | null)[][],
  reserve: DoubledReserve
): boolean[][] => {
  const availableSquares = initSquares();
  setAvailable(selectedPiece, board, reserve, availableSquares);

  if (!selectedPiece) {
    return availableSquares;
  }

  // get the owner of the square
  const o = ((): Player => {
    if (selectedPiece.placement === Placement.Board) {
      return board[selectedPiece.y!][selectedPiece.x!]!.owner;
    } else {
      return selectedPiece.owner!;
    }
  })();

  // for each available square inside squares
  for (let y = 0; y < availableSquares.length; y++) {
    for (let x = 0; x < availableSquares.length; x++) {
      if (availableSquares[y][x]) {
        // clone board and reserve
        const [b, r] = [
          JSON.parse(JSON.stringify(board)),
          JSON.parse(JSON.stringify(reserve)),
        ];

        // we can assert that selected piece exists at this point because there are available squares to select from

        // move the selected piece to that available square
        movePiece(selectedPiece, x, y, b, r);

        // find the king of the current side
        // this feels really slow
        // also it's weird how in javascript you can't name a variable the same as one that's already in scope, but if you use a for loop, it's allowed

        const [xK, yK] = getKingCoords(o, b);

        // check if the king is in check
        if (isUnderCheck(xK, yK, b, r)) {
          availableSquares[y][x] = false;
        }
      }
    }
  }
  return availableSquares;
};

const setAvailable = (
  selectedPiece: SelectedPiece | null,
  board: (Piece | null)[][],
  reserve: DoubledReserve,
  s: boolean[][]
): void => {
  if (!selectedPiece) {
    return;
  }

  if (selectedPiece.placement === Placement.Board) {
    const p = board[selectedPiece.y!][selectedPiece.x!];

    if (!p) {
      return;
    }

    const [x, y] = [selectedPiece.x!, selectedPiece.y!];

    // also need to handle if from reserve or if promoted
    switch (p.type) {
      case "l": {
        addAvailableTowards(x, y, p.owner, 0, p.owner, s, board);
        break;
      }
      case "n": {
        const dy = p.owner * 2;
        [-1, 1].forEach((dx, _) => {
          addAvailable(x, y, p.owner, dx, dy, s, board);
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
          addAvailable(x, y, p.owner, dx, dy * p.owner, s, board);
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
          addAvailable(x, y, p.owner, dx, dy * p.owner, s, board);
        });
        break;
      }
      case "k": {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (!(dx == 0 && dy == 0)) {
              addAvailable(x, y, p.owner, dx, dy, s, board);
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
          addAvailableTowards(x, y, p.owner, dx, dy, s, board);
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
          addAvailableTowards(x, y, p.owner, dx, dy, s, board);
        });
        break;
      }
      case "p": {
        addAvailable(x, y, p.owner, 0, p.owner, s, board);
        break;
      }
      default: {
        console.log("fatal error: invalid piece selected");
        break;
      }
    }
    return;
  } else {
    const selPc = reserve[selectedPiece.owner!].find(
      (p) => p.type === selectedPiece.type
    );

    switch (selPc!.type) {
      case "p": {
        const isPawnInColumn: boolean[] = [];
        for (let i = 0; i < 9; i++) {
          isPawnInColumn.push(false);
        }

        // allow all columns which do not have a pawn in it
        for (let y = 0; y < board.length; y++) {
          for (let x = 0; x < board.length; x++) {
            const piece = board[y][x];
            if (!piece) {
              continue;
            }
            if (piece.owner === selectedPiece.owner! && piece.type === "p") {
              isPawnInColumn[x] = true;
            }
          }
        }

        let [y, end] =
          selectedPiece.owner === Player.Challenging
            ? [1, board.length]
            : [0, board.length - 1];

        for (y; y < end; y++) {
          for (let x = 0; x < s.length; x++) {
            if (!isPawnInColumn[x]) {
              // if there is no piece in there
              if (!board[y][x]) {
                s[y][x] = true;
              }
            }
          }
        }
        break;
      }
      case "s":
      case "g":
      case "b":
      case "r": {
        for (let y = 0; y < board.length; y++) {
          for (let x = 0; x < board.length; x++) {
            if (!board[y][x]) {
              s[y][x] = true;
            }
          }
        }
        break;
      }
      case "n": {
        // anywhere but the last two, dependent on turn
        let [y, end] =
          selectedPiece.owner === Player.Challenging
            ? [2, board.length]
            : [0, board.length - 2];

        for (y; y < end; y++) {
          for (let x = 0; x < board.length; x++) {
            if (!board[y][x]) {
              s[y][x] = true;
            }
          }
        }
        break;
      }
      case "l":
        let [y, end] =
          selectedPiece.owner === Player.Challenging
            ? [1, board.length]
            : [0, board.length - 1];

        for (y; y < end; y++) {
          for (let x = 0; x < board.length; x++) {
            if (!board[y][x]) {
              s[y][x] = true;
            }
          }
        }
        break;
      default:
        console.log("movement for this reserve piece is not implemented yet");
        break;
    }
    return;
  }
};

export const BoardComponent: Component = () => {
  return (
    <div class={styles.board}>
      <For each={boardStore}>
        {(row, y) => (
          <For each={row}>
            {(piece, x) => {
              return (
                <div
                  style="position: relative"
                  class={`${squaresStore[y()][x()] ? styles.available : ""} ${
                    isSelected(
                      { placement: Placement.Board, x: x(), y: y() },
                      selectedPiece(),
                      boardStore
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
                  onClick={(_) => {
                    // if it's an available square
                    if (squaresStore[y()][x()]) {
                      // deep clone board, not sure how performant this is

                      movePiece(
                        selectedPiece() as unknown as SelectedPiece,
                        x(),
                        y(),
                        boardStore,
                        reserve
                      );

                      // remove all available pieces
                      // setSquare(initSquares());
                      // disconnect selected piece after move, otherwise the next player could potentially move this player's piece
                      setSelectedPiece(null);
                      setSquare(
                        getAvailableFromStore(
                          selectedPiece(),
                          boardStore,
                          reserve
                        )
                      );
                      // change turn
                      setTurn(turn() * -1);
                      // return; 

                      // on the beginning of a turn where a player is in check, check if it results in an endgame
                      const [xK, yK] = getKingCoords(turn(), boardStore);

                      if (!isUnderCheck(xK, yK, boardStore, reserve)) {
                        return;
                      }

                      for (let y = 0; y < boardStore.length; y++) {
                        for (let x = 0; x < boardStore[y].length; x++) {
                          const piece = boardStore[y][x];
                          if (!piece || piece.owner !== turn()) {
                            continue;
                          }

                          const t = getAvailableFromStore(
                            {
                              placement: Placement.Board,
                              x: x,
                              y: y,
                            },
                            boardStore,
                            reserve
                          );
                          // x^4 time complexity let's goo
                          for (let j = 0; j < t.length; j++) {
                            for (let i = 0; i < t[j].length; i++) {
                              if (t[j][i]) {
                                console.log("can put", piece, "to", i, j);
                                return;
                              }
                            }
                          }
                        }
                      }
                      // // set message to current player lost
                      // // set running to false
                      setRunning(false);
                    } else {
                      // add the ability to click on the square underneath a friendly piece to select it
                      if (piece && piece.owner === turn()) {
                        setSelectedPiece({
                          placement: Placement.Board,
                          x: x(),
                          y: y(),
                        });
                        setSquare(
                          getAvailableFromStore(
                            selectedPiece(),
                            boardStore,
                            reserve
                          )
                        );
                        // showAvailable(e, piece as Piece, x(), y());
                      } else {
                        // add the ability to click on another square or unreachable enemy piece to deselect the currently selected piece
                        // remove selected piece
                        setSelectedPiece(null);
                        setSquare(
                          getAvailableFromStore(
                            selectedPiece(),
                            boardStore,
                            reserve
                          )
                        );
                        // remove all available squares
                        // setSquare(initSquares());
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

                        setSquare(
                          getAvailableFromStore(
                            selectedPiece(),
                            boardStore,
                            reserve
                          )
                        );
                        // showAvailable(e, piece as Piece, x(), y());
                      }}
                      style={`position: absolute; transform: ${
                        (piece as Piece).owner === Player.Challenging
                          ? "none"
                          : "rotate(180deg)"
                      };
                      `}
                      class={`
                        ${
                          (piece as Piece).owner === turn()
                            ? styles.availablePiece
                            : ""
                        }
                        ${styles.piece}
                      `}
                    >
                      <div>
                        {kanji(
                          (piece as Piece).owner,
                          (piece as Piece).rank,
                          (piece as Piece).type
                        )}
                      </div>
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
