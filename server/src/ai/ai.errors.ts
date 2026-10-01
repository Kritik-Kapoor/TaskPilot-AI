export class AiChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiChatError";
  }
}
