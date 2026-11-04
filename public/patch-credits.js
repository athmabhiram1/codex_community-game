// Patch credits overlay: a small "i" button, bottom left, that toggles the game's credits.
(() => {
	const C = {
		title: 'Tidewater',
		author: 'Dan Greenheck',
		license: 'MIT (code). Assets: CC0, MIT and OFL; see CREDITS.md',
		source: 'github.com/dgreenheck/tidewater',
	};
	const root = document.createElement('div');
	root.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:13px/1.4 system-ui,sans-serif;color:#eef';
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.textContent = 'i';
	btn.setAttribute('aria-label', 'Credits');
	btn.style.cssText = 'pointer-events:auto;width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,.45);background:rgba(10,16,24,.45);color:#fff;font:italic 600 14px/22px Georgia,serif;padding:0;cursor:pointer;opacity:.55';
	const panel = document.createElement('div');
	panel.hidden = true;
	panel.style.cssText = 'pointer-events:auto;position:absolute;left:0;bottom:32px;width:270px;padding:10px 12px;border-radius:8px;background:rgba(10,16,24,.88);border:1px solid rgba(255,255,255,.18);user-select:text';
	const line = (text, css) => {
		const p = document.createElement('div');
		p.textContent = text;
		if (css) p.style.cssText = css;
		panel.appendChild(p);
	};
	line(C.title, 'font-weight:700;font-size:15px');
	line('by ' + C.author);
	line('License: ' + C.license);
	line('Source: ' + C.source, 'word-break:break-all');
	line('Added to Patch by Patch. The author can claim it.', 'margin-top:6px;opacity:.7');
	btn.addEventListener('click', () => {
		panel.hidden = !panel.hidden;
		btn.style.opacity = panel.hidden ? '.55' : '1';
	});
	btn.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
	btn.addEventListener('mouseleave', () => (btn.style.opacity = panel.hidden ? '.55' : '1'));
	const stop = (e) => e.stopPropagation();
	for (const el of [btn, panel])
		for (const t of ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click', 'dblclick', 'pointerdown', 'pointerup', 'pointermove', 'mousemove', 'wheel', 'contextmenu', 'touchstart', 'touchend'])
			el.addEventListener(t, stop);
	// keyboard focus on the button must not leave Space/Enter reaching the game
	btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); btn.click(); } });
	root.append(panel, btn);
	(document.body || document.documentElement).appendChild(root);
})();
