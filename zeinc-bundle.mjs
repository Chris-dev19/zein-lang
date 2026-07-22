var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// build/dev/javascript/zein/zein.mjs
var zein_exports = {};
__export(zein_exports, {
  halt: () => halt,
  main: () => main,
  run_js_native: () => run_js
});
module.exports = __toCommonJS(zein_exports);

// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array2, tail) {
    let t = tail || new Empty();
    for (let i = array2.length - 1; i >= 0; --i) {
      t = new NonEmpty(array2[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var List$Empty = () => new Empty();
var List$isEmpty = (value) => value instanceof Empty;
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value) => value instanceof NonEmpty;
var List$NonEmpty$first = (value) => value.head;
var List$NonEmpty$rest = (value) => value.tail;
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index2) {
    if (index2 < 0 || index2 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index2);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated
   *
   * @returns {number}
   */
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index2) {
  if (bitOffset === 0) {
    return buffer[index2] ?? 0;
  } else {
    const a = buffer[index2] << bitOffset & 255;
    const b = buffer[index2 + 1] >> 8 - bitOffset;
    return a | b;
  }
}
var UtfCodepoint = class {
  constructor(value) {
    this.value = value;
  }
};
var Result = class _Result extends CustomType {
  static isResult(data2) {
    return data2 instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
};
var Result$Ok = (value) => new Ok(value);
var Error2 = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
};
var Result$Error = (detail) => new Error2(detail);
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a = values2.pop();
    let b = values2.pop();
    if (a === b) continue;
    if (!isObject(a) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    const ka = keys2(a);
    const kb = keys2(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      values2.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c)) return false;
  return a.constructor === b.constructor;
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module2, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module2;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/argv/argv_ffi.mjs
function load() {
  if (globalThis.process) {
    const [runtime2, program2, ...args2] = process.argv;
    return [runtime2, program2, List.fromArray(args2)];
  }
  if (globalThis.Deno) {
    const runtime2 = Deno.execPath();
    const program2 = new URL(Deno.mainModule).pathname;
    const args2 = List.fromArray(Deno.args);
    return [runtime2, program2, args2];
  }
  const runtime = "browser";
  const program = document.location.toString();
  const args = List.fromArray([]);
  return [runtime, program, args];
}

// build/dev/javascript/argv/argv.mjs
var Argv = class extends CustomType {
  constructor(runtime, program, arguments$) {
    super();
    this.runtime = runtime;
    this.program = program;
    this.arguments = arguments$;
  }
};
function load2() {
  let $ = load();
  let runtime = $[0];
  let program = $[1];
  let arguments$ = $[2];
  return new Argv(runtime, program, arguments$);
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/dict.mjs
var Dict = class {
  constructor(size2, root) {
    this.size = size2;
    this.root = root;
  }
};
var bits = 5;
var mask = (1 << bits) - 1;
function fold(dict2, state, fun) {
  const queue = [dict2.root];
  while (queue.length) {
    const node = queue.pop();
    const data2 = node.data;
    const edgesStart = data2.length - popcount(node.nodemap);
    for (let i = 0; i < edgesStart; i += 2) {
      state = fun(state, data2[i], data2[i + 1]);
    }
    for (let i = edgesStart; i < data2.length; ++i) {
      queue.push(data2[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function length_loop(loop$list, loop$count) {
  while (true) {
    let list2 = loop$list;
    let count = loop$count;
    if (list2 instanceof Empty) {
      return count;
    } else {
      let list$1 = list2.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list2) {
  return length_loop(list2, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list2) {
  return reverse_and_prepend(list2, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list2 = loop$list;
    let elem = loop$elem;
    if (list2 instanceof Empty) {
      return false;
    } else {
      let first$1 = list2.head;
      if (isEqual(first$1, elem)) {
        return true;
      } else {
        let rest$1 = list2.tail;
        loop$list = rest$1;
        loop$elem = elem;
      }
    }
  }
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list2, fun) {
  return map_loop(list2, fun, toList([]));
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let index2 = loop$index;
    let acc = loop$acc;
    if (list2 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let acc$1 = prepend(fun(first$1, index2), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index2 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list2, fun) {
  return index_map_loop(list2, fun, 0, toList([]));
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list2 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list2, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list2 = loop$list;
    let predicate = loop$predicate;
    if (list2 instanceof Empty) {
      return false;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let $ = predicate(first$1);
      if ($) {
        return $;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}
function each(loop$list, loop$f) {
  while (true) {
    let list2 = loop$list;
    let f = loop$f;
    if (list2 instanceof Empty) {
      return void 0;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      f(first$1);
      loop$list = rest$1;
      loop$f = f;
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return Result$Ok(parseInt(value));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function string_replace(string3, target, substitute) {
  return string3.replaceAll(target, substitute);
}
function string_length(string3) {
  if (string3 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string3.match(/./gsu).length;
  }
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string3.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string3) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string3)[Symbol.iterator]();
  }
}
function split(xs, pattern) {
  return arrayToList(xs.split(pattern));
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string3) {
  return string3.replace(trim_start_regex, "");
}
function trim_end(string3) {
  return string3.replace(trim_end_regex, "");
}
function console_log(term) {
  console.log(term);
}
function bit_array_to_string(bit_array2) {
  if (bit_array2.bitSize % 8 !== 0) {
    return Result$Error(Nil);
  }
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    if (bit_array2.bitOffset === 0) {
      return Result$Ok(decoder.decode(bit_array2.rawBuffer));
    } else {
      const buffer = new Uint8Array(bit_array2.byteSize);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = bit_array2.byteAt(i);
      }
      return Result$Ok(decoder.decode(buffer));
    }
  } catch {
    return Result$Error(Nil);
  }
}
function print(string3) {
  if (typeof process === "object" && process.stdout?.write) {
    process.stdout.write(string3);
  } else if (typeof Deno === "object") {
    Deno.stdout.writeSync(new TextEncoder().encode(string3));
  } else {
    console.log(string3);
  }
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float2) {
  const string3 = float2.toString().replace("+", "");
  if (string3.indexOf(".") >= 0) {
    return string3;
  } else {
    const index2 = string3.indexOf("e");
    if (index2 >= 0) {
      return string3.slice(0, index2) + ".0" + string3.slice(index2);
    } else {
      return string3 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true) return "True";
    if (v === false) return "False";
    if (v === null) return "//js(null)";
    if (v === void 0) return "Nil";
    if (t === "string") return this.#string(v);
    if (t === "bigint" || Number.isInteger(v)) return v.toString();
    if (t === "number") return float_to_string(v);
    if (v instanceof UtfCodepoint) return this.#utfCodepoint(v);
    if (v instanceof BitArray) return this.#bit_array(v);
    if (v instanceof RegExp) return `//js(${v})`;
    if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error) return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map4) {
    let body = "dict.from_list([";
    let first = true;
    body = fold(map4, body, (body2, key, value) => {
      if (!first) body2 = body2 + ", ";
      first = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list2) {
    if (List$isEmpty(list2)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list2;
    while (List$isNonEmpty(current)) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += String.fromCharCode(element);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case "\n":
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "	":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += '\\"';
          break;
        default:
          if (char < " " || char > "~" && char < "\xA0") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0; i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
};
function arrayToList(array2) {
  let list2 = List$Empty();
  let i = array2.length;
  while (i--) {
    list2 = List$NonEmpty(array2[i], list2);
  }
  return list2;
}
function isList(data2) {
  return List$isEmpty(data2) || List$isNonEmpty(data2);
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string3, pattern, substitute) {
  let _pipe = string3;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string3 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string3;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}
function trim(string3) {
  let _pipe = string3;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function inspect2(term) {
  let _pipe = term;
  let _pipe$1 = inspect(_pipe);
  return identity(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function json_to_string(json) {
  return JSON.stringify(json);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity2(x) {
  return x;
}
function array(list2) {
  const array2 = [];
  while (List$isNonEmpty(list2)) {
    array2.push(List$NonEmpty$first(list2));
    list2 = List$NonEmpty$rest(list2);
  }
  return array2;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
function to_string2(json) {
  return json_to_string(json);
}
function string2(input) {
  return identity2(input);
}
function int2(input) {
  return identity2(input);
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from2) {
  return array(from2);
}

// build/dev/javascript/simplifile/simplifile_js.mjs
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
function readBits(filepath) {
  return gleamResult(() => {
    const contents = import_node_fs.default.readFileSync(import_node_path.default.normalize(filepath));
    return new BitArray(new Uint8Array(contents));
  });
}
function gleamResult(op) {
  try {
    const val = op();
    return new Ok(val);
  } catch (e) {
    return new Error2(cast_error(e.code));
  }
}
function cast_error(error_code) {
  switch (error_code) {
    case "EACCES":
      return new Eacces();
    case "EAGAIN":
      return new Eagain();
    case "EBADF":
      return new Ebadf();
    case "EBADMSG":
      return new Ebadmsg();
    case "EBUSY":
      return new Ebusy();
    case "EDEADLK":
      return new Edeadlk();
    case "EDEADLOCK":
      return new Edeadlock();
    case "EDQUOT":
      return new Edquot();
    case "EEXIST":
      return new Eexist();
    case "EFAULT":
      return new Efault();
    case "EFBIG":
      return new Efbig();
    case "EFTYPE":
      return new Eftype();
    case "EINTR":
      return new Eintr();
    case "EINVAL":
      return new Einval();
    case "EIO":
      return new Eio();
    case "EISDIR":
      return new Eisdir();
    case "ELOOP":
      return new Eloop();
    case "EMFILE":
      return new Emfile();
    case "EMLINK":
      return new Emlink();
    case "EMULTIHOP":
      return new Emultihop();
    case "ENAMETOOLONG":
      return new Enametoolong();
    case "ENFILE":
      return new Enfile();
    case "ENOBUFS":
      return new Enobufs();
    case "ENODEV":
      return new Enodev();
    case "ENOLCK":
      return new Enolck();
    case "ENOLINK":
      return new Enolink();
    case "ENOENT":
      return new Enoent();
    case "ENOMEM":
      return new Enomem();
    case "ENOSPC":
      return new Enospc();
    case "ENOSR":
      return new Enosr();
    case "ENOSTR":
      return new Enostr();
    case "ENOSYS":
      return new Enosys();
    case "ENOBLK":
      return new Enotblk();
    case "ENOTDIR":
      return new Enotdir();
    case "ENOTSUP":
      return new Enotsup();
    case "ENXIO":
      return new Enxio();
    case "EOPNOTSUPP":
      return new Eopnotsupp();
    case "EOVERFLOW":
      return new Eoverflow();
    case "EPERM":
      return new Eperm();
    case "EPIPE":
      return new Epipe();
    case "ERANGE":
      return new Erange();
    case "EROFS":
      return new Erofs();
    case "ESPIPE":
      return new Espipe();
    case "ESRCH":
      return new Esrch();
    case "ESTALE":
      return new Estale();
    case "ETXTBSY":
      return new Etxtbsy();
    case "EXDEV":
      return new Exdev();
    case "NOTUTF8":
      return new NotUtf8();
    default:
      return new Unknown(error_code);
  }
}

// build/dev/javascript/simplifile/simplifile.mjs
var Eacces = class extends CustomType {
};
var Eagain = class extends CustomType {
};
var Ebadf = class extends CustomType {
};
var Ebadmsg = class extends CustomType {
};
var Ebusy = class extends CustomType {
};
var Edeadlk = class extends CustomType {
};
var Edeadlock = class extends CustomType {
};
var Edquot = class extends CustomType {
};
var Eexist = class extends CustomType {
};
var Efault = class extends CustomType {
};
var Efbig = class extends CustomType {
};
var Eftype = class extends CustomType {
};
var Eintr = class extends CustomType {
};
var Einval = class extends CustomType {
};
var Eio = class extends CustomType {
};
var Eisdir = class extends CustomType {
};
var Eloop = class extends CustomType {
};
var Emfile = class extends CustomType {
};
var Emlink = class extends CustomType {
};
var Emultihop = class extends CustomType {
};
var Enametoolong = class extends CustomType {
};
var Enfile = class extends CustomType {
};
var Enobufs = class extends CustomType {
};
var Enodev = class extends CustomType {
};
var Enolck = class extends CustomType {
};
var Enolink = class extends CustomType {
};
var Enoent = class extends CustomType {
};
var Enomem = class extends CustomType {
};
var Enospc = class extends CustomType {
};
var Enosr = class extends CustomType {
};
var Enostr = class extends CustomType {
};
var Enosys = class extends CustomType {
};
var Enotblk = class extends CustomType {
};
var Enotdir = class extends CustomType {
};
var Enotsup = class extends CustomType {
};
var Enxio = class extends CustomType {
};
var Eopnotsupp = class extends CustomType {
};
var Eoverflow = class extends CustomType {
};
var Eperm = class extends CustomType {
};
var Epipe = class extends CustomType {
};
var Erange = class extends CustomType {
};
var Erofs = class extends CustomType {
};
var Espipe = class extends CustomType {
};
var Esrch = class extends CustomType {
};
var Estale = class extends CustomType {
};
var Etxtbsy = class extends CustomType {
};
var Exdev = class extends CustomType {
};
var NotUtf8 = class extends CustomType {
};
var Unknown = class extends CustomType {
  constructor(inner) {
    super();
    this.inner = inner;
  }
};
function read(filepath) {
  let $ = readBits(filepath);
  if ($ instanceof Ok) {
    let bits2 = $[0];
    let $1 = bit_array_to_string(bits2);
    if ($1 instanceof Ok) {
      return $1;
    } else {
      return new Error2(new NotUtf8());
    }
  } else {
    return $;
  }
}

// build/dev/javascript/zein/ast.mjs
var Box = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LInt = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LFloat = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LBool = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var LString = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Add = class extends CustomType {
};
var Subtract = class extends CustomType {
};
var Multiply = class extends CustomType {
};
var Divide = class extends CustomType {
};
var Modulo = class extends CustomType {
};
var Equal = class extends CustomType {
};
var NotEqual = class extends CustomType {
};
var LessThan = class extends CustomType {
};
var GreaterThan = class extends CustomType {
};
var LessOrEqual = class extends CustomType {
};
var GreaterOrEqual = class extends CustomType {
};
var And = class extends CustomType {
};
var Or = class extends CustomType {
};
var Concat = class extends CustomType {
};
var Negate = class extends CustomType {
};
var Not = class extends CustomType {
};
var PLiteral = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PVariable = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var PWildcard = class extends CustomType {
};
var PVariant = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var MatchClause = class extends CustomType {
  constructor(pattern, guard2, body) {
    super();
    this.pattern = pattern;
    this.guard = guard2;
    this.body = body;
  }
};
var TNamed = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var TVariable = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var TFunction = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var TypeParam = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var VariantField = class extends CustomType {
  constructor(name, value_type) {
    super();
    this.name = name;
    this.value_type = value_type;
  }
};
var Variant = class extends CustomType {
  constructor(name, fields) {
    super();
    this.name = name;
    this.fields = fields;
  }
};
var DefFunction = class extends CustomType {
  constructor(name, params, return_type, body) {
    super();
    this.name = name;
    this.params = params;
    this.return_type = return_type;
    this.body = body;
  }
};
var DefType = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DefRecord = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DefAlias = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var DefLet = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var FunctionParam = class extends CustomType {
  constructor(name, param_type) {
    super();
    this.name = name;
    this.param_type = param_type;
  }
};
var SumType = class extends CustomType {
  constructor(name, params, variants) {
    super();
    this.name = name;
    this.params = params;
    this.variants = variants;
  }
};
var BlockExpr = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var BlockDef = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ELiteral = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EVariable = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var ECall = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EMethodCall = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var EFieldAccess = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EIndex = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EInfix = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var EUnary = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EReassign = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var ELet = class extends CustomType {
  constructor($0, $1, $2, $3) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
    this[3] = $3;
  }
};
var EBlock = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EIf = class extends CustomType {
  constructor($0, $1, $2, $3) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
    this[3] = $3;
  }
};
var EReturn = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EPipe = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var ERange = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EMatch = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var ELambda = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var EFor = class extends CustomType {
  constructor($0, $1, $2) {
    super();
    this[0] = $0;
    this[1] = $1;
    this[2] = $2;
  }
};
var EWhile = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var ERecord = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var EList = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Import = class extends CustomType {
  constructor(path2, alias) {
    super();
    this.path = path2;
    this.alias = alias;
  }
};
var Module = class extends CustomType {
  constructor(name, imports, definitions) {
    super();
    this.name = name;
    this.imports = imports;
    this.definitions = definitions;
  }
};

// build/dev/javascript/zein/codegen.mjs
function unwrap_ann(boxed) {
  let t = boxed[0];
  return generate_type(t);
}
function generate_type(t) {
  if (t instanceof TNamed) {
    let name = t[0];
    let params = t[1];
    let _block;
    if (params instanceof Empty) {
      _block = "";
    } else {
      let _block$1;
      let _pipe = params;
      let _pipe$1 = map2(_pipe, generate_type);
      _block$1 = join(_pipe$1, ", ");
      let inner = _block$1;
      _block = "<" + inner + ">";
    }
    let params_str = _block;
    return name + params_str;
  } else if (t instanceof TVariable) {
    let name = t[0];
    return name;
  } else {
    let params = t[0];
    let ret = t[1];
    let ret_expr = unwrap_ann(ret);
    let _block;
    let _pipe = params;
    let _pipe$1 = map2(_pipe, generate_type);
    _block = join(_pipe$1, ", ");
    let inner = _block;
    return "(" + inner + ") => " + ret_expr;
  }
}
function generate_record_type(rt) {
  let fields = map2(
    rt.fields,
    (f) => {
      return "  " + f.name + ": " + generate_type(f.field_type);
    }
  );
  return "// record " + rt.name + "\n{\n" + join(fields, ",\n") + "\n}";
}
function generate_sum_type(st) {
  let variants = map2(
    st.variants,
    (v) => {
      let fields = map2(
        v.fields,
        (f) => {
          return f.name + ": " + generate_type(f.value_type);
        }
      );
      let _block;
      if (fields instanceof Empty) {
        _block = "";
      } else {
        _block = " { " + join(fields, ", ") + " }";
      }
      let fields_str = _block;
      return "  " + v.name + fields_str;
    }
  );
  return "// type " + st.name + "\n" + join(variants, " |\n");
}
function generate_param(p) {
  let $ = p.param_type;
  if ($ instanceof Some) {
    let t = $[0];
    return p.name + " /** : " + generate_type(t) + " */";
  } else {
    return p.name;
  }
}
function indent(s) {
  let lines = split2(s, "\n");
  let _pipe = lines;
  let _pipe$1 = map2(_pipe, (line) => {
    return "  " + line;
  });
  return join(_pipe$1, "\n");
}
function escape_string(s) {
  let _pipe = s;
  let _pipe$1 = replace(_pipe, "\\", "\\\\");
  let _pipe$2 = replace(_pipe$1, '"', '\\"');
  let _pipe$3 = replace(_pipe$2, "\n", "\\n");
  return replace(_pipe$3, "	", "\\t");
}
function float_to_string2(f) {
  let s = trim(inspect2(f));
  let $ = contains_string(s, ".");
  if ($) {
    return s;
  } else {
    return s + ".0";
  }
}
function pattern_literal_op(lit) {
  if (lit instanceof LInt) {
    let n = lit[0];
    return "=== " + to_string(n);
  } else if (lit instanceof LFloat) {
    let f = lit[0];
    return "=== " + float_to_string2(f);
  } else if (lit instanceof LBool) {
    let $ = lit[0];
    if ($) {
      return "=== true";
    } else {
      return "=== false";
    }
  } else {
    let s = lit[0];
    return '=== "' + escape_string(s) + '"';
  }
}
function match_condition_field(pattern, index2) {
  if (pattern instanceof PLiteral) {
    let lit = pattern[0];
    return "__v.args[" + to_string(index2) + "] " + pattern_literal_op(
      lit
    );
  } else if (pattern instanceof PVariable) {
    return "true";
  } else if (pattern instanceof PWildcard) {
    return "true";
  } else {
    let name = pattern[0];
    let fields = pattern[1];
    let check = "__v.args[" + to_string(index2) + '].tag === "' + name + '"';
    if (fields instanceof Empty) {
      return check;
    } else {
      let field_checks = index_map(
        fields,
        (f, i) => {
          return match_condition_field(f, i);
        }
      );
      return check + " && " + join(field_checks, " && ");
    }
  }
}
function match_condition(pattern) {
  if (pattern instanceof PLiteral) {
    let lit = pattern[0];
    return "__v " + pattern_literal_op(lit);
  } else if (pattern instanceof PVariable) {
    return "true";
  } else if (pattern instanceof PWildcard) {
    return "true";
  } else {
    let name = pattern[0];
    let fields = pattern[1];
    let check = '__v.tag === "' + name + '"';
    if (fields instanceof Empty) {
      return check;
    } else {
      let field_checks = index_map(
        fields,
        (f, i) => {
          return match_condition_field(f, i);
        }
      );
      return check + " && " + join(field_checks, " && ");
    }
  }
}
function infix_op_string(op) {
  if (op instanceof Add) {
    return "+";
  } else if (op instanceof Subtract) {
    return "-";
  } else if (op instanceof Multiply) {
    return "*";
  } else if (op instanceof Divide) {
    return "/";
  } else if (op instanceof Modulo) {
    return "%";
  } else if (op instanceof Equal) {
    return "===";
  } else if (op instanceof NotEqual) {
    return "!==";
  } else if (op instanceof LessThan) {
    return "<";
  } else if (op instanceof GreaterThan) {
    return ">";
  } else if (op instanceof LessOrEqual) {
    return "<=";
  } else if (op instanceof GreaterOrEqual) {
    return ">=";
  } else if (op instanceof And) {
    return "&&";
  } else if (op instanceof Or) {
    return "||";
  } else {
    return "+";
  }
}
function generate_literal(lit) {
  if (lit instanceof LInt) {
    let n = lit[0];
    return to_string(n);
  } else if (lit instanceof LFloat) {
    let f = lit[0];
    return float_to_string2(f);
  } else if (lit instanceof LBool) {
    let $ = lit[0];
    if ($) {
      return "true";
    } else {
      return "false";
    }
  } else {
    let s = lit[0];
    return '"' + escape_string(s) + '"';
  }
}
function is_loop_expr(item) {
  if (item instanceof BlockExpr) {
    let $ = item[0];
    if ($ instanceof EFor) {
      return true;
    } else if ($ instanceof EWhile) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function unwrap_expr(boxed) {
  let expr = boxed[0];
  return generate_expression(expr);
}
function generate_match_clause(clause) {
  let cond = match_condition(clause.pattern);
  let body_str = generate_expression(clause.body);
  let _block;
  let $ = clause.guard;
  if ($ instanceof Some) {
    let g = $[0];
    _block = " && (" + generate_expression(g) + ")";
  } else {
    _block = "";
  }
  let guard_str = _block;
  return "if (" + cond + guard_str + ") { return " + body_str + "; }";
}
function generate_block_item(item) {
  if (item instanceof BlockExpr) {
    let expr = item[0];
    return generate_expression(expr);
  } else {
    let def = item[0];
    return generate_definition(def);
  }
}
function unwrap_body(boxed) {
  let expr = boxed[0];
  if (expr instanceof EBlock) {
    let items = expr[0];
    let _pipe = items;
    let _pipe$1 = map2(_pipe, generate_block_item);
    return join(_pipe$1, ";\n");
  } else {
    return generate_expression(expr);
  }
}
function generate_else_tail(alt_body) {
  let body = alt_body[0];
  if (body instanceof EIf) {
    let cond = body[0];
    let conseq = body[1];
    let else_ifs = body[2];
    let alt = body[3];
    return " else if (" + unwrap_expr(cond) + ") {\n" + indent(
      unwrap_body(conseq)
    ) + "\n}" + (() => {
      if (else_ifs instanceof Empty) {
        if (alt instanceof Some) {
          let a = alt[0];
          return generate_else_tail(a);
        } else {
          return "";
        }
      } else {
        let _block;
        let _pipe = else_ifs;
        let _pipe$1 = map2(
          _pipe,
          (pair) => {
            let elif_cond = pair[0];
            let elif_body = pair[1];
            return " else if (" + unwrap_expr(elif_cond) + ") {\n" + indent(
              unwrap_body(elif_body)
            ) + "\n}";
          }
        );
        _block = join(_pipe$1, "");
        let rest = _block;
        return rest + (() => {
          if (alt instanceof Some) {
            let a = alt[0];
            return generate_else_tail(a);
          } else {
            return "";
          }
        })();
      }
    })();
  } else {
    return " else {\n" + indent(unwrap_body(alt_body)) + "\n}";
  }
}
function generate_expression(expr) {
  if (expr instanceof ELiteral) {
    let lit = expr[0];
    return generate_literal(lit);
  } else if (expr instanceof EVariable) {
    let name = expr[0];
    return name;
  } else if (expr instanceof ECall) {
    let callee = expr[0];
    let args = expr[1];
    let inner = callee[0];
    let callee_str = generate_expression(inner);
    let _block;
    let _pipe = args;
    let _pipe$1 = map2(_pipe, generate_expression);
    _block = join(_pipe$1, ", ");
    let args_str = _block;
    if (inner instanceof EVariable) {
      let $ = inner[0];
      if ($ === "print") {
        return "console.log(" + args_str + ")";
      } else if ($ === "random_int") {
        return "Math.floor(Math.random() * (" + args_str + "))";
      } else {
        return callee_str + "(" + args_str + ")";
      }
    } else {
      return callee_str + "(" + args_str + ")";
    }
  } else if (expr instanceof EMethodCall) {
    let expr$1 = expr[0];
    let method = expr[1];
    let args = expr[2];
    let _block;
    let _pipe = args;
    let _pipe$1 = map2(_pipe, generate_expression);
    _block = join(_pipe$1, ", ");
    let args_str = _block;
    return unwrap_expr(expr$1) + "." + method + "(" + args_str + ")";
  } else if (expr instanceof EFieldAccess) {
    let expr$1 = expr[0];
    let field = expr[1];
    return unwrap_expr(expr$1) + "." + field;
  } else if (expr instanceof EIndex) {
    let expr$1 = expr[0];
    let index2 = expr[1];
    return unwrap_expr(expr$1) + "[" + unwrap_expr(index2) + "]";
  } else if (expr instanceof EInfix) {
    let left = expr[0];
    let op = expr[1];
    let right = expr[2];
    let op_str = infix_op_string(op);
    let left_str = unwrap_expr(left);
    let right_str = unwrap_expr(right);
    return left_str + " " + op_str + " " + right_str;
  } else if (expr instanceof EUnary) {
    let op = expr[0];
    let operand = expr[1];
    let _block;
    if (op instanceof Negate) {
      _block = "-";
    } else {
      _block = "!";
    }
    let op_str = _block;
    return op_str + unwrap_expr(operand);
  } else if (expr instanceof EReassign) {
    let name = expr[0];
    let value = expr[1];
    return name + " = " + unwrap_expr(value);
  } else if (expr instanceof ELet) {
    let name = expr[0];
    let t = expr[1];
    let value = expr[2];
    let body = expr[3];
    let _block;
    if (t instanceof Some) {
      let ann = t[0];
      _block = " /** : " + generate_type(ann) + " */";
    } else {
      _block = "";
    }
    let t_str = _block;
    return "let " + name + t_str + " = " + unwrap_expr(value) + ";\n" + unwrap_expr(
      body
    );
  } else if (expr instanceof EBlock) {
    let items = expr[0];
    let _block;
    let _pipe = items;
    let _pipe$1 = map2(_pipe, generate_block_item);
    _block = join(_pipe$1, ";\n");
    let items_str = _block;
    return "{\n" + indent(items_str) + "\n}";
  } else if (expr instanceof EIf) {
    let cond = expr[0];
    let conseq = expr[1];
    let else_ifs = expr[2];
    let alt = expr[3];
    let conseq_str = "if (" + unwrap_expr(cond) + ") {\n" + indent(
      unwrap_body(conseq)
    ) + "\n}";
    let _block;
    let _pipe = else_ifs;
    let _pipe$1 = map2(
      _pipe,
      (pair) => {
        let elif_cond = pair[0];
        let elif_body = pair[1];
        return " else if (" + unwrap_expr(elif_cond) + ") {\n" + indent(
          unwrap_body(elif_body)
        ) + "\n}";
      }
    );
    _block = join(_pipe$1, "");
    let else_ifs_str = _block;
    let _block$1;
    if (alt instanceof Some) {
      let alt_body = alt[0];
      _block$1 = generate_else_tail(alt_body);
    } else {
      _block$1 = "";
    }
    let else_tail = _block$1;
    return "(() => {\n" + indent(conseq_str + else_ifs_str + else_tail) + "\n})()";
  } else if (expr instanceof EReturn) {
    let value = expr[0];
    return "return " + unwrap_expr(value);
  } else if (expr instanceof EPipe) {
    let left = expr[0];
    let right = expr[1];
    return "(" + unwrap_expr(right) + ")(" + unwrap_expr(left) + ")";
  } else if (expr instanceof ERange) {
    let start = expr[0];
    let end_ = expr[1];
    let s = unwrap_expr(start);
    let e = unwrap_expr(end_);
    return "Array.from({length: (" + e + " - " + s + " + 1)}, (_, __i) => " + s + " + __i)";
  } else if (expr instanceof EMatch) {
    let value = expr[0];
    let clauses = expr[1];
    let _block;
    let _pipe = clauses;
    _block = map2(_pipe, generate_match_clause);
    let cases = _block;
    let cases_str = join(cases, " else ");
    return "(function() {\n" + indent(
      "const __v = " + unwrap_expr(value) + ";\n" + cases_str
    ) + "\n})()";
  } else if (expr instanceof ELambda) {
    let params = expr[0];
    let body = expr[2];
    let _block;
    let _pipe = params;
    let _pipe$1 = map2(_pipe, generate_param);
    _block = join(_pipe$1, ", ");
    let params_str = _block;
    return "(" + params_str + ") => " + unwrap_expr(body);
  } else if (expr instanceof EFor) {
    let name = expr[0];
    let iterable = expr[1];
    let body = expr[2];
    return "for (const " + name + " of " + unwrap_expr(iterable) + ") " + unwrap_expr(
      body
    );
  } else if (expr instanceof EWhile) {
    let cond = expr[0];
    let body = expr[1];
    return "while (" + unwrap_expr(cond) + ") " + unwrap_expr(body);
  } else if (expr instanceof ERecord) {
    let fields = expr[1];
    let _block;
    let _pipe = fields;
    let _pipe$1 = map2(
      _pipe,
      (pair) => {
        let fname = pair[0];
        let fexpr = pair[1];
        return fname + ": " + generate_expression(fexpr);
      }
    );
    _block = join(_pipe$1, ", ");
    let fields_str = _block;
    return "({ " + fields_str + " })";
  } else {
    let items = expr[0];
    let _block;
    let _pipe = items;
    let _pipe$1 = map2(_pipe, generate_expression);
    _block = join(_pipe$1, ", ");
    let items_str = _block;
    return "[" + items_str + "]";
  }
}
function generate_function_body(body) {
  if (body instanceof EBlock) {
    let items = body[0];
    let last_index = length(items) - 1;
    let _block;
    let _pipe = items;
    let _pipe$1 = index_map(
      _pipe,
      (item, idx) => {
        let s = generate_block_item(item);
        let $ = idx === last_index && !is_loop_expr(item);
        if ($) {
          return "return " + s;
        } else {
          return s;
        }
      }
    );
    let _pipe$2 = join(_pipe$1, ";\n");
    _block = indent(_pipe$2);
    let strings = _block;
    return strings;
  } else if (body instanceof EFor) {
    let _pipe = generate_expression(body);
    return indent(_pipe);
  } else if (body instanceof EWhile) {
    let _pipe = generate_expression(body);
    return indent(_pipe);
  } else {
    return "return " + (() => {
      let _pipe = generate_expression(body);
      return indent(_pipe);
    })();
  }
}
function generate_definition(def) {
  if (def instanceof DefFunction) {
    let name = def.name;
    let params = def.params;
    let ret_type = def.return_type;
    let body = def.body;
    let _block;
    let _pipe = params;
    let _pipe$1 = map2(_pipe, generate_param);
    _block = join(_pipe$1, ", ");
    let params_str = _block;
    let _block$1;
    if (ret_type instanceof Some) {
      let t = ret_type[0];
      _block$1 = " /** -> " + generate_type(t) + " */";
    } else {
      _block$1 = "";
    }
    let ret_str = _block$1;
    return "function " + name + "(" + params_str + ")" + ret_str + " {\n" + generate_function_body(
      body
    ) + "\n}";
  } else if (def instanceof DefType) {
    let st = def[0];
    return generate_sum_type(st);
  } else if (def instanceof DefRecord) {
    let rt = def[0];
    return generate_record_type(rt);
  } else if (def instanceof DefAlias) {
    let ta = def[0];
    return "// type alias " + ta.name + " = " + generate_type(ta.target);
  } else {
    let name = def[0];
    let t = def[1];
    let value = def[2];
    let _block;
    if (t instanceof Some) {
      let ann = t[0];
      _block = " /** : " + generate_type(ann) + " */";
    } else {
      _block = "";
    }
    let t_str = _block;
    return "let " + name + t_str + " = " + generate_expression(value);
  }
}
function generate(module2) {
  let defs = map2(module2.definitions, generate_definition);
  let defs_str = join(defs, "\n\n");
  let has_main = any(
    module2.definitions,
    (d) => {
      if (d instanceof DefFunction) {
        let $ = d.name;
        if ($ === "main") {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  );
  let _block;
  if (has_main) {
    _block = "\n\nmain();";
  } else {
    _block = "";
  }
  let call = _block;
  return new Ok(defs_str + call);
}

// build/dev/javascript/zein/tokenizer.mjs
var Import2 = class extends CustomType {
};
var As = class extends CustomType {
};
var Fn = class extends CustomType {
};
var Let = class extends CustomType {
};
var Type = class extends CustomType {
};
var If = class extends CustomType {
};
var Else = class extends CustomType {
};
var Match = class extends CustomType {
};
var For = class extends CustomType {
};
var In = class extends CustomType {
};
var Return = class extends CustomType {
};
var While = class extends CustomType {
};
var TrueToken = class extends CustomType {
};
var FalseToken = class extends CustomType {
};
var Underscore = class extends CustomType {
};
var Plus = class extends CustomType {
};
var Minus = class extends CustomType {
};
var Star = class extends CustomType {
};
var Slash = class extends CustomType {
};
var Percent = class extends CustomType {
};
var PlusEqual = class extends CustomType {
};
var MinusEqual = class extends CustomType {
};
var StarEqual = class extends CustomType {
};
var SlashEqual = class extends CustomType {
};
var EqualEqual = class extends CustomType {
};
var BangEqual = class extends CustomType {
};
var Less = class extends CustomType {
};
var Greater = class extends CustomType {
};
var LessEqual = class extends CustomType {
};
var GreaterEqual = class extends CustomType {
};
var AndAnd = class extends CustomType {
};
var OrOr = class extends CustomType {
};
var Bang = class extends CustomType {
};
var Concat2 = class extends CustomType {
};
var Pipe = class extends CustomType {
};
var LParen = class extends CustomType {
};
var RParen = class extends CustomType {
};
var LBrace = class extends CustomType {
};
var RBrace = class extends CustomType {
};
var LBracket = class extends CustomType {
};
var RBracket = class extends CustomType {
};
var Comma = class extends CustomType {
};
var Dot = class extends CustomType {
};
var Colon = class extends CustomType {
};
var Arrow = class extends CustomType {
};
var DoubleArrow = class extends CustomType {
};
var Equal2 = class extends CustomType {
};
var DotDot = class extends CustomType {
};
var IntLiteral = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var FloatLiteral = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StringLiteral = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Identifier = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var Newline = class extends CustomType {
};
var EOF = class extends CustomType {
};
var TokenError = class extends CustomType {
  constructor(message, line, col) {
    super();
    this.message = message;
    this.line = line;
    this.col = col;
  }
};
var TokenizeResult = class extends CustomType {
  constructor(tokens, errors) {
    super();
    this.tokens = tokens;
    this.errors = errors;
  }
};
var digits = /* @__PURE__ */ toList([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
]);
var upper_letters = /* @__PURE__ */ toList([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
]);
var lower_letters = /* @__PURE__ */ toList([
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z"
]);
function is_ident_start(c) {
  return contains(lower_letters, c) || contains(upper_letters, c) || c === "_";
}
function is_ident_continue(c) {
  return is_ident_start(c) || contains(digits, c);
}
function power3(base, exp2) {
  if (exp2 === 0) {
    return 1;
  } else if (exp2 < 0) {
    return divideFloat(1, power3(base, -exp2));
  } else {
    return base * power3(base, exp2 - 1);
  }
}
function parse_float2(s) {
  if (s === "") {
    return new Error2(void 0);
  } else {
    let parts = split2(s, ".");
    if (parts instanceof Empty) {
      return new Error2(void 0);
    } else {
      let $ = parts.tail;
      if ($ instanceof Empty) {
        return new Error2(void 0);
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          let frac_part = $.head;
          if (frac_part !== "") {
            let int_part = parts.head;
            let $2 = parse_int(int_part);
            if ($2 instanceof Ok) {
              let n = $2[0];
              let $3 = parse_int(frac_part);
              if ($3 instanceof Ok) {
                let f = $3[0];
                let frac_len = string_length(frac_part);
                let divisor = power3(10, frac_len);
                let result = identity(n) + divideFloat(
                  identity(f),
                  divisor
                );
                return new Ok(result);
              } else {
                return new Error2(void 0);
              }
            } else {
              return new Error2(void 0);
            }
          } else {
            return new Error2(void 0);
          }
        } else {
          return new Error2(void 0);
        }
      }
    }
  }
}
function starts_with2(chars, expected) {
  if (chars instanceof Empty) {
    return new Error2(void 0);
  } else {
    let c = chars.head;
    if (c === expected) {
      let rest = chars.tail;
      return new Ok(rest);
    } else {
      return new Error2(void 0);
    }
  }
}
function finish_ident(chars, acc, line, col, tokens, errors) {
  let _block;
  if (acc === "import") {
    _block = new Ok(new Import2());
  } else if (acc === "as") {
    _block = new Ok(new As());
  } else if (acc === "fn") {
    _block = new Ok(new Fn());
  } else if (acc === "let") {
    _block = new Ok(new Let());
  } else if (acc === "type") {
    _block = new Ok(new Type());
  } else if (acc === "if") {
    _block = new Ok(new If());
  } else if (acc === "else") {
    _block = new Ok(new Else());
  } else if (acc === "match") {
    _block = new Ok(new Match());
  } else if (acc === "for") {
    _block = new Ok(new For());
  } else if (acc === "in") {
    _block = new Ok(new In());
  } else if (acc === "return") {
    _block = new Ok(new Return());
  } else if (acc === "while") {
    _block = new Ok(new While());
  } else if (acc === "true") {
    _block = new Ok(new TrueToken());
  } else if (acc === "false") {
    _block = new Ok(new FalseToken());
  } else if (acc === "_") {
    _block = new Ok(new Underscore());
  } else {
    _block = new Error2(void 0);
  }
  let keyword_token = _block;
  let _block$1;
  if (keyword_token instanceof Ok) {
    let t = keyword_token[0];
    _block$1 = t;
  } else {
    _block$1 = new Identifier(acc);
  }
  let token = _block$1;
  return do_tokenize(chars, line, col, prepend(token, tokens), errors);
}
function read_ident(loop$chars, loop$line, loop$col, loop$acc, loop$tokens, loop$errors) {
  while (true) {
    let chars = loop$chars;
    let line = loop$line;
    let col = loop$col;
    let acc = loop$acc;
    let tokens = loop$tokens;
    let errors = loop$errors;
    if (chars instanceof Empty) {
      return finish_ident(toList([]), acc, line, col, tokens, errors);
    } else {
      let c = chars.head;
      let rest = chars.tail;
      let $ = is_ident_continue(c);
      if ($) {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$acc = acc + c;
        loop$tokens = tokens;
        loop$errors = errors;
      } else {
        return finish_ident(chars, acc, line, col, tokens, errors);
      }
    }
  }
}
function finish_number(chars, acc, is_float, line, col, tokens, errors) {
  let _block;
  if (is_float) {
    let $ = parse_int(acc);
    if ($ instanceof Ok) {
      let n = $[0];
      _block = new IntLiteral(n);
    } else {
      let $1 = parse_float2(acc);
      if ($1 instanceof Ok) {
        let f = $1[0];
        _block = new FloatLiteral(f);
      } else {
        _block = new Identifier(acc);
      }
    }
  } else {
    let $ = parse_int(acc);
    if ($ instanceof Ok) {
      let n = $[0];
      _block = new IntLiteral(n);
    } else {
      _block = new Identifier(acc);
    }
  }
  let token = _block;
  return do_tokenize(chars, line, col, prepend(token, tokens), errors);
}
function read_number(loop$chars, loop$line, loop$col, loop$acc, loop$tokens, loop$errors) {
  while (true) {
    let chars = loop$chars;
    let line = loop$line;
    let col = loop$col;
    let acc = loop$acc;
    let tokens = loop$tokens;
    let errors = loop$errors;
    let is_float = contains_string(acc, ".");
    if (chars instanceof Empty) {
      return finish_number(toList([]), acc, is_float, line, col, tokens, errors);
    } else {
      let c = chars.head;
      let rest = chars.tail;
      let $ = contains(digits, c);
      if ($) {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$acc = acc + c;
        loop$tokens = tokens;
        loop$errors = errors;
      } else {
        if (c === "." && !is_float) {
          if (rest instanceof Empty) {
            return finish_number(
              toList([]),
              acc + ".",
              true,
              line,
              col,
              tokens,
              errors
            );
          } else {
            let n = rest.head;
            let $1 = contains(digits, n);
            if ($1) {
              loop$chars = rest;
              loop$line = line;
              loop$col = col + 1;
              loop$acc = acc + ".";
              loop$tokens = tokens;
              loop$errors = errors;
            } else {
              return finish_number(
                chars,
                acc,
                is_float,
                line,
                col,
                tokens,
                errors
              );
            }
          }
        } else {
          return finish_number(chars, acc, is_float, line, col, tokens, errors);
        }
      }
    }
  }
}
function read_string(loop$chars, loop$line, loop$col, loop$acc, loop$tokens, loop$errors) {
  while (true) {
    let chars = loop$chars;
    let line = loop$line;
    let col = loop$col;
    let acc = loop$acc;
    let tokens = loop$tokens;
    let errors = loop$errors;
    if (chars instanceof Empty) {
      return new TokenizeResult(
        reverse(tokens),
        prepend(new TokenError("unterminated string", line, col), errors)
      );
    } else {
      let $ = chars.head;
      if ($ === "\n") {
        return new TokenizeResult(
          reverse(tokens),
          prepend(new TokenError("unterminated string", line, col), errors)
        );
      } else if ($ === '"') {
        let rest = chars.tail;
        return do_tokenize(
          rest,
          line,
          col + 1,
          prepend(new StringLiteral(acc), tokens),
          errors
        );
      } else if ($ === "\\") {
        let rest = chars.tail;
        if (rest instanceof Empty) {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$acc = acc + "\\";
          loop$tokens = tokens;
          loop$errors = errors;
        } else {
          let $1 = rest.head;
          if ($1 === "n") {
            let rest2 = rest.tail;
            loop$chars = rest2;
            loop$line = line;
            loop$col = col + 2;
            loop$acc = acc + "\n";
            loop$tokens = tokens;
            loop$errors = errors;
          } else if ($1 === "t") {
            let rest2 = rest.tail;
            loop$chars = rest2;
            loop$line = line;
            loop$col = col + 2;
            loop$acc = acc + "	";
            loop$tokens = tokens;
            loop$errors = errors;
          } else if ($1 === "\\") {
            let rest2 = rest.tail;
            loop$chars = rest2;
            loop$line = line;
            loop$col = col + 2;
            loop$acc = acc + "\\";
            loop$tokens = tokens;
            loop$errors = errors;
          } else if ($1 === '"') {
            let rest2 = rest.tail;
            loop$chars = rest2;
            loop$line = line;
            loop$col = col + 2;
            loop$acc = acc + '"';
            loop$tokens = tokens;
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$acc = acc + "\\";
            loop$tokens = tokens;
            loop$errors = errors;
          }
        }
      } else {
        let c = $;
        let rest = chars.tail;
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$acc = acc + c;
        loop$tokens = tokens;
        loop$errors = errors;
      }
    }
  }
}
function skip_line_comment(loop$chars, loop$line, loop$col, loop$tokens, loop$errors) {
  while (true) {
    let chars = loop$chars;
    let line = loop$line;
    let col = loop$col;
    let tokens = loop$tokens;
    let errors = loop$errors;
    if (chars instanceof Empty) {
      return do_tokenize(toList([]), line, col, tokens, errors);
    } else {
      let $ = chars.head;
      if ($ === "\n") {
        let rest_cps = chars.tail;
        return do_tokenize(rest_cps, line, col, tokens, errors);
      } else {
        let rest_cps = chars.tail;
        loop$chars = rest_cps;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = tokens;
        loop$errors = errors;
      }
    }
  }
}
function do_tokenize(loop$chars, loop$line, loop$col, loop$tokens, loop$errors) {
  while (true) {
    let chars = loop$chars;
    let line = loop$line;
    let col = loop$col;
    let tokens = loop$tokens;
    let errors = loop$errors;
    if (chars instanceof Empty) {
      return new TokenizeResult(reverse(tokens), errors);
    } else {
      let c = chars.head;
      let rest = chars.tail;
      if (c === "\n") {
        loop$chars = rest;
        loop$line = line + 1;
        loop$col = 0;
        loop$tokens = prepend(new Newline(), tokens);
        loop$errors = errors;
      } else if (c === " ") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = tokens;
        loop$errors = errors;
      } else if (c === "	") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = tokens;
        loop$errors = errors;
      } else if (c === "\r") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = tokens;
        loop$errors = errors;
      } else if (c === "+") {
        let $ = starts_with2(rest, "=");
        if ($ instanceof Ok) {
          let after_peq = $[0];
          loop$chars = after_peq;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new PlusEqual(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = prepend(new Plus(), tokens);
          loop$errors = errors;
        }
      } else if (c === "-") {
        let $ = starts_with2(rest, ">");
        if ($ instanceof Ok) {
          let after_arrow = $[0];
          loop$chars = after_arrow;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new Arrow(), tokens);
          loop$errors = errors;
        } else {
          let $1 = starts_with2(rest, "=");
          if ($1 instanceof Ok) {
            let after_meq = $1[0];
            loop$chars = after_meq;
            loop$line = line;
            loop$col = col + 2;
            loop$tokens = prepend(new MinusEqual(), tokens);
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = prepend(new Minus(), tokens);
            loop$errors = errors;
          }
        }
      } else if (c === "*") {
        let $ = starts_with2(rest, "=");
        if ($ instanceof Ok) {
          let after_seq = $[0];
          loop$chars = after_seq;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new StarEqual(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = prepend(new Star(), tokens);
          loop$errors = errors;
        }
      } else if (c === "/") {
        let $ = starts_with2(rest, "/");
        if ($ instanceof Ok) {
          let comment_rest = $[0];
          return skip_line_comment(comment_rest, line, col, tokens, errors);
        } else {
          let $1 = starts_with2(rest, "=");
          if ($1 instanceof Ok) {
            let after_sleq = $1[0];
            loop$chars = after_sleq;
            loop$line = line;
            loop$col = col + 2;
            loop$tokens = prepend(new SlashEqual(), tokens);
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = prepend(new Slash(), tokens);
            loop$errors = errors;
          }
        }
      } else if (c === "%") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new Percent(), tokens);
        loop$errors = errors;
      } else if (c === "=") {
        let $ = starts_with2(rest, ">");
        if ($ instanceof Ok) {
          let after_darr = $[0];
          loop$chars = after_darr;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new DoubleArrow(), tokens);
          loop$errors = errors;
        } else {
          let $1 = starts_with2(rest, "=");
          if ($1 instanceof Ok) {
            let after_eq = $1[0];
            loop$chars = after_eq;
            loop$line = line;
            loop$col = col + 2;
            loop$tokens = prepend(new EqualEqual(), tokens);
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = prepend(new Equal2(), tokens);
            loop$errors = errors;
          }
        }
      } else if (c === "!") {
        let $ = starts_with2(rest, "=");
        if ($ instanceof Ok) {
          let after_bangeq = $[0];
          loop$chars = after_bangeq;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new BangEqual(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = prepend(new Bang(), tokens);
          loop$errors = errors;
        }
      } else if (c === "<") {
        let $ = starts_with2(rest, ">");
        if ($ instanceof Ok) {
          let after_concat = $[0];
          loop$chars = after_concat;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new Concat2(), tokens);
          loop$errors = errors;
        } else {
          let $1 = starts_with2(rest, "=");
          if ($1 instanceof Ok) {
            let after_le = $1[0];
            loop$chars = after_le;
            loop$line = line;
            loop$col = col + 2;
            loop$tokens = prepend(new LessEqual(), tokens);
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = prepend(new Less(), tokens);
            loop$errors = errors;
          }
        }
      } else if (c === ">") {
        let $ = starts_with2(rest, "=");
        if ($ instanceof Ok) {
          let after_ge = $[0];
          loop$chars = after_ge;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new GreaterEqual(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = prepend(new Greater(), tokens);
          loop$errors = errors;
        }
      } else if (c === "&") {
        let $ = starts_with2(rest, "&");
        if ($ instanceof Ok) {
          let after_and = $[0];
          loop$chars = after_and;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new AndAnd(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = tokens;
          loop$errors = prepend(
            new TokenError("unexpected '&'", line, col),
            errors
          );
        }
      } else if (c === "|") {
        let $ = starts_with2(rest, "|");
        if ($ instanceof Ok) {
          let after_or = $[0];
          loop$chars = after_or;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new OrOr(), tokens);
          loop$errors = errors;
        } else {
          let $1 = starts_with2(rest, ">");
          if ($1 instanceof Ok) {
            let after_pipe = $1[0];
            loop$chars = after_pipe;
            loop$line = line;
            loop$col = col + 2;
            loop$tokens = prepend(new Pipe(), tokens);
            loop$errors = errors;
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = tokens;
            loop$errors = prepend(
              new TokenError("unexpected '|'", line, col),
              errors
            );
          }
        }
      } else if (c === "(") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new LParen(), tokens);
        loop$errors = errors;
      } else if (c === ")") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new RParen(), tokens);
        loop$errors = errors;
      } else if (c === "{") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new LBrace(), tokens);
        loop$errors = errors;
      } else if (c === "}") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new RBrace(), tokens);
        loop$errors = errors;
      } else if (c === "[") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new LBracket(), tokens);
        loop$errors = errors;
      } else if (c === "]") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new RBracket(), tokens);
        loop$errors = errors;
      } else if (c === ",") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new Comma(), tokens);
        loop$errors = errors;
      } else if (c === ":") {
        loop$chars = rest;
        loop$line = line;
        loop$col = col + 1;
        loop$tokens = prepend(new Colon(), tokens);
        loop$errors = errors;
      } else if (c === ".") {
        let $ = starts_with2(rest, ".");
        if ($ instanceof Ok) {
          let after_dotdot = $[0];
          loop$chars = after_dotdot;
          loop$line = line;
          loop$col = col + 2;
          loop$tokens = prepend(new DotDot(), tokens);
          loop$errors = errors;
        } else {
          loop$chars = rest;
          loop$line = line;
          loop$col = col + 1;
          loop$tokens = prepend(new Dot(), tokens);
          loop$errors = errors;
        }
      } else if (c === '"') {
        return read_string(rest, line, col + 1, "", tokens, errors);
      } else {
        let $ = contains(digits, c);
        if ($) {
          return read_number(chars, line, col, "", tokens, errors);
        } else {
          let $1 = is_ident_start(c);
          if ($1) {
            return read_ident(chars, line, col, "", tokens, errors);
          } else {
            loop$chars = rest;
            loop$line = line;
            loop$col = col + 1;
            loop$tokens = tokens;
            loop$errors = prepend(
              new TokenError("unexpected character: " + c, line, col),
              errors
            );
          }
        }
      }
    }
  }
}
function tokenize(source) {
  let chars = graphemes(source);
  return do_tokenize(chars, 0, 0, toList([]), toList([]));
}
function token_name(t) {
  if (t instanceof Import2) {
    return "import";
  } else if (t instanceof As) {
    return "as";
  } else if (t instanceof Fn) {
    return "fn";
  } else if (t instanceof Let) {
    return "let";
  } else if (t instanceof Type) {
    return "type";
  } else if (t instanceof If) {
    return "if";
  } else if (t instanceof Else) {
    return "else";
  } else if (t instanceof Match) {
    return "match";
  } else if (t instanceof For) {
    return "for";
  } else if (t instanceof In) {
    return "in";
  } else if (t instanceof Return) {
    return "return";
  } else if (t instanceof While) {
    return "while";
  } else if (t instanceof TrueToken) {
    return "true";
  } else if (t instanceof FalseToken) {
    return "false";
  } else if (t instanceof Underscore) {
    return "_";
  } else if (t instanceof Plus) {
    return "+";
  } else if (t instanceof Minus) {
    return "-";
  } else if (t instanceof Star) {
    return "*";
  } else if (t instanceof Slash) {
    return "/";
  } else if (t instanceof Percent) {
    return "%";
  } else if (t instanceof PlusEqual) {
    return "+=";
  } else if (t instanceof MinusEqual) {
    return "-=";
  } else if (t instanceof StarEqual) {
    return "*=";
  } else if (t instanceof SlashEqual) {
    return "/=";
  } else if (t instanceof EqualEqual) {
    return "==";
  } else if (t instanceof BangEqual) {
    return "!=";
  } else if (t instanceof Less) {
    return "<";
  } else if (t instanceof Greater) {
    return ">";
  } else if (t instanceof LessEqual) {
    return "<=";
  } else if (t instanceof GreaterEqual) {
    return ">=";
  } else if (t instanceof AndAnd) {
    return "&&";
  } else if (t instanceof OrOr) {
    return "||";
  } else if (t instanceof Bang) {
    return "!";
  } else if (t instanceof Concat2) {
    return "<>";
  } else if (t instanceof Pipe) {
    return "|>";
  } else if (t instanceof LParen) {
    return "(";
  } else if (t instanceof RParen) {
    return ")";
  } else if (t instanceof LBrace) {
    return "{";
  } else if (t instanceof RBrace) {
    return "}";
  } else if (t instanceof LBracket) {
    return "[";
  } else if (t instanceof RBracket) {
    return "]";
  } else if (t instanceof Comma) {
    return ",";
  } else if (t instanceof Dot) {
    return ".";
  } else if (t instanceof Colon) {
    return ":";
  } else if (t instanceof Arrow) {
    return "->";
  } else if (t instanceof DoubleArrow) {
    return "=>";
  } else if (t instanceof Equal2) {
    return "=";
  } else if (t instanceof DotDot) {
    return "..";
  } else if (t instanceof IntLiteral) {
    return "<int>";
  } else if (t instanceof FloatLiteral) {
    return "<float>";
  } else if (t instanceof StringLiteral) {
    return "<string>";
  } else if (t instanceof Identifier) {
    return "<identifier>";
  } else if (t instanceof Newline) {
    return "<newline>";
  } else {
    return "<eof>";
  }
}

// build/dev/javascript/zein/parser.mjs
var FILEPATH = "src/parser.gleam";
var ParseError = class extends CustomType {
  constructor(expected, found, line, col) {
    super();
    this.expected = expected;
    this.found = found;
    this.line = line;
    this.col = col;
  }
};
function consume(tokens, expected, kind) {
  if (tokens instanceof Empty) {
    return new Error2(new ParseError(expected, new EOF(), 0, 0));
  } else {
    let t = tokens.head;
    let rest = tokens.tail;
    let $ = kind(t);
    if ($) {
      return new Ok([t, rest]);
    } else {
      return new Error2(new ParseError(expected, t, 0, 0));
    }
  }
}
function token_name2(t) {
  if (t instanceof Import2) {
    return "import";
  } else if (t instanceof As) {
    return "as";
  } else if (t instanceof Fn) {
    return "fn";
  } else if (t instanceof Let) {
    return "let";
  } else if (t instanceof Type) {
    return "type";
  } else if (t instanceof If) {
    return "if";
  } else if (t instanceof Else) {
    return "else";
  } else if (t instanceof Match) {
    return "match";
  } else if (t instanceof For) {
    return "for";
  } else if (t instanceof In) {
    return "in";
  } else if (t instanceof Return) {
    return "return";
  } else if (t instanceof While) {
    return "while";
  } else if (t instanceof TrueToken) {
    return "true";
  } else if (t instanceof FalseToken) {
    return "false";
  } else if (t instanceof Underscore) {
    return "_";
  } else if (t instanceof Plus) {
    return "+";
  } else if (t instanceof Minus) {
    return "-";
  } else if (t instanceof Star) {
    return "*";
  } else if (t instanceof Slash) {
    return "/";
  } else if (t instanceof Percent) {
    return "%";
  } else if (t instanceof PlusEqual) {
    return "+=";
  } else if (t instanceof MinusEqual) {
    return "-=";
  } else if (t instanceof StarEqual) {
    return "*=";
  } else if (t instanceof SlashEqual) {
    return "/=";
  } else if (t instanceof EqualEqual) {
    return "==";
  } else if (t instanceof BangEqual) {
    return "!=";
  } else if (t instanceof Less) {
    return "<";
  } else if (t instanceof Greater) {
    return ">";
  } else if (t instanceof LessEqual) {
    return "<=";
  } else if (t instanceof GreaterEqual) {
    return ">=";
  } else if (t instanceof AndAnd) {
    return "&&";
  } else if (t instanceof OrOr) {
    return "||";
  } else if (t instanceof Bang) {
    return "!";
  } else if (t instanceof Concat2) {
    return "<>";
  } else if (t instanceof Pipe) {
    return "|>";
  } else if (t instanceof LParen) {
    return "(";
  } else if (t instanceof RParen) {
    return ")";
  } else if (t instanceof LBrace) {
    return "{";
  } else if (t instanceof RBrace) {
    return "}";
  } else if (t instanceof LBracket) {
    return "[";
  } else if (t instanceof RBracket) {
    return "]";
  } else if (t instanceof Comma) {
    return ",";
  } else if (t instanceof Dot) {
    return ".";
  } else if (t instanceof Colon) {
    return ":";
  } else if (t instanceof Arrow) {
    return "->";
  } else if (t instanceof DoubleArrow) {
    return "=>";
  } else if (t instanceof Equal2) {
    return "=";
  } else if (t instanceof DotDot) {
    return "..";
  } else if (t instanceof IntLiteral) {
    return "<int>";
  } else if (t instanceof FloatLiteral) {
    return "<float>";
  } else if (t instanceof StringLiteral) {
    return "<string>";
  } else if (t instanceof Identifier) {
    return "<identifier>";
  } else if (t instanceof Newline) {
    return "<newline>";
  } else {
    return "<eof>";
  }
}
function expect(tokens, expected) {
  return consume(
    tokens,
    token_name2(expected),
    (t) => {
      return isEqual(t, expected);
    }
  );
}
function skip_newlines(loop$tokens) {
  while (true) {
    let tokens = loop$tokens;
    if (tokens instanceof Empty) {
      return tokens;
    } else {
      let $ = tokens.head;
      if ($ instanceof Newline) {
        let rest = tokens.tail;
        loop$tokens = rest;
      } else {
        return tokens;
      }
    }
  }
}
function parse_type_list(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    let $ = parse_type(tokens$1);
    let t;
    let tokens$2;
    if ($ instanceof Ok) {
      t = $[0][0];
      tokens$2 = $[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        517,
        "parse_type_list",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 14579,
          end: 14627,
          pattern_start: 14590,
          pattern_end: 14606
        }
      );
    }
    let tokens$3 = skip_newlines(tokens$2);
    let _block;
    if (tokens$3 instanceof Empty) {
      _block = [toList([]), tokens$3];
    } else {
      let $2 = tokens$3.head;
      if ($2 instanceof Comma) {
        let rest2 = tokens$3.tail;
        let rest$1 = skip_newlines(rest2);
        _block = parse_type_list(rest$1);
      } else {
        _block = [toList([]), tokens$3];
      }
    }
    let $1 = _block;
    let rest = $1[0];
    let tokens$4 = $1[1];
    return [prepend(t, rest), tokens$4];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RParen) {
      return [toList([]), tokens$1];
    } else {
      let $1 = parse_type(tokens$1);
      let t;
      let tokens$2;
      if ($1 instanceof Ok) {
        t = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          517,
          "parse_type_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 14579,
            end: 14627,
            pattern_start: 14590,
            pattern_end: 14606
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let _block;
      if (tokens$3 instanceof Empty) {
        _block = [toList([]), tokens$3];
      } else {
        let $3 = tokens$3.head;
        if ($3 instanceof Comma) {
          let rest2 = tokens$3.tail;
          let rest$1 = skip_newlines(rest2);
          _block = parse_type_list(rest$1);
        } else {
          _block = [toList([]), tokens$3];
        }
      }
      let $2 = _block;
      let rest = $2[0];
      let tokens$4 = $2[1];
      return [prepend(t, rest), tokens$4];
    }
  }
}
function parse_type(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return new Error2(
      new ParseError(
        "type",
        (() => {
          if (tokens$1 instanceof Empty) {
            return new EOF();
          } else {
            let t = tokens$1.head;
            return t;
          }
        })(),
        0,
        0
      )
    );
  } else {
    let $ = tokens$1.head;
    if ($ instanceof Identifier) {
      let rest = tokens$1.tail;
      let name = $[0];
      let rest$1 = skip_newlines(rest);
      let _block;
      if (rest$1 instanceof Empty) {
        _block = [toList([]), rest$1];
      } else {
        let $2 = rest$1.head;
        if ($2 instanceof LParen) {
          let rest$22 = rest$1.tail;
          let rest$32 = skip_newlines(rest$22);
          let $3 = parse_type_list(rest$32);
          let params2 = $3[0];
          let rest$4 = $3[1];
          let rest$5 = skip_newlines(rest$4);
          let $4 = expect(rest$5, new RParen());
          let rest$6;
          if ($4 instanceof Ok) {
            rest$6 = $4[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              477,
              "parse_type",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $4,
                start: 13681,
                end: 13729,
                pattern_start: 13692,
                pattern_end: 13706
              }
            );
          }
          _block = [params2, rest$6];
        } else {
          _block = [toList([]), rest$1];
        }
      }
      let $1 = _block;
      let params = $1[0];
      let rest$2 = $1[1];
      let rest$3 = skip_newlines(rest$2);
      if (rest$3 instanceof Empty) {
        return new Ok([new TNamed(name, params), rest$3]);
      } else {
        let $2 = rest$3.head;
        if ($2 instanceof Arrow) {
          let rest$4 = rest$3.tail;
          let rest$5 = skip_newlines(rest$4);
          let $3 = parse_type(rest$5);
          let ret_type;
          let rest$6;
          if ($3 instanceof Ok) {
            ret_type = $3[0][0];
            rest$6 = $3[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              488,
              "parse_type",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $3,
                start: 13973,
                end: 14024,
                pattern_start: 13984,
                pattern_end: 14005
              }
            );
          }
          return new Ok(
            [
              new TFunction(
                toList([new TNamed(name, params)]),
                new Box(ret_type)
              ),
              rest$6
            ]
          );
        } else {
          return new Ok([new TNamed(name, params), rest$3]);
        }
      }
    } else {
      return new Error2(
        new ParseError(
          "type",
          (() => {
            if (tokens$1 instanceof Empty) {
              return new EOF();
            } else {
              let t = tokens$1.head;
              return t;
            }
          })(),
          0,
          0
        )
      );
    }
  }
}
function parse_param_list(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    let $ = consume(
      tokens$1,
      "<identifier>",
      (t) => {
        if (t instanceof Identifier) {
          return true;
        } else {
          return false;
        }
      }
    );
    let name;
    let tokens$2;
    if ($ instanceof Ok) {
      let $1 = $[0][0];
      if ($1 instanceof Identifier) {
        tokens$2 = $[0][1];
        name = $1[0];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          296,
          "parse_param_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $,
            start: 8275,
            end: 8466,
            pattern_start: 8286,
            pattern_end: 8317
          }
        );
      }
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        296,
        "parse_param_list",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 8275,
          end: 8466,
          pattern_start: 8286,
          pattern_end: 8317
        }
      );
    }
    let tokens$3 = skip_newlines(tokens$2);
    let $2 = expect(tokens$3, new Colon());
    let tokens$4;
    if ($2 instanceof Ok) {
      tokens$4 = $2[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        304,
        "parse_param_list",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $2,
          start: 8514,
          end: 8565,
          pattern_start: 8525,
          pattern_end: 8541
        }
      );
    }
    let tokens$5 = skip_newlines(tokens$4);
    let $3 = parse_type(tokens$5);
    let param_type;
    let tokens$6;
    if ($3 instanceof Ok) {
      param_type = $3[0][0];
      tokens$6 = $3[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        306,
        "parse_param_list",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $3,
          start: 8613,
          end: 8670,
          pattern_start: 8624,
          pattern_end: 8649
        }
      );
    }
    let tokens$7 = skip_newlines(tokens$6);
    let _block;
    if (tokens$7 instanceof Empty) {
      _block = [toList([]), tokens$7];
    } else {
      let $5 = tokens$7.head;
      if ($5 instanceof Comma) {
        let rest2 = tokens$7.tail;
        let rest$1 = skip_newlines(rest2);
        _block = parse_param_list(rest$1);
      } else {
        _block = [toList([]), tokens$7];
      }
    }
    let $4 = _block;
    let rest = $4[0];
    let tokens$8 = $4[1];
    return [
      prepend(new FunctionParam(name, new Some(param_type)), rest),
      tokens$8
    ];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RParen) {
      return [toList([]), tokens$1];
    } else {
      let $1 = consume(
        tokens$1,
        "<identifier>",
        (t) => {
          if (t instanceof Identifier) {
            return true;
          } else {
            return false;
          }
        }
      );
      let name;
      let tokens$2;
      if ($1 instanceof Ok) {
        let $2 = $1[0][0];
        if ($2 instanceof Identifier) {
          tokens$2 = $1[0][1];
          name = $2[0];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            296,
            "parse_param_list",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 8275,
              end: 8466,
              pattern_start: 8286,
              pattern_end: 8317
            }
          );
        }
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          296,
          "parse_param_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 8275,
            end: 8466,
            pattern_start: 8286,
            pattern_end: 8317
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let $3 = expect(tokens$3, new Colon());
      let tokens$4;
      if ($3 instanceof Ok) {
        tokens$4 = $3[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          304,
          "parse_param_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $3,
            start: 8514,
            end: 8565,
            pattern_start: 8525,
            pattern_end: 8541
          }
        );
      }
      let tokens$5 = skip_newlines(tokens$4);
      let $4 = parse_type(tokens$5);
      let param_type;
      let tokens$6;
      if ($4 instanceof Ok) {
        param_type = $4[0][0];
        tokens$6 = $4[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          306,
          "parse_param_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $4,
            start: 8613,
            end: 8670,
            pattern_start: 8624,
            pattern_end: 8649
          }
        );
      }
      let tokens$7 = skip_newlines(tokens$6);
      let _block;
      if (tokens$7 instanceof Empty) {
        _block = [toList([]), tokens$7];
      } else {
        let $6 = tokens$7.head;
        if ($6 instanceof Comma) {
          let rest2 = tokens$7.tail;
          let rest$1 = skip_newlines(rest2);
          _block = parse_param_list(rest$1);
        } else {
          _block = [toList([]), tokens$7];
        }
      }
      let $5 = _block;
      let rest = $5[0];
      let tokens$8 = $5[1];
      return [
        prepend(new FunctionParam(name, new Some(param_type)), rest),
        tokens$8
      ];
    }
  }
}
function parse_pattern_fields(loop$tokens) {
  while (true) {
    let tokens = loop$tokens;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      let $ = parse_pattern(tokens$1);
      let p;
      let tokens$2;
      if ($ instanceof Ok) {
        p = $[0][0];
        tokens$2 = $[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          1104,
          "parse_pattern_fields",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $,
            start: 33864,
            end: 33915,
            pattern_start: 33875,
            pattern_end: 33891
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let _block;
      if (tokens$3 instanceof Empty) {
        _block = [toList([]), tokens$3];
      } else {
        let $2 = tokens$3.head;
        if ($2 instanceof Comma) {
          let rest2 = tokens$3.tail;
          let rest$1 = skip_newlines(rest2);
          _block = parse_pattern_fields(rest$1);
        } else {
          _block = [toList([]), tokens$3];
        }
      }
      let $1 = _block;
      let rest = $1[0];
      let tokens$4 = $1[1];
      return [prepend(p, rest), tokens$4];
    } else {
      let $ = tokens$1.head;
      if ($ instanceof RParen) {
        return [toList([]), tokens$1];
      } else if ($ instanceof Comma) {
        let rest = tokens$1.tail;
        let rest$1 = skip_newlines(rest);
        loop$tokens = rest$1;
      } else {
        let $1 = parse_pattern(tokens$1);
        let p;
        let tokens$2;
        if ($1 instanceof Ok) {
          p = $1[0][0];
          tokens$2 = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            1104,
            "parse_pattern_fields",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 33864,
              end: 33915,
              pattern_start: 33875,
              pattern_end: 33891
            }
          );
        }
        let tokens$3 = skip_newlines(tokens$2);
        let _block;
        if (tokens$3 instanceof Empty) {
          _block = [toList([]), tokens$3];
        } else {
          let $3 = tokens$3.head;
          if ($3 instanceof Comma) {
            let rest2 = tokens$3.tail;
            let rest$1 = skip_newlines(rest2);
            _block = parse_pattern_fields(rest$1);
          } else {
            _block = [toList([]), tokens$3];
          }
        }
        let $2 = _block;
        let rest = $2[0];
        let tokens$4 = $2[1];
        return [prepend(p, rest), tokens$4];
      }
    }
  }
}
function parse_pattern(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return new Error2(
      new ParseError(
        "pattern",
        (() => {
          if (tokens$1 instanceof Empty) {
            return new EOF();
          } else {
            let t = tokens$1.head;
            return t;
          }
        })(),
        0,
        0
      )
    );
  } else {
    let $ = tokens$1.head;
    if ($ instanceof TrueToken) {
      let rest = tokens$1.tail;
      return new Ok([new PLiteral(new LBool(true)), rest]);
    } else if ($ instanceof FalseToken) {
      let rest = tokens$1.tail;
      return new Ok([new PLiteral(new LBool(false)), rest]);
    } else if ($ instanceof Underscore) {
      let rest = tokens$1.tail;
      return new Ok([new PWildcard(), rest]);
    } else if ($ instanceof IntLiteral) {
      let rest = tokens$1.tail;
      let n = $[0];
      return new Ok([new PLiteral(new LInt(n)), rest]);
    } else if ($ instanceof FloatLiteral) {
      let rest = tokens$1.tail;
      let f = $[0];
      return new Ok([new PLiteral(new LFloat(f)), rest]);
    } else if ($ instanceof StringLiteral) {
      let rest = tokens$1.tail;
      let s = $[0];
      return new Ok([new PLiteral(new LString(s)), rest]);
    } else if ($ instanceof Identifier) {
      let rest = tokens$1.tail;
      let name = $[0];
      let rest$1 = skip_newlines(rest);
      if (rest$1 instanceof Empty) {
        return new Ok([new PVariable(name), rest$1]);
      } else {
        let $1 = rest$1.head;
        if ($1 instanceof LParen) {
          let rest$2 = rest$1.tail;
          let rest$3 = skip_newlines(rest$2);
          let $2 = parse_pattern_fields(rest$3);
          let fields = $2[0];
          let rest$4 = $2[1];
          let rest$5 = skip_newlines(rest$4);
          let $3 = expect(rest$5, new RParen());
          let rest$6;
          if ($3 instanceof Ok) {
            rest$6 = $3[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              1074,
              "parse_pattern",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $3,
                start: 33235,
                end: 33283,
                pattern_start: 33246,
                pattern_end: 33260
              }
            );
          }
          return new Ok([new PVariant(name, fields), rest$6]);
        } else {
          return new Ok([new PVariable(name), rest$1]);
        }
      }
    } else {
      return new Error2(
        new ParseError(
          "pattern",
          (() => {
            if (tokens$1 instanceof Empty) {
              return new EOF();
            } else {
              let t = tokens$1.head;
              return t;
            }
          })(),
          0,
          0
        )
      );
    }
  }
}
function parse_variant_fields(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return [toList([]), tokens$1];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RParen) {
      return [toList([]), tokens$1];
    } else if ($ instanceof Identifier) {
      let rest = tokens$1.tail;
      let name = $[0];
      let rest$1 = skip_newlines(rest);
      let _block;
      if (rest$1 instanceof Empty) {
        _block = [new TVariable(name), rest$1];
      } else {
        let $22 = rest$1.head;
        if ($22 instanceof Colon) {
          let rest$22 = rest$1.tail;
          let rest$32 = skip_newlines(rest$22);
          let $3 = parse_type(rest$32);
          let t;
          let rest$42;
          if ($3 instanceof Ok) {
            t = $3[0][0];
            rest$42 = $3[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              445,
              "parse_variant_fields",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $3,
                start: 12747,
                end: 12791,
                pattern_start: 12758,
                pattern_end: 12772
              }
            );
          }
          _block = [t, rest$42];
        } else {
          _block = [new TVariable(name), rest$1];
        }
      }
      let $1 = _block;
      let value_type = $1[0];
      let rest$2 = $1[1];
      let rest$3 = skip_newlines(rest$2);
      let _block$1;
      if (rest$3 instanceof Empty) {
        _block$1 = [toList([]), rest$3];
      } else {
        let $3 = rest$3.head;
        if ($3 instanceof Comma) {
          let rest$42 = rest$3.tail;
          let rest$5 = skip_newlines(rest$42);
          _block$1 = parse_variant_fields(rest$5);
        } else {
          _block$1 = [toList([]), rest$3];
        }
      }
      let $2 = _block$1;
      let rest_fields = $2[0];
      let rest$4 = $2[1];
      return [
        prepend(new VariantField(name, value_type), rest_fields),
        rest$4
      ];
    } else {
      return [toList([]), tokens$1];
    }
  }
}
function parse_variants(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return [toList([]), tokens$1];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RBrace) {
      return [toList([]), tokens$1];
    } else if ($ instanceof Identifier) {
      let rest = tokens$1.tail;
      let name = $[0];
      let rest$1 = skip_newlines(rest);
      let _block;
      if (rest$1 instanceof Empty) {
        _block = [new Variant(name, toList([])), skip_newlines(rest$1)];
      } else {
        let $22 = rest$1.head;
        if ($22 instanceof LParen) {
          let rest_after_lparen = rest$1.tail;
          let $3 = parse_variant_fields(rest_after_lparen);
          let fields = $3[0];
          let rest$22 = $3[1];
          let rest$32 = skip_newlines(rest$22);
          let $4 = expect(rest$32, new RParen());
          let rest$4;
          if ($4 instanceof Ok) {
            rest$4 = $4[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              420,
              "parse_variants",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $4,
                start: 11940,
                end: 11988,
                pattern_start: 11951,
                pattern_end: 11965
              }
            );
          }
          let rest$5 = skip_newlines(rest$4);
          _block = [new Variant(name, fields), rest$5];
        } else {
          _block = [new Variant(name, toList([])), skip_newlines(rest$1)];
        }
      }
      let $1 = _block;
      let variant = $1[0];
      let rest$2 = $1[1];
      let $2 = parse_variants(rest$2);
      let more_variants = $2[0];
      let rest$3 = $2[1];
      return [prepend(variant, more_variants), rest$3];
    } else {
      return [toList([]), tokens$1];
    }
  }
}
function parse_type_param_list(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return [toList([]), tokens$1];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RParen) {
      return [toList([]), tokens$1];
    } else if ($ instanceof Identifier) {
      let rest = tokens$1.tail;
      let name = $[0];
      let rest$1 = skip_newlines(rest);
      let _block;
      if (rest$1 instanceof Empty) {
        _block = [toList([]), rest$1];
      } else {
        let $2 = rest$1.head;
        if ($2 instanceof Comma) {
          let rest$22 = rest$1.tail;
          _block = parse_type_param_list(rest$22);
        } else {
          _block = [toList([]), rest$1];
        }
      }
      let $1 = _block;
      let rest_params = $1[0];
      let rest$2 = $1[1];
      return [prepend(new TypeParam(name), rest_params), rest$2];
    } else {
      return [toList([]), tokens$1];
    }
  }
}
function parse_type_params(tokens) {
  if (tokens instanceof Empty) {
    return [toList([]), tokens];
  } else {
    let $ = tokens.head;
    if ($ instanceof LParen) {
      let rest = tokens.tail;
      let rest$1 = skip_newlines(rest);
      let $1 = parse_type_param_list(rest$1);
      let params = $1[0];
      let rest$2 = $1[1];
      let rest$3 = skip_newlines(rest$2);
      let $2 = expect(rest$3, new RParen());
      let rest$4;
      if ($2 instanceof Ok) {
        rest$4 = $2[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          385,
          "parse_type_params",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $2,
            start: 10915,
            end: 10963,
            pattern_start: 10926,
            pattern_end: 10940
          }
        );
      }
      return [params, rest$4];
    } else {
      return [toList([]), tokens];
    }
  }
}
function parse_type_def(tokens) {
  let $ = expect(tokens, new Type());
  let tokens$1;
  if ($ instanceof Ok) {
    tokens$1 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      354,
      "parse_type_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 9930,
        end: 9980,
        pattern_start: 9941,
        pattern_end: 9957
      }
    );
  }
  let tokens$2 = skip_newlines(tokens$1);
  let $1 = consume(
    tokens$2,
    "<identifier>",
    (t) => {
      if (t instanceof Identifier) {
        return true;
      } else {
        return false;
      }
    }
  );
  let name;
  let tokens$3;
  if ($1 instanceof Ok) {
    let $2 = $1[0][0];
    if ($2 instanceof Identifier) {
      tokens$3 = $1[0][1];
      name = $2[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        356,
        "parse_type_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 10020,
          end: 10187,
          pattern_start: 10031,
          pattern_end: 10062
        }
      );
    }
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      356,
      "parse_type_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 10020,
        end: 10187,
        pattern_start: 10031,
        pattern_end: 10062
      }
    );
  }
  let tokens$4 = skip_newlines(tokens$3);
  let $3 = parse_type_params(tokens$4);
  let type_params = $3[0];
  let tokens$5 = $3[1];
  let tokens$6 = skip_newlines(tokens$5);
  let $4 = expect(tokens$6, new LBrace());
  let tokens$7;
  if ($4 instanceof Ok) {
    tokens$7 = $4[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      368,
      "parse_type_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $4,
        start: 10323,
        end: 10375,
        pattern_start: 10334,
        pattern_end: 10350
      }
    );
  }
  let tokens$8 = skip_newlines(tokens$7);
  let $5 = parse_variants(tokens$8);
  let variants = $5[0];
  let remaining = $5[1];
  let remaining$1 = skip_newlines(remaining);
  let $6 = expect(remaining$1, new RBrace());
  let remaining$2;
  if ($6 instanceof Ok) {
    remaining$2 = $6[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      373,
      "parse_type_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $6,
        start: 10513,
        end: 10571,
        pattern_start: 10524,
        pattern_end: 10543
      }
    );
  }
  return new Ok(
    [
      new DefType(new SumType(name, type_params, variants)),
      remaining$2
    ]
  );
}
function reassign_check(result) {
  if (result instanceof Ok) {
    let $ = result[0][0];
    if ($ instanceof EVariable) {
      let tokens = result[0][1];
      let name = $[0];
      let tokens$1 = skip_newlines(tokens);
      if (tokens$1 instanceof Empty) {
        return new Ok([new EVariable(name), tokens$1]);
      } else {
        let $1 = tokens$1.head;
        if ($1 instanceof PlusEqual) {
          let rest = tokens$1.tail;
          let rest$1 = skip_newlines(rest);
          let $2 = parse_expression(rest$1);
          let value;
          let rest$2;
          if ($2 instanceof Ok) {
            value = $2[0][0];
            rest$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              555,
              "reassign_check",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 15735,
                end: 15789,
                pattern_start: 15746,
                pattern_end: 15764
              }
            );
          }
          let rest$3 = skip_newlines(rest$2);
          let op = new EInfix(
            new Box(new EVariable(name)),
            new Add(),
            new Box(value)
          );
          return new Ok([new EReassign(name, new Box(op)), rest$3]);
        } else if ($1 instanceof MinusEqual) {
          let rest = tokens$1.tail;
          let rest$1 = skip_newlines(rest);
          let $2 = parse_expression(rest$1);
          let value;
          let rest$2;
          if ($2 instanceof Ok) {
            value = $2[0][0];
            rest$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              562,
              "reassign_check",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 16067,
                end: 16121,
                pattern_start: 16078,
                pattern_end: 16096
              }
            );
          }
          let rest$3 = skip_newlines(rest$2);
          let op = new EInfix(
            new Box(new EVariable(name)),
            new Subtract(),
            new Box(value)
          );
          return new Ok([new EReassign(name, new Box(op)), rest$3]);
        } else if ($1 instanceof StarEqual) {
          let rest = tokens$1.tail;
          let rest$1 = skip_newlines(rest);
          let $2 = parse_expression(rest$1);
          let value;
          let rest$2;
          if ($2 instanceof Ok) {
            value = $2[0][0];
            rest$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              569,
              "reassign_check",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 16403,
                end: 16457,
                pattern_start: 16414,
                pattern_end: 16432
              }
            );
          }
          let rest$3 = skip_newlines(rest$2);
          let op = new EInfix(
            new Box(new EVariable(name)),
            new Multiply(),
            new Box(value)
          );
          return new Ok([new EReassign(name, new Box(op)), rest$3]);
        } else if ($1 instanceof SlashEqual) {
          let rest = tokens$1.tail;
          let rest$1 = skip_newlines(rest);
          let $2 = parse_expression(rest$1);
          let value;
          let rest$2;
          if ($2 instanceof Ok) {
            value = $2[0][0];
            rest$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              576,
              "reassign_check",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 16740,
                end: 16794,
                pattern_start: 16751,
                pattern_end: 16769
              }
            );
          }
          let rest$3 = skip_newlines(rest$2);
          let op = new EInfix(
            new Box(new EVariable(name)),
            new Divide(),
            new Box(value)
          );
          return new Ok([new EReassign(name, new Box(op)), rest$3]);
        } else if ($1 instanceof Equal2) {
          let rest = tokens$1.tail;
          let rest$1 = skip_newlines(rest);
          let $2 = parse_expression(rest$1);
          let value;
          let rest$2;
          if ($2 instanceof Ok) {
            value = $2[0][0];
            rest$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              549,
              "reassign_check",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 15486,
                end: 15540,
                pattern_start: 15497,
                pattern_end: 15515
              }
            );
          }
          let rest$3 = skip_newlines(rest$2);
          return new Ok([new EReassign(name, new Box(value)), rest$3]);
        } else {
          return new Ok([new EVariable(name), tokens$1]);
        }
      }
    } else {
      return result;
    }
  } else {
    return result;
  }
}
function parse_binary_cont(loop$tokens, loop$left, loop$min_prec) {
  while (true) {
    let tokens = loop$tokens;
    let left = loop$left;
    let min_prec = loop$min_prec;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      let _block;
      if (tokens$1 instanceof Empty) {
        _block = new None();
      } else {
        let $ = tokens$1.head;
        if ($ instanceof Plus && min_prec <= 5) {
          _block = new Some([new Add(), 5]);
        } else if ($ instanceof Minus && min_prec <= 5) {
          _block = new Some([new Subtract(), 5]);
        } else if ($ instanceof Star && min_prec <= 6) {
          _block = new Some([new Multiply(), 6]);
        } else if ($ instanceof Slash && min_prec <= 6) {
          _block = new Some([new Divide(), 6]);
        } else if ($ instanceof Percent && min_prec <= 6) {
          _block = new Some([new Modulo(), 6]);
        } else if ($ instanceof EqualEqual && min_prec <= 3) {
          _block = new Some([new Equal(), 3]);
        } else if ($ instanceof BangEqual && min_prec <= 3) {
          _block = new Some([new NotEqual(), 3]);
        } else if ($ instanceof Less && min_prec <= 3) {
          _block = new Some([new LessThan(), 3]);
        } else if ($ instanceof Greater && min_prec <= 3) {
          _block = new Some([new GreaterThan(), 3]);
        } else if ($ instanceof LessEqual && min_prec <= 3) {
          _block = new Some([new LessOrEqual(), 3]);
        } else if ($ instanceof GreaterEqual && min_prec <= 3) {
          _block = new Some([new GreaterOrEqual(), 3]);
        } else if ($ instanceof AndAnd && min_prec <= 2) {
          _block = new Some([new And(), 2]);
        } else if ($ instanceof OrOr && min_prec <= 1) {
          _block = new Some([new Or(), 1]);
        } else if ($ instanceof Concat2 && min_prec <= 4) {
          _block = new Some([new Concat(), 4]);
        } else {
          _block = new None();
        }
      }
      let op_info = _block;
      if (op_info instanceof Some) {
        let op = op_info[0][0];
        let prec = op_info[0][1];
        if (tokens$1 instanceof Empty) {
          return new Ok([left, tokens$1]);
        } else {
          let rest = tokens$1.tail;
          let $ = parse_binary(rest, prec + 1);
          let right;
          let rest_after_right;
          if ($ instanceof Ok) {
            right = $[0][0];
            rest_after_right = $[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              648,
              "parse_binary_cont",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $,
                start: 19316,
                end: 19404,
                pattern_start: 19327,
                pattern_end: 19357
              }
            );
          }
          let combined = new EInfix(
            new Box(left),
            op,
            new Box(right)
          );
          loop$tokens = rest_after_right;
          loop$left = combined;
          loop$min_prec = min_prec;
        }
      } else {
        return new Ok([left, tokens$1]);
      }
    } else {
      let $ = tokens$1.head;
      if ($ instanceof DotDot && min_prec <= 1) {
        let rest = tokens$1.tail;
        let $1 = parse_binary(rest, 2);
        let right;
        let rest_after_right;
        if ($1 instanceof Ok) {
          right = $1[0][0];
          rest_after_right = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            620,
            "parse_binary_cont",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 17969,
              end: 18034,
              pattern_start: 17980,
              pattern_end: 18010
            }
          );
        }
        let range_expr = new ERange(
          new Box(left),
          new Box(right)
        );
        loop$tokens = rest_after_right;
        loop$left = range_expr;
        loop$min_prec = min_prec;
      } else {
        let _block;
        if (tokens$1 instanceof Empty) {
          _block = new None();
        } else {
          let $1 = tokens$1.head;
          if ($1 instanceof Plus && min_prec <= 5) {
            _block = new Some([new Add(), 5]);
          } else if ($1 instanceof Minus && min_prec <= 5) {
            _block = new Some([new Subtract(), 5]);
          } else if ($1 instanceof Star && min_prec <= 6) {
            _block = new Some([new Multiply(), 6]);
          } else if ($1 instanceof Slash && min_prec <= 6) {
            _block = new Some([new Divide(), 6]);
          } else if ($1 instanceof Percent && min_prec <= 6) {
            _block = new Some([new Modulo(), 6]);
          } else if ($1 instanceof EqualEqual && min_prec <= 3) {
            _block = new Some([new Equal(), 3]);
          } else if ($1 instanceof BangEqual && min_prec <= 3) {
            _block = new Some([new NotEqual(), 3]);
          } else if ($1 instanceof Less && min_prec <= 3) {
            _block = new Some([new LessThan(), 3]);
          } else if ($1 instanceof Greater && min_prec <= 3) {
            _block = new Some([new GreaterThan(), 3]);
          } else if ($1 instanceof LessEqual && min_prec <= 3) {
            _block = new Some([new LessOrEqual(), 3]);
          } else if ($1 instanceof GreaterEqual && min_prec <= 3) {
            _block = new Some([new GreaterOrEqual(), 3]);
          } else if ($1 instanceof AndAnd && min_prec <= 2) {
            _block = new Some([new And(), 2]);
          } else if ($1 instanceof OrOr && min_prec <= 1) {
            _block = new Some([new Or(), 1]);
          } else if ($1 instanceof Concat2 && min_prec <= 4) {
            _block = new Some([new Concat(), 4]);
          } else {
            _block = new None();
          }
        }
        let op_info = _block;
        if (op_info instanceof Some) {
          let op = op_info[0][0];
          let prec = op_info[0][1];
          if (tokens$1 instanceof Empty) {
            return new Ok([left, tokens$1]);
          } else {
            let rest = tokens$1.tail;
            let $1 = parse_binary(rest, prec + 1);
            let right;
            let rest_after_right;
            if ($1 instanceof Ok) {
              right = $1[0][0];
              rest_after_right = $1[0][1];
            } else {
              throw makeError(
                "let_assert",
                FILEPATH,
                "parser",
                648,
                "parse_binary_cont",
                "Pattern match failed, no pattern matched the value.",
                {
                  value: $1,
                  start: 19316,
                  end: 19404,
                  pattern_start: 19327,
                  pattern_end: 19357
                }
              );
            }
            let combined = new EInfix(
              new Box(left),
              op,
              new Box(right)
            );
            loop$tokens = rest_after_right;
            loop$left = combined;
            loop$min_prec = min_prec;
          }
        } else {
          return new Ok([left, tokens$1]);
        }
      }
    }
  }
}
function parse_arg_list(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    let $ = parse_expression(tokens$1);
    let expr;
    let tokens$2;
    if ($ instanceof Ok) {
      expr = $[0][0];
      tokens$2 = $[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        728,
        "parse_arg_list",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 21868,
          end: 21925,
          pattern_start: 21879,
          pattern_end: 21898
        }
      );
    }
    let tokens$3 = skip_newlines(tokens$2);
    let _block;
    if (tokens$3 instanceof Empty) {
      _block = [toList([]), tokens$3];
    } else {
      let $2 = tokens$3.head;
      if ($2 instanceof Comma) {
        let rest2 = tokens$3.tail;
        let rest$1 = skip_newlines(rest2);
        _block = parse_arg_list(rest$1);
      } else {
        _block = [toList([]), tokens$3];
      }
    }
    let $1 = _block;
    let rest = $1[0];
    let tokens$4 = $1[1];
    return [prepend(expr, rest), tokens$4];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RParen) {
      return [toList([]), tokens$1];
    } else {
      let $1 = parse_expression(tokens$1);
      let expr;
      let tokens$2;
      if ($1 instanceof Ok) {
        expr = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          728,
          "parse_arg_list",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 21868,
            end: 21925,
            pattern_start: 21879,
            pattern_end: 21898
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let _block;
      if (tokens$3 instanceof Empty) {
        _block = [toList([]), tokens$3];
      } else {
        let $3 = tokens$3.head;
        if ($3 instanceof Comma) {
          let rest2 = tokens$3.tail;
          let rest$1 = skip_newlines(rest2);
          _block = parse_arg_list(rest$1);
        } else {
          _block = [toList([]), tokens$3];
        }
      }
      let $2 = _block;
      let rest = $2[0];
      let tokens$4 = $2[1];
      return [prepend(expr, rest), tokens$4];
    }
  }
}
function parse_call_cont(loop$tokens, loop$expr) {
  while (true) {
    let tokens = loop$tokens;
    let expr = loop$expr;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      return new Ok([expr, tokens$1]);
    } else {
      let $ = tokens$1.head;
      if ($ instanceof LParen) {
        let rest = tokens$1.tail;
        let rest$1 = skip_newlines(rest);
        let $1 = parse_arg_list(rest$1);
        let args = $1[0];
        let rest$2 = $1[1];
        let rest$3 = skip_newlines(rest$2);
        let $2 = expect(rest$3, new RParen());
        let rest$4;
        if ($2 instanceof Ok) {
          rest$4 = $2[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            695,
            "parse_call_cont",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $2,
              start: 20686,
              end: 20734,
              pattern_start: 20697,
              pattern_end: 20711
            }
          );
        }
        let call_expr = new ECall(new Box(expr), args);
        loop$tokens = rest$4;
        loop$expr = call_expr;
      } else if ($ instanceof LBracket) {
        let rest = tokens$1.tail;
        let rest$1 = skip_newlines(rest);
        let $1 = parse_expression(rest$1);
        let index2;
        let rest$2;
        if ($1 instanceof Ok) {
          index2 = $1[0][0];
          rest$2 = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            713,
            "parse_call_cont",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 21387,
              end: 21441,
              pattern_start: 21398,
              pattern_end: 21416
            }
          );
        }
        let rest$3 = skip_newlines(rest$2);
        let $2 = expect(rest$3, new RBracket());
        let rest$4;
        if ($2 instanceof Ok) {
          rest$4 = $2[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            715,
            "parse_call_cont",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $2,
              start: 21485,
              end: 21535,
              pattern_start: 21496,
              pattern_end: 21510
            }
          );
        }
        let index_expr = new EIndex(
          new Box(expr),
          new Box(index2)
        );
        loop$tokens = rest$4;
        loop$expr = index_expr;
      } else if ($ instanceof Dot) {
        let $1 = tokens$1.tail;
        if ($1 instanceof Empty) {
          return new Ok([expr, tokens$1]);
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let $3 = $1.head;
            if ($3 instanceof Identifier) {
              let rest = $2;
              let name = $3[0];
              let field_expr = new EFieldAccess(new Box(expr), name);
              loop$tokens = rest;
              loop$expr = field_expr;
            } else {
              return new Ok([expr, tokens$1]);
            }
          } else {
            let $3 = $1.head;
            if ($3 instanceof Identifier) {
              let $4 = $2.head;
              if ($4 instanceof LParen) {
                let rest = $2.tail;
                let name = $3[0];
                let rest$1 = skip_newlines(rest);
                let $5 = parse_arg_list(rest$1);
                let args = $5[0];
                let rest$2 = $5[1];
                let rest$3 = skip_newlines(rest$2);
                let $6 = expect(rest$3, new RParen());
                let rest$4;
                if ($6 instanceof Ok) {
                  rest$4 = $6[0][1];
                } else {
                  throw makeError(
                    "let_assert",
                    FILEPATH,
                    "parser",
                    703,
                    "parse_call_cont",
                    "Pattern match failed, no pattern matched the value.",
                    {
                      value: $6,
                      start: 21009,
                      end: 21057,
                      pattern_start: 21020,
                      pattern_end: 21034
                    }
                  );
                }
                let call_expr = new EMethodCall(
                  new Box(expr),
                  name,
                  args
                );
                loop$tokens = rest$4;
                loop$expr = call_expr;
              } else {
                let rest = $2;
                let name = $3[0];
                let field_expr = new EFieldAccess(new Box(expr), name);
                loop$tokens = rest;
                loop$expr = field_expr;
              }
            } else {
              return new Ok([expr, tokens$1]);
            }
          }
        }
      } else {
        return new Ok([expr, tokens$1]);
      }
    }
  }
}
function parse_return_expr(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = parse_expression(tokens$1);
  let value;
  let tokens$2;
  if ($ instanceof Ok) {
    value = $[0][0];
    tokens$2 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      995,
      "parse_return_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 30425,
        end: 30483,
        pattern_start: 30436,
        pattern_end: 30456
      }
    );
  }
  return new Ok([new EReturn(new Box(value)), tokens$2]);
}
function parse_lambda(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = expect(tokens$1, new LParen());
  let tokens$2;
  if ($ instanceof Ok) {
    tokens$2 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      959,
      "parse_lambda",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 29381,
        end: 29433,
        pattern_start: 29392,
        pattern_end: 29408
      }
    );
  }
  let tokens$3 = skip_newlines(tokens$2);
  let $1 = parse_param_list(tokens$3);
  let params = $1[0];
  let tokens$4 = $1[1];
  let tokens$5 = skip_newlines(tokens$4);
  let $2 = expect(tokens$5, new RParen());
  let tokens$6;
  if ($2 instanceof Ok) {
    tokens$6 = $2[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      963,
      "parse_lambda",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $2,
        start: 29561,
        end: 29613,
        pattern_start: 29572,
        pattern_end: 29588
      }
    );
  }
  let tokens$7 = skip_newlines(tokens$6);
  let _block;
  if (tokens$7 instanceof Empty) {
    _block = [new None(), tokens$7];
  } else {
    let $42 = tokens$7.head;
    if ($42 instanceof Arrow) {
      let rest = tokens$7.tail;
      let rest$1 = skip_newlines(rest);
      let $5 = parse_type(rest$1);
      let t;
      let rest$2;
      if ($5 instanceof Ok) {
        t = $5[0][0];
        rest$2 = $5[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          969,
          "parse_lambda",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $5,
            start: 29762,
            end: 29806,
            pattern_start: 29773,
            pattern_end: 29787
          }
        );
      }
      _block = [new Some(t), rest$2];
    } else {
      _block = [new None(), tokens$7];
    }
  }
  let $3 = _block;
  let ret_type = $3[0];
  let tokens$8 = $3[1];
  let tokens$9 = skip_newlines(tokens$8);
  let _block$1;
  if (tokens$9 instanceof Empty) {
    let $5 = parse_block(tokens$9);
    let body2;
    let tokens$102;
    if ($5 instanceof Ok) {
      body2 = $5[0][0];
      tokens$102 = $5[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        983,
        "parse_lambda",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $5,
          start: 30112,
          end: 30164,
          pattern_start: 30123,
          pattern_end: 30142
        }
      );
    }
    _block$1 = [body2, tokens$102];
  } else {
    let $5 = tokens$9.head;
    if ($5 instanceof DoubleArrow) {
      let rest = tokens$9.tail;
      let rest$1 = skip_newlines(rest);
      let $6 = parse_expression(rest$1);
      let body2;
      let rest$2;
      if ($6 instanceof Ok) {
        body2 = $6[0][0];
        rest$2 = $6[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          979,
          "parse_lambda",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $6,
            start: 30015,
            end: 30068,
            pattern_start: 30026,
            pattern_end: 30043
          }
        );
      }
      _block$1 = [body2, rest$2];
    } else {
      let $6 = parse_block(tokens$9);
      let body2;
      let tokens$102;
      if ($6 instanceof Ok) {
        body2 = $6[0][0];
        tokens$102 = $6[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          983,
          "parse_lambda",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $6,
            start: 30112,
            end: 30164,
            pattern_start: 30123,
            pattern_end: 30142
          }
        );
      }
      _block$1 = [body2, tokens$102];
    }
  }
  let $4 = _block$1;
  let body = $4[0];
  let tokens$10 = $4[1];
  return new Ok(
    [new ELambda(params, ret_type, new Box(body)), tokens$10]
  );
}
function parse_while_expr(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = parse_expression(tokens$1);
  let cond;
  let tokens$2;
  if ($ instanceof Ok) {
    cond = $[0][0];
    tokens$2 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      857,
      "parse_while_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 25792,
        end: 25849,
        pattern_start: 25803,
        pattern_end: 25822
      }
    );
  }
  let tokens$3 = skip_newlines(tokens$2);
  let $1 = parse_block(tokens$3);
  let body;
  let tokens$4;
  if ($1 instanceof Ok) {
    body = $1[0][0];
    tokens$4 = $1[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      859,
      "parse_while_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 25889,
        end: 25941,
        pattern_start: 25900,
        pattern_end: 25919
      }
    );
  }
  return new Ok(
    [new EWhile(new Box(cond), new Box(body)), tokens$4]
  );
}
function parse_for_expr(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = consume(
    tokens$1,
    "<identifier>",
    (t) => {
      if (t instanceof Identifier) {
        return true;
      } else {
        return false;
      }
    }
  );
  let name;
  let tokens$2;
  if ($ instanceof Ok) {
    let $1 = $[0][0];
    if ($1 instanceof Identifier) {
      tokens$2 = $[0][1];
      name = $1[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        938,
        "parse_for_expr",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 28689,
          end: 28856,
          pattern_start: 28700,
          pattern_end: 28731
        }
      );
    }
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      938,
      "parse_for_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 28689,
        end: 28856,
        pattern_start: 28700,
        pattern_end: 28731
      }
    );
  }
  let tokens$3 = skip_newlines(tokens$2);
  let $2 = expect(tokens$3, new In());
  let tokens$4;
  if ($2 instanceof Ok) {
    tokens$4 = $2[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      946,
      "parse_for_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $2,
        start: 28896,
        end: 28944,
        pattern_start: 28907,
        pattern_end: 28923
      }
    );
  }
  let tokens$5 = skip_newlines(tokens$4);
  let $3 = parse_expression(tokens$5);
  let iterable;
  let tokens$6;
  if ($3 instanceof Ok) {
    iterable = $3[0][0];
    tokens$6 = $3[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      948,
      "parse_for_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $3,
        start: 28984,
        end: 29045,
        pattern_start: 28995,
        pattern_end: 29018
      }
    );
  }
  let tokens$7 = skip_newlines(tokens$6);
  let $4 = parse_block(tokens$7);
  let body;
  let tokens$8;
  if ($4 instanceof Ok) {
    body = $4[0][0];
    tokens$8 = $4[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      950,
      "parse_for_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $4,
        start: 29085,
        end: 29137,
        pattern_start: 29096,
        pattern_end: 29115
      }
    );
  }
  return new Ok(
    [new EFor(name, new Box(iterable), new Box(body)), tokens$8]
  );
}
function parse_match_clauses(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    let $ = parse_pattern(tokens$1);
    let pattern;
    let tokens$2;
    if ($ instanceof Ok) {
      pattern = $[0][0];
      tokens$2 = $[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        909,
        "parse_match_clauses",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 27720,
          end: 27777,
          pattern_start: 27731,
          pattern_end: 27753
        }
      );
    }
    let tokens$3 = skip_newlines(tokens$2);
    let $1 = expect(tokens$3, new DoubleArrow());
    let tokens$4;
    if ($1 instanceof Ok) {
      tokens$4 = $1[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        911,
        "parse_match_clauses",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 27825,
          end: 27882,
          pattern_start: 27836,
          pattern_end: 27852
        }
      );
    }
    let tokens$5 = skip_newlines(tokens$4);
    let $2 = parse_expression(tokens$5);
    let body;
    let tokens$6;
    if ($2 instanceof Ok) {
      body = $2[0][0];
      tokens$6 = $2[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        913,
        "parse_match_clauses",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $2,
          start: 27930,
          end: 27987,
          pattern_start: 27941,
          pattern_end: 27960
        }
      );
    }
    let tokens$7 = skip_newlines(tokens$6);
    let _block;
    if (tokens$7 instanceof Empty) {
      _block = [new None(), tokens$7];
    } else {
      let $42 = tokens$7.head;
      if ($42 instanceof If) {
        let rest2 = tokens$7.tail;
        let rest$1 = skip_newlines(rest2);
        let $5 = parse_expression(rest$1);
        let guard_expr;
        let rest$2;
        if ($5 instanceof Ok) {
          guard_expr = $5[0][0];
          rest$2 = $5[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            920,
            "parse_match_clauses",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $5,
              start: 28184,
              end: 28243,
              pattern_start: 28195,
              pattern_end: 28218
            }
          );
        }
        _block = [new Some(guard_expr), rest$2];
      } else {
        _block = [new None(), tokens$7];
      }
    }
    let $3 = _block;
    let guard2 = $3[0];
    let tokens$8 = $3[1];
    let tokens$9 = skip_newlines(tokens$8);
    let $4 = parse_match_clauses(tokens$9);
    let rest = $4[0];
    let tokens$10 = $4[1];
    return [
      prepend(new MatchClause(pattern, guard2, body), rest),
      tokens$10
    ];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof RBrace) {
      return [toList([]), tokens$1];
    } else {
      let $1 = parse_pattern(tokens$1);
      let pattern;
      let tokens$2;
      if ($1 instanceof Ok) {
        pattern = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          909,
          "parse_match_clauses",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 27720,
            end: 27777,
            pattern_start: 27731,
            pattern_end: 27753
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let $2 = expect(tokens$3, new DoubleArrow());
      let tokens$4;
      if ($2 instanceof Ok) {
        tokens$4 = $2[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          911,
          "parse_match_clauses",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $2,
            start: 27825,
            end: 27882,
            pattern_start: 27836,
            pattern_end: 27852
          }
        );
      }
      let tokens$5 = skip_newlines(tokens$4);
      let $3 = parse_expression(tokens$5);
      let body;
      let tokens$6;
      if ($3 instanceof Ok) {
        body = $3[0][0];
        tokens$6 = $3[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          913,
          "parse_match_clauses",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $3,
            start: 27930,
            end: 27987,
            pattern_start: 27941,
            pattern_end: 27960
          }
        );
      }
      let tokens$7 = skip_newlines(tokens$6);
      let _block;
      if (tokens$7 instanceof Empty) {
        _block = [new None(), tokens$7];
      } else {
        let $52 = tokens$7.head;
        if ($52 instanceof If) {
          let rest2 = tokens$7.tail;
          let rest$1 = skip_newlines(rest2);
          let $6 = parse_expression(rest$1);
          let guard_expr;
          let rest$2;
          if ($6 instanceof Ok) {
            guard_expr = $6[0][0];
            rest$2 = $6[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              920,
              "parse_match_clauses",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $6,
                start: 28184,
                end: 28243,
                pattern_start: 28195,
                pattern_end: 28218
              }
            );
          }
          _block = [new Some(guard_expr), rest$2];
        } else {
          _block = [new None(), tokens$7];
        }
      }
      let $4 = _block;
      let guard2 = $4[0];
      let tokens$8 = $4[1];
      let tokens$9 = skip_newlines(tokens$8);
      let $5 = parse_match_clauses(tokens$9);
      let rest = $5[0];
      let tokens$10 = $5[1];
      return [
        prepend(new MatchClause(pattern, guard2, body), rest),
        tokens$10
      ];
    }
  }
}
function parse_match_expr(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = parse_expression(tokens$1);
  let value;
  let tokens$2;
  if ($ instanceof Ok) {
    value = $[0][0];
    tokens$2 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      892,
      "parse_match_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 27115,
        end: 27173,
        pattern_start: 27126,
        pattern_end: 27146
      }
    );
  }
  let tokens$3 = skip_newlines(tokens$2);
  let $1 = expect(tokens$3, new LBrace());
  let tokens$4;
  if ($1 instanceof Ok) {
    tokens$4 = $1[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      894,
      "parse_match_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 27213,
        end: 27265,
        pattern_start: 27224,
        pattern_end: 27240
      }
    );
  }
  let tokens$5 = skip_newlines(tokens$4);
  let $2 = parse_match_clauses(tokens$5);
  let clauses = $2[0];
  let remaining = $2[1];
  let remaining$1 = skip_newlines(remaining);
  let $3 = expect(remaining$1, new RBrace());
  let remaining$2;
  if ($3 instanceof Ok) {
    remaining$2 = $3[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      898,
      "parse_match_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $3,
        start: 27406,
        end: 27464,
        pattern_start: 27417,
        pattern_end: 27436
      }
    );
  }
  return new Ok([new EMatch(new Box(value), clauses), remaining$2]);
}
function parse_if_expr(tokens) {
  let tokens$1 = skip_newlines(tokens);
  let $ = parse_expression(tokens$1);
  let cond;
  let tokens$2;
  if ($ instanceof Ok) {
    cond = $[0][0];
    tokens$2 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      867,
      "parse_if_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 26141,
        end: 26198,
        pattern_start: 26152,
        pattern_end: 26171
      }
    );
  }
  let tokens$3 = skip_newlines(tokens$2);
  let $1 = parse_block(tokens$3);
  let conseq;
  let tokens$4;
  if ($1 instanceof Ok) {
    conseq = $1[0][0];
    tokens$4 = $1[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      869,
      "parse_if_expr",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 26238,
        end: 26292,
        pattern_start: 26249,
        pattern_end: 26270
      }
    );
  }
  let tokens$5 = skip_newlines(tokens$4);
  if (tokens$5 instanceof Empty) {
    return new Ok(
      [
        new EIf(
          new Box(cond),
          new Box(conseq),
          toList([]),
          new None()
        ),
        tokens$5
      ]
    );
  } else {
    let $2 = tokens$5.tail;
    if ($2 instanceof Empty) {
      let $3 = tokens$5.head;
      if ($3 instanceof Else) {
        let rest = $2;
        let rest$1 = skip_newlines(rest);
        let $4 = parse_block(rest$1);
        let alt_body;
        let rest$2;
        if ($4 instanceof Ok) {
          alt_body = $4[0][0];
          rest$2 = $4[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            880,
            "parse_if_expr",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $4,
              start: 26696,
              end: 26748,
              pattern_start: 26707,
              pattern_end: 26728
            }
          );
        }
        return new Ok(
          [
            new EIf(
              new Box(cond),
              new Box(conseq),
              toList([]),
              new Some(new Box(alt_body))
            ),
            rest$2
          ]
        );
      } else {
        return new Ok(
          [
            new EIf(
              new Box(cond),
              new Box(conseq),
              toList([]),
              new None()
            ),
            tokens$5
          ]
        );
      }
    } else {
      let $3 = tokens$5.head;
      if ($3 instanceof Else) {
        let $4 = $2.head;
        if ($4 instanceof If) {
          let rest = $2.tail;
          let rest$1 = skip_newlines(rest);
          let $5 = parse_if_expr(rest$1);
          let alt;
          let rest$2;
          if ($5 instanceof Ok) {
            alt = $5[0][0];
            rest$2 = $5[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              875,
              "parse_if_expr",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $5,
                start: 26490,
                end: 26539,
                pattern_start: 26501,
                pattern_end: 26517
              }
            );
          }
          return new Ok(
            [
              new EIf(
                new Box(cond),
                new Box(conseq),
                toList([]),
                new Some(new Box(alt))
              ),
              rest$2
            ]
          );
        } else {
          let rest = $2;
          let rest$1 = skip_newlines(rest);
          let $5 = parse_block(rest$1);
          let alt_body;
          let rest$2;
          if ($5 instanceof Ok) {
            alt_body = $5[0][0];
            rest$2 = $5[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              880,
              "parse_if_expr",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $5,
                start: 26696,
                end: 26748,
                pattern_start: 26707,
                pattern_end: 26728
              }
            );
          }
          return new Ok(
            [
              new EIf(
                new Box(cond),
                new Box(conseq),
                toList([]),
                new Some(new Box(alt_body))
              ),
              rest$2
            ]
          );
        }
      } else {
        return new Ok(
          [
            new EIf(
              new Box(cond),
              new Box(conseq),
              toList([]),
              new None()
            ),
            tokens$5
          ]
        );
      }
    }
  }
}
function parse_list_items(loop$tokens, loop$acc) {
  while (true) {
    let tokens = loop$tokens;
    let acc = loop$acc;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      let $ = parse_expression(tokens$1);
      let expr;
      let rest;
      if ($ instanceof Ok) {
        expr = $[0][0];
        rest = $[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          843,
          "parse_list_items",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $,
            start: 25402,
            end: 25457,
            pattern_start: 25413,
            pattern_end: 25430
          }
        );
      }
      let rest$1 = skip_newlines(rest);
      if (rest$1 instanceof Empty) {
        return [reverse(prepend(expr, acc)), rest$1];
      } else {
        let $1 = rest$1.head;
        if ($1 instanceof Comma) {
          let rest2 = rest$1.tail;
          loop$tokens = rest2;
          loop$acc = prepend(expr, acc);
        } else {
          return [reverse(prepend(expr, acc)), rest$1];
        }
      }
    } else {
      let $ = tokens$1.head;
      if ($ instanceof RBracket) {
        return [reverse(acc), tokens$1];
      } else {
        let $1 = parse_expression(tokens$1);
        let expr;
        let rest;
        if ($1 instanceof Ok) {
          expr = $1[0][0];
          rest = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            843,
            "parse_list_items",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 25402,
              end: 25457,
              pattern_start: 25413,
              pattern_end: 25430
            }
          );
        }
        let rest$1 = skip_newlines(rest);
        if (rest$1 instanceof Empty) {
          return [reverse(prepend(expr, acc)), rest$1];
        } else {
          let $2 = rest$1.head;
          if ($2 instanceof Comma) {
            let rest2 = rest$1.tail;
            loop$tokens = rest2;
            loop$acc = prepend(expr, acc);
          } else {
            return [reverse(prepend(expr, acc)), rest$1];
          }
        }
      }
    }
  }
}
function parse_record_fields(loop$tokens, loop$acc) {
  while (true) {
    let tokens = loop$tokens;
    let acc = loop$acc;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      return [reverse(acc), tokens$1];
    } else {
      let $ = tokens$1.head;
      if ($ instanceof RParen) {
        return [reverse(acc), tokens$1];
      } else if ($ instanceof Identifier) {
        let $1 = tokens$1.tail;
        if ($1 instanceof Empty) {
          return [reverse(acc), tokens$1];
        } else {
          let $2 = $1.head;
          if ($2 instanceof Colon) {
            let name = $[0];
            let rest = $1.tail;
            let rest$1 = skip_newlines(rest);
            let $3 = parse_expression(rest$1);
            let value;
            let rest$2;
            if ($3 instanceof Ok) {
              value = $3[0][0];
              rest$2 = $3[0][1];
            } else {
              throw makeError(
                "let_assert",
                FILEPATH,
                "parser",
                823,
                "parse_record_fields",
                "Pattern match failed, no pattern matched the value.",
                {
                  value: $3,
                  start: 24845,
                  end: 24899,
                  pattern_start: 24856,
                  pattern_end: 24874
                }
              );
            }
            let rest$3 = skip_newlines(rest$2);
            if (rest$3 instanceof Empty) {
              return [reverse(prepend([name, value], acc)), rest$3];
            } else {
              let $4 = rest$3.head;
              if ($4 instanceof Comma) {
                let rest2 = rest$3.tail;
                loop$tokens = rest2;
                loop$acc = prepend([name, value], acc);
              } else {
                return [reverse(prepend([name, value], acc)), rest$3];
              }
            }
          } else {
            return [reverse(acc), tokens$1];
          }
        }
      } else {
        return [reverse(acc), tokens$1];
      }
    }
  }
}
function parse_primary(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return new Error2(
      new ParseError(
        "expression",
        (() => {
          if (tokens$1 instanceof Empty) {
            return new EOF();
          } else {
            let t = tokens$1.head;
            return t;
          }
        })(),
        0,
        0
      )
    );
  } else {
    let $ = tokens$1.head;
    if ($ instanceof Fn) {
      let rest = tokens$1.tail;
      return parse_lambda(rest);
    } else if ($ instanceof If) {
      let rest = tokens$1.tail;
      return parse_if_expr(rest);
    } else if ($ instanceof Match) {
      let rest = tokens$1.tail;
      return parse_match_expr(rest);
    } else if ($ instanceof For) {
      let rest = tokens$1.tail;
      return parse_for_expr(rest);
    } else if ($ instanceof Return) {
      let rest = tokens$1.tail;
      return parse_return_expr(rest);
    } else if ($ instanceof While) {
      let rest = tokens$1.tail;
      return parse_while_expr(rest);
    } else if ($ instanceof TrueToken) {
      let rest = tokens$1.tail;
      return new Ok([new ELiteral(new LBool(true)), rest]);
    } else if ($ instanceof FalseToken) {
      let rest = tokens$1.tail;
      return new Ok([new ELiteral(new LBool(false)), rest]);
    } else if ($ instanceof LParen) {
      let rest = tokens$1.tail;
      let rest$1 = skip_newlines(rest);
      let $1 = parse_expression(rest$1);
      let expr;
      let rest$2;
      if ($1 instanceof Ok) {
        expr = $1[0][0];
        rest$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          778,
          "parse_primary",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 23606,
            end: 23659,
            pattern_start: 23617,
            pattern_end: 23634
          }
        );
      }
      let rest$3 = skip_newlines(rest$2);
      let $2 = expect(rest$3, new RParen());
      let rest$4;
      if ($2 instanceof Ok) {
        rest$4 = $2[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          780,
          "parse_primary",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $2,
            start: 23703,
            end: 23751,
            pattern_start: 23714,
            pattern_end: 23728
          }
        );
      }
      return new Ok([expr, rest$4]);
    } else if ($ instanceof LBrace) {
      let all = tokens$1;
      return parse_block(all);
    } else if ($ instanceof LBracket) {
      let rest = tokens$1.tail;
      let rest$1 = skip_newlines(rest);
      let $1 = parse_list_items(rest$1, toList([]));
      let items = $1[0];
      let rest$2 = $1[1];
      let rest$3 = skip_newlines(rest$2);
      let $2 = expect(rest$3, new RBracket());
      let rest$4;
      if ($2 instanceof Ok) {
        rest$4 = $2[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          788,
          "parse_primary",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $2,
            start: 23945,
            end: 23995,
            pattern_start: 23956,
            pattern_end: 23970
          }
        );
      }
      return new Ok([new EList(items), rest$4]);
    } else if ($ instanceof IntLiteral) {
      let rest = tokens$1.tail;
      let n = $[0];
      return new Ok([new ELiteral(new LInt(n)), rest]);
    } else if ($ instanceof FloatLiteral) {
      let rest = tokens$1.tail;
      let f = $[0];
      return new Ok([new ELiteral(new LFloat(f)), rest]);
    } else if ($ instanceof StringLiteral) {
      let rest = tokens$1.tail;
      let s = $[0];
      return new Ok([new ELiteral(new LString(s)), rest]);
    } else if ($ instanceof Identifier) {
      let $1 = tokens$1.tail;
      if ($1 instanceof Empty) {
        let rest = $1;
        let name = $[0];
        return new Ok([new EVariable(name), rest]);
      } else {
        let $2 = $1.head;
        if ($2 instanceof LParen) {
          let name = $[0];
          let rest = $1.tail;
          let rest_skip = skip_newlines(rest);
          if (rest_skip instanceof Empty) {
            return new Ok(
              [new EVariable(name), prepend(new LParen(), rest)]
            );
          } else {
            let $3 = rest_skip.tail;
            if ($3 instanceof Empty) {
              return new Ok(
                [new EVariable(name), prepend(new LParen(), rest)]
              );
            } else {
              let $4 = rest_skip.head;
              if ($4 instanceof Identifier) {
                let $5 = $3.head;
                if ($5 instanceof Colon) {
                  let $6 = parse_record_fields(rest, toList([]));
                  let fields = $6[0];
                  let rest$1 = $6[1];
                  let rest$2 = skip_newlines(rest$1);
                  let $7 = expect(rest$2, new RParen());
                  let rest$3;
                  if ($7 instanceof Ok) {
                    rest$3 = $7[0][1];
                  } else {
                    throw makeError(
                      "let_assert",
                      FILEPATH,
                      "parser",
                      765,
                      "parse_primary",
                      "Pattern match failed, no pattern matched the value.",
                      {
                        value: $7,
                        start: 23274,
                        end: 23322,
                        pattern_start: 23285,
                        pattern_end: 23299
                      }
                    );
                  }
                  return new Ok([new ERecord(name, fields), rest$3]);
                } else {
                  return new Ok(
                    [new EVariable(name), prepend(new LParen(), rest)]
                  );
                }
              } else {
                return new Ok(
                  [new EVariable(name), prepend(new LParen(), rest)]
                );
              }
            }
          }
        } else if ($2 instanceof DotDot) {
          let name = $[0];
          let rest = $1.tail;
          let $3 = parse_expression(rest);
          let end_expr;
          let rest$1;
          if ($3 instanceof Ok) {
            end_expr = $3[0][0];
            rest$1 = $3[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              754,
              "parse_primary",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $3,
                start: 22765,
                end: 22822,
                pattern_start: 22776,
                pattern_end: 22797
              }
            );
          }
          return new Ok(
            [
              new ERange(
                new Box(new EVariable(name)),
                new Box(end_expr)
              ),
              rest$1
            ]
          );
        } else {
          let rest = $1;
          let name = $[0];
          return new Ok([new EVariable(name), rest]);
        }
      }
    } else {
      return new Error2(
        new ParseError(
          "expression",
          (() => {
            if (tokens$1 instanceof Empty) {
              return new EOF();
            } else {
              let t = tokens$1.head;
              return t;
            }
          })(),
          0,
          0
        )
      );
    }
  }
}
function parse_call_primary(tokens) {
  let $ = parse_primary(tokens);
  let expr;
  let tokens_after_primary;
  if ($ instanceof Ok) {
    expr = $[0][0];
    tokens_after_primary = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      681,
      "parse_call_primary",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 20237,
        end: 20305,
        pattern_start: 20248,
        pattern_end: 20281
      }
    );
  }
  return parse_call_cont(tokens_after_primary, expr);
}
function parse_unary(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    return parse_call_primary(tokens$1);
  } else {
    let $ = tokens$1.head;
    if ($ instanceof Minus) {
      let rest = tokens$1.tail;
      let $1 = parse_unary(rest);
      let operand;
      let rest$1;
      if ($1 instanceof Ok) {
        operand = $1[0][0];
        rest$1 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          671,
          "parse_unary",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 19970,
            end: 20021,
            pattern_start: 19981,
            pattern_end: 20001
          }
        );
      }
      return new Ok(
        [new EUnary(new Negate(), new Box(operand)), rest$1]
      );
    } else if ($ instanceof Bang) {
      let rest = tokens$1.tail;
      let $1 = parse_unary(rest);
      let operand;
      let rest$1;
      if ($1 instanceof Ok) {
        operand = $1[0][0];
        rest$1 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          667,
          "parse_unary",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 19824,
            end: 19875,
            pattern_start: 19835,
            pattern_end: 19855
          }
        );
      }
      return new Ok(
        [new EUnary(new Not(), new Box(operand)), rest$1]
      );
    } else {
      return parse_call_primary(tokens$1);
    }
  }
}
function parse_binary(tokens, min_prec) {
  let $ = parse_unary(tokens);
  let left;
  let tokens_after_left;
  if ($ instanceof Ok) {
    left = $[0][0];
    tokens_after_left = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      607,
      "parse_binary",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 17600,
        end: 17663,
        pattern_start: 17611,
        pattern_end: 17641
      }
    );
  }
  return parse_binary_cont(tokens_after_left, left, min_prec);
}
function parse_pipe_chain(loop$tokens, loop$left) {
  while (true) {
    let tokens = loop$tokens;
    let left = loop$left;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      return new Ok([left, tokens$1]);
    } else {
      let $ = tokens$1.head;
      if ($ instanceof Pipe) {
        let rest = tokens$1.tail;
        let $1 = parse_binary(rest, 1);
        let right;
        let rest$1;
        if ($1 instanceof Ok) {
          right = $1[0][0];
          rest$1 = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            595,
            "parse_pipe_chain",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 17284,
              end: 17337,
              pattern_start: 17295,
              pattern_end: 17313
            }
          );
        }
        let pipe_expr = new EPipe(new Box(left), new Box(right));
        loop$tokens = rest$1;
        loop$left = pipe_expr;
      } else {
        return new Ok([left, tokens$1]);
      }
    }
  }
}
function parse_expression(tokens) {
  let $ = parse_binary(tokens, 1);
  let expr;
  let tokens$1;
  if ($ instanceof Ok) {
    expr = $[0][0];
    tokens$1 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      536,
      "parse_expression",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 15035,
        end: 15091,
        pattern_start: 15046,
        pattern_end: 15065
      }
    );
  }
  let _pipe = parse_pipe_chain(tokens$1, expr);
  return reassign_check(_pipe);
}
function parse_let_def(tokens) {
  let $ = expect(tokens, new Let());
  let tokens$1;
  if ($ instanceof Ok) {
    tokens$1 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      324,
      "parse_let_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 9086,
        end: 9135,
        pattern_start: 9097,
        pattern_end: 9113
      }
    );
  }
  let tokens$2 = skip_newlines(tokens$1);
  let $1 = consume(
    tokens$2,
    "<identifier>",
    (t2) => {
      if (t2 instanceof Identifier) {
        return true;
      } else {
        return false;
      }
    }
  );
  let name;
  let tokens$3;
  if ($1 instanceof Ok) {
    let $2 = $1[0][0];
    if ($2 instanceof Identifier) {
      tokens$3 = $1[0][1];
      name = $2[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        326,
        "parse_let_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 9175,
          end: 9342,
          pattern_start: 9186,
          pattern_end: 9217
        }
      );
    }
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      326,
      "parse_let_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 9175,
        end: 9342,
        pattern_start: 9186,
        pattern_end: 9217
      }
    );
  }
  let tokens$4 = skip_newlines(tokens$3);
  let _block;
  if (tokens$4 instanceof Empty) {
    _block = [new None(), tokens$4];
  } else {
    let $42 = tokens$4.head;
    if ($42 instanceof Colon) {
      let rest = tokens$4.tail;
      let rest$1 = skip_newlines(rest);
      let $52 = parse_type(rest$1);
      let ann;
      let rest$2;
      if ($52 instanceof Ok) {
        ann = $52[0][0];
        rest$2 = $52[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          338,
          "parse_let_def",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $52,
            start: 9484,
            end: 9530,
            pattern_start: 9495,
            pattern_end: 9511
          }
        );
      }
      _block = [new Some(ann), rest$2];
    } else {
      _block = [new None(), tokens$4];
    }
  }
  let $3 = _block;
  let t = $3[0];
  let tokens$5 = $3[1];
  let tokens$6 = skip_newlines(tokens$5);
  let $4 = expect(tokens$6, new Equal2());
  let tokens$7;
  if ($4 instanceof Ok) {
    tokens$7 = $4[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      345,
      "parse_let_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $4,
        start: 9631,
        end: 9682,
        pattern_start: 9642,
        pattern_end: 9658
      }
    );
  }
  let tokens$8 = skip_newlines(tokens$7);
  let $5 = parse_expression(tokens$8);
  let value;
  let tokens$9;
  if ($5 instanceof Ok) {
    value = $5[0][0];
    tokens$9 = $5[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      347,
      "parse_let_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $5,
        start: 9722,
        end: 9780,
        pattern_start: 9733,
        pattern_end: 9753
      }
    );
  }
  return new Ok([new DefLet(name, t, value), tokens$9]);
}
function parse_function_def(tokens) {
  let $ = expect(tokens, new Fn());
  let tokens$1;
  if ($ instanceof Ok) {
    tokens$1 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      240,
      "parse_function_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 6700,
        end: 6748,
        pattern_start: 6711,
        pattern_end: 6727
      }
    );
  }
  let tokens$2 = skip_newlines(tokens$1);
  let $1 = consume(
    tokens$2,
    "<identifier>",
    (t) => {
      if (t instanceof Identifier) {
        return true;
      } else {
        return false;
      }
    }
  );
  let name;
  let tokens$3;
  if ($1 instanceof Ok) {
    let $2 = $1[0][0];
    if ($2 instanceof Identifier) {
      tokens$3 = $1[0][1];
      name = $2[0];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        242,
        "parse_function_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $1,
          start: 6788,
          end: 6955,
          pattern_start: 6799,
          pattern_end: 6830
        }
      );
    }
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      242,
      "parse_function_def",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $1,
        start: 6788,
        end: 6955,
        pattern_start: 6799,
        pattern_end: 6830
      }
    );
  }
  let tokens$4 = skip_newlines(tokens$3);
  let _block;
  if (tokens$4 instanceof Empty) {
    let $42 = expect(tokens$4, new LParen());
    let tokens$52;
    if ($42 instanceof Ok) {
      tokens$52 = $42[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        254,
        "parse_function_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $42,
          start: 7101,
          end: 7153,
          pattern_start: 7112,
          pattern_end: 7128
        }
      );
    }
    let tokens$62 = skip_newlines(tokens$52);
    let $5 = parse_param_list(tokens$62);
    let params2 = $5[0];
    let tokens$72 = $5[1];
    let tokens$8 = skip_newlines(tokens$72);
    let $6 = expect(tokens$8, new RParen());
    let tokens$9;
    if ($6 instanceof Ok) {
      tokens$9 = $6[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        258,
        "parse_function_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $6,
          start: 7297,
          end: 7349,
          pattern_start: 7308,
          pattern_end: 7324
        }
      );
    }
    let tokens$10 = skip_newlines(tokens$9);
    let _block$12;
    if (tokens$10 instanceof Empty) {
      _block$12 = [new None(), tokens$10];
    } else {
      let $8 = tokens$10.head;
      if ($8 instanceof Arrow) {
        let rest = tokens$10.tail;
        let rest$1 = skip_newlines(rest);
        let $9 = parse_type(rest$1);
        let t;
        let rest$2;
        if ($9 instanceof Ok) {
          t = $9[0][0];
          rest$2 = $9[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            264,
            "parse_function_def",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $9,
              start: 7518,
              end: 7562,
              pattern_start: 7529,
              pattern_end: 7543
            }
          );
        }
        _block$12 = [new Some(t), rest$2];
      } else {
        _block$12 = [new None(), tokens$10];
      }
    }
    let $7 = _block$12;
    let ret_type2 = $7[0];
    let tokens$11 = $7[1];
    _block = [params2, ret_type2, tokens$11];
  } else {
    let $42 = tokens$4.head;
    if ($42 instanceof LBrace) {
      _block = [toList([]), new None(), tokens$4];
    } else {
      let $5 = expect(tokens$4, new LParen());
      let tokens$52;
      if ($5 instanceof Ok) {
        tokens$52 = $5[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          254,
          "parse_function_def",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $5,
            start: 7101,
            end: 7153,
            pattern_start: 7112,
            pattern_end: 7128
          }
        );
      }
      let tokens$62 = skip_newlines(tokens$52);
      let $6 = parse_param_list(tokens$62);
      let params2 = $6[0];
      let tokens$72 = $6[1];
      let tokens$8 = skip_newlines(tokens$72);
      let $7 = expect(tokens$8, new RParen());
      let tokens$9;
      if ($7 instanceof Ok) {
        tokens$9 = $7[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          258,
          "parse_function_def",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $7,
            start: 7297,
            end: 7349,
            pattern_start: 7308,
            pattern_end: 7324
          }
        );
      }
      let tokens$10 = skip_newlines(tokens$9);
      let _block$12;
      if (tokens$10 instanceof Empty) {
        _block$12 = [new None(), tokens$10];
      } else {
        let $9 = tokens$10.head;
        if ($9 instanceof Arrow) {
          let rest = tokens$10.tail;
          let rest$1 = skip_newlines(rest);
          let $10 = parse_type(rest$1);
          let t;
          let rest$2;
          if ($10 instanceof Ok) {
            t = $10[0][0];
            rest$2 = $10[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              264,
              "parse_function_def",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $10,
                start: 7518,
                end: 7562,
                pattern_start: 7529,
                pattern_end: 7543
              }
            );
          }
          _block$12 = [new Some(t), rest$2];
        } else {
          _block$12 = [new None(), tokens$10];
        }
      }
      let $8 = _block$12;
      let ret_type2 = $8[0];
      let tokens$11 = $8[1];
      _block = [params2, ret_type2, tokens$11];
    }
  }
  let $3 = _block;
  let params = $3[0];
  let ret_type = $3[1];
  let tokens$5 = $3[2];
  let tokens$6 = skip_newlines(tokens$5);
  let _block$1;
  if (tokens$6 instanceof Empty) {
    let $5 = parse_block(tokens$6);
    let body2;
    let tokens$72;
    if ($5 instanceof Ok) {
      body2 = $5[0][0];
      tokens$72 = $5[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        281,
        "parse_function_def",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $5,
          start: 7928,
          end: 7980,
          pattern_start: 7939,
          pattern_end: 7958
        }
      );
    }
    _block$1 = [body2, tokens$72];
  } else {
    let $5 = tokens$6.head;
    if ($5 instanceof DoubleArrow) {
      let rest = tokens$6.tail;
      let rest$1 = skip_newlines(rest);
      let $6 = parse_expression(rest$1);
      let body2;
      let rest$2;
      if ($6 instanceof Ok) {
        body2 = $6[0][0];
        rest$2 = $6[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          277,
          "parse_function_def",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $6,
            start: 7831,
            end: 7884,
            pattern_start: 7842,
            pattern_end: 7859
          }
        );
      }
      _block$1 = [body2, rest$2];
    } else {
      let $6 = parse_block(tokens$6);
      let body2;
      let tokens$72;
      if ($6 instanceof Ok) {
        body2 = $6[0][0];
        tokens$72 = $6[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          281,
          "parse_function_def",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $6,
            start: 7928,
            end: 7980,
            pattern_start: 7939,
            pattern_end: 7958
          }
        );
      }
      _block$1 = [body2, tokens$72];
    }
  }
  let $4 = _block$1;
  let body = $4[0];
  let tokens$7 = $4[1];
  return new Ok([new DefFunction(name, params, ret_type, body), tokens$7]);
}
function parse_block_items(tokens) {
  let tokens$1 = skip_newlines(tokens);
  if (tokens$1 instanceof Empty) {
    let $ = parse_expression(tokens$1);
    let expr;
    let tokens$2;
    if ($ instanceof Ok) {
      expr = $[0][0];
      tokens$2 = $[0][1];
    } else {
      throw makeError(
        "let_assert",
        FILEPATH,
        "parser",
        1047,
        "parse_block_items",
        "Pattern match failed, no pattern matched the value.",
        {
          value: $,
          start: 32143,
          end: 32200,
          pattern_start: 32154,
          pattern_end: 32173
        }
      );
    }
    let tokens$3 = skip_newlines(tokens$2);
    let $1 = parse_block_items(tokens$3);
    let items = $1[0];
    let tokens$4 = $1[1];
    return [prepend(new BlockExpr(expr), items), tokens$4];
  } else {
    let $ = tokens$1.head;
    if ($ instanceof Fn) {
      let rest = tokens$1.tail;
      if (rest instanceof Empty) {
        let $1 = parse_function_def(tokens$1);
        let def;
        let tokens$2;
        if ($1 instanceof Ok) {
          def = $1[0][0];
          tokens$2 = $1[0][1];
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            1027,
            "parse_block_items",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 31433,
              end: 31491,
              pattern_start: 31444,
              pattern_end: 31462
            }
          );
        }
        let tokens$3 = skip_newlines(tokens$2);
        let $2 = parse_block_items(tokens$3);
        let items = $2[0];
        let tokens$4 = $2[1];
        return [prepend(new BlockDef(def), items), tokens$4];
      } else {
        let $1 = rest.head;
        if ($1 instanceof LParen) {
          let $2 = parse_lambda(rest);
          let expr;
          let tokens$2;
          if ($2 instanceof Ok) {
            expr = $2[0][0];
            tokens$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              1021,
              "parse_block_items",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 31190,
                end: 31241,
                pattern_start: 31201,
                pattern_end: 31220
              }
            );
          }
          let tokens$3 = skip_newlines(tokens$2);
          let $3 = parse_block_items(tokens$3);
          let items = $3[0];
          let tokens$4 = $3[1];
          return [prepend(new BlockExpr(expr), items), tokens$4];
        } else {
          let $2 = parse_function_def(tokens$1);
          let def;
          let tokens$2;
          if ($2 instanceof Ok) {
            def = $2[0][0];
            tokens$2 = $2[0][1];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              1027,
              "parse_block_items",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $2,
                start: 31433,
                end: 31491,
                pattern_start: 31444,
                pattern_end: 31462
              }
            );
          }
          let tokens$3 = skip_newlines(tokens$2);
          let $3 = parse_block_items(tokens$3);
          let items = $3[0];
          let tokens$4 = $3[1];
          return [prepend(new BlockDef(def), items), tokens$4];
        }
      }
    } else if ($ instanceof Let) {
      let $1 = parse_let_def(tokens$1);
      let def;
      let tokens$2;
      if ($1 instanceof Ok) {
        def = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          1035,
          "parse_block_items",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 31695,
            end: 31748,
            pattern_start: 31706,
            pattern_end: 31724
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let $2 = parse_block_items(tokens$3);
      let items = $2[0];
      let tokens$4 = $2[1];
      return [prepend(new BlockDef(def), items), tokens$4];
    } else if ($ instanceof Type) {
      let $1 = parse_type_def(tokens$1);
      let def;
      let tokens$2;
      if ($1 instanceof Ok) {
        def = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          1041,
          "parse_block_items",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 31923,
            end: 31977,
            pattern_start: 31934,
            pattern_end: 31952
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let $2 = parse_block_items(tokens$3);
      let items = $2[0];
      let tokens$4 = $2[1];
      return [prepend(new BlockDef(def), items), tokens$4];
    } else if ($ instanceof RBrace) {
      return [toList([]), tokens$1];
    } else {
      let $1 = parse_expression(tokens$1);
      let expr;
      let tokens$2;
      if ($1 instanceof Ok) {
        expr = $1[0][0];
        tokens$2 = $1[0][1];
      } else {
        throw makeError(
          "let_assert",
          FILEPATH,
          "parser",
          1047,
          "parse_block_items",
          "Pattern match failed, no pattern matched the value.",
          {
            value: $1,
            start: 32143,
            end: 32200,
            pattern_start: 32154,
            pattern_end: 32173
          }
        );
      }
      let tokens$3 = skip_newlines(tokens$2);
      let $2 = parse_block_items(tokens$3);
      let items = $2[0];
      let tokens$4 = $2[1];
      return [prepend(new BlockExpr(expr), items), tokens$4];
    }
  }
}
function parse_block(tokens) {
  let $ = expect(tokens, new LBrace());
  let tokens$1;
  if ($ instanceof Ok) {
    tokens$1 = $[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      1003,
      "parse_block",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 30649,
        end: 30701,
        pattern_start: 30660,
        pattern_end: 30676
      }
    );
  }
  let tokens$2 = skip_newlines(tokens$1);
  let $1 = parse_block_items(tokens$2);
  let items = $1[0];
  let remaining = $1[1];
  let remaining$1 = skip_newlines(remaining);
  let $2 = expect(remaining$1, new RBrace());
  let remaining$2;
  if ($2 instanceof Ok) {
    remaining$2 = $2[0][1];
  } else {
    throw makeError(
      "let_assert",
      FILEPATH,
      "parser",
      1007,
      "parse_block",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $2,
        start: 30838,
        end: 30896,
        pattern_start: 30849,
        pattern_end: 30868
      }
    );
  }
  return new Ok([new EBlock(items), remaining$2]);
}
function parse_definitions(loop$tokens, loop$imports, loop$acc) {
  while (true) {
    let tokens = loop$tokens;
    let imports = loop$imports;
    let acc = loop$acc;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      if (tokens$1 instanceof Empty) {
        return new Ok([reverse(imports), reverse(acc), tokens$1]);
      } else {
        let rest = tokens$1.tail;
        loop$tokens = rest;
        loop$imports = imports;
        loop$acc = acc;
      }
    } else {
      let $ = tokens$1.head;
      if ($ instanceof Import2) {
        let tokens$2 = skip_newlines(tokens$1);
        let $1 = consume(
          tokens$2,
          "<identifier>",
          (t) => {
            if (t instanceof Identifier) {
              return true;
            } else {
              return false;
            }
          }
        );
        let path2;
        let tokens$3;
        if ($1 instanceof Ok) {
          let $2 = $1[0][0];
          if ($2 instanceof Identifier) {
            tokens$3 = $1[0][1];
            path2 = $2[0];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              166,
              "parse_definitions",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $1,
                start: 4369,
                end: 4560,
                pattern_start: 4380,
                pattern_end: 4411
              }
            );
          }
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            166,
            "parse_definitions",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 4369,
              end: 4560,
              pattern_start: 4380,
              pattern_end: 4411
            }
          );
        }
        let tokens$4 = skip_newlines(tokens$3);
        let _block;
        if (tokens$4 instanceof Empty) {
          _block = [new None(), tokens$4];
        } else {
          let $4 = tokens$4.head;
          if ($4 instanceof As) {
            let rest2 = tokens$4.tail;
            let rest2$1 = skip_newlines(rest2);
            let $5 = consume(
              rest2$1,
              "<identifier>",
              (t) => {
                if (t instanceof Identifier) {
                  return true;
                } else {
                  return false;
                }
              }
            );
            let a;
            let rest2$2;
            if ($5 instanceof Ok) {
              let $6 = $5[0][0];
              if ($6 instanceof Identifier) {
                rest2$2 = $5[0][1];
                a = $6[0];
              } else {
                throw makeError(
                  "let_assert",
                  FILEPATH,
                  "parser",
                  177,
                  "parse_definitions",
                  "Pattern match failed, no pattern matched the value.",
                  {
                    value: $5,
                    start: 4725,
                    end: 4935,
                    pattern_start: 4736,
                    pattern_end: 4763
                  }
                );
              }
            } else {
              throw makeError(
                "let_assert",
                FILEPATH,
                "parser",
                177,
                "parse_definitions",
                "Pattern match failed, no pattern matched the value.",
                {
                  value: $5,
                  start: 4725,
                  end: 4935,
                  pattern_start: 4736,
                  pattern_end: 4763
                }
              );
            }
            _block = [new Some(a), rest2$2];
          } else {
            _block = [new None(), tokens$4];
          }
        }
        let $3 = _block;
        let alias = $3[0];
        let tokens$5 = $3[1];
        let tokens$6 = skip_newlines(tokens$5);
        loop$tokens = tokens$6;
        loop$imports = prepend(new Import(path2, alias), imports);
        loop$acc = acc;
      } else if ($ instanceof Fn) {
        return try$(
          parse_function_def(tokens$1),
          (pair) => {
            let def = pair[0];
            let tokens$2 = pair[1];
            let tokens$3 = skip_newlines(tokens$2);
            return parse_definitions(tokens$3, imports, prepend(def, acc));
          }
        );
      } else if ($ instanceof Let) {
        return try$(
          parse_let_def(tokens$1),
          (pair) => {
            let def = pair[0];
            let tokens$2 = pair[1];
            let tokens$3 = skip_newlines(tokens$2);
            return parse_definitions(tokens$3, imports, prepend(def, acc));
          }
        );
      } else if ($ instanceof Type) {
        return try$(
          parse_type_def(tokens$1),
          (pair) => {
            let def = pair[0];
            let tokens$2 = pair[1];
            let tokens$3 = skip_newlines(tokens$2);
            return parse_definitions(tokens$3, imports, prepend(def, acc));
          }
        );
      } else if ($ instanceof RBrace) {
        return new Ok([reverse(imports), reverse(acc), tokens$1]);
      } else if ($ instanceof Identifier) {
        let rest = tokens$1.tail;
        let name = $[0];
        let rest_skip = skip_newlines(rest);
        if (rest_skip instanceof Empty) {
          if (rest instanceof Empty) {
            return new Ok([reverse(imports), reverse(acc), rest]);
          } else {
            loop$tokens = rest;
            loop$imports = imports;
            loop$acc = acc;
          }
        } else {
          let $1 = rest_skip.head;
          if ($1 instanceof LBrace) {
            let $2 = parse_block(rest);
            let body;
            let rest$1;
            if ($2 instanceof Ok) {
              body = $2[0][0];
              rest$1 = $2[0][1];
            } else {
              throw makeError(
                "let_assert",
                FILEPATH,
                "parser",
                213,
                "parse_definitions",
                "Pattern match failed, no pattern matched the value.",
                {
                  value: $2,
                  start: 5891,
                  end: 5939,
                  pattern_start: 5902,
                  pattern_end: 5919
                }
              );
            }
            let rest$2 = skip_newlines(rest$1);
            loop$tokens = rest$2;
            loop$imports = imports;
            loop$acc = prepend(
              new DefFunction(name, toList([]), new None(), body),
              acc
            );
          } else {
            if (rest instanceof Empty) {
              return new Ok([reverse(imports), reverse(acc), rest]);
            } else {
              loop$tokens = rest;
              loop$imports = imports;
              loop$acc = acc;
            }
          }
        }
      } else {
        if (tokens$1 instanceof Empty) {
          return new Ok([reverse(imports), reverse(acc), tokens$1]);
        } else {
          let rest = tokens$1.tail;
          loop$tokens = rest;
          loop$imports = imports;
          loop$acc = acc;
        }
      }
    }
  }
}
function parse_top_level(loop$tokens, loop$imports, loop$defs) {
  while (true) {
    let tokens = loop$tokens;
    let imports = loop$imports;
    let defs = loop$defs;
    let tokens$1 = skip_newlines(tokens);
    if (tokens$1 instanceof Empty) {
      return new Ok([reverse(imports), reverse(defs), tokens$1]);
    } else {
      let $ = tokens$1.head;
      if ($ instanceof Import2) {
        let rest = tokens$1.tail;
        let rest$1 = skip_newlines(rest);
        let $1 = consume(
          rest$1,
          "<identifier>",
          (t) => {
            if (t instanceof Identifier) {
              return true;
            } else {
              return false;
            }
          }
        );
        let path2;
        let rest$2;
        if ($1 instanceof Ok) {
          let $2 = $1[0][0];
          if ($2 instanceof Identifier) {
            rest$2 = $1[0][1];
            path2 = $2[0];
          } else {
            throw makeError(
              "let_assert",
              FILEPATH,
              "parser",
              127,
              "parse_top_level",
              "Pattern match failed, no pattern matched the value.",
              {
                value: $1,
                start: 3186,
                end: 3373,
                pattern_start: 3197,
                pattern_end: 3226
              }
            );
          }
        } else {
          throw makeError(
            "let_assert",
            FILEPATH,
            "parser",
            127,
            "parse_top_level",
            "Pattern match failed, no pattern matched the value.",
            {
              value: $1,
              start: 3186,
              end: 3373,
              pattern_start: 3197,
              pattern_end: 3226
            }
          );
        }
        let rest$3 = skip_newlines(rest$2);
        let _block;
        if (rest$3 instanceof Empty) {
          _block = [new None(), rest$3];
        } else {
          let $4 = rest$3.head;
          if ($4 instanceof As) {
            let rest2 = rest$3.tail;
            let rest2$1 = skip_newlines(rest2);
            let $5 = consume(
              rest2$1,
              "<identifier>",
              (t) => {
                if (t instanceof Identifier) {
                  return true;
                } else {
                  return false;
                }
              }
            );
            let a;
            let rest2$2;
            if ($5 instanceof Ok) {
              let $6 = $5[0][0];
              if ($6 instanceof Identifier) {
                rest2$2 = $5[0][1];
                a = $6[0];
              } else {
                throw makeError(
                  "let_assert",
                  FILEPATH,
                  "parser",
                  138,
                  "parse_top_level",
                  "Pattern match failed, no pattern matched the value.",
                  {
                    value: $5,
                    start: 3530,
                    end: 3740,
                    pattern_start: 3541,
                    pattern_end: 3568
                  }
                );
              }
            } else {
              throw makeError(
                "let_assert",
                FILEPATH,
                "parser",
                138,
                "parse_top_level",
                "Pattern match failed, no pattern matched the value.",
                {
                  value: $5,
                  start: 3530,
                  end: 3740,
                  pattern_start: 3541,
                  pattern_end: 3568
                }
              );
            }
            _block = [new Some(a), rest2$2];
          } else {
            _block = [new None(), rest$3];
          }
        }
        let $3 = _block;
        let alias = $3[0];
        let rest$4 = $3[1];
        let rest$5 = skip_newlines(rest$4);
        loop$tokens = rest$5;
        loop$imports = prepend(new Import(path2, alias), imports);
        loop$defs = defs;
      } else {
        return parse_definitions(tokens$1, imports, defs);
      }
    }
  }
}
function parse_module(tokens) {
  let tokens$1 = skip_newlines(tokens);
  return try$(
    parse_top_level(tokens$1, toList([]), toList([])),
    (defs_imports) => {
      let imports = defs_imports[0];
      let defs = defs_imports[1];
      let remaining = defs_imports[2];
      return new Ok([new Module("main", imports, defs), remaining]);
    }
  );
}

