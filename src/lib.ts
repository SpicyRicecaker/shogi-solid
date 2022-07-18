export enum Rank {
    Regular = 1,
    Promoted = 2
}

export enum Player {
    Challenging = -1,
    Residing = 1
}

export enum Placement {
    Board,
    Reserve
}

export interface Piece {
    type: string,
    rank: Rank,
    owner: Player,
    placement: Placement
}

export interface Square {
    available: boolean
}

export const kanji = (p: Piece): string => {
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