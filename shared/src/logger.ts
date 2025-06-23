import os from "node:os";

const { NODE_ENV } = process.env;

class Logger {
  #contextName: string;
  #hostname: string;

  constructor(contextName: string) {
    this.#contextName = `[${contextName}]`;
    this.#hostname = NODE_ENV === "production" ? os.hostname() : process.cwd().split("/").pop() || "";
  }

  #getDate(): string {
    const timeZone = "Europe/Amsterdam";
    return new Date().toLocaleString("en-UK", { timeZone });
  }

  error(...args: any[]) {
    console.error(this.#getDate(), this.#hostname, this.#contextName, ...args);
  }

  info(...args: any[]) {
    console.info(this.#getDate(), this.#hostname, this.#contextName, ...args);
  }

  log(...args: any[]) {
    console.log(this.#getDate(), this.#hostname, this.#contextName, ...args);
  }

  warn(...args: any[]) {
    console.warn(this.#getDate(), this.#hostname, this.#contextName, ...args);
  }
}

export default Logger;