// build/dev/javascript/zein/typechecker.mjs
var TInt = class extends CustomType {
};
var TFloat = class extends CustomType {
};
var TBool = class extends CustomType {
};
var TString = class extends CustomType {
};
var TVar = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var TFun = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var TApp = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var TypeError2 = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var TypeEnv = class extends CustomType {
  constructor(bindings) {
    super();
    this.bindings = bindings;
  }
};
var Substitution = class extends CustomType {
  constructor(map4) {
    super();
    this.map = map4;
  }
};
var TypeCheckerState = class extends CustomType {
  constructor(env, subs, counter, errors) {
    super();
    this.env = env;
    this.subs = subs;
    this.counter = counter;
    this.errors = errors;
  }
};
function empty_env() {
  return new TypeEnv(toList([]));
}
function empty_subs() {
  return new Substitution(toList([]));
}
function initial_state() {
  return new TypeCheckerState(empty_env(), empty_subs(), 0, toList([]));
}
function extend_env(env, name, t) {
  return new TypeEnv(prepend([name, t], env.bindings));
}
function lookup_env(loop$env, loop$name) {
  while (true) {
    let env = loop$env;
    let name = loop$name;
    let $ = env.bindings;
    if ($ instanceof Empty) {
      return new Error2(new TypeError2("undefined variable: " + name));
    } else {
      let rest = $.tail;
      let n = $.head[0];
      let t = $.head[1];
      let $1 = n === name;
      if ($1) {
        return new Ok(t);
      } else {
        loop$env = new TypeEnv(rest);
        loop$name = name;
      }
    }
  }
}
function fresh_tvar(state) {
  return [
    new TVar(state.counter),
    new TypeCheckerState(state.env, state.subs, state.counter + 1, state.errors)
  ];
}
function add_subs(subs, id, t) {
  return new Substitution(prepend([id, t], subs.map));
}
function unbox(b) {
  let v = b[0];
  return v;
}
function prune(loop$t, loop$subs) {
  while (true) {
    let t = loop$t;
    let subs = loop$subs;
    if (t instanceof TVar) {
      let id = t[0];
      let $ = subs.map;
      if ($ instanceof Empty) {
        return new TVar(id);
      } else {
        let rest = $.tail;
        let sid = $.head[0];
        let st = $.head[1];
        let $1 = id === sid;
        if ($1) {
          loop$t = st;
          loop$subs = subs;
        } else {
          loop$t = new TVar(id);
          loop$subs = new Substitution(rest);
        }
      }
    } else if (t instanceof TFun) {
      let params = t[0];
      let ret = t[1];
      return new TFun(
        map2(params, (p) => {
          return prune(p, subs);
        }),
        new Box(prune(unbox(ret), subs))
      );
    } else if (t instanceof TApp) {
      let name = t[0];
      let args = t[1];
      return new TApp(name, map2(args, (a) => {
        return prune(a, subs);
      }));
    } else {
      return t;
    }
  }
}
function prune_all(t, subs) {
  let t1 = prune(t, subs);
  if (t1 instanceof TVar) {
    return t1;
  } else {
    return t1;
  }
}
function occurs_list(id, types, subs) {
  if (types instanceof Empty) {
    return false;
  } else {
    let t = types.head;
    let rest = types.tail;
    return occurs(id, t, subs) || occurs_list(id, rest, subs);
  }
}
function occurs(id, t, subs) {
  let t$1 = prune(t, subs);
  if (t$1 instanceof TVar) {
    let other_id = t$1[0];
    return id === other_id;
  } else if (t$1 instanceof TFun) {
    let params = t$1[0];
    let ret = t$1[1];
    return occurs_list(id, params, subs) || occurs(id, unbox(ret), subs);
  } else if (t$1 instanceof TApp) {
    let args = t$1[1];
    return occurs_list(id, args, subs);
  } else {
    return false;
  }
}
function type_to_string(t) {
  if (t instanceof TInt) {
    return "Int";
  } else if (t instanceof TFloat) {
    return "Float";
  } else if (t instanceof TBool) {
    return "Bool";
  } else if (t instanceof TString) {
    return "String";
  } else if (t instanceof TVar) {
    let id = t[0];
    return "'t" + to_string(id);
  } else if (t instanceof TFun) {
    let params = t[0];
    let ret = t[1];
    let _block;
    let _pipe = params;
    let _pipe$1 = map2(_pipe, type_to_string);
    _block = join(_pipe$1, ", ");
    let params_str = _block;
    return "(" + params_str + ") -> " + type_to_string(unbox(ret));
  } else {
    let name = t[0];
    let args = t[1];
    if (args instanceof Empty) {
      return name;
    } else {
      let _block;
      let _pipe = args;
      let _pipe$1 = map2(_pipe, type_to_string);
      _block = join(_pipe$1, ", ");
      let args_str = _block;
      return name + "<" + args_str + ">";
    }
  }
}
function add_error(state, err) {
  return new TypeCheckerState(
    state.env,
    state.subs,
    state.counter,
    prepend(err, state.errors)
  );
}
function unify_lists(loop$l1, loop$l2, loop$state) {
  while (true) {
    let l1 = loop$l1;
    let l2 = loop$l2;
    let state = loop$state;
    if (l1 instanceof Empty) {
      if (l2 instanceof Empty) {
        return state;
      } else {
        return add_error(state, new TypeError2("type arity mismatch"));
      }
    } else if (l2 instanceof Empty) {
      return add_error(state, new TypeError2("type arity mismatch"));
    } else {
      let t1 = l1.head;
      let r1 = l1.tail;
      let t2 = l2.head;
      let r2 = l2.tail;
      let state$1 = unify(t1, t2, state);
      loop$l1 = r1;
      loop$l2 = r2;
      loop$state = state$1;
    }
  }
}
function unify(t1, t2, state) {
  let t1$1 = prune_all(t1, state.subs);
  let t2$1 = prune_all(t2, state.subs);
  if (t1$1 instanceof TInt) {
    if (t2$1 instanceof TInt) {
      return state;
    } else if (t2$1 instanceof TVar) {
      let id = t2$1[0];
      let $ = occurs(id, t1$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t1$1),
          state.counter,
          state.errors
        );
      }
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else if (t1$1 instanceof TFloat) {
    if (t2$1 instanceof TFloat) {
      return state;
    } else if (t2$1 instanceof TVar) {
      let id = t2$1[0];
      let $ = occurs(id, t1$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t1$1),
          state.counter,
          state.errors
        );
      }
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else if (t1$1 instanceof TBool) {
    if (t2$1 instanceof TBool) {
      return state;
    } else if (t2$1 instanceof TVar) {
      let id = t2$1[0];
      let $ = occurs(id, t1$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t1$1),
          state.counter,
          state.errors
        );
      }
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else if (t1$1 instanceof TString) {
    if (t2$1 instanceof TString) {
      return state;
    } else if (t2$1 instanceof TVar) {
      let id = t2$1[0];
      let $ = occurs(id, t1$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t1$1),
          state.counter,
          state.errors
        );
      }
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else if (t1$1 instanceof TVar) {
    if (t2$1 instanceof TVar) {
      let id1 = t1$1[0];
      let id2 = t2$1[0];
      if (id1 === id2) {
        return state;
      } else {
        let id = t1$1[0];
        let $ = occurs(id, t2$1, state.subs);
        if ($) {
          return add_error(state, new TypeError2("recursive type"));
        } else {
          return new TypeCheckerState(
            state.env,
            add_subs(state.subs, id, t2$1),
            state.counter,
            state.errors
          );
        }
      }
    } else {
      let id = t1$1[0];
      let $ = occurs(id, t2$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t2$1),
          state.counter,
          state.errors
        );
      }
    }
  } else if (t1$1 instanceof TFun) {
    if (t2$1 instanceof TVar) {
      let id = t2$1[0];
      let $ = occurs(id, t1$1, state.subs);
      if ($) {
        return add_error(state, new TypeError2("recursive type"));
      } else {
        return new TypeCheckerState(
          state.env,
          add_subs(state.subs, id, t1$1),
          state.counter,
          state.errors
        );
      }
    } else if (t2$1 instanceof TFun) {
      let p1 = t1$1[0];
      let r1 = t1$1[1];
      let p2 = t2$1[0];
      let r2 = t2$1[1];
      let state$1 = unify(unbox(r1), unbox(r2), state);
      return unify_lists(p1, p2, state$1);
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else if (t2$1 instanceof TVar) {
    let id = t2$1[0];
    let $ = occurs(id, t1$1, state.subs);
    if ($) {
      return add_error(state, new TypeError2("recursive type"));
    } else {
      return new TypeCheckerState(
        state.env,
        add_subs(state.subs, id, t1$1),
        state.counter,
        state.errors
      );
    }
  } else if (t2$1 instanceof TApp) {
    let n1 = t1$1[0];
    let n2 = t2$1[0];
    if (n1 === n2) {
      let a1 = t1$1[1];
      let a2 = t2$1[1];
      return unify_lists(a1, a2, state);
    } else {
      return add_error(
        state,
        new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
      );
    }
  } else {
    return add_error(
      state,
      new TypeError2(type_to_string(t1$1) + " != " + type_to_string(t2$1))
    );
  }
}
function apply_subs(t, subs) {
  let t$1 = prune_all(t, subs);
  if (t$1 instanceof TFun) {
    let params = t$1[0];
    let ret = t$1[1];
    return new TFun(
      map2(params, (p) => {
        return apply_subs(p, subs);
      }),
      new Box(apply_subs(unbox(ret), subs))
    );
  } else if (t$1 instanceof TApp) {
    let name = t$1[0];
    let args = t$1[1];
    return new TApp(
      name,
      map2(args, (a) => {
        return apply_subs(a, subs);
      })
    );
  } else {
    return t$1;
  }
}
function type_from_annotation(ann) {
  if (ann instanceof TNamed) {
    let name = ann[0];
    let params = ann[1];
    if (name === "Int") {
      return new TInt();
    } else if (name === "Float") {
      return new TFloat();
    } else if (name === "Bool") {
      return new TBool();
    } else if (name === "String") {
      return new TString();
    } else if (name === "Nil") {
      return new TApp("Nil", toList([]));
    } else {
      return new TApp(name, map2(params, type_from_annotation));
    }
  } else if (ann instanceof TVariable) {
    return new TApp("Var", toList([]));
  } else {
    let params = ann[0];
    let ret = ann[1];
    return new TFun(
      map2(params, type_from_annotation),
      new Box(type_from_annotation(unbox(ret)))
    );
  }
}
function zip_fold(loop$params, loop$types, loop$env, loop$f) {
  while (true) {
    let params = loop$params;
    let types = loop$types;
    let env = loop$env;
    let f = loop$f;
    if (params instanceof Empty) {
      return env;
    } else if (types instanceof Empty) {
      return env;
    } else {
      let p = params.head;
      let prest = params.tail;
      let t = types.head;
      let trest = types.tail;
      loop$params = prest;
      loop$types = trest;
      loop$env = f(env, p, t);
      loop$f = f;
    }
  }
}
function check_pattern(pattern, value_type, state) {
  if (pattern instanceof PLiteral) {
    let lit = pattern[0];
    let _block;
    if (lit instanceof LInt) {
      _block = new TInt();
    } else if (lit instanceof LFloat) {
      _block = new TFloat();
    } else if (lit instanceof LBool) {
      _block = new TBool();
    } else {
      _block = new TString();
    }
    let lit_t = _block;
    return unify(value_type, lit_t, state);
  } else if (pattern instanceof PVariable) {
    return state;
  } else if (pattern instanceof PWildcard) {
    return state;
  } else {
    let fields = pattern[1];
    return fold2(
      fields,
      state,
      (s, f) => {
        return check_pattern(f, value_type, s);
      }
    );
  }
}
function infer_variable(name, state) {
  if (name === "print") {
    let $ = fresh_tvar(state);
    let t = $[0];
    let state$1 = $[1];
    return [
      new TFun(toList([t]), new Box(new TApp("Nil", toList([])))),
      state$1
    ];
  } else if (name === "random_int") {
    return [new TFun(toList([new TInt()]), new Box(new TInt())), state];
  } else {
    let $ = lookup_env(state.env, name);
    if ($ instanceof Ok) {
      let t = $[0];
      return [apply_subs(t, state.subs), state];
    } else {
      let e = $[0];
      return [new TVar(-1), add_error(state, e)];
    }
  }
}
function infer_literal(lit, state) {
  if (lit instanceof LInt) {
    return [new TInt(), state];
  } else if (lit instanceof LFloat) {
    return [new TFloat(), state];
  } else if (lit instanceof LBool) {
    return [new TBool(), state];
  } else {
    return [new TString(), state];
  }
}
function infer_list(items, state) {
  let $ = fresh_tvar(state);
  let elem_t = $[0];
  let state$1 = $[1];
  let $1 = fold2(
    items,
    [toList([]), state$1],
    (acc, item) => {
      let types = acc[0];
      let state$22 = acc[1];
      let $2 = infer_expression(item, state$22);
      let it = $2[0];
      let state$3 = $2[1];
      let state$4 = unify(elem_t, it, state$3);
      return [prepend(it, types), state$4];
    }
  );
  let item_types = $1[0];
  let state$2 = $1[1];
  return [new TApp("List", toList([apply_subs(elem_t, state$2.subs)])), state$2];
}
function infer_method_call(expr, method, args, state) {
  let $ = infer_expression(unbox(expr), state);
  let state$1 = $[1];
  let $1 = fold2(
    args,
    [toList([]), state$1],
    (acc, arg) => {
      let types = acc[0];
      let state$22 = acc[1];
      let $22 = infer_expression(arg, state$22);
      let at = $22[0];
      let state$32 = $22[1];
      return [prepend(at, types), state$32];
    }
  );
  let arg_types = $1[0];
  let state$2 = $1[1];
  let $2 = fresh_tvar(state$2);
  let ret_t = $2[0];
  let state$3 = $2[1];
  return [ret_t, state$3];
}
function infer_field_access(expr, field, state) {
  let $ = infer_expression(unbox(expr), state);
  let state$1 = $[1];
  let $1 = fresh_tvar(state$1);
  let ret_t = $1[0];
  let state$2 = $1[1];
  return [ret_t, state$2];
}
function infer_record(name, fields, state) {
  let state$1 = fold2(
    fields,
    state,
    (state2, pair) => {
      let fexpr = pair[1];
      let $ = infer_expression(fexpr, state2);
      let state$12 = $[1];
      return state$12;
    }
  );
  return [new TApp(name, toList([])), state$1];
}
function infer_index(expr, index2, state) {
  let $ = infer_expression(unbox(expr), state);
  let expr_t = $[0];
  let state$1 = $[1];
  let $1 = infer_expression(unbox(index2), state$1);
  let index_t = $1[0];
  let state$2 = $1[1];
  let state$3 = unify(index_t, new TInt(), state$2);
  let $2 = fresh_tvar(state$3);
  let elem_t = $2[0];
  let state$4 = $2[1];
  let state$5 = unify(expr_t, new TApp("List", toList([elem_t])), state$4);
  return [apply_subs(elem_t, state$5.subs), state$5];
}
function infer_while(cond, body, state) {
  let $ = infer_expression(unbox(cond), state);
  let cond_t = $[0];
  let state$1 = $[1];
  let state$2 = unify(cond_t, new TBool(), state$1);
  let $1 = infer_expression(unbox(body), state$2);
  let state$3 = $1[1];
  return [new TApp("Nil", toList([])), state$3];
}
function infer_for(name, iterable, body, state) {
  let $ = infer_expression(unbox(iterable), state);
  let iterable_t = $[0];
  let state$1 = $[1];
  let $1 = fresh_tvar(state$1);
  let elem_t = $1[0];
  let state$2 = $1[1];
  let expected_iterable = new TApp("List", toList([elem_t]));
  let state$3 = unify(iterable_t, expected_iterable, state$2);
  let env = extend_env(state$3.env, name, apply_subs(elem_t, state$3.subs));
  let state$4 = new TypeCheckerState(
    env,
    state$3.subs,
    state$3.counter,
    state$3.errors
  );
  let $2 = infer_expression(unbox(body), state$4);
  let state$5 = $2[1];
  return [new TApp("Nil", toList([])), state$5];
}
function infer_lambda(params, ret_type, body, state) {
  let $ = fold2(
    params,
    [toList([]), state],
    (acc, p) => {
      let types = acc[0];
      let state$12 = acc[1];
      let _block2;
      let $22 = p.param_type;
      if ($22 instanceof Some) {
        let ann = $22[0];
        _block2 = [type_from_annotation(ann), state$12];
      } else {
        _block2 = fresh_tvar(state$12);
      }
      let $12 = _block2;
      let pt = $12[0];
      let state$22 = $12[1];
      return [prepend(pt, types), state$22];
    }
  );
  let param_types = $[0];
  let state$1 = $[1];
  let param_types$1 = reverse(param_types);
  let _block;
  if (ret_type instanceof Some) {
    let ann = ret_type[0];
    _block = [type_from_annotation(ann), state$1];
  } else {
    _block = fresh_tvar(state$1);
  }
  let $1 = _block;
  let ret_t = $1[0];
  let state$2 = $1[1];
  let env = zip_fold(
    params,
    param_types$1,
    state$2.env,
    (e, p, t) => {
      return extend_env(e, p.name, t);
    }
  );
  let state$3 = new TypeCheckerState(
    env,
    state$2.subs,
    state$2.counter,
    state$2.errors
  );
  let $2 = infer_expression(unbox(body), state$3);
  let body_t = $2[0];
  let state$4 = $2[1];
  let state$5 = unify(body_t, ret_t, state$4);
  return [new TFun(param_types$1, new Box(ret_t)), state$5];
}
function infer_match(value, clauses, state) {
  let $ = infer_expression(unbox(value), state);
  let val_t = $[0];
  let state$1 = $[1];
  if (clauses instanceof Empty) {
    return [new TVar(-1), state$1];
  } else {
    let clause = clauses.head;
    let rest = clauses.tail;
    let state$2 = check_pattern(clause.pattern, val_t, state$1);
    let $1 = infer_expression(clause.body, state$2);
    let clause_t = $1[0];
    let state$3 = $1[1];
    return fold2(
      rest,
      [clause_t, state$3],
      (acc, c) => {
        let acc_t = acc[0];
        let state$4 = acc[1];
        let state$5 = check_pattern(c.pattern, val_t, state$4);
        let $2 = infer_expression(c.body, state$5);
        let c_t = $2[0];
        let state$6 = $2[1];
        let state$7 = unify(acc_t, c_t, state$6);
        return [apply_subs(c_t, state$7.subs), state$7];
      }
    );
  }
}
function infer_range(start, end_, state) {
  let $ = infer_expression(unbox(start), state);
  let start_t = $[0];
  let state$1 = $[1];
  let $1 = infer_expression(unbox(end_), state$1);
  let end_t = $1[0];
  let state$2 = $1[1];
  let state$3 = unify(start_t, new TInt(), state$2);
  let state$4 = unify(end_t, new TInt(), state$3);
  return [new TApp("List", toList([new TInt()])), state$4];
}
function infer_pipe(left, right, state) {
  let $ = infer_expression(unbox(left), state);
  let left_t = $[0];
  let state$1 = $[1];
  let $1 = infer_expression(unbox(right), state$1);
  let right_t = $1[0];
  let state$2 = $1[1];
  let $2 = fresh_tvar(state$2);
  let ret_t = $2[0];
  let state$3 = $2[1];
  let expected_fn = new TFun(toList([left_t]), new Box(ret_t));
  let state$4 = unify(right_t, expected_fn, state$3);
  return [apply_subs(ret_t, state$4.subs), state$4];
}
function infer_return(value, state) {
  let $ = infer_expression(unbox(value), state);
  let state$1 = $[1];
  return [new TApp("Nil", toList([])), state$1];
}
function infer_if(cond, conseq, else_ifs, alt, state) {
  let $ = infer_expression(unbox(cond), state);
  let cond_t = $[0];
  let state$1 = $[1];
  let state$2 = unify(cond_t, new TBool(), state$1);
  let $1 = infer_expression(unbox(conseq), state$2);
  let conseq_t = $1[0];
  let state$3 = $1[1];
  let $2 = fold2(
    else_ifs,
    [conseq_t, state$3],
    (acc, pair) => {
      let elif_cond = pair[0];
      let elif_body = pair[1];
      let state$42 = acc[1];
      let $3 = infer_expression(unbox(elif_cond), state$42);
      let ec_t = $3[0];
      let state$52 = $3[1];
      let state$6 = unify(ec_t, new TBool(), state$52);
      let $4 = infer_expression(unbox(elif_body), state$6);
      let eb_t = $4[0];
      let state$7 = $4[1];
      let state$8 = unify(conseq_t, eb_t, state$7);
      return [conseq_t, state$8];
    }
  );
  let state$4 = $2[1];
  let _block;
  if (alt instanceof Some) {
    let alt_body = alt[0];
    let $3 = infer_expression(unbox(alt_body), state$4);
    let alt_t = $3[0];
    let state$52 = $3[1];
    _block = unify(conseq_t, alt_t, state$52);
  } else {
    _block = state$4;
  }
  let state$5 = _block;
  return [apply_subs(conseq_t, state$5.subs), state$5];
}
function infer_block_item(item, state) {
  if (item instanceof BlockExpr) {
    let expr = item[0];
    return infer_expression(expr, state);
  } else {
    let def = item[0];
    return check_definition(def, state);
  }
}
function infer_block(loop$items, loop$state) {
  while (true) {
    let items = loop$items;
    let state = loop$state;
    if (items instanceof Empty) {
      return [new TApp("Nil", toList([])), state];
    } else {
      let $ = items.tail;
      if ($ instanceof Empty) {
        let item = items.head;
        return infer_block_item(item, state);
      } else {
        let item = items.head;
        let rest = $;
        let $1 = infer_block_item(item, state);
        let state$1 = $1[1];
        loop$items = rest;
        loop$state = state$1;
      }
    }
  }
}
function infer_let(name, t, value, body, state) {
  let $ = infer_expression(unbox(value), state);
  let val_t = $[0];
  let state$1 = $[1];
  let _block;
  if (t instanceof Some) {
    let ann = t[0];
    _block = unify(val_t, type_from_annotation(ann), state$1);
  } else {
    _block = state$1;
  }
  let state$2 = _block;
  let val_t$1 = apply_subs(val_t, state$2.subs);
  let env = extend_env(state$2.env, name, val_t$1);
  let state$3 = new TypeCheckerState(
    env,
    state$2.subs,
    state$2.counter,
    state$2.errors
  );
  return infer_expression(unbox(body), state$3);
}
function infer_reassign(name, value, state) {
  let $ = lookup_env(state.env, name);
  if ($ instanceof Ok) {
    let var_t = $[0];
    let var_t$1 = apply_subs(var_t, state.subs);
    let $1 = infer_expression(unbox(value), state);
    let val_t = $1[0];
    let state$1 = $1[1];
    let state$2 = unify(var_t$1, val_t, state$1);
    return [var_t$1, state$2];
  } else {
    let e = $[0];
    return [new TVar(-1), add_error(state, e)];
  }
}
function infer_unary(op, operand, state) {
  let $ = infer_expression(unbox(operand), state);
  let operand_t = $[0];
  let state$1 = $[1];
  if (op instanceof Negate) {
    let state$2 = unify(operand_t, new TInt(), state$1);
    return [new TInt(), state$2];
  } else {
    let state$2 = unify(operand_t, new TBool(), state$1);
    return [new TBool(), state$2];
  }
}
function infer_infix(left, op, right, state) {
  let $ = infer_expression(unbox(left), state);
  let left_t = $[0];
  let state$1 = $[1];
  let $1 = infer_expression(unbox(right), state$1);
  let right_t = $1[0];
  let state$2 = $1[1];
  if (op instanceof Add) {
    let state$3 = unify(left_t, new TInt(), state$2);
    let state$4 = unify(right_t, new TInt(), state$3);
    return [new TInt(), state$4];
  } else if (op instanceof Subtract) {
    let state$3 = unify(left_t, new TInt(), state$2);
    let state$4 = unify(right_t, new TInt(), state$3);
    return [new TInt(), state$4];
  } else if (op instanceof Multiply) {
    let state$3 = unify(left_t, new TInt(), state$2);
    let state$4 = unify(right_t, new TInt(), state$3);
    return [new TInt(), state$4];
  } else if (op instanceof Divide) {
    let state$3 = unify(left_t, new TInt(), state$2);
    let state$4 = unify(right_t, new TInt(), state$3);
    return [new TInt(), state$4];
  } else if (op instanceof Modulo) {
    let state$3 = unify(left_t, new TInt(), state$2);
    let state$4 = unify(right_t, new TInt(), state$3);
    return [new TInt(), state$4];
  } else if (op instanceof Equal) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof NotEqual) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof LessThan) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof GreaterThan) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof LessOrEqual) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof GreaterOrEqual) {
    let state$3 = unify(left_t, right_t, state$2);
    return [new TBool(), state$3];
  } else if (op instanceof And) {
    let state$3 = unify(left_t, new TBool(), state$2);
    let state$4 = unify(right_t, new TBool(), state$3);
    return [new TBool(), state$4];
  } else if (op instanceof Or) {
    let state$3 = unify(left_t, new TBool(), state$2);
    let state$4 = unify(right_t, new TBool(), state$3);
    return [new TBool(), state$4];
  } else {
    let state$3 = unify(left_t, new TString(), state$2);
    let state$4 = unify(right_t, new TString(), state$3);
    return [new TString(), state$4];
  }
}
function infer_call(callee, args, state) {
  let $ = infer_expression(unbox(callee), state);
  let callee_t = $[0];
  let state$1 = $[1];
  let $1 = fresh_tvar(state$1);
  let ret_t = $1[0];
  let state$2 = $1[1];
  let $2 = fold2(
    args,
    [toList([]), state$2],
    (acc, arg) => {
      let types = acc[0];
      let state$32 = acc[1];
      let $3 = infer_expression(arg, state$32);
      let arg_t = $3[0];
      let state$42 = $3[1];
      return [prepend(arg_t, types), state$42];
    }
  );
  let param_types = $2[0];
  let state$3 = $2[1];
  let param_types$1 = reverse(param_types);
  let expected_fn_t = new TFun(param_types$1, new Box(ret_t));
  let state$4 = unify(callee_t, expected_fn_t, state$3);
  return [apply_subs(ret_t, state$4.subs), state$4];
}
function infer_expression(expr, state) {
  if (expr instanceof ELiteral) {
    let lit = expr[0];
    return infer_literal(lit, state);
  } else if (expr instanceof EVariable) {
    let name = expr[0];
    return infer_variable(name, state);
  } else if (expr instanceof ECall) {
    let callee = expr[0];
    let args = expr[1];
    return infer_call(callee, args, state);
  } else if (expr instanceof EMethodCall) {
    let expr$1 = expr[0];
    let method = expr[1];
    let args = expr[2];
    return infer_method_call(expr$1, method, args, state);
  } else if (expr instanceof EFieldAccess) {
    let expr$1 = expr[0];
    let field = expr[1];
    return infer_field_access(expr$1, field, state);
  } else if (expr instanceof EIndex) {
    let expr$1 = expr[0];
    let index2 = expr[1];
    return infer_index(expr$1, index2, state);
  } else if (expr instanceof EInfix) {
    let left = expr[0];
    let op = expr[1];
    let right = expr[2];
    return infer_infix(left, op, right, state);
  } else if (expr instanceof EUnary) {
    let op = expr[0];
    let operand = expr[1];
    return infer_unary(op, operand, state);
  } else if (expr instanceof EReassign) {
    let name = expr[0];
    let value = expr[1];
    return infer_reassign(name, value, state);
  } else if (expr instanceof ELet) {
    let name = expr[0];
    let t = expr[1];
    let value = expr[2];
    let body = expr[3];
    return infer_let(name, t, value, body, state);
  } else if (expr instanceof EBlock) {
    let items = expr[0];
    return infer_block(items, state);
  } else if (expr instanceof EIf) {
    let cond = expr[0];
    let conseq = expr[1];
    let else_ifs = expr[2];
    let alt = expr[3];
    return infer_if(cond, conseq, else_ifs, alt, state);
  } else if (expr instanceof EReturn) {
    let value = expr[0];
    return infer_return(value, state);
  } else if (expr instanceof EPipe) {
    let left = expr[0];
    let right = expr[1];
    return infer_pipe(left, right, state);
  } else if (expr instanceof ERange) {
    let start = expr[0];
    let end_ = expr[1];
    return infer_range(start, end_, state);
  } else if (expr instanceof EMatch) {
    let value = expr[0];
    let clauses = expr[1];
    return infer_match(value, clauses, state);
  } else if (expr instanceof ELambda) {
    let params = expr[0];
    let ret_type = expr[1];
    let body = expr[2];
    return infer_lambda(params, ret_type, body, state);
  } else if (expr instanceof EFor) {
    let name = expr[0];
    let iterable = expr[1];
    let body = expr[2];
    return infer_for(name, iterable, body, state);
  } else if (expr instanceof EWhile) {
    let cond = expr[0];
    let body = expr[1];
    return infer_while(cond, body, state);
  } else if (expr instanceof ERecord) {
    let name = expr[0];
    let fields = expr[1];
    return infer_record(name, fields, state);
  } else {
    let items = expr[0];
    return infer_list(items, state);
  }
}
function check_definition(def, state) {
  if (def instanceof DefFunction) {
    let name = def.name;
    let params = def.params;
    let ret_type = def.return_type;
    let body = def.body;
    let $ = fold2(
      params,
      [toList([]), state],
      (acc, p) => {
        let types = acc[0];
        let state$12 = acc[1];
        let _block2;
        let $22 = p.param_type;
        if ($22 instanceof Some) {
          let ann = $22[0];
          _block2 = [type_from_annotation(ann), state$12];
        } else {
          _block2 = fresh_tvar(state$12);
        }
        let $12 = _block2;
        let pt = $12[0];
        let state$22 = $12[1];
        return [prepend(pt, types), state$22];
      }
    );
    let param_types = $[0];
    let state$1 = $[1];
    let param_types$1 = reverse(param_types);
    let _block;
    if (ret_type instanceof Some) {
      let ann = ret_type[0];
      _block = [type_from_annotation(ann), state$1];
    } else {
      _block = fresh_tvar(state$1);
    }
    let $1 = _block;
    let ret_t = $1[0];
    let state$2 = $1[1];
    let preliminary_fn_type = new TFun(param_types$1, new Box(ret_t));
    let env = zip_fold(
      params,
      param_types$1,
      state$2.env,
      (e, p, t) => {
        return extend_env(e, p.name, t);
      }
    );
    let env$1 = extend_env(env, name, preliminary_fn_type);
    let state$3 = new TypeCheckerState(
      env$1,
      state$2.subs,
      state$2.counter,
      state$2.errors
    );
    let $2 = infer_expression(body, state$3);
    let body_t = $2[0];
    let state$4 = $2[1];
    let state$5 = unify(body_t, ret_t, state$4);
    let ret_t_resolved = apply_subs(ret_t, state$5.subs);
    let fn_type = new TFun(
      map2(param_types$1, (t) => {
        return apply_subs(t, state$5.subs);
      }),
      new Box(ret_t_resolved)
    );
    let env$2 = extend_env(state$5.env, name, fn_type);
    return [
      fn_type,
      new TypeCheckerState(env$2, state$5.subs, state$5.counter, state$5.errors)
    ];
  } else if (def instanceof DefType) {
    return [new TApp("Nil", toList([])), state];
  } else if (def instanceof DefRecord) {
    return [new TApp("Nil", toList([])), state];
  } else if (def instanceof DefAlias) {
    return [new TApp("Nil", toList([])), state];
  } else {
    let name = def[0];
    let t = def[1];
    let value = def[2];
    let $ = infer_expression(value, state);
    let val_t = $[0];
    let state$1 = $[1];
    let _block;
    if (t instanceof Some) {
      let ann = t[0];
      _block = unify(val_t, type_from_annotation(ann), state$1);
    } else {
      _block = state$1;
    }
    let state$2 = _block;
    let val_t$1 = apply_subs(val_t, state$2.subs);
    let env = extend_env(state$2.env, name, val_t$1);
    return [
      val_t$1,
      new TypeCheckerState(env, state$2.subs, state$2.counter, state$2.errors)
    ];
  }
}
function check_definitions(loop$defs, loop$state) {
  while (true) {
    let defs = loop$defs;
    let state = loop$state;
    if (defs instanceof Empty) {
      return [new TApp("Nil", toList([])), state];
    } else {
      let def = defs.head;
      let rest = defs.tail;
      let $ = check_definition(def, state);
      let state$1 = $[1];
      loop$defs = rest;
      loop$state = state$1;
    }
  }
}
function add_builtins(state) {
  let env = state.env;
  let $ = fresh_tvar(state);
  let t = $[0];
  let state$1 = $[1];
  let env$1 = extend_env(
    env,
    "print",
    new TFun(toList([t]), new Box(new TApp("Nil", toList([]))))
  );
  let env$2 = extend_env(
    env$1,
    "int_to_string",
    new TFun(toList([new TInt()]), new Box(new TString()))
  );
  return new TypeCheckerState(
    env$2,
    state$1.subs,
    state$1.counter,
    state$1.errors
  );
}
function check_module(mod) {
  let state = initial_state();
  let state$1 = add_builtins(state);
  let $ = check_definitions(mod.definitions, state$1);
  let state$2 = $[1];
  let $1 = state$2.errors;
  if ($1 instanceof Empty) {
    return new Ok(state$2);
  } else {
    let errors = $1;
    return new Error2(errors);
  }
}

