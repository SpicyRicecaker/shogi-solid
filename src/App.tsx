import { Component, createSignal } from "solid-js";
import { Player, Placement } from "./lib";
import { createMutable } from "solid-js/store";

import styles from "./App.module.css";
import { BoardComponent } from "./Board";
import { ReserveComponent, initDoubledReserve } from "./Reserve";

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
        <br />
        <a href="javascript:">settings (WIP)</a>
      </div>
      <div
        class={styles.boardBody}
        // style={`transform: ${
        //   turn() === Player.Challenging ? "none" : "rotate(180deg)"
        // }`}
      >
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
