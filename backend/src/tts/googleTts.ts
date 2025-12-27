import textToSpeech from "@google-cloud/text-to-speech";
import { config } from "../config";

export interface GoogleTtsOptions {
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
}

export class GoogleTtsClient {
  private client: textToSpeech.TextToSpeechClient;

  constructor() {
    this.client = new textToSpeech.TextToSpeechClient();
  }

  async synthesizeSpeech(text: string, options: GoogleTtsOptions = {}): Promise<Buffer> {
    const languageCode = options.languageCode ?? config.tts.language;
    const voiceName = options.voiceName ?? config.tts.voice;
    const speakingRate = options.speakingRate ?? config.tts.speakingRate;
    const voice = voiceName ? { languageCode, name: voiceName } : { languageCode };

    const [response] = await this.client.synthesizeSpeech({
      input: { text },
      voice,
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
      },
    });

    if (!response.audioContent) {
      throw new Error("Google TTS response missing audio content.");
    }

    const audioContent =
      response.audioContent instanceof Buffer
        ? response.audioContent
        : Buffer.from(response.audioContent as Uint8Array);

    return audioContent;
  }
}
