import { HttpMethod, Path, PathRule } from '../utils';

export class SecurityBuilder {
  #currentPath: Path | undefined;
  #currentRule: PathRule | undefined;
  #currentMethod: HttpMethod | 'ALL' = 'ALL';
  readonly #paths: Record<string, Path>;

  constructor() {
    this.#paths = {
      '*': {
        rules: {
          ALL: { authRequired: false, roles: '*' },
        },
        paths: {},
      },
    };

    this.#currentPath = this.#paths['*'];
  }

  global() {
    if (this.#paths['*']) this.#currentPath = this.#paths['*'];
    return this;
  }

  path(val: string) {
    let path: Path | undefined;
    const pathKeys = val.split('/');

    for (const key in pathKeys) {
      const pathKey = pathKeys[key]?.trim();
      if (!pathKey || pathKey === '/') continue;

      if (!path) {
        if (!this.#paths[pathKey])
          this.#paths[pathKey] = { paths: {}, rules: { ALL: {} } };

        path = this.#paths[pathKey];
      } else {
        if (!path.paths[pathKey])
          path.paths[pathKey] = { paths: {}, rules: { ALL: {} } };

        path = path?.paths[pathKey];
      }
    }

    this.#currentPath = path;
    this.#currentMethod = 'ALL';
    return this;
  }

  roles(...roles: string[]) {
    this.#setSelectedRule();
    if (!this.#currentRule) return this;

    this.#currentRule.roles = roles;
    return this;
  }

  allRoles() {
    this.#setSelectedRule();
    if (!this.#currentRule) return this;

    this.#currentRule.roles = '*';
    return this;
  }

  authorized(required = true) {
    this.#setSelectedRule();
    if (!this.#currentRule) return this;

    this.#currentRule.authRequired = required;
    return this;
  }

  method(val: HttpMethod | 'ALL') {
    if (!this.#currentPath) return this;
    if (!this.#currentPath.rules[val]) this.#currentPath.rules[val] = {};

    this.#currentMethod = val;
    return this;
  }

  #setSelectedRule() {
    const currentPath = this.#currentPath ?? this.#paths['*'];
    if (currentPath) {
      const selectedRule = currentPath.rules[this.#currentMethod];
      if (selectedRule) this.#currentRule = selectedRule;
    }
  }

  toString() {
    return JSON.stringify(this.#paths);
  }

  getRule(route: string, method: HttpMethod | 'ALL') {
    const rule: PathRule = { authRequired: false, roles: '*' };

    const pathKeys = route
      .trim()
      .replace(/^\/|\/$/g, '')
      .split('/');

    Object.assign(rule, {
      roles: this.#paths['*']?.rules?.ALL?.roles ?? rule.roles,
      authRequired:
        this.#paths['*']?.rules?.ALL?.authRequired ?? rule.authRequired,
    });

    let path: Path | undefined;

    for (const key in pathKeys) {
      const pathKey = pathKeys[key]?.trim();

      if (!pathKey || pathKey === '/') continue;
      if (!path) path = this.#paths[pathKey];
      else path = path.paths[pathKey];

      if (!path) break;

      Object.assign(rule, {
        roles:
          path.rules[method]?.roles ??
          path.rules.ALL?.roles ??
          path.paths['*']?.rules.ALL?.roles ??
          rule.roles,
        authRequired:
          path.rules[method]?.authRequired ??
          path.rules.ALL?.authRequired ??
          path.paths['*']?.rules?.ALL?.authRequired ??
          rule.authRequired,
      });
    }

    return rule;
  }
}
