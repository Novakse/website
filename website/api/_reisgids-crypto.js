/* Travel guide ("reisgids"): signed customer codes and the encrypted data box.
   Helper module, not a route (the leading _ keeps Vercel from serving it).

   Everything comes from one secret, the environment variable REISGIDS_GEHEIM
   (random, at least 32 bytes, base64url; made by `node scripts/reisgids.js
   geheim`). The secret string itself is the HMAC key:
     encKey  = HMAC-SHA256(secret, "novakse-reisgids-enc-v1")   AES-256-GCM key for the data
     signKey = HMAC-SHA256(secret, "novakse-reisgids-sign-v1")  signs the customer codes

   Customer code:
     base64url(JSON payload) + "." + base64url(first 16 bytes of HMAC-SHA256(signKey, payloadPart))
   payload: { "v": 1, "id": "<8 chars a-z0-9>", "n": "<name>", "r": ["falun"], "t": "YYYY-MM-DD" }
   r = booked trip ids, t = last valid day. The payload is signed, not
   encrypted: whoever has the link can read the name, trips and last day,
   but cannot change them.

   Data box: { v: 1, iv, tag, data } (base64), AES-256-GCM with a random
   12-byte iv.

   Also holds the two data helpers both sides share: stripPrivate() (drops
   "_" keys) and hasPlaceholder() (finds "[INVULLEN" text).

   Used by api/reisgids.js and by scripts/reisgids.js (the owner's CLI). */

var crypto = require("crypto");

// Trip ids a code may name and a region or place may list.
var TRIPS = ["falun", "orsa", "wellness", "groepsreis-falun", "groepsreis-orsa", "salen", "lulea", "finland", "weissensee"];

var ID_PATTERN = /^[a-z0-9]{8}$/;
var ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
// 43 base64url characters carry 258 bits, so at least 32 random bytes.
var SECRET_PATTERN = /^[A-Za-z0-9_-]{43,}$/;
// Control characters and line separators never belong in a name.
var NAME_FORBIDDEN = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
var NAME_MAX = 60;
var CODE_MAX = 1000; // a code with a 60-character name and all trips stays far below this
var SIG_BYTES = 16;
var SIG_CHARS = 22; // base64url length of 16 bytes, without padding
var PAYLOAD_KEYS = ["v", "id", "n", "r", "t"];
// Binds the ciphertext to its purpose; a box from another context will not open.
var DATA_AAD = Buffer.from("novakse-reisgids-data-v1", "utf8");

var cachedSecret = null;
var cachedKeys = null;

/* { encKey, signKey } as 32-byte Buffers. Throws when the secret is missing
   or too weak, so a misconfiguration never works "a bit". */
function keysFromSecret(secret) {
  var clean = typeof secret === "string" ? secret.trim() : "";
  if (!SECRET_PATTERN.test(clean)) {
    throw new Error("REISGIDS_GEHEIM is missing or not a base64url secret of at least 32 bytes.");
  }
  if (clean === cachedSecret) return cachedKeys;
  cachedKeys = {
    encKey: crypto.createHmac("sha256", clean).update("novakse-reisgids-enc-v1").digest(),
    signKey: crypto.createHmac("sha256", clean).update("novakse-reisgids-sign-v1").digest()
  };
  cachedSecret = clean;
  return cachedKeys;
}

// "2027-02-20" -> true only for a date that exists.
function isRealDate(text) {
  if (typeof text !== "string" || !DATE_PATTERN.test(text)) return false;
  var d = text.split("-");
  var date = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
  return date.getUTCFullYear() === +d[0] && date.getUTCMonth() === +d[1] - 1 && date.getUTCDate() === +d[2];
}

// Today's date in Sweden as "YYYY-MM-DD"; `now` (a Date) is optional.
function todayInStockholm(now) {
  var parts = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now || new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return parts.year + "-" + parts.month + "-" + parts.day;
}

function isValidName(name) {
  return typeof name === "string" && name.length >= 1 && name.length <= NAME_MAX &&
    name.trim() === name && !NAME_FORBIDDEN.test(name);
}

// 8 random characters a-z0-9 for a new code.
function newCodeId() {
  var id = "";
  for (var i = 0; i < 8; i++) id += ID_CHARS.charAt(crypto.randomInt(ID_CHARS.length));
  return id;
}

/* A clean copy of a payload with exactly the five expected keys, or null
   when anything about its shape is off. */
