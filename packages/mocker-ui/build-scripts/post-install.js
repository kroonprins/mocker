const { spawn } = require('child_process')
const os = require('os').type()

let child
if (os === 'Linux' || os === 'Darwin') {
  child = spawn('./build-scripts/post-install.sh')
} else if (os === 'Windows_NT') {
  child = spawn('.\\build-scripts\\post-install.bat')
} else {
  throw new Error('Unsupported OS found: ' + os)
}

child.stdout.pipe(process.stdout)
child.stderr.pipe(process.stderr)
