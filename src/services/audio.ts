/**
 * Audio Services: Text-To-Speech (TTS) and Speech-To-Text (STT)
 */

export function playTTS(textStr: string): void {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(textStr);
  utterance.volume = 1;
  utterance.rate = 1.1;
  utterance.pitch = 0.8;

  let voices = synth.getVoices();
  const pickVoice = (vList: SpeechSynthesisVoice[]) => {
    return (
      vList.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) ||
      vList[0]
    );
  };

  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = synth.getVoices();
      const brutalVoice = pickVoice(voices);
      if (brutalVoice) utterance.voice = brutalVoice;
      synth.speak(utterance);
    };
  } else {
    const brutalVoice = pickVoice(voices);
    if (brutalVoice) utterance.voice = brutalVoice;
    synth.speak(utterance);
  }
}

export function haltTTS(): void {
  window.speechSynthesis.cancel();
}

export interface STTOptions {
  outputLang: string;
  groqKey?: string;
  onListening: () => void;
  onDecoded: (text: string) => void;
  onError: (errorText: string) => void;
  onEnd: () => void;
}

export async function startSTT(options: STTOptions): Promise<void> {
  const { outputLang, groqKey, onListening, onDecoded, onError, onEnd } = options;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  // 1. Try Native Browser Speech Recognition
  if (SpeechRecognition) {
    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        outputLang === 'Spanish'
          ? 'es-ES'
          : outputLang === 'French'
          ? 'fr-FR'
          : outputLang === 'German'
          ? 'de-DE'
          : outputLang === 'Hindi'
          ? 'hi-IN'
          : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      onListening();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onDecoded(transcript);
        onEnd();
      };

      recognition.onerror = (e: any) => {
        onError(e.error || 'MICROPHONE_ERROR');
        onEnd();
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();
      return;
    } catch (e) {
      console.warn('Native speech recognition failed, trying Groq fallback', e);
    }
  }

  // 2. Fallback: Groq Whisper API
  if (groqKey) {
    onListening();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');

        try {
          const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${groqKey}` },
            body: formData
          });
          const data = await res.json();
          if (data.text) {
            onDecoded(data.text);
          } else {
            throw new Error(data.error?.message || 'STT Failed');
          }
        } catch (e: any) {
          onError(e.message || 'VOCAL_INPUT_REJECTED');
        } finally {
          onEnd();
        }
      });

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 5000);
    } catch (err: any) {
      onError(`MIC_ACCESS_DENIED // ${err.message}`);
      onEnd();
    }
  } else {
    onError('Browser Speech Recognition not supported and no Groq Whisper key provided.');
    onEnd();
  }
}
