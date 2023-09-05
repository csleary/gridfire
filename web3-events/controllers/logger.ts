class Logger {
  #contextName: string;

  constructor(contextName: string) {
    this.#contextName = `[${contextName}]`;
  }

  #getDate(): string {
    const timeZone = "Europe/Amsterdam";
    return new Date().toLocaleString("en-UK", { timeZone });
  }

  error(...args: any[]) {
    console.error(this.#getDate(), this.#contextName, ...args);
  }

  info(...args: any[]) {
    console.info(this.#getDate(), this.#contextName, ...args);
  }

  log(...args: any[]) {
    console.log(this.#getDate(), this.#contextName, ...args);
  }

  warn(...args: any[]) {
    console.warn(this.#getDate(), this.#contextName, ...args);
  }
}

export default new Logger("web3-events");
