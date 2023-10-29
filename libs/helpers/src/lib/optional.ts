import { CustomRes } from './custom-res';

export class Optional<T> {
  readonly #val: Promise<T | null | undefined>;

  constructor(val: Promise<T | null | undefined>) {
    this.#val = val;
  }

  static of<T>(val: Promise<T>) {
    return new Optional<T>(val);
  }
  static sync<T>(val?: T | null) {
    return new OptionalSync(val);
  }

  async elseNull() {
    try {
      const val = await this.#val;
      return val ? val : null;
    } catch (e) {
      console.error(`unwrap error :: `, e);
      return null;
    }
  }

  async elseReturn(defaultValue: T) {
    try {
      const val = await this.#val;
      return val ? val : defaultValue;
    } catch (e) {
      console.error(`unwrap error :: `, e);
      return defaultValue;
    }
  }

  async elseThrow(error = CustomRes.serverError()) {
    let val;

    try {
      val = await this.#val;
    } catch (e) {
      console.error(`unwrap error :: `, e);
      throw error;
    }

    if (!val) throw error;
    return val;
  }
}

class OptionalSync<T> {
  readonly #val: T | null | undefined;

  constructor(val?: T | null) {
    this.#val = val;
  }

  elseNull() {
    return this.#val ?? null;
  }

  elseReturn(defaultValue: T) {
    return this.#val ?? defaultValue;
  }

  elseThrow(error = CustomRes.serverError()): T {
    if (this.#val) return this.#val;
    else throw error;
  }
}
