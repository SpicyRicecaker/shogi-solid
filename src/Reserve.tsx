import { Piece, Player, Placement, Rank, kanji } from "./lib";
import { createEffect, For } from "solid-js";
import type { Component } from "solid-js";

import { turn, selectedPiece, setSelectedPiece, SelectedPiece } from "./App";

import styles from "./App.module.css";

export interface DoubledReserve {
  [Player.Challenging]: ReservePiece[];
  [Player.Residing]: ReservePiece[];
}

interface ReservePiece {
  type: string;
  count: number;
}

export const initReserve = (): ReservePiece[] => {
  const template = "psgnlbr";
  const reserve: ReservePiece[] = [];

  for (const c of template) {
    reserve.push({ type: c, count: 0 });
  }

  // console.log(reserve);

  return reserve;
};

export const initDoubledReserve = (): DoubledReserve => ({
  [Player.Challenging]: initReserve(),
  [Player.Residing]: initReserve(),
});

// we don't even need writable access at this point
export const ReserveComponent: Component<{
  owner: Player;
  reserve: ReservePiece[];
}> = (props) => {
  return (
    <div class={styles.reserve}>
      <For each={Array.from(props.reserve)}>
        {(reservePiece) => {
          return (
            <div
              style="position: relative"
              class={reservePiece.count === 0 ? styles.empty : ""}
            >
              <div
                onClick={(e) => {
                  if (props.owner !== turn()) {
                    return;
                  }

                  setSelectedPiece({
                    placement: Placement.Reserve,
                    type: reservePiece.type,
                    owner: props.owner,
                  });
                }}
                class={
                  props.owner === turn() && reservePiece.count != 0
                    ? styles.availablePiece
                    : ""
                }
              >
                {kanji(props.owner, Rank.Regular, reservePiece.type)}
              </div>
              <div style="position: absolute; top: 0; left: 0; font-size: calc(var(--square-len) * .3)">
                {reservePiece.count}
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};
