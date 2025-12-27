export const synthesizeSpeechMock = jest.fn(async () => [
  { audioContent: Buffer.from("mock-audio") }
]);

export class TextToSpeechClient {
  synthesizeSpeech = synthesizeSpeechMock;
}

const textToSpeech = {
  TextToSpeechClient
};

export default textToSpeech;
