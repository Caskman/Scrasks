//@flow

export function loop() {
    console.log('sup')
    let o = {
        a: 1,
        b: '',
        d: 2,
    }
    const { a, b } = o
    console.log(`${a} ${b}`)
}
