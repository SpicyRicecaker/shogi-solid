import { Square } from './lib';

export const initSquares = (): Square[][] => {
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
    const squaresInit: Square[][] = [];
    for (let y = 0; y < lines.length; y++) {
        let arr: Square[] = [];
        let line: string = lines[y].trim();
        for (let x = 0; x < line.length; x++) {
            arr.push({ available: false });
        }
        squaresInit.push(arr);
    }
    return squaresInit;
}