function cleanPayload(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  var keys = Object.keys(p);
  if (keys.length !== PAYLOAD_KEYS.length) return null;
  for (var i = 0; i < PAYLOAD_KEYS.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(p, PAYLOAD_KEYS[i])) return null;
  }
  if (p.v !== 1) return null;
  if (typeof p.id !== "string" || !ID_PATTERN.test(p.id)) return null;
  if (!isValidName(p.n)) return null;
  if (!Array.isArray(p.r) || p.r.length < 1 || p.r.length > TRIPS.length) return null;
  for (var j = 0; j < p.r.length; j++) {
    if (typeof p.r[j] !== "string" || TRIPS.indexOf(p.r[j]) === -1) return null;
    if (p.r.indexOf(p.r[j]) !== j) return null; // no duplicates
  }
  if (!isRealDate(p.t)) return null;
  return { v: 1, id: p.id, n: p.n, r: p.r.slice(), t: p.t };
}

function signaturePart(payloadPart, signKey) {
  return crypto.createHmac("sha256", signKey).update(payloadPart).digest()
    .subarray(0, SIG_BYTES).toString("base64url");
}

/* The customer code for a payload. Throws on an invalid payload or secret. */
function signCode(payload, secret) {
  var keys = keysFromSecret(secret);
  var clean = cleanPayload(payload);
  if (!clean) throw new Error("Invalid code payload.");
  var payloadPart = Buffer.from(JSON.stringify(clean), "utf8").toString("base64url");
  return payloadPart + "." + signaturePart(payloadPart, keys.signKey);
}

/* The payload of a genuine code, or null for anything missing, damaged,
   tampered with or signed with another secret. Throws only when the secret
   itself is unusable (a configuration problem, not a bad code). */
function verifyCode(code, secret) {
  var keys = keysFromSecret(secret);
  if (typeof code !== "string" || code.length > CODE_MAX) return null;
  var dot = code.indexOf(".");
  if (dot < 1 || code.indexOf(".", dot + 1) !== -1) return null;
  var payloadPart = code.slice(0, dot);
  var sigPart = code.slice(dot + 1);
  if (!BASE64URL_PATTERN.test(payloadPart)) return null;
  if (sigPart.length !== SIG_CHARS || !BASE64URL_PATTERN.test(sigPart)) return null;

  var expected = signaturePart(payloadPart, keys.signKey);
  if (!crypto.timingSafeEqual(Buffer.from(sigPart, "utf8"), Buffer.from(expected, "utf8"))) return null;

  var payload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch (fout) {
    return null;
  }
  return cleanPayload(payload);
}

/* { v: 1, iv, tag, data } with obj as encrypted JSON. */
function encryptJson(obj, secret) {
  var keys = keysFromSecret(secret);
  var iv = crypto.randomBytes(12);
  var cipher = crypto.createCipheriv("aes-256-gcm", keys.encKey, iv, { authTagLength: 16 });
  cipher.setAAD(DATA_AAD);
  var data = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  return {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64")
  };
}

/* The object inside a box. Throws when the box is malformed, was changed or
   belongs to another secret. */
function decryptJson(box, secret) {
  if (!box || typeof box !== "object" || box.v !== 1 ||
      typeof box.iv !== "string" || typeof box.tag !== "string" || typeof box.data !== "string") {
    throw new Error("Invalid data box.");
  }
  var iv = Buffer.from(box.iv, "base64");
  var tag = Buffer.from(box.tag, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid data box.");
  var keys = keysFromSecret(secret);
  var decipher = crypto.createDecipheriv("aes-256-gcm", keys.encKey, iv, { authTagLength: 16 });
  decipher.setAAD(DATA_AAD);
  decipher.setAuthTag(tag);
  var plain = Buffer.concat([decipher.update(Buffer.from(box.data, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

/* Owner text that is not known yet is written as "[INVULLEN ...]". Matched
   without regard to case, so "[invullen" is caught too. */
var PLACEHOLDER_PATTERN = /\[invullen/i;

/* true when any string anywhere inside value (keys excluded) holds a
   placeholder. */
function hasPlaceholder(value) {
  if (typeof value === "string") return PLACEHOLDER_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (value && typeof value === "object") {
    return Object.keys(value).some(function (key) { return hasPlaceholder(value[key]); });
  }
  return false;
}

/* A deep copy without any key that starts with "_" (private notes). */
function stripPrivate(value) {
  if (Array.isArray(value)) return value.map(stripPrivate);
  if (value && typeof value === "object") {
    var copy = {};
    Object.keys(value).forEach(function (key) {
      if (key.charAt(0) !== "_") copy[key] = stripPrivate(value[key]);
    });
    return copy;
  }
  return value;
}

module.exports = {
  TRIPS: TRIPS,
  ID_PATTERN: ID_PATTERN,
  NAME_MAX: NAME_MAX,
  keysFromSecret: keysFromSecret,
  signCode: signCode,
  verifyCode: verifyCode,
  encryptJson: encryptJson,
  decryptJson: decryptJson,
  isRealDate: isRealDate,
  isValidName: isValidName,
  todayInStockholm: todayInStockholm,
  newCodeId: newCodeId,
  stripPrivate: stripPrivate,
  hasPlaceholder: hasPlaceholder
};
