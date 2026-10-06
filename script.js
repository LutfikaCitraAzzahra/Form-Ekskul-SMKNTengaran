const $ = id => document.getElementById(id);
const form = $('regForm');
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KLUB = { Jurnalistik:'#16A37F', Pramuka:'#ceff52', PMR:'#E5484D', Paskibra:'#C2410C', Fosster:'#3B82F6', Padus:'#8B5CF6',  Volly:'#ea7100', Rohis:'#292632', Drumband:'#624429', Futsal:'#709191' , Tari:'rgb(109, 117, 7)', Jepang:'#84b6a3' , Silat:'#DB2777', Rebbana:'#6f64ca' };
const DEFAULT_TXT = 'JPG atau PNG, maksimal 2 MB';
let fotoURL = '', nomor = '';

// Kuota pendaftaran: [total kuota, jumlah sudah terdaftar]. Silakan ubah angkanya sesuai kebutuhan.
const KUOTA = { Jurnalistik:[25,23], Pramuka:[40,31], PMR:[30,22], Paskibra:[30,29], Fosster:[20,20], Padus:[25,11], Volly:[30,24], Rohis:[35,15], Drumband:[40,33], Futsal:[30,26], Tari:[20,9], Jepang:[20,14], Silat:[25,17], Rebbana:[30,12] };
const KEY = 'kuotaEkskul';
const terisi = {};
Object.keys(KUOTA).forEach(k => terisi[k] = KUOTA[k][1]);
try { Object.assign(terisi, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const simpanKuota = () => { try { localStorage.setItem(KEY, JSON.stringify(terisi)); } catch (e) {} };
const sisa = k => Math.max(KUOTA[k][0] - terisi[k], 0);

function showKuota() {
  const k = $('ekskul').value, box = $('kuota');
  if (!k) { box.hidden = true; return; }
  const s = sisa(k), total = KUOTA[k][0];
  box.hidden = false;
  box.classList.toggle('low', s <= 5);
  box.querySelector('span').textContent = s ? `Sisa ${s} dari ${total} kuota` + (s <= 5 ? ' · hampir penuh!' : '') : 'Kuota penuh';
  box.querySelector('i').style.width = ((total - s) / total * 100) + '%';
}
function renderEkskul() {
  const sel = $('ekskul'), cur = sel.value;
  sel.length = 1;
  Object.keys(KLUB).forEach(k => {
    const s = sisa(k), o = new Option(s ? `${k} — sisa ${s} kuota` : `${k} — Penuh`, k);
    o.disabled = !s;
    sel.add(o);
  });
  sel.value = cur;
  showKuota();
}
renderEkskul();

const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tanggal = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }).toUpperCase();

function ticket(done) {
  const nama = $('nama').value.trim(), kelas = $('kelas').value.trim(), email = $('email').value.trim(), klub = $('ekskul').value;
  return `<div class="tk" style="--c:${KLUB[klub] || '#FF7A3D'}">
    <div class="tk-a">
      <div class="tk-top"><span>MEMBER PASS</span><span>${tanggal}</span></div>
      <div class="tk-body">
        <div class="tk-photo">${fotoURL ? `<img src="${fotoURL}" alt="Foto anggota">` : 'Foto'}</div>
        <div class="tk-info">
          <small>NAMA</small><b>${esc(nama) || 'Nama Lengkap'}</b>
          <small>KELAS</small><span>${esc(kelas) || 'Kelas Lengkap'}</span>
          <small>KLUB</small><em class="chip">${klub || 'Belum dipilih'}</em>
          <small>EMAIL</small><span>${esc(email) || 'email@kamu.com'}</span>
        </div>
      </div>
    </div>
    <div class="tk-b">
      <div class="code"><div class="bars"></div><small>${nomor || 'EKS-26-•••••'}</small></div>
      ${done ? '<div class="stamp">TERDAFTAR</div>' : ''}
    </div>
  </div>`;
}
const renderLive = () => { $('livePass').innerHTML = ticket(false); };

// Goyang halus hanya saat kursor diarahkan ke tiket
const live = $('livePass');
live.addEventListener('mouseenter', () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || live.classList.contains('wiggle')) return;
  live.classList.add('wiggle');
});
live.addEventListener('animationend', e => { if (e.target === live) live.classList.remove('wiggle'); });

