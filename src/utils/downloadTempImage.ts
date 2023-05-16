import { temporaryWrite, FileOptions } from "tempy";
import fetch from "cross-fetch";

export default async function downloadTempImage(url: string, name?: string) {
  const response = await fetch(url);

  if (response.status !== 200) {
    throw new Error(`File download failed. Server responded with ${response.status}`);
  }

  const data = await response.arrayBuffer();

  if (data === null) {
    throw new Error("Unable to read image response");
  }

  let tempyOpt: FileOptions;
  if (name) {
    tempyOpt = { name: `${name}.png` };
  } else {
    tempyOpt = { name: "image.png" };
  }

  let file: string;
  try {
    file = await temporaryWrite(Buffer.from(data), tempyOpt);
  } catch (e) {
    const error = e as Error;
    throw new Error(`Failed to download image: "${error.message}"`);
  }

  return file;
}
