const { detectLanguageSimple } = require('../lib/language-detection.ts')

function runTests() {
  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`)
      failed++
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed')
  }

  console.log('\n--- Running Language Detection Tests ---\n')

  test('detects Japanese text', () => {
    const result = detectLanguageSimple('これは日本語です')
    assert(result.language === 'ja', `Expected ja, got ${result.language}`)
  })

  test('detects Korean text', () => {
    const result = detectLanguageSimple('안녕하세요')
    assert(result.language === 'ko', `Expected ko, got ${result.language}`)
  })

  test('detects Arabic text', () => {
    const result = detectLanguageSimple('مرحبا بالعالم')
    assert(result.language === 'ar', `Expected ar, got ${result.language}`)
  })

  test('detects Russian text', () => {
    const result = detectLanguageSimple('Привет мир')
    assert(result.language === 'ru', `Expected ru, got ${result.language}`)
  })

  test('detects English text', () => {
    const result = detectLanguageSimple('hello world')
    assert(result.language === 'en', `Expected en, got ${result.language}`)
  })

  test('detects Spanish text', () => {
    const result = detectLanguageSimple('hola mundo')
    assert(result.language === 'es', `Expected es, got ${result.language}`)
  })

  test('detects French text', () => {
    const result = detectLanguageSimple('bonjour monde')
    assert(result.language === 'fr', `Expected fr, got ${result.language}`)
  })

  test('detects German text', () => {
    const result = detectLanguageSimple('hallo welt')
    assert(result.language === 'de', `Expected de, got ${result.language}`)
  })

  test('detects Chinese text', () => {
    const result = detectLanguageSimple('你好世界')
    assert(result.language === 'zh', `Expected zh, got ${result.language}`)
  })

  test('returns confidence score', () => {
    const result = detectLanguageSimple('hello')
    assert(typeof result.confidence === 'number', 'confidence should be a number')
    assert(result.confidence > 0, 'confidence should be greater than 0')
  })

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests()