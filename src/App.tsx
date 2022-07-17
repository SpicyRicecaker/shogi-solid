import type { Component } from 'solid-js';

// import logo from './logo.svg';
import styles from './App.module.css';
import { For, Show } from "solid-js";

enum Rank {
  Regular = 1,
  Promoted = 2
}

enum Player {
  Challenging = 1,
  Residing = -1
}

interface Piece {
  type: string,
  rank: Rank,
  owner: Player
}

const kanji = (p: Piece): string => {
  if (p.type === 'k') {
    if (p.owner == Player.Challenging) {
      return '玉'
    } else {
      return '王'
    }
  }
  return pieceToKanji[p.rank][p.type];
}

const pieceToKanji: { [key: number]: { [key: string]: string } } = {
  [Rank.Regular]: {
    "l": "香",
    "n": "桂",
    "s": "銀",
    "g": "金",
    "r": "飛",
    "b": "角",
    "p": "歩",
  },
  [Rank.Promoted]: {
    "l": "杏",
    "n": "今",
    "s": "全",
    "g": "金",
    "r": "竜",
    "b": "馬",
    "p": "と",
  }
}

interface Square {
  available: boolean
}

const showAvailable = (e: MouseEvent, p: Piece, y: number, x: number, board: (Piece|null)[][], squares: Square[][]) => {
  console.log(p, "clicked at", y, x);
}

const board = () => {
  const boardState: (Piece | null)[][] = [];
  const boardStateSquares: Square[][] = [];
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
    let actualY = lines.length - 1 - y;
    let owner = actualY <= 2 ? Player.Challenging : Player.Residing;
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
    boardState.push(arr);
  }

  return <div class={styles.board}>
    <For each={boardState}>
      {(row, y) =>
        <For each={row}>
          {(piece, x) => (
            <div style="position: relative;">
              <Show when={piece}>
                <div onClick={(e) => showAvailable(e, piece as Piece, y(), x(), boardState, boardStateSquares)} style="position: absolute;">{kanji(piece as Piece)}</div>
              </Show>
            </div>
          )}
        </For>
      }
    </For>
  </div>;
}

const reserve = () => {

}

const App: Component = () => {
  return (
    <>
      <div>header here</div>
      <div class={styles.boardBody}>
        <div></div>
        {board()}
        <div></div>
      </div>
    </>
    // <div class={styles.Afp}>
    //   <header class={styles.header}>
    //     <img src={logo} class={styles.logo} alt="logo" />
    //     <p>
    //       Edit <code>src/App.tsx</code> and save to reload.
    //     </p>
    //     <a
    //       class={styles.link}
    //       href="https://github.com/solidjs/solid"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn Solid
    //     </a>
    //   </header>
    // </div>
  );
};

export default App;
