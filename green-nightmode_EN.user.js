// ==UserScript==
// @name              Eye Comfort Mode Assistant (Adjustable Intensity + Toggle Button + Color Support)
// @version           1.0.1
// @namespace         https://github.com/lantinglu/green-nightmode
// @supportURL        https://github.com/lantinglu/green-nightmode
// @description       Enable night mode on any website, with adjustable darkness intensity, bottom-right toggle button, whitelist control, and customizable color theme (default: green).
// @license           MIT
// @match             *://*/*
// @require           https://unpkg.com/darkrule@1.0.4/dist/rule.min.js
// @require           https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.js
// @resource          swalStyle https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.css
// @run-at            document-start
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_registerMenuCommand
// @grant             GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';

    const util = {
        getValue: GM_getValue,
        setValue: GM_setValue,
        addStyle(id, tag = 'style', css) {
            if (document.getElementById(id)) return;
            const style = document.createElement(tag);
            style.rel = 'stylesheet';
            style.id = id;
            tag === 'style' ? style.innerHTML = css : style.href = css;
            document.head.appendChild(style);
        },
        removeElementById(id) {
            const el = document.getElementById(id);
            el && el.remove();
        },
        generateGreenMatrix(intensity = 100) {
            const t = intensity / 100;
            const val = (a, b) => a * t + b * (1 - t);
            return `<filter id="dark-mode-filter" x="0" y="0" width="99999" height="99999">
                <feColorMatrix type="matrix" values="
                    ${val(0.2, 1)} ${val(-0.3, 0)} ${val(-0.3, 0)} 0 ${val(0.5, 0)}
                    ${val(-0.3, 0)} ${val(1, 1)} ${val(-0.3, 0)} 0 ${val(0.5, 0)}
                    ${val(-0.3, 0)} ${val(-0.3, 0)} ${val(0.2, 1)} 0 ${val(0.5, 0)}
                    0 0 0 1 0"/>
            </filter>`;
        },
        applyDarkFilter(intensity) {
            util.removeElementById('dark-mode-svg');
            const svgDom = `<svg id="dark-mode-svg" style="height: 0; width: 0;">
                ${util.generateGreenMatrix(intensity)}
            </svg>`;
            const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            div.innerHTML = svgDom;
            const frag = document.createDocumentFragment();
            while (div.firstChild) frag.appendChild(div.firstChild);
            document.head.appendChild(frag);

            util.removeElementById('dark-mode-style');
            util.addStyle('dark-mode-style', 'style', `
                html {
                    filter: url(#dark-mode-filter) !important;
                }
            `);
        },
        createToggleButton() {
            if (document.getElementById('dark-toggle-btn')) return;

            const btn = document.createElement('div');
            btn.id = 'dark-toggle-btn';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 40px;
                height: 40px;
                background: #fff;
                border-radius: 50%;
                border: 1px solid #aaa;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                cursor: pointer;
                z-index: 99999;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);`;
            btn.textContent = GM_getValue('dark_mode') === 'dark' ? '☀️' : '🌙';

            btn.addEventListener('click', () => {
                const isDark = GM_getValue('dark_mode') === 'dark';
                GM_setValue('dark_mode', isDark ? 'light' : 'dark');
                location.reload();
            });

            document.body.appendChild(btn);
        }
    };

    const registerMenuCommandWithSlider = () => {
        const currentIntensity = util.getValue('dark_intensity') || 100;
        util.addStyle('swal-pub-style', 'style', GM_getResourceText('swalStyle'));
        Swal.fire({
            title: 'Eye Comfort Mode Settings',
            html: `
                <div style="text-align: left; font-size: 14px">
                    <label>Green Intensity：<span id="dark-intensity-label">${currentIntensity}</span>%</label>
                    <input type="range" id="dark-intensity-slider" min="0" max="100" step="5" value="${currentIntensity}" style="width: 100%">
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: 'Save',
            preConfirm: () => {
                const val = parseInt(document.getElementById('dark-intensity-slider').value);
                GM_setValue('dark_intensity', val);
                location.reload();
            }
        });

        setTimeout(() => {
            const slider = document.getElementById('dark-intensity-slider');
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                document.getElementById('dark-intensity-label').innerText = val;
                util.applyDarkFilter(val);
            });
        }, 200);
    };

    const init = () => {
        if (GM_getValue('dark_intensity') === undefined) {
            GM_setValue('dark_intensity', 15);
        }
        if (GM_getValue('dark_mode') === undefined) {
            GM_setValue('dark_mode', 'dark');
        }

        GM_registerMenuCommand('🎚️ Adjust Green Intensity', registerMenuCommandWithSlider);

        const isExcluded = (GM_getValue('exclude_list') || []).includes(location.host);
        const darkModeEnabled = GM_getValue('dark_mode') === 'dark';

        window.addEventListener('DOMContentLoaded', () => {
            util.createToggleButton();
        });

        if (!isExcluded && darkModeEnabled) {
            util.applyDarkFilter(GM_getValue('dark_intensity'));
        }
    };

    init();
})();