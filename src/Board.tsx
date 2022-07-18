import { For, Show } from "solid-js";
import { Piece, Rank, Player, kanji } from './lib';
import { Component } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

import styles from './App.module.css';
import { initSquares } from "./squares";

export const BoardComponent: Component = () => {
  return <div class={styles.board}>
    <For each={board}>
      {(row, y) =>
        <For each={row}>
          {(piece, x) => (
            <div style={
              {
                "position": "relative",
                "background-color": squares[y()][x()].available ? "blue" : "white"
              }
            }>
              <Show when={piece}>
                <div
                  onClick={(e) => showAvailable(e, piece as Piece, y(), x())} style="position: absolute;">{kanji(piece as Piece)}</div>
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
          rank: Rank.Regular
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

const showAvailable = (e: MouseEvent, p: Piece, y: number, x: number) => {
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
  for (let k = 0; k < squares.length; k++) {
    for (let j = 0; j < squares[k].length; j++) {
      setSquare(
        produce((squaresPrev) => {
            squaresPrev[k][j].available = true;
        })
      )
    }
  }
}
