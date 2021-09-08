// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright 2021 the denosaurs team. All rights reserved. MIT license.
// deno-lint-ignore-file

export const brand = Symbol("[[webidl.brand]]");

export function assertBranded(self, prototype) {
  if (!(self instanceof prototype) || self[brand] !== brand) {
    throw new TypeError("Illegal invocation");
  }
}

export function requiredArguments(length, required, opts = {}) {
  if (length < required) {
    const errMsg = `${
      opts.prefix ? opts.prefix + ": " : ""
    }${required} argument${
      required === 1 ? "" : "s"
    } required, but only ${length} present.`;
    throw new TypeError(errMsg);
  }
}

export function createDictionaryConverter(name, ...dictionaries) {
  let hasRequiredKey = false;
  const allMembers = [];
  for (const members of dictionaries) {
    for (const member of members) {
      if (member.required) {
        hasRequiredKey = true;
      }
      allMembers.push(member);
    }
  }
  allMembers.sort((a, b) => {
    if (a.key == b.key) {
      return 0;
    }
    return a.key < b.key ? -1 : 1;
  });

  const defaultValues = {};
  for (const member of allMembers) {
    if ("defaultValue" in member) {
      const idlMemberValue = member.defaultValue;
      const imvType = typeof idlMemberValue;
      // Copy by value types can be directly assigned, copy by reference types
      // need to be re-created for each allocation.
      if (
        imvType === "number" || imvType === "boolean" ||
        imvType === "string" || imvType === "bigint" ||
        imvType === "undefined"
      ) {
        defaultValues[member.key] = member.converter(idlMemberValue, {});
      } else {
        Object.defineProperty(defaultValues, member.key, {
          get() {
            return member.converter(idlMemberValue, member.defaultValue);
          },
          enumerable: true,
        });
      }
    }
  }

  return function (V, opts = {}) {
    const typeV = type(V);
    switch (typeV) {
      case "Undefined":
      case "Null":
      case "Object":
        break;
      default:
        throw makeException(
          TypeError,
          "can not be converted to a dictionary",
          opts,
        );
    }
    const esDict = V;

    const idlDict = { ...defaultValues };

    // NOTE: fast path Null and Undefined.
    if ((V === undefined || V === null) && !hasRequiredKey) {
      return idlDict;
    }

    for (const member of allMembers) {
      const key = member.key;

      let esMemberValue;
      if (typeV === "Undefined" || typeV === "Null") {
        esMemberValue = undefined;
      } else {
        esMemberValue = esDict[key];
      }

      if (esMemberValue !== undefined) {
        const context = `'${key}' of '${name}'${
          opts.context ? ` (${opts.context})` : ""
        }`;
        const converter = member.converter;
        const idlMemberValue = converter(esMemberValue, { ...opts, context });
        idlDict[key] = idlMemberValue;
      } else if (member.required) {
        throw makeException(
          TypeError,
          `can not be converted to '${name}' because '${key}' is required in '${name}'.`,
          { ...opts },
        );
      }
    }

    return idlDict;
  };
}

export const converters = {};

converters["DOMString"] = (V, opts = {}) => {
  if (opts.treatNullAsEmptyString && V === null) {
    return "";
  }

  if (typeof V === "symbol") {
    throw makeException(
      TypeError,
      "is a symbol, which cannot be converted to a string",
      opts,
    );
  }

  return String(V);
};

converters["USVString"] = (V, opts) => {
  const S = converters.DOMString(V, opts);
  const n = S.length;
  let U = "";
  for (let i = 0; i < n; ++i) {
    const c = S.charCodeAt(i);
    if (c < 0xd800 || c > 0xdfff) {
      U += String.fromCodePoint(c);
    } else if (0xdc00 <= c && c <= 0xdfff) {
      U += String.fromCodePoint(0xfffd);
    } else if (i === n - 1) {
      U += String.fromCodePoint(0xfffd);
    } else {
      const d = S.charCodeAt(i + 1);
      if (0xdc00 <= d && d <= 0xdfff) {
        const a = c & 0x3ff;
        const b = d & 0x3ff;
        U += String.fromCodePoint((2 << 15) + (2 << 9) * a + b);
        ++i;
      } else {
        U += String.fromCodePoint(0xfffd);
      }
    }
  }
  return U;
};

converters["URLPatternInput"] = (V, opts) => {
  if (typeof V == "object") {
    return converters.URLPatternInit(V, opts);
  }
  return converters.USVString(V, opts);
};

converters["URLPatternInit"] = createDictionaryConverter("URLPatternInit", [
  { key: "protocol", converter: converters.USVString },
  { key: "username", converter: converters.USVString },
  { key: "password", converter: converters.USVString },
  { key: "hostname", converter: converters.USVString },
  { key: "port", converter: converters.USVString },
  { key: "pathname", converter: converters.USVString },
  { key: "search", converter: converters.USVString },
  { key: "hash", converter: converters.USVString },
  { key: "baseURL", converter: converters.USVString },
]);
