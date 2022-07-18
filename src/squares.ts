// import { Square } from './lib';

export const initSquares = (): boolean[][] => {
    const squaresInit: boolean[][] = [];
    for (let y = 0; y < 9; y++) {
        let arr: boolean[] = [];
        for (let x = 0; x < 9; x++) {
            arr.push(false);
        }
        squaresInit.push(arr);
    }
    return squaresInit;
}