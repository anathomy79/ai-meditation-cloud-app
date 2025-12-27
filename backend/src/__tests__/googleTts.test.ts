import { GoogleTtsClient } from "../tts/googleTts";

describe("GoogleTtsClient", () => {
  it("uses mocked TextToSpeechClient", async () => {
    const { synthesizeSpeechMock } = jest.requireMock(
      "@google-cloud/text-to-speech"
    ) as { synthesizeSpeechMock: jest.Mock };

    const client = new GoogleTtsClient();
    const result = await client.synthesizeSpeech("hello");

    expect(synthesizeSpeechMock).toHaveBeenCalled();
    expect(result).toEqual(Buffer.from("mock-audio"));
  });
});
