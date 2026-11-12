/* Camada visual V7. Não altera chaves de armazenamento ou cálculos. */
(()=>{
 const outcome=document.getElementById('outcome');
 const buttons=[...document.querySelectorAll('.outcome-option')];
 const sync=()=>{for(const b of buttons){const active=b.dataset.outcome===outcome.value;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));}};
 buttons.forEach(b=>b.addEventListener('click',()=>{outcome.value=b.dataset.outcome;outcome.dispatchEvent(new Event('input',{bubbles:true}));outcome.dispatchEvent(new Event('change',{bubbles:true}));sync();}));
 outcome.addEventListener('change',sync);sync();
 const links=[...document.querySelectorAll('.bottom-nav a')];
 links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>{x.classList.toggle('nav-active',x===a);if(x===a)x.setAttribute('aria-current','location');else x.removeAttribute('aria-current');});}));
})();
