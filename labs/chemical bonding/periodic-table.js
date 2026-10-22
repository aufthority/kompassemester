/* Kompas Semester · shared periodic table reference
   One file used by every explainer and lab. Include it with
     <script src="../shared/periodic-table.js" defer></script>
   then call KompasPT.open() from a button (explainers: in the Contents panel).
   Cells show relative atomic masses rounded the way the courses calculate
   (nearest whole number, Cl = 35.5). Tapping a cell shows the standard atomic
   weight to 4 significant figures. Elements with no stable isotopes show the
   mass number of the longest-lived isotope in [brackets].
   Optional: <script ... data-rounding="precise"> shows the 4 s.f. values in the cells instead. */
(function(){
  if (window.KompasPT) return;
  var me = document.currentScript;
  var PRECISE = me && me.getAttribute('data-rounding') === 'precise';
  var SPECIAL = {Cl: '35.5'};   /* teaching values that are not simply rounded */
  var DATA = '1|H|Hydrogen|1.008|n,2|He|Helium|4.003|g,3|Li|Lithium|6.940|m,4|Be|Beryllium|9.012|m,5|B|Boron|10.81|d,6|C|Carbon|12.01|n,7|N|Nitrogen|14.01|n,8|O|Oxygen|16.00|n,9|F|Fluorine|19.00|n,10|Ne|Neon|20.18|g,11|Na|Sodium|22.99|m,12|Mg|Magnesium|24.30|m,13|Al|Aluminium|26.98|m,14|Si|Silicon|28.09|d,15|P|Phosphorus|30.97|n,16|S|Sulfur|32.06|n,17|Cl|Chlorine|35.45|n,18|Ar|Argon|39.95|g,19|K|Potassium|39.10|m,20|Ca|Calcium|40.08|m,21|Sc|Scandium|44.96|m,22|Ti|Titanium|47.87|m,23|V|Vanadium|50.94|m,24|Cr|Chromium|52.00|m,25|Mn|Manganese|54.94|m,26|Fe|Iron|55.84|m,27|Co|Cobalt|58.93|m,28|Ni|Nickel|58.69|m,29|Cu|Copper|63.55|m,30|Zn|Zinc|65.38|m,31|Ga|Gallium|69.72|m,32|Ge|Germanium|72.63|d,33|As|Arsenic|74.92|d,34|Se|Selenium|78.97|n,35|Br|Bromine|79.90|n,36|Kr|Krypton|83.80|g,37|Rb|Rubidium|85.47|m,38|Sr|Strontium|87.62|m,39|Y|Yttrium|88.91|m,40|Zr|Zirconium|91.22|m,41|Nb|Niobium|92.91|m,42|Mo|Molybdenum|95.95|m,43|Tc|Technetium|[98]|m,44|Ru|Ruthenium|101.1|m,45|Rh|Rhodium|102.9|m,46|Pd|Palladium|106.4|m,47|Ag|Silver|107.9|m,48|Cd|Cadmium|112.4|m,49|In|Indium|114.8|m,50|Sn|Tin|118.7|m,51|Sb|Antimony|121.8|d,52|Te|Tellurium|127.6|d,53|I|Iodine|126.9|n,54|Xe|Xenon|131.3|g,55|Cs|Caesium|132.9|m,56|Ba|Barium|137.3|m,57|La|Lanthanum|138.9|m,58|Ce|Cerium|140.1|m,59|Pr|Praseodymium|140.9|m,60|Nd|Neodymium|144.2|m,61|Pm|Promethium|[145]|m,62|Sm|Samarium|150.4|m,63|Eu|Europium|152.0|m,64|Gd|Gadolinium|157.2|m,65|Tb|Terbium|158.9|m,66|Dy|Dysprosium|162.5|m,67|Ho|Holmium|164.9|m,68|Er|Erbium|167.3|m,69|Tm|Thulium|168.9|m,70|Yb|Ytterbium|173.0|m,71|Lu|Lutetium|175.0|m,72|Hf|Hafnium|178.5|m,73|Ta|Tantalum|180.9|m,74|W|Tungsten|183.8|m,75|Re|Rhenium|186.2|m,76|Os|Osmium|190.2|m,77|Ir|Iridium|192.2|m,78|Pt|Platinum|195.1|m,79|Au|Gold|197.0|m,80|Hg|Mercury|200.6|m,81|Tl|Thallium|204.4|m,82|Pb|Lead|207.2|m,83|Bi|Bismuth|209.0|m,84|Po|Polonium|[209]|m,85|At|Astatine|[210]|d,86|Rn|Radon|[222]|g,87|Fr|Francium|[223]|m,88|Ra|Radium|[226]|m,89|Ac|Actinium|[227]|m,90|Th|Thorium|232.0|m,91|Pa|Protactinium|231.0|m,92|U|Uranium|238.0|m,93|Np|Neptunium|[237]|m,94|Pu|Plutonium|[244]|m,95|Am|Americium|[243]|m,96|Cm|Curium|[247]|m,97|Bk|Berkelium|[247]|m,98|Cf|Californium|[251]|m,99|Es|Einsteinium|[252]|m,100|Fm|Fermium|[257]|m,101|Md|Mendelevium|[258]|m,102|No|Nobelium|[259]|m,103|Lr|Lawrencium|[266]|m,104|Rf|Rutherfordium|[267]|m,105|Db|Dubnium|[268]|m,106|Sg|Seaborgium|[267]|m,107|Bh|Bohrium|[270]|m,108|Hs|Hassium|[271]|m,109|Mt|Meitnerium|[278]|m,110|Ds|Darmstadtium|[281]|m,111|Rg|Roentgenium|[282]|m,112|Cn|Copernicium|[285]|m,113|Nh|Nihonium|[286]|m,114|Fl|Flerovium|[289]|m,115|Mc|Moscovium|[290]|m,116|Lv|Livermorium|[293]|m,117|Ts|Tennessine|[294]|m,118|Og|Oganesson|[294]|g';
  var CAT = {m:'Metal', d:'Metalloid', n:'Non-metal', g:'Noble gas'};

  var els = DATA.split(',').map(function(r){
    var p = r.split('|'), z = +p[0], m = p[3], br = m.charAt(0) === '[';
    var round = br ? m : (SPECIAL[p[1]] || String(Math.round(parseFloat(m))));
    return {z:z, s:p[1], n:p[2], m:m, br:br, r:round, c:p[4]};
  });

  /* grid position: [row, column]; rows 9-10 hold the f-block */
  function pos(z){
    if (z === 1) return [1,1];
    if (z === 2) return [1,18];
    var starts = [[3,2],[11,3],[19,4],[37,5],[55,6],[87,7]], i, row, start;
    for (i = starts.length - 1; i >= 0; i--) if (z >= starts[i][0]) { start = starts[i][0]; row = starts[i][1]; break; }
    var k = z - start;
    if (row <= 3) return k < 2 ? [row, k + 1] : [row, k + 11];
    if (row <= 5) return [row, k + 1];
    if (k < 2) return [row, k + 1];
    if (k <= 16) return [row + 3, k + 1];          /* La-Lu or Ac-Lr: f-block rows */
    return [row, k - 13];                          /* Hf/Rf onward: groups 4-18 */
  }

  var CSS =
  '.kpt-ov{display:none;position:fixed;inset:0;z-index:70;background:rgba(20,30,25,.45);padding:12px;overflow-y:auto;font-family:"DM Sans",system-ui,sans-serif}'+
  '.kpt-ov.open{display:block}'+
  '.kpt-panel{max-width:1040px;margin:0 auto;background:#fff;border-radius:14px;padding:14px 16px 16px;color:var(--body,#3f4742)}'+
  '.kpt-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:4px}'+
  '.kpt-head h3{font-weight:800;color:var(--ink,#1c2620);font-size:1.25rem;letter-spacing:-.02em;margin:0}'+
  '.kpt-x{background:#fff;border:1px solid var(--rule,#e4e6e3);color:var(--body,#3f4742);font:600 .78rem "DM Sans",sans-serif;padding:5px 12px;border-radius:100px;cursor:pointer}'+
  '.kpt-note{font-size:.8rem;color:var(--muted,#6f7771);margin:0 0 8px}'+
  '.kpt-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}'+
  '.kpt-find{font:500 .9rem "DM Sans",sans-serif;padding:6px 10px;border:1px solid var(--rule,#e4e6e3);border-radius:100px;width:13em;color:var(--ink,#1c2620)}'+
  '.kpt-legend{display:flex;flex-wrap:wrap;gap:10px;font-size:.74rem;color:var(--muted,#6f7771)}'+
  '.kpt-legend span{display:inline-flex;align-items:center;gap:4px}'+
  '.kpt-legend i{width:11px;height:11px;border-radius:3px;display:inline-block;border:1px solid rgba(0,0,0,.12)}'+
  '.kpt-detail{min-height:2.6em;border-left:3px solid var(--accent,#2d6a4f);background:var(--g-bg,#e9f4ee);border-radius:0 8px 8px 0;padding:6px 10px;font-size:.86rem;margin-bottom:8px}'+
  '.kpt-detail b{color:var(--ink,#1c2620)}'+
  '.kpt-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}'+
  '.kpt-grid{display:grid;grid-template-columns:repeat(18,minmax(2.75rem,1fr));gap:3px;min-width:52rem}'+
  '.kpt-gh{font-size:.62rem;font-weight:700;color:var(--muted,#6f7771);text-align:center;align-self:end}'+
  '.kpt-c{border:1px solid rgba(0,0,0,.1);border-radius:5px;padding:2px 2px 3px;text-align:center;cursor:pointer;font:inherit;line-height:1.1;min-width:0;color:var(--ink,#1c2620)}'+
  '.kpt-c .z{display:block;font-size:.56rem;opacity:.75;text-align:left;padding-left:2px}'+
  '.kpt-c b{display:block;font-size:.95rem;font-weight:800}'+
  '.kpt-c .m{display:block;font-size:.6rem;white-space:nowrap}'+
  '.kpt-c.m-m{background:#eef3f8}.kpt-c.m-d{background:#fdf3e6}.kpt-c.m-n{background:#e9f4ee}.kpt-c.m-g{background:#f1ecf8}'+
  '.kpt-c:hover{border-color:var(--ink,#1c2620)}'+
  '.kpt-c.on{outline:2.5px solid var(--orange,#d9821f);outline-offset:0;border-color:transparent}'+
  '.kpt-ph{border:1px dashed rgba(0,0,0,.18);border-radius:5px;font-size:.58rem;color:var(--muted,#6f7771);display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1}'+
  '.kpt-gap{grid-column:1/-1;height:6px}'+
  '.kpt-hint{display:none;font-size:.72rem;color:var(--muted,#6f7771);margin-top:4px}'+
  '@media (max-width:860px){.kpt-hint{display:block}}';

  var ov, detail, find, cells = {}, lastFocus = null;
  function track(ev, data){ try{ if (window.umami) umami.track(ev, data); }catch(_){} }

  function describe(e){
    var w = e.br
      ? 'No stable isotopes, so there is no standard atomic weight. <b>' + e.m + '</b> is the mass number of its longest-lived isotope.'
      : 'Standard atomic weight <b>' + e.m + '</b>' + (PRECISE ? '' : ' · use <b>' + e.r + '</b> in calculations');
    return '<b>' + e.s + ' · ' + e.n + '</b> · atomic number ' + e.z + ' · ' + CAT[e.c] + '<br>' + w;
  }
  function select(e, scroll){
    for (var k in cells) cells[k].classList.remove('on');
    var c = cells[e.s]; c.classList.add('on');
    detail.innerHTML = describe(e);
    if (scroll) c.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
  }

  function build(){
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    ov = document.createElement('div');
    ov.className = 'kpt-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Periodic table of the elements');
    ov.innerHTML =
      '<div class="kpt-panel">'+
        '<div class="kpt-head"><h3>Periodic table</h3><button type="button" class="kpt-x">Close</button></div>'+
        '<p class="kpt-note">' + (PRECISE
          ? 'Standard atomic weights, 4 significant figures. [ ] = mass number of the longest-lived isotope.'
          : 'Masses in the cells are rounded the way this course calculates (Cl = 35.5). Tap an element for its standard atomic weight.') + '</p>'+
        '<div class="kpt-bar"><input class="kpt-find" type="search" placeholder="Find: Na or sodium" aria-label="Find an element">'+
          '<div class="kpt-legend"><span><i style="background:#eef3f8"></i>Metal</span><span><i style="background:#fdf3e6"></i>Metalloid</span><span><i style="background:#e9f4ee"></i>Non-metal</span><span><i style="background:#f1ecf8"></i>Noble gas</span></div></div>'+
        '<div class="kpt-detail" aria-live="polite">Tap any element.</div>'+
        '<div class="kpt-scroll"><div class="kpt-grid"></div></div>'+
        '<p class="kpt-hint">Scroll sideways to see every group, or turn your phone to landscape.</p>'+
      '</div>';
    document.body.appendChild(ov);
    detail = ov.querySelector('.kpt-detail'); find = ov.querySelector('.kpt-find');
    var grid = ov.querySelector('.kpt-grid'), g;
    for (g = 1; g <= 18; g++) { var h = document.createElement('div'); h.className = 'kpt-gh'; h.style.gridRow = 1; h.style.gridColumn = g; h.textContent = g; grid.appendChild(h); }
    els.forEach(function(e){
      var p = pos(e.z), b = document.createElement('button');
      b.type = 'button'; b.className = 'kpt-c m-' + e.c;
      b.style.gridRow = p[0] + 1;   /* row 1 = group numbers, row 9 = gap */ b.style.gridColumn = p[1];
      b.innerHTML = '<span class="z">' + e.z + '</span><b>' + e.s + '</b><span class="m">' + (PRECISE || e.br ? e.m : e.r) + '</span>';
      b.setAttribute('aria-label', e.n + ', atomic number ' + e.z + ', ' + (e.br ? 'mass number ' : 'atomic mass ') + (PRECISE || e.br ? e.m.replace(/[\[\]]/g,'') : e.r));
      b.addEventListener('click', function(){ select(e, false); track('pt-element', {el:e.s}); });
      cells[e.s] = b; grid.appendChild(b);
    });
    [['57–71',7,3],['89–103',8,3]].forEach(function(x){ var d = document.createElement('div'); d.className = 'kpt-ph'; d.style.gridRow = x[1]; d.style.gridColumn = x[2]; d.textContent = x[0]; grid.appendChild(d); });
    var gap = document.createElement('div'); gap.className = 'kpt-gap'; gap.style.gridRow = 9; grid.appendChild(gap);
    find.addEventListener('input', function(){
      var q = find.value.trim().toLowerCase(); if (!q) return;
      var hit = els.filter(function(e){ return e.s.toLowerCase() === q; })[0]
             || els.filter(function(e){ return e.n.toLowerCase().indexOf(q) === 0; })[0]
             || (/^\d+$/.test(q) ? els[+q - 1] : null);
      if (hit) select(hit, true);
    });
    ov.querySelector('.kpt-x').addEventListener('click', close);
    ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
  }
  function open(){
    if (!ov) build();
    lastFocus = document.activeElement;
    ov.classList.add('open'); ov.scrollTop = 0;
    ov.querySelector('.kpt-x').focus({preventScroll:true});
    track('periodic-table-open');
  }
  function close(){
    ov.classList.remove('open');
    if (lastFocus && lastFocus.focus) try{ lastFocus.focus({preventScroll:true}); }catch(_){}
  }
  window.KompasPT = {open:open, close:close, elements:els};
})();
