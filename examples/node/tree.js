const H = 7
console.log(' '.repeat(H - 1) + '\x1b[93m★\x1b[0m')
for (let i = 1; i < H; i++) {
  console.log(' '.repeat(H - 1 - i) + '\x1b[32m' + '^'.repeat(2 * i - 1) + '\x1b[0m')
}
console.log(' '.repeat(H - 2) + '\x1b[33m|||\x1b[0m')
console.log('聖誕快樂！')
