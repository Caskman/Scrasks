
export class TileMap<T> {

    static fromSites(sites: {x: number, y: number}[]) {
        const map = new TileMap({} as TileMapData<boolean>)
        sites.forEach(s => map.set(s.x, s.y, true))
        return map
    }

    static bool() {
        return new TileMap<boolean>({})
    }

    constructor(private map: TileMapData<T>) {}

    get(x: number, y: number): T {
        if (x in this.map) {
            return this.map[x][y]
        }
    }

    set(x: number, y: number, val: T) {
        if (!(x in this.map)) {
            this.map[x] = {}
        }
        this.map[x][y] = val
    }

}
function createBannedSpotsMap(sites: {x: number, y: number}[]) {
    const map = {} as {
        [x: number]: {
            [y: number]: boolean
        }
    }
    sites.forEach(s => {
        if (!(s.x in map)) {
            map[s.x] = {}
        }
        map[s.x][s.y] = true
    })
}

type TileMapData<T> = {
    [x: number]: {
        [y: number]: T
    }
}
