export class LlmProviderError extends Error {
  status: number;
  actionCode: string;
  provider: string;
  actionUrl: string;

  constructor(message: string, actionCode: string, provider = "auto", status = 400, actionUrl = "/profile") {
    super(message);
    this.name = "LlmProviderError";
    this.status = status;
    this.actionCode = actionCode;
    this.provider = provider;
    this.actionUrl = actionUrl;
  }
}
