import { Component } from 'solid-js';

import styles from './App.module.css';
import { BoardComponent } from './Board';

const reserve = () => {

}

const App: Component = () => {
  return (
    <>
      <div>header here</div>
      <div class={styles.boardBody}>
        <div></div>
        <BoardComponent/>
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
