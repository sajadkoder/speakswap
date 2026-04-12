const { spawn } = require('child_process')
const path = require('path')

function runTestFile(file) {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', [file], {
      cwd: path.dirname(file),
      stdio: 'inherit'
    })
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Test exited with code ${code}`))
      }
    })
  })
}

async function main() {
  const testDir = path.join(__dirname)
  const fs = require('fs')
  
  const testFiles = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.test.js'))
    .map(f => path.join(testDir, f))
  
  console.log(`Running ${testFiles.length} test file(s)...\n`)
  
  for (const file of testFiles) {
    try {
      await runTestFile(file)
    } catch (err) {
      console.error(`Failed: ${err.message}`)
      process.exit(1)
    }
  }
  
  console.log('\n✅ All tests passed!')
}

main()