import { IOptional, IOptionalSync, IRes } from '../types';
import { Res } from './res';

export class Optional<T> implements IOptional<T> {
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

  async unwrapOrNull() {
    try {
      const val = await this.#val;
      return val ? val : null;
    } catch (e) {
      return null;
    }
  }

  async unwrapOrThrow(error: IRes = Res.serverError()) {
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

class OptionalSync<T> implements IOptionalSync<T> {
  readonly #val: T | null | undefined;

  constructor(val?: T | null) {
    this.#val = val;
  }

  unwrapOrNull(): T | null {
    if (this.#val) return this.#val;
    else return null;
  }

  unwrapOrThrow(error: IRes = Res.serverError()): T {
    if (this.#val) return this.#val;
    else throw error;
  }
}
