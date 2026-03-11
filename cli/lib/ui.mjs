import { createInterface } from 'node:readline'

// ANSI color helpers
export const green = (s) => `\x1b[32m${s}\x1b[0m`
export const red = (s) => `\x1b[31m${s}\x1b[0m`
export const cyan = (s) => `\x1b[36m${s}\x1b[0m`
export const dim = (s) => `\x1b[2m${s}\x1b[0m`
export const bold = (s) => `\x1b[1m${s}\x1b[0m`
export const yellow = (s) => `\x1b[33m${s}\x1b[0m`

// Status symbols
export const symbols = {
  success: green('✓'),
  error: red('✗'),
  arrow: cyan('→'),
  bullet: dim('•'),
}

// Spinner using braille characters
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function createSpinner(message) {
  let i = 0
  let timer = null

  return {
    start() {
      timer = setInterval(() => {
        process.stdout.write(`\r${cyan(frames[i++ % frames.length])} ${message}`)
      }, 80)
    },
    stop(finalMessage) {
      clearInterval(timer)
      process.stdout.write(`\r${' '.repeat(message.length + 4)}\r`)
      if (finalMessage) console.log(finalMessage)
    },
  }
}

// Y/n confirmation prompt
export function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`${question} ${dim('(Y/n)')} `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() !== 'n')
    })
  })
}

// Error and exit
export function fatal(message) {
  console.error(`${symbols.error} ${message}`)
  process.exit(1)
}
