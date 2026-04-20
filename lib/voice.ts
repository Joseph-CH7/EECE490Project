export async function speak(text: string) {
  if (typeof window === "undefined") return;
  if (!text.trim()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

  const preferredVoice =
    voices.find((v) => v.name === "Google US English") ||
    voices.find((v) => v.name === "Alex") || 
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  } else {
    utterance.lang = "en-US";
  }

  utterance.rate = 0.95;
  utterance.pitch = 1;

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("Speech synthesis failed"));
    window.speechSynthesis.speak(utterance);
  });
}