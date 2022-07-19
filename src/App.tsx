import { Component, createSignal } from "solid-js";
import { Piece, Player, Placement } from "./lib";
import { createMutable } from "solid-js/store";

import styles from "./App.module.css";
import { BoardComponent } from "./Board";
import { ReserveComponent, initReserve, initDoubledReserve } from "./Reserve";

export const [turn, setTurn] = createSignal(Player.Challenging);

export interface SelectedPiece {
  placement: Placement;
  x?: number;
  y?: number;
  type?: string;
  owner?: Player;
}

const temp = (): null | SelectedPiece => null;
export const [selectedPiece, setSelectedPiece] = createSignal(temp());

export const reserve = createMutable(initDoubledReserve());

const App: Component = () => {
  return (
    <>
      <div>
        <div>A Game of Shogi</div>
        <a href="https://github.com/SpicyRicecaker/shogi-solid">src</a>
      </div>
      <div class={styles.boardBody}>
        <ReserveComponent
          owner={Player.Residing}
          reserve={reserve[Player.Residing]}
        />
        <BoardComponent />
        <ReserveComponent
          owner={Player.Challenging}
          reserve={reserve[Player.Challenging]}
        />
      </div>
    </>
  );
};

export default App;
