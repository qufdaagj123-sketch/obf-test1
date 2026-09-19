(function () {
  const { LANGS, obfuscate, tryDecode } = window.CodeVault;

  const langGrid = document.getElementById('langGrid');
  const methodSel = document.getElementById('method');
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const status = document.getElementById('status');
  const outMeta = document.getElementById('outMeta');
  const junkLevel = document.getElementById('junkLevel');
  const junkVal = document.getElementById('junkVal');

  let currentLang = 'javascript';

  function setStatus(msg, ok) {
    status.textContent = msg;
    status.style.color = ok === false ? '#f87171' : ok ? '#ccc' : '';
  }

  function renderLangs() {
    langGrid.innerHTML = '';
    Object.keys(LANGS).forEach((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn' + (id === currentLang ? ' on' : '');
      btn.textContent = LANGS[id].label;
      btn.onclick = () => {
        currentLang = id;
        renderLangs();
        renderMethods();
      };
      langGrid.appendChild(btn);
    });
  }

  function renderMethods() {
    const list = LANGS[currentLang].methods;
    methodSel.innerHTML = list
      .map((m) => `<option value="${m.id}">${m.name}</option>`)
      .join('');
  }

  junkLevel.oninput = () => {
    junkVal.textContent = junkLevel.value;
  };

  function opts() {
    return {
      junk: document.getElementById('optJunk').checked,
      layers: document.getElementById('optLayers').checked,
      minify: document.getElementById('optMinify').checked,
      junkLevel: +junkLevel.value,
      xorKey: document.getElementById('xorKey').value.trim() || 'vault'
    };
  }

  document.getElementById('btnRun').onclick = () => {
    try {
      const method = methodSel.value;
      const result = obfuscate(currentLang, method, input.value, opts());
      output.value = result;
      outMeta.textContent =
        result.length.toLocaleString() + ' chars · ' + LANGS[currentLang].label;
      setStatus('✓ Đã mã hóa (' + method + ')', true);
    } catch (e) {
      setStatus('✗ ' + e.message, false);
    }
  };

  document.getElementById('btnDecode').onclick = () => {
    try {
      const method = methodSel.value;
      const src = output.value.trim() || input.value;
      const result = tryDecode(method, src, opts().xorKey);
      output.value = result;
      setStatus('✓ Đã thử giải mã', true);
    } catch (e) {
      setStatus('✗ ' + e.message, false);
    }
  };

  document.getElementById('btnCopy').onclick = async () => {
    if (!output.value) return setStatus('Chưa có output', false);
    await navigator.clipboard.writeText(output.value);
    setStatus('✓ Đã copy', true);
  };

  document.getElementById('btnDl').onclick = () => {
    if (!output.value) return setStatus('Chưa có output', false);
    const ext =
      {
        javascript: 'js',
        python: 'py',
        html: 'html',
        css: 'css',
        lua: 'lua',
        php: 'php',
        json: 'txt',
        text: 'txt'
      }[currentLang] || 'txt';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([output.value], { type: 'text/plain' }));
    a.download = 'obfuscated.' + ext;
    a.click();
    setStatus('✓ Đã tải file', true);
  };

  document.getElementById('btnClear').onclick = () => {
    input.value = '';
    output.value = '';
    outMeta.textContent = '';
    setStatus('Đã xóa');
  };

  // samples
  input.value = `// Sample
function hello(name) {
  console.log("Hello, " + name);
}
hello("World");
`;

  renderLangs();
  renderMethods();
})();
