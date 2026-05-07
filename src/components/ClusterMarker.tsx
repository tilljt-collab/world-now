export function buildClusterEl(cluster: { count: number }): HTMLElement {
  const size = Math.min(20 + cluster.count * 2, 52)
  const el = document.createElement('div')
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    background:rgba(231,76,60,0.85);border:2px solid rgba(255,255,255,0.6);
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:11px;font-weight:700;cursor:pointer;
    box-shadow:0 0 12px rgba(231,76,60,0.5);`
  el.textContent = String(cluster.count)
  return el
}
