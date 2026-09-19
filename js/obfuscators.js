/**
 * Code Vault — engine mã hóa / obfuscate nhiều ngôn ngữ
 */
(function (global) {
  'use strict';

  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str)));
  }
  function toHex(str) {
    return Array.from(unescape(encodeURIComponent(str)))
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }
  function fromHex(hex) {
    const bytes = hex.match(/.{1,2}/g) || [];
    return decodeURIComponent(
      escape(bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join(''))
    );
  }
  function xorStr(str, key) {
    if (!key) key = 'vault';
    const out = [];
    for (let i = 0; i < str.length; i++) {
      out.push(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }
  function xorToB64(str, key) {
    const arr = xorStr(str, key);
    let bin = '';
    arr.forEach((n) => (bin += String.fromCharCode(n)));
    return btoa(bin);
  }
  function b64XorDecode(b64, key) {
    const bin = atob(b64);
    let out = '';
    for (let i = 0; i < bin.length; i++) {
      out += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }
  function randId(n) {
    const c = 'abcdefghijklmnopqrstuvwxyz';
    let s = c[Math.floor(Math.random() * 26)];
    const all = c + '0123456789';
    for (let i = 1; i < n; i++) s += all[Math.floor(Math.random() * all.length)];
    return s;
  }
  function junkJS(level) {
    const lines = [];
    for (let i = 0; i < level * 3; i++) {
      const a = randId(6),
        b = randId(5);
      lines.push(
        [
          `var ${a}=${Math.floor(Math.random() * 999)};`,
          `function ${b}(){return ${Math.floor(Math.random() * 50)};}`,
          `if(false){console.log(${Math.random()})}`,
          `/* junk_${randId(4)} */`
        ][Math.floor(Math.random() * 4)]
      );
    }
    return lines.join('\n');
  }
  function junkPython(level) {
    const lines = [];
    for (let i = 0; i < level * 3; i++) {
      lines.push(
        [
          `_j${randId(4)} = ${Math.floor(Math.random() * 100)}`,
          `def _f${randId(3)}():\n    return None`,
          `if False:\n    pass  # ${randId(6)}`,
          `# dead_${randId(5)}`
        ][Math.floor(Math.random() * 4)]
      );
    }
    return lines.join('\n');
  }
  function junkLua(level) {
    let s = '';
    for (let i = 0; i < level * 2; i++) {
      s += `local _${randId(4)}=${Math.floor(Math.random() * 99)}\n`;
    }
    return s;
  }
  function junkHTML(level) {
    let s = '';
    for (let i = 0; i < level * 2; i++) {
      s += `<!-- junk:${randId(8)} -->\n`;
      s += `<div style="display:none" data-x="${randId(6)}"></div>\n`;
    }
    return s;
  }
  function stringCharJS(str) {
    return (
      'String.fromCharCode(' +
      Array.from(str)
        .map((c) => c.charCodeAt(0))
        .join(',') +
      ')'
    );
  }
  function stringCharLua(str) {
    return (
      'string.char(' +
      Array.from(unescape(encodeURIComponent(str)))
        .map((c) => c.charCodeAt(0))
        .join(',') +
      ')'
    );
  }
  function minifyJS(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function splitChunks(b64, size) {
    const parts = [];
    for (let i = 0; i < b64.length; i += size) parts.push(b64.slice(i, i + size));
    return parts;
  }

  const LANGS = {
    javascript: {
      label: 'JavaScript',
      methods: [
        { id: 'js_eval_b64', name: 'eval + Base64' },
        { id: 'js_func_b64', name: 'Function + Base64' },
        { id: 'js_charcode', name: 'fromCharCode array' },
        { id: 'js_xor', name: 'XOR + Base64 + eval' },
        { id: 'js_chunks', name: 'Chunk split + join' },
        { id: 'js_heavy', name: 'Heavy (junk + multi-layer)' }
      ]
    },
    python: {
      label: 'Python',
      methods: [
        { id: 'py_exec_b64', name: 'exec + base64' },
        { id: 'py_codecs', name: 'codecs.decode hex' },
        { id: 'py_xor', name: 'XOR + base64 exec' },
        { id: 'py_heavy', name: 'Heavy junk + exec' }
      ]
    },
    html: {
      label: 'HTML',
      methods: [
        { id: 'html_entities', name: 'HTML entities' },
        { id: 'html_b64_doc', name: 'Data URI + Base64' },
        { id: 'html_junk', name: 'Junk comments + wrap' }
      ]
    },
    css: {
      label: 'CSS',
      methods: [
        { id: 'css_minify', name: 'Minify + junk rules' },
        { id: 'css_unicode', name: 'Unicode escapes' }
      ]
    },
    lua: {
      label: 'Lua',
      methods: [
        { id: 'lua_load_b64', name: 'load + base64' },
        { id: 'lua_char', name: 'string.char encode' },
        { id: 'lua_heavy', name: 'Junk + loadstring' }
      ]
    },
    text: {
      label: 'Text / Any',
      methods: [
        { id: 'txt_b64', name: 'Base64' },
        { id: 'txt_hex', name: 'Hex' },
        { id: 'txt_reverse', name: 'Reverse' },
        { id: 'txt_xor', name: 'XOR + Base64' },
        { id: 'txt_rot13', name: 'ROT13 (letters)' }
      ]
    },
    json: {
      label: 'JSON',
      methods: [
        { id: 'json_b64', name: 'JSON → Base64 wrap' },
        { id: 'json_minify_b64', name: 'Minify + Base64' }
      ]
    },
    php: {
      label: 'PHP',
      methods: [
        { id: 'php_eval_b64', name: 'eval + base64_decode' },
        { id: 'php_gz', name: 'gzinflate style (b64)' }
      ]
    }
  };

  function obfuscate(lang, methodId, code, opts) {
    opts = opts || {};
    const junk = !!opts.junk;
    const level = Math.max(1, Math.min(5, opts.junkLevel || 3));
    const layers = !!opts.layers;
    const minify = !!opts.minify;
    const key = opts.xorKey || 'vault';

    let src = code;
    if (!src || !String(src).trim()) throw new Error('Chưa có code input');

    if (minify && (lang === 'javascript' || lang === 'css')) {
      src = minifyJS(src);
    }

    const wrapLayer = (payload, builder) => {
      let out = builder(payload);
      if (layers) {
        // lớp 2 base64
        out = builder(out);
      }
      return out;
    };

    switch (methodId) {
      case 'js_eval_b64': {
        const b64 = utf8ToB64(src);
        let body = `eval(atob("${b64}"))`;
        if (junk) body = junkJS(level) + '\n' + body;
        return body;
      }
      case 'js_func_b64': {
        const b64 = utf8ToB64(src);
        const fn = randId(8);
        let body = `var ${fn}=atob("${b64}");(new Function(${fn}))();`;
        if (junk) body = junkJS(level) + '\n' + body;
        return body;
      }
      case 'js_charcode': {
        const expr = stringCharJS(src);
        let body = `eval(${expr})`;
        if (junk) body = junkJS(level) + '\n' + body;
        return body;
      }
      case 'js_xor': {
        const b64 = xorToB64(src, key);
        const k = JSON.stringify(key);
        let body = `(function(k,d){d=atob(d);var o="";for(var i=0;i<d.length;i++)o+=String.fromCharCode(d.charCodeAt(i)^k.charCodeAt(i%k.length));eval(o)})(${k},"${b64}")`;
        if (junk) body = junkJS(level) + '\n' + body;
        return body;
      }
      case 'js_chunks': {
        const parts = splitChunks(utf8ToB64(src), 40);
        const arr = parts.map((p) => JSON.stringify(p)).join(',');
        let body = `eval(atob([${arr}].join("")))`;
        if (junk) body = junkJS(level) + '\n' + body;
        return body;
      }
      case 'js_heavy': {
        let inner = src;
        if (junk) inner = junkJS(level) + '\n' + inner;
        const b64 = xorToB64(inner, key);
        const parts = splitChunks(b64, 32);
        const arr = parts.map((p) => JSON.stringify(p)).join(',');
        const k = JSON.stringify(key);
        const a = randId(7),
          b = randId(7);
        return `${junkJS(level)}
var ${a}=[${arr}].join("");
var ${b}=(function(k,d){d=atob(d);var o="";for(var i=0;i<d.length;i++)o+=String.fromCharCode(d.charCodeAt(i)^k.charCodeAt(i%k.length));return o})(${k},${a});
(new Function(${b}))();`;
      }

      case 'py_exec_b64': {
        const b64 = utf8ToB64(src);
        let body = `import base64\nexec(base64.b64decode("${b64}").decode())`;
        if (junk) body = junkPython(level) + '\n' + body;
        return body;
      }
      case 'py_codecs': {
        const hex = toHex(src);
        let body = `import codecs\nexec(codecs.decode("${hex}","hex").decode())`;
        if (junk) body = junkPython(level) + '\n' + body;
        return body;
      }
      case 'py_xor': {
        const b64 = xorToB64(src, key);
        let body = `import base64
k=${JSON.stringify(key)}
d=base64.b64decode(${JSON.stringify(b64)})
exec(''.join(chr(b^ord(k[i%len(k)])) for i,b in enumerate(d)))`;
        if (junk) body = junkPython(level) + '\n' + body;
        return body;
      }
      case 'py_heavy': {
        const b64 = utf8ToB64((junk ? junkPython(level) + '\n' : '') + src);
        return `import base64 as _b
${junkPython(level)}
_x=_b.b64decode("${b64}").decode()
exec(_x)`;
      }

      case 'html_entities': {
        return src
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }
      case 'html_b64_doc': {
        const b64 = utf8ToB64(src);
        return `<!-- encoded document -->
<iframe src="data:text/html;base64,${b64}" style="width:100%;height:100%;border:0"></iframe>`;
      }
      case 'html_junk': {
        return junkHTML(level) + src + '\n' + junkHTML(level);
      }

      case 'css_minify': {
        let c = minifyJS(src);
        if (junk) {
          for (let i = 0; i < level * 2; i++) {
            c += `._j${randId(5)}{outline:0!important}`;
          }
        }
        return c;
      }
      case 'css_unicode': {
        return src.replace(/[a-zA-Z]/g, (ch) => {
          if (Math.random() < 0.35) {
            return '\\' + ch.charCodeAt(0).toString(16);
          }
          return ch;
        });
      }

      case 'lua_load_b64': {
        // pure lua-ish with simulated decode note
        const b64 = utf8ToB64(src);
        let body = `-- base64 payload; cần decoder runtime
local b=${JSON.stringify(b64)}
-- load(decode(b))()
print("PAYLOAD_B64:"..b)`;
        if (junk) body = junkLua(level) + body;
        return body;
      }
      case 'lua_char': {
        const expr = stringCharLua(src);
        let body = `load(${expr})()`;
        if (junk) body = junkLua(level) + body;
        return body;
      }
      case 'lua_heavy': {
        const expr = stringCharLua(src);
        return `${junkLua(level)}local _p=${expr}
load(_p)()`;
      }

      case 'txt_b64':
        return utf8ToB64(src);
      case 'txt_hex':
        return toHex(src);
      case 'txt_reverse':
        return src.split('').reverse().join('');
      case 'txt_xor':
        return xorToB64(src, key);
      case 'txt_rot13':
        return src.replace(/[a-zA-Z]/g, (c) => {
          const base = c <= 'Z' ? 65 : 97;
          return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        });

      case 'json_b64': {
        JSON.parse(src); // validate
        return utf8ToB64(src);
      }
      case 'json_minify_b64': {
        const min = JSON.stringify(JSON.parse(src));
        return utf8ToB64(min);
      }

      case 'php_eval_b64': {
        const b64 = utf8ToB64(src);
        return `<?php eval(base64_decode("${b64}"));`;
      }
      case 'php_gz': {
        const b64 = utf8ToB64(src);
        return `<?php /* emulate */ eval(base64_decode("${b64}"));`;
      }

      default:
        throw new Error('Method không hỗ trợ: ' + methodId);
    }
  }

  function tryDecode(methodId, code, key) {
    key = key || 'vault';
    const t = code.trim();
    try {
      if (methodId.startsWith('txt_b64') || methodId.includes('b64') || methodId === 'json_b64' || methodId === 'json_minify_b64') {
        // try pure b64
        if (/^[A-Za-z0-9+/=\s]+$/.test(t) && t.length > 8) {
          return b64ToUtf8(t.replace(/\s/g, ''));
        }
      }
      if (methodId === 'txt_hex' || methodId === 'py_codecs') {
        return fromHex(t.replace(/\s/g, ''));
      }
      if (methodId === 'txt_reverse') return t.split('').reverse().join('');
      if (methodId === 'txt_rot13') {
        return t.replace(/[a-zA-Z]/g, (c) => {
          const base = c <= 'Z' ? 65 : 97;
          return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        });
      }
      if (methodId.includes('xor') || methodId === 'txt_xor') {
        // extract b64 from quotes if wrapped
        const m = t.match(/"([A-Za-z0-9+/=]{8,})"/);
        const b64 = m ? m[1] : t.replace(/\s/g, '');
        return b64XorDecode(b64, key);
      }
      // eval wrappers — extract atob("...")
      const at = t.match(/atob\(["']([A-Za-z0-9+/=]+)["']\)/);
      if (at) return b64ToUtf8(at[1]);
      const b64py = t.match(/b64decode\(["']([A-Za-z0-9+/=]+)["']\)/);
      if (b64py) return b64ToUtf8(b64py[1]);
      return b64ToUtf8(t.replace(/\s/g, ''));
    } catch (e) {
      throw new Error('Không giải được: ' + e.message);
    }
  }

  global.CodeVault = { LANGS, obfuscate, tryDecode, utf8ToB64, b64ToUtf8 };
})(typeof window !== 'undefined' ? window : global);