const rules = {
  foto: () => {
    const f = $('foto').files[0];
    if (!f) return 'Foto wajib diunggah.';
    if (!['image/jpeg', 'image/png'].includes(f.type)) return 'Format harus JPG atau PNG.';
    return f.size > 2 * 1024 * 1024 ? 'Ukuran foto maksimal 2 MB.' : '';
  },
  nama: () => $('nama').value.trim().length >= 3 ? '' : 'Nama minimal 3 karakter.',
  kelas: () => $('kelas').value.trim().length >= 2 ? '' : 'Kelas wajib diisi (contoh: XI RPL 1).',
  email: () => emailRe.test($('email').value.trim()) ? '' : 'Format email belum benar (contoh: nama@email.com).',
  password: () => $('password').value.length >= 8 ? '' : 'Password minimal 8 karakter.',
  konfirmasi: () => !$('konfirmasi').value ? 'Konfirmasi password wajib diisi.' : $('konfirmasi').value === $('password').value ? '' : 'Password tidak sama.',
  ekskul: () => !$('ekskul').value ? 'Silakan pilih ekstrakurikuler.' : sisa($('ekskul').value) ? '' : 'Kuota ekskul ini sudah penuh, pilih yang lain.'
};
function check(name) {
  const box = form.querySelector(`[data-field="${name}"]`), err = rules[name]();
  box.classList.toggle('is-bad', !!err);
  box.classList.toggle('is-ok', !err);
  box.querySelector('.msg').textContent = err;
  return !err;
}

['nama', 'kelas', 'email', 'password', 'konfirmasi', 'ekskul'].forEach(n => {
  $(n).addEventListener(n === 'ekskul' ? 'change' : 'input', () => {
    check(n);
    if (n === 'password' && $('konfirmasi').value) check('konfirmasi');
    renderLive();
    if (n === 'ekskul') showKuota();
  });
});

document.querySelectorAll('.eye').forEach(btn => btn.addEventListener('click', () => {
  const input = $(btn.dataset.target), show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.setAttribute('aria-pressed', show);
  btn.setAttribute('aria-label', (show ? 'Sembunyikan ' : 'Tampilkan ') + 'password');
}));

$('foto').addEventListener('change', () => {
  const ok = check('foto'), f = $('foto').files[0];
  fotoURL = ok ? URL.createObjectURL(f) : '';
  $('thumb').hidden = !ok; $('plus').hidden = ok;
  if (ok) $('thumb').src = fotoURL;
  $('fname').textContent = f ? f.name : DEFAULT_TXT;
  renderLive();
});

// Pop-up hasil pendaftaran
function openModal() {
  nomor = 'EKS-26-' + (Math.floor(Math.random() * 90000) + 10000);
  $('overlay').style.setProperty('--c', KLUB[$('ekskul').value] || '#FF7A3D');
  $('modalPass').innerHTML = ticket(true);
  const klub = $('ekskul').value;
  terisi[klub]++; simpanKuota(); renderEkskul(); // kurangi kuota
  $('overlay').hidden = false;
  $('printBtn').focus();
}
const closeModal = () => { $('overlay').hidden = true; };
$('xBtn').onclick = closeModal;
$('printBtn').onclick = () => window.print();
$('againBtn').onclick = () => {
  closeModal(); form.reset(); fotoURL = ''; nomor = '';
  form.querySelectorAll('.field').forEach(f => f.classList.remove('is-ok', 'is-bad'));
  $('thumb').hidden = true; $('plus').hidden = false; $('fname').textContent = DEFAULT_TXT;
  renderLive(); showKuota(); window.scrollTo({ top: 0, behavior: 'smooth' });
};
$('overlay').addEventListener('click', e => { if (e.target === $('overlay')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

form.addEventListener('submit', e => {
  e.preventDefault(); // cegah reload
  const all = Object.keys(rules).map(check);
  if (all.every(Boolean)) openModal();
  else form.querySelector('.is-bad input, .is-bad select')?.focus();
});
renderLive();
