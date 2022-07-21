import { Show } from "solid-js";
import { running, turn } from "./App";
import { Player } from "./lib";

export default () => {
  return (
    <Show when={!running()}>
    <div style="width: 100%; position: absolute; display: flex; top: 00%; justify-content: center; font-size: calc(var(--board-len) *0.7); transform: rotate(45deg); opacity: 05%">
      <span><b>{turn() === Player.Challenging ? "Residing" : "Challenging"}</b> player won!!</span>
    </div>
    </Show>
  );
};
