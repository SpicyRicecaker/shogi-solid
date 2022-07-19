import { For, Show, createEffect } from "solid-js";
import {
  turn,
  setTurn,
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
  if (p.placement === Placement.Board) {
    // match statement here later TODO DEBUG ...
    // console.log("attemping to move piece");
    const temp = b[y][x];
    // if we actually took a piece, move it to the selected piece's player's reserve
    if (temp) {
      r[b[p.y!][p.x!]!.owner].find(
        (reservePiece) => reservePiece.type === temp.type
      )!.count += 1;
    }

    b[y][x] = b[p.y!][p.x!];

    // also need to handle promotions as well.
    b[p.y!][p.x!] = null;

    // add temp to `turn()`'s reserve
    // also implement take
  } else {
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

export const BoardComponent: Component = () => {
  // on change of selected piece, reset our squares

  const doShowAvailable = (
    selectedPiece: SelectedPiece | null
    // board: (Piece | null)[][],
    // reserve: DoubledReserve
  ) => {
    setSquare(getAvailable(selectedPiece, board, reserve));
  };

  createEffect(() => doShowAvailable(selectedPiece()));

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
                      // setSquare(initSquares());
                      // disconnect selected piece after move, otherwise the next player could potentially move this player's piece
                      setSelectedPiece(null);
                      // change turn
                      setTurn(turn() * -1);
                    } else {
                      // add the ability to click on the square underneath a friendly piece to select it
                      if (piece && piece.owner === turn()) {
                        setSelectedPiece({
                          placement: Placement.Board,
                          x: x(),
                          y: y(),
                        });
                        // showAvailable(e, piece as Piece, x(), y());
                      } else {
                        // add the ability to click on another square or unreachable enemy piece to deselect the currently selected piece
                        // remove selected piece
                        setSelectedPiece(null);
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
                        // showAvailable(e, piece as Piece, x(), y());
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

const getAvailable = (
  selectedPiece: SelectedPiece | null,
  board: (Piece | null)[][],
  reserve: DoubledReserve
) => {
  let s = initSquares();

  if (!selectedPiece) {
    return s;
  }

  if (selectedPiece.placement === Placement.Board) {
    const p = board[selectedPiece.y!][selectedPiece.x!];

    if (!p) {
      return s;
    }

    const [x, y] = [selectedPiece.x!, selectedPiece.y!];

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
    return s;
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
            if (board[y][x]) {
              if (
                board[y][x]!.owner === selectedPiece.owner! &&
                board[y][x]!.type === "p"
              ) {
                isPawnInColumn[x] = true;
              }
            }
          }
        }
        console.log(isPawnInColumn);

        let [y, end] =
          selectedPiece.owner === Player.Challenging
            ? [1, board.length]
            : [0, board.length - 1];

        for (let x = 0; x < s.length; x++) {
          if (!isPawnInColumn[x]) {
            for (y; y < end; y++) {
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
    return s;
  }
};