// build/dev/javascript/zein/zein_ffi.mjs
var import_child_process = require("child_process");
function halt(code) {
  process.exit(code);
}
function run_js(js) {
  eval(js);
}

// build/dev/javascript/zein/zein.mjs
var version = "0.1.0";
function print_usage() {
  return console_log(
    "usage: zein [--compile|--diagnostics|--help|--version] <filename.zn>"
  );
}
function run_js2(js2) {
  return run_js(js2);
}
function resolve_imports(mod) {
  let $ = mod.imports;
  if ($ instanceof Empty) {
    return new Ok(mod);
  } else {
    let imports = $;
    let known = toList(["random"]);
    let result = fold2(
      imports,
      new Ok(mod),
      (acc, imp) => {
        if (acc instanceof Ok) {
          let m = acc[0];
          let $1 = contains(known, imp.path);
          if ($1) {
            return new Ok(m);
          } else {
            return new Error2("unknown module: " + imp.path);
          }
        } else {
          return acc;
        }
      }
    );
    return result;
  }
}
function parser_error_string(e) {
  if (e instanceof ParseError) {
    let expected = e.expected;
    let found = e.found;
    return "expected " + expected + ", found " + token_name(
      found
    );
  } else {
    let errors = e[0];
    let _pipe = errors;
    let _pipe$1 = map2(_pipe, parser_error_string);
    return join(_pipe$1, "\n");
  }
}
function generate_js(source) {
  let res = tokenize(source);
  let $ = res.errors;
  if ($ instanceof Empty) {
    let $1 = parse_module(res.tokens);
    if ($1 instanceof Ok) {
      let mod = $1[0][0];
      let $2 = resolve_imports(mod);
      if ($2 instanceof Ok) {
        let mod$1 = $2[0];
        let $3 = check_module(mod$1);
        if ($3 instanceof Ok) {
          let $4 = generate(mod$1);
          if ($4 instanceof Ok) {
            return $4;
          } else {
            let e = $4[0];
            console_log("codegen error: " + e.message);
            return new Error2(void 0);
          }
        } else {
          let errors = $3[0];
          console_log("type errors:");
          let _pipe = errors;
          each(_pipe, (e) => {
            return console_log("  " + e.message);
          });
          return new Error2(void 0);
        }
      } else {
        let msg = $2[0];
        console_log(msg);
        return new Error2(void 0);
      }
    } else {
      let e = $1[0];
      console_log("parse error: " + parser_error_string(e));
      return new Error2(void 0);
    }
  } else {
    console_log("tokenizer errors:");
    let _pipe = res.errors;
    each(
      _pipe,
      (e) => {
        return console_log(
          "  line " + to_string(e.line) + ": " + e.message
        );
      }
    );
    return new Error2(void 0);
  }
}
function run_source(source) {
  let $ = generate_js(source);
  if ($ instanceof Ok) {
    let js2 = $[0];
    return run_js2(js2);
  } else {
    return halt(1);
  }
}
function read_source(filename) {
  let $ = read(filename);
  if ($ instanceof Ok) {
    return $;
  } else {
    return new Error2(void 0);
  }
}
function compile_and_print(source) {
  let $ = generate_js(source);
  if ($ instanceof Ok) {
    let js2 = $[0];
    return print(js2);
  } else {
    return halt(1);
  }
}
function mk_diag(severity, message, line, col) {
  return object2(
    toList([
      ["severity", string2(severity)],
      ["message", string2(message)],
      [
        "range",
        object2(
          toList([
            [
              "start",
              object2(
                toList([
                  ["line", int2(line)],
                  ["character", int2(col)]
                ])
              )
            ],
            [
              "end",
              object2(
                toList([
                  ["line", int2(line)],
                  ["character", int2(col + 1)]
                ])
              )
            ]
          ])
        )
      ]
    ])
  );
}
function parse_error_diags(e) {
  if (e instanceof ParseError) {
    let expected = e.expected;
    let found = e.found;
    let line = e.line;
    let col = e.col;
    return toList([
      mk_diag(
        "error",
        "expected " + expected + ", found " + token_name(found),
        line,
        col
      )
    ]);
  } else {
    let errors = e[0];
    let _pipe = errors;
    let _pipe$1 = map2(_pipe, (e2) => {
      return parse_error_diags(e2);
    });
    return flatten(_pipe$1);
  }
}
function run_diagnostics(source) {
  let res = tokenize(source);
  let _block;
  let _pipe = res.errors;
  _block = map2(
    _pipe,
    (e) => {
      return mk_diag("error", e.message, e.line, e.col);
    }
  );
  let token_diags = _block;
  let _block$1;
  let $ = parse_module(res.tokens);
  if ($ instanceof Ok) {
    let mod = $[0][0];
    let $1 = check_module(mod);
    if ($1 instanceof Ok) {
      _block$1 = toList([]);
    } else {
      let errors = $1[0];
      let _pipe$1 = errors;
      _block$1 = map2(
        _pipe$1,
        (e) => {
          return mk_diag("error", e.message, 0, 0);
        }
      );
    }
  } else {
    let e = $[0];
    _block$1 = parse_error_diags(e);
  }
  let parse_diags = _block$1;
  return print(
    to_string2(
      preprocessed_array(
        flatten(toList([token_diags, parse_diags]))
      )
    )
  );
}
function diagnostics(filename) {
  let $ = read_source(filename);
  if ($ instanceof Ok) {
    let source = $[0];
    return run_diagnostics(source);
  } else {
    return print(
      to_string2(
        preprocessed_array(
          toList([mk_diag("error", "file not found: " + filename, 0, 0)])
        )
      )
    );
  }
}
function main() {
  let args = load2().arguments;
  if (args instanceof Empty) {
    return print_usage();
  } else {
    let $ = args.head;
    if ($ === "--help") {
      return print_usage();
    } else if ($ === "-h") {
      return print_usage();
    } else if ($ === "--version") {
      return console_log("Zein " + version);
    } else if ($ === "-v") {
      return console_log("Zein " + version);
    } else if ($ === "--diagnostics") {
      let $1 = args.tail;
      if ($1 instanceof Empty) {
        let filename = $;
        let $2 = read_source(filename);
        if ($2 instanceof Ok) {
          let source = $2[0];
          return run_source(source);
        } else {
          return halt(1);
        }
      } else {
        let filename = $1.head;
        return diagnostics(filename);
      }
    } else if ($ === "--compile") {
      let $1 = args.tail;
      if ($1 instanceof Empty) {
        let filename = $;
        let $2 = read_source(filename);
        if ($2 instanceof Ok) {
          let source = $2[0];
          return run_source(source);
        } else {
          return halt(1);
        }
      } else {
        let filename = $1.head;
        let $2 = read_source(filename);
        if ($2 instanceof Ok) {
          let source = $2[0];
          return compile_and_print(source);
        } else {
          return halt(1);
        }
      }
    } else {
      let filename = $;
      let $1 = read_source(filename);
      if ($1 instanceof Ok) {
        let source = $1[0];
        return run_source(source);
      } else {
        return halt(1);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  halt,
  main,
  run_js_native
});
