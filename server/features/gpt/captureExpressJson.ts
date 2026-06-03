import { Request, Response } from "express";

export async function captureExpressJson(
  handler: (req: Request, res: Response) => Promise<unknown>,
  req: Request,
): Promise<{ statusCode: number; body: any }> {
  let statusCode = 200;
  let body: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
  } as Response;

  await handler(req, res);

  return { statusCode, body };
}
