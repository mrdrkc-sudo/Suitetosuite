async function loadSettings(){
  try{
    const res = await fetch('data/settings.json?v=' + Date.now());
    const settings = await res.json();
    if(settings.theme){
      const root = document.documentElement;
      Object.entries(settings.theme).forEach(([k,v]) => root.style.setProperty(`--${k}`, v));
    }
    const siteNameEl=document.getElementById('siteName');
    const logoEl=document.getElementById('logo');
    siteNameEl.textContent=settings.siteName||'Мой сайт';
    if(settings.logoUrl){logoEl.src=settings.logoUrl;logoEl.style.display='block';}else{logoEl.style.display='none';}
    const nav=document.getElementById('nav'); nav.innerHTML='';
    (settings.nav||[{label:'Главная',page:'home'},{label:'Магазин',page:'shop'},{label:'О нас',page:'about'},{label:'Контакты',page:'contact'}]).forEach(item=>{
      const a=document.createElement('a'); a.href=`?page=${encodeURIComponent(item.page)}`; a.textContent=item.label; if(getPage()===item.page) a.classList.add('active');
      a.addEventListener('click',e=>{e.preventDefault();const url=new URL(window.location);url.searchParams.set('page',item.page);history.pushState({},'',url);
        [...nav.querySelectorAll('a')].forEach(x=>x.classList.remove('active')); a.classList.add('active'); renderPage(item.page);
      });
      nav.appendChild(a);
    });
    const foot=document.getElementById('footerText'); if(settings.footerText) foot.textContent=settings.footerText;
  }catch(e){console.warn('settings error',e);}
}
function getPage(){const url=new URL(window.location); return url.searchParams.get('page')||'home';}
async function fetchMarkdown(slug){
  const path=`content/${slug}.md?v=${Date.now()}`;
  const res=await fetch(path); if(!res.ok) return `# Страница не найдена\nФайл \`${path}\` отсутствует.`;
  const text=await res.text(); const fm=/^---[\s\S]*?---\s*/; return text.replace(fm,'');
}
async function renderProducts(container){
  try{
    const res=await fetch('data/products.json?v='+Date.now()); const data=await res.json(); const items=data.items||[];
    if(!items.length){container.innerHTML+=`<div class="alert">Товары пока не добавлены. Зайдите в <a href="admin/">админ панель</a> и добавьте товары.</div>`; return;}
    const grid=document.createElement('div'); grid.className='grid';
    items.forEach(p=>{
      const card=document.createElement('div'); card.className='card';
      const img=document.createElement('img'); img.src=p.image||'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop'; img.alt=p.title||'';
      const pad=document.createElement('div'); pad.className='pad';
      const h3=document.createElement('h3'); h3.textContent=p.title||'Без названия';
      const desc=document.createElement('div'); desc.textContent=p.description||'';
      const price=document.createElement('div'); price.className='price'; if(typeof p.price!=='undefined') price.textContent=`₴ ${p.price}`;
      const btn=document.createElement('a'); btn.className='btn'; btn.textContent='Купить'; btn.href=p.link||'#';
      if(!p.link) btn.addEventListener('click',e=>{e.preventDefault(); alert('Добавьте ссылку покупки в админке.');});
      pad.append(h3); if(desc.textContent) pad.append(desc); if(price.textContent) pad.append(price); pad.append(btn);
      card.append(img); card.append(pad); grid.append(card);
    });
    container.append(grid);
  }catch(e){container.innerHTML+=`<div class="alert">Ошибка загрузки товаров: ${e.message}</div>`;}
}
async function renderPage(slug){
  const app=document.getElementById('app');
  const md=await fetchMarkdown(slug);
  const html=marked.parse(md); app.innerHTML=html;
  if(slug==='shop'){ const productsHost=document.createElement('div'); productsHost.id='products'; app.append(productsHost); await renderProducts(productsHost); }
}
window.addEventListener('popstate',()=>renderPage(getPage()));
(async function init(){ await loadSettings(); await renderPage(getPage()); })();
