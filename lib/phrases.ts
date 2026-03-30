type Phrase = { category: string; text: string }
type PhraseGroup = { name: string; phrases: Phrase[] }

export const commonPhrases: Record<string, PhraseGroup> = {
  ar: { name: 'Arabic', phrases: [
    { text: 'مرحبا', category: 'Greetings' },
    { text: 'شكرا جزيلا', category: 'Polite' },
    { text: 'أين الحمام؟', category: 'Travel' },
    { text: 'كم السعر؟', category: 'Shopping' },
    { text: 'لا أفهم', category: 'Communication' },
    { text: 'أحتاج إلى طبيب', category: 'Emergency' },
  ] },
  de: { name: 'German', phrases: [
    { text: 'Hallo, wie geht es Ihnen?', category: 'Greetings' },
    { text: 'Vielen Dank', category: 'Polite' },
    { text: 'Wo ist die Toilette?', category: 'Travel' },
    { text: 'Wie viel kostet das?', category: 'Shopping' },
    { text: 'Ich verstehe nicht', category: 'Communication' },
    { text: 'Ich brauche einen Arzt', category: 'Emergency' },
  ] },
  en: { name: 'English', phrases: [
    { text: 'Hello, how are you?', category: 'Greetings' },
    { text: 'Thank you very much', category: 'Polite' },
    { text: 'Where is the bathroom?', category: 'Travel' },
    { text: 'How much does this cost?', category: 'Shopping' },
    { text: "I don't understand", category: 'Communication' },
    { text: 'I need a doctor', category: 'Emergency' },
  ] },
  es: { name: 'Spanish', phrases: [
    { text: 'Hola, ¿cómo estás?', category: 'Greetings' },
    { text: 'Muchas gracias', category: 'Polite' },
    { text: '¿Dónde está el baño?', category: 'Travel' },
    { text: '¿Cuánto cuesta esto?', category: 'Shopping' },
    { text: 'No entiendo', category: 'Communication' },
    { text: 'Necesito un médico', category: 'Emergency' },
  ] },
  fr: { name: 'French', phrases: [
    { text: 'Bonjour, comment allez-vous ?', category: 'Greetings' },
    { text: 'Merci beaucoup', category: 'Polite' },
    { text: 'Où sont les toilettes ?', category: 'Travel' },
    { text: 'Combien ça coûte ?', category: 'Shopping' },
    { text: 'Je ne comprends pas', category: 'Communication' },
    { text: "J'ai besoin d'un médecin", category: 'Emergency' },
  ] },
  hi: { name: 'Hindi', phrases: [
    { text: 'नमस्ते, आप कैसे हैं?', category: 'Greetings' },
    { text: 'बहुत धन्यवाद', category: 'Polite' },
    { text: 'शौचालय कहाँ है?', category: 'Travel' },
    { text: 'यह कितने का है?', category: 'Shopping' },
    { text: 'मुझे समझ नहीं आया', category: 'Communication' },
    { text: 'मुझे डॉक्टर चाहिए', category: 'Emergency' },
  ] },
  it: { name: 'Italian', phrases: [
    { text: 'Ciao, come stai?', category: 'Greetings' },
    { text: 'Grazie mille', category: 'Polite' },
    { text: "Dov'è il bagno?", category: 'Travel' },
    { text: 'Quanto costa questo?', category: 'Shopping' },
    { text: 'Non capisco', category: 'Communication' },
    { text: 'Ho bisogno di un medico', category: 'Emergency' },
  ] },
  ja: { name: 'Japanese', phrases: [
    { text: 'こんにちは、お元気ですか？', category: 'Greetings' },
    { text: 'ありがとうございます', category: 'Polite' },
    { text: 'トイレはどこですか？', category: 'Travel' },
    { text: 'これはいくらですか？', category: 'Shopping' },
    { text: '分かりません', category: 'Communication' },
    { text: '医者を呼んでください', category: 'Emergency' },
  ] },
  ko: { name: 'Korean', phrases: [
    { text: '안녕하세요, 잘 지내세요?', category: 'Greetings' },
    { text: '정말 감사합니다', category: 'Polite' },
    { text: '화장실이 어디에 있나요?', category: 'Travel' },
    { text: '이거 얼마예요?', category: 'Shopping' },
    { text: '이해가 안 돼요', category: 'Communication' },
    { text: '의사를 불러주세요', category: 'Emergency' },
  ] },
  pt: { name: 'Portuguese', phrases: [
    { text: 'Olá, como você está?', category: 'Greetings' },
    { text: 'Muito obrigado', category: 'Polite' },
    { text: 'Onde fica o banheiro?', category: 'Travel' },
    { text: 'Quanto custa isto?', category: 'Shopping' },
    { text: 'Eu não entendo', category: 'Communication' },
    { text: 'Preciso de um médico', category: 'Emergency' },
  ] },
  ru: { name: 'Russian', phrases: [
    { text: 'Привет, как дела?', category: 'Greetings' },
    { text: 'Большое спасибо', category: 'Polite' },
    { text: 'Где туалет?', category: 'Travel' },
    { text: 'Сколько это стоит?', category: 'Shopping' },
    { text: 'Я не понимаю', category: 'Communication' },
    { text: 'Мне нужен врач', category: 'Emergency' },
  ] },
  zh: { name: 'Chinese', phrases: [
    { text: '你好，你好吗？', category: 'Greetings' },
    { text: '非常感谢', category: 'Polite' },
    { text: '洗手间在哪里？', category: 'Travel' },
    { text: '这个多少钱？', category: 'Shopping' },
    { text: '我不明白', category: 'Communication' },
    { text: '我需要医生', category: 'Emergency' },
  ] },
}

export const categories = ['Greetings', 'Polite', 'Travel', 'Shopping', 'Communication', 'Emergency']

export const getPhrasesByLanguage = (langCode: string) => commonPhrases[langCode] || commonPhrases.en

export const getPhrasesByCategory = (langCode: string, category: string) =>
  getPhrasesByLanguage(langCode).phrases.filter((phrase) => phrase.category === category)
