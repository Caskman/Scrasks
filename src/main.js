
module.exports.loop = function() {
    console.log('sup')
    let o = {
        a: 1,
        b: 2,
    }
    const { a, b } = o
    console.log(`${a} ${b}`)
}
