/* @ds-bundle: {"format":4,"namespace":"HRoneDesignSystem_c54fc9","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Eyebrow","sourcePath":"components/brand/Eyebrow.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Divider","sourcePath":"components/display/Divider.jsx"},{"name":"Stat","sourcePath":"components/display/Stat.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Callout","sourcePath":"components/feedback/Callout.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"a9e19c195647","components/actions/IconButton.jsx":"9dd984039ec6","components/brand/Eyebrow.jsx":"4d6c282b4370","components/brand/Wordmark.jsx":"64af5c123371","components/display/Avatar.jsx":"1b44258b8246","components/display/Badge.jsx":"6d99e2c5d480","components/display/Card.jsx":"18c9483bf948","components/display/Divider.jsx":"15cf855688af","components/display/Stat.jsx":"9697998eaae4","components/display/Tag.jsx":"c9312b2adf44","components/feedback/Callout.jsx":"0a17a8053974","components/forms/Checkbox.jsx":"447ec4f5e86b","components/forms/Field.jsx":"1a25636608fb","components/forms/Input.jsx":"48fa9605aced","components/forms/Radio.jsx":"24a67da61954","components/forms/Select.jsx":"0542a9093599","components/forms/Switch.jsx":"2e29570bb0b7","components/forms/Textarea.jsx":"a0678be9b2d2"},"inlinedExternals":[],"unexposedExports":[{"name":"ensureChoiceCss","sourcePath":"components/forms/Checkbox.jsx"},{"name":"ensureFieldCss","sourcePath":"components/forms/Input.jsx"}]} */

(() => {

const __ds_ns = (window.HRoneDesignSystem_c54fc9 = window.HRoneDesignSystem_c54fc9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let _injected = false;
function inject() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const s = document.createElement('style');
  s.id = 'hrn-btn-css';
  s.textContent = `
.hrn-btn{--_bg:var(--slate-500);--_bgh:var(--slate-600);--_bga:var(--slate-700);--_fg:#fff;--_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:.55em;font-family:var(--font-sans);font-weight:600;
  border:1px solid var(--_bd);border-radius:var(--radius-sm);background:var(--_bg);color:var(--_fg);cursor:pointer;
  line-height:1;white-space:nowrap;text-decoration:none;letter-spacing:0.005em;
  transition:background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard),transform var(--dur-instant);-webkit-font-smoothing:antialiased}
.hrn-btn:hover{background:var(--_bgh)}
.hrn-btn:active{background:var(--_bga);transform:translateY(1px)}
.hrn-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.hrn-btn[disabled],.hrn-btn[aria-disabled="true"]{opacity:.5;cursor:not-allowed;transform:none;pointer-events:none}
.hrn-btn--accent{--_bg:var(--amber-500);--_bgh:var(--amber-600);--_bga:var(--amber-700)}
.hrn-btn--accent:focus-visible{box-shadow:var(--focus-ring-accent)}
.hrn-btn--secondary{--_bg:var(--surface);--_bgh:var(--surface-2);--_bga:var(--surface-3);--_fg:var(--text-primary);--_bd:var(--border-strong)}
.hrn-btn--secondary:hover{border-color:var(--ink-300)}
.hrn-btn--ghost{--_bg:transparent;--_bgh:var(--surface-2);--_bga:var(--surface-3);--_fg:var(--text-primary)}
.hrn-btn--danger{--_bg:var(--danger-500);--_bgh:var(--danger-600);--_bga:var(--danger-600)}
.hrn-btn--sm{height:var(--field-height-sm);padding:0 var(--space-3);font-size:var(--text-sm)}
.hrn-btn--md{height:var(--field-height);padding:0 var(--space-5);font-size:var(--text-base)}
.hrn-btn--lg{height:3.25rem;padding:0 var(--space-6);font-size:var(--text-md)}
.hrn-btn--block{width:100%}
.hrn-btn__ic{display:inline-flex;align-items:center;justify-content:center;flex:none}
.hrn-btn__ic svg{width:1.15em;height:1.15em;display:block}`;
  document.head.appendChild(s);
}
function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft,
  iconRight,
  as,
  href,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  inject();
  const Tag = as || (href ? 'a' : 'button');
  const cls = ['hrn-btn', `hrn-btn--${variant}`, `hrn-btn--${size}`, block && 'hrn-btn--block', className].filter(Boolean).join(' ');
  const extra = Tag === 'button' ? {
    type,
    disabled
  } : {
    href,
    'aria-disabled': disabled ? 'true' : undefined
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, extra, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    className: "hrn-btn__ic"
  }, iconLeft), children != null && /*#__PURE__*/React.createElement("span", null, children), iconRight && /*#__PURE__*/React.createElement("span", {
    className: "hrn-btn__ic"
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let _injected = false;
function inject() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const s = document.createElement('style');
  s.id = 'hrn-iconbtn-css';
  s.textContent = `
.hrn-iconbtn{--_bg:transparent;--_bgh:var(--surface-2);--_bga:var(--surface-3);--_fg:var(--text-secondary);--_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--_bd);border-radius:var(--radius-sm);
  background:var(--_bg);color:var(--_fg);cursor:pointer;transition:background var(--dur-fast) var(--ease-standard),color var(--dur-fast),border-color var(--dur-fast),transform var(--dur-instant)}
.hrn-iconbtn:hover{background:var(--_bgh);color:var(--text-primary)}
.hrn-iconbtn:active{background:var(--_bga);transform:translateY(1px)}
.hrn-iconbtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.hrn-iconbtn[disabled]{opacity:.5;cursor:not-allowed;transform:none}
.hrn-iconbtn--primary{--_bg:var(--slate-500);--_bgh:var(--slate-600);--_bga:var(--slate-700);--_fg:#fff}
.hrn-iconbtn--primary:hover{color:#fff}
.hrn-iconbtn--secondary{--_bg:var(--surface);--_bgh:var(--surface-2);--_fg:var(--text-primary);--_bd:var(--border-strong)}
.hrn-iconbtn--sm{width:var(--field-height-sm);height:var(--field-height-sm)}
.hrn-iconbtn--md{width:var(--field-height);height:var(--field-height)}
.hrn-iconbtn--lg{width:3.25rem;height:3.25rem}
.hrn-iconbtn svg{width:1.25rem;height:1.25rem;display:block}`;
  document.head.appendChild(s);
}
function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  label,
  className = '',
  children,
  ...rest
}) {
  inject();
  const cls = ['hrn-iconbtn', `hrn-iconbtn--${variant}`, `hrn-iconbtn--${size}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    disabled: disabled,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  accent: 'var(--amber-600)',
  brand: 'var(--slate-600)',
  muted: 'var(--text-secondary)',
  inverse: 'var(--amber-300)'
};

/** Petit label mono en capitales espacées : eyebrow de section, étiquette technique. */
function Eyebrow({
  tone = 'muted',
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: className,
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      fontSize: 'var(--text-xs)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: TONES[tone] || TONES.muted
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 18,
  md: 26,
  lg: 40,
  xl: 60
};

/**
 * Wordmark typographique Hérone. Aucun logo n'existant à ce jour, le nom est
 * posé en Bricolage Grotesque. Ne jamais remplacer par un dessin/pictogramme inventé.
 */
function Wordmark({
  size = 'md',
  tagline,
  tone = 'ink',
  as = 'span',
  className = '',
  ...rest
}) {
  const px = SIZES[size] || SIZES.md;
  const Tag = as;
  const fg = tone === 'inverse' ? 'var(--text-inverse)' : 'var(--text-strong)';
  const sub = tone === 'inverse' ? 'var(--ink-300)' : 'var(--text-secondary)';
  const taglineText = tagline === true ? 'Systèmes IA · Grand Ouest' : tagline;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: className,
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      gap: taglineText ? '0.25em' : 0,
      lineHeight: 1
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: px,
      letterSpacing: '0.01em',
      color: fg
    }
  }, "H\xC9RONE"), taglineText && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      fontSize: Math.max(10, px * 0.24),
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: sub
    }
  }, taglineText));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64
};
function initials(name) {
  return String(name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/** Avatar : image ou initiales sur fond ardoise clair. */
function Avatar({
  name = '',
  src,
  size = 'md',
  shape = 'circle',
  className = '',
  style,
  ...rest
}) {
  const px = SIZES[size] || SIZES.md;
  const radius = shape === 'square' ? 'var(--radius-md)' : 'var(--radius-full)';
  const common = {
    width: px,
    height: px,
    borderRadius: radius,
    flex: 'none',
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", _extends({
      className: className,
      src: src,
      alt: name,
      style: {
        ...common,
        objectFit: 'cover',
        display: 'block'
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    "aria-label": name || undefined,
    style: {
      ...common,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--slate-100)',
      color: 'var(--slate-700)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: px * 0.4,
      letterSpacing: '0.01em',
      userSelect: 'none'
    }
  }, rest), initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const V = {
  neutral: ['var(--ink-100)', 'var(--ink-700)'],
  brand: ['var(--slate-50)', 'var(--slate-600)'],
  accent: ['var(--amber-50)', 'var(--amber-700)'],
  success: ['var(--success-50)', 'var(--success-600)'],
  warning: ['var(--warning-50)', 'var(--warning-600)'],
  danger: ['var(--danger-50)', 'var(--danger-600)'],
  info: ['var(--info-50)', 'var(--info-600)']
};

/** Pastille de statut compacte, fond sourd + texte teinté. */
function Badge({
  variant = 'neutral',
  dot = false,
  className = '',
  style,
  children,
  ...rest
}) {
  const [bg, fg] = V[variant] || V.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4em',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      lineHeight: 1.5,
      color: fg,
      background: bg,
      padding: '2px 9px',
      borderRadius: 'var(--radius-full)',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor',
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let _in = false;
function inject() {
  if (_in || typeof document === 'undefined') return;
  _in = true;
  const s = document.createElement('style');
  s.id = 'hrn-card-css';
  s.textContent = `
.hrn-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);color:var(--text-primary);box-sizing:border-box;
  transition:box-shadow var(--dur) var(--ease-standard),border-color var(--dur) var(--ease-standard),transform var(--dur) var(--ease-standard)}
.hrn-card--interactive{cursor:pointer;text-decoration:none;display:block}
.hrn-card--interactive:hover{box-shadow:var(--shadow-md);border-color:var(--border-strong);transform:translateY(-2px)}
.hrn-card--interactive:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.hrn-card--inverse{background:var(--ink-950);border-color:var(--border-inverse);color:var(--text-inverse)}
.hrn-card--flat{box-shadow:none}
.hrn-card--raised{border-color:transparent;box-shadow:var(--shadow-md)}`;
  document.head.appendChild(s);
}
function Card({
  variant = 'default',
  elevation = 'flat',
  padding = 'var(--space-6)',
  as,
  href,
  className = '',
  style,
  children,
  ...rest
}) {
  inject();
  const interactive = variant === 'interactive';
  const Tag = as || (href ? 'a' : 'div');
  const cls = ['hrn-card', interactive && 'hrn-card--interactive', variant === 'inverse' && 'hrn-card--inverse', `hrn-card--${elevation}`, className].filter(Boolean).join(' ');
  const pad = typeof padding === 'number' ? padding + 'px' : padding;
  const extra = interactive && !href ? {
    tabIndex: 0
  } : {};
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    href: href,
    style: {
      padding: pad,
      ...style
    }
  }, extra, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Séparateur horizontal/vertical, avec label centré optionnel. */
function Divider({
  orientation = 'horizontal',
  label,
  className = '',
  style,
  ...rest
}) {
  if (orientation === 'vertical') {
    return /*#__PURE__*/React.createElement("span", _extends({
      className: className,
      role: "separator",
      "aria-orientation": "vertical",
      style: {
        display: 'inline-block',
        width: 1,
        alignSelf: 'stretch',
        background: 'var(--border)',
        ...style
      }
    }, rest));
  }
  if (label) {
    return /*#__PURE__*/React.createElement("div", _extends({
      className: className,
      role: "separator",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        color: 'var(--text-muted)'
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border)'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("hr", _extends({
    className: className,
    style: {
      border: 0,
      height: 1,
      background: 'var(--border)',
      margin: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Divider.jsx", error: String((e && e.message) || e) }); }

// components/display/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Indicateur chiffré (preuve, KPI). Le nombre est en Plex Mono (chiffres tabulaires). */
function Stat({
  value,
  unit,
  label,
  delta,
  deltaDirection = 'up',
  align = 'left',
  className = '',
  style,
  ...rest
}) {
  const deltaColor = deltaDirection === 'down' ? 'var(--danger-600)' : 'var(--success-600)';
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      textAlign: align,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '0.3em',
      justifyContent: align === 'center' ? 'center' : 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 'var(--text-3xl)',
      lineHeight: 1,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-lg)',
      color: 'var(--text-secondary)'
    }
  }, unit), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 500,
      color: deltaColor
    }
  }, deltaDirection === 'down' ? '↓' : '↑', " ", delta)), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Stat.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
let _in = false;
function inject() {
  if (_in || typeof document === 'undefined') return;
  _in = true;
  const s = document.createElement('style');
  s.id = 'hrn-tag-css';
  s.textContent = `
.hrn-tag{display:inline-flex;align-items:center;gap:var(--space-1-5);font-family:var(--font-sans);font-size:var(--text-sm);color:var(--text-primary);background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:2px 8px;line-height:1.5}
.hrn-tag__x{position:relative;width:15px;height:15px;border:none;background:transparent;cursor:pointer;padding:0;flex:none;border-radius:3px;transition:background var(--dur-fast)}
.hrn-tag__x:hover{background:var(--surface-3)}
.hrn-tag__x:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.hrn-tag__x::before,.hrn-tag__x::after{content:"";position:absolute;left:3px;top:6.5px;width:9px;height:1.5px;background:var(--text-secondary);border-radius:1px}
.hrn-tag__x::before{transform:rotate(45deg)}
.hrn-tag__x::after{transform:rotate(-45deg)}`;
  document.head.appendChild(s);
}

/** Étiquette / mot-clé, optionnellement supprimable. */
function Tag({
  onRemove,
  removeLabel = 'Retirer',
  className = '',
  children,
  ...rest
}) {
  inject();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['hrn-tag', className].filter(Boolean).join(' ')
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "hrn-tag__x",
    "aria-label": removeLabel,
    onClick: onRemove
  }));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const V = {
  neutral: ['var(--surface-2)', 'var(--ink-500)', 'var(--text-primary)'],
  info: ['var(--info-50)', 'var(--info-600)', 'var(--info-600)'],
  success: ['var(--success-50)', 'var(--success-600)', 'var(--success-600)'],
  warning: ['var(--warning-50)', 'var(--warning-600)', 'var(--warning-600)'],
  danger: ['var(--danger-50)', 'var(--danger-600)', 'var(--danger-600)']
};

/** Encart de message contextuel : fond teinté + bordure pleine (jamais un simple filet coloré à gauche). */
function Callout({
  variant = 'neutral',
  title,
  icon,
  className = '',
  style,
  children,
  ...rest
}) {
  const [bg, iconColor, titleColor] = V[variant] || V.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    role: "note",
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      background: bg,
      border: `1px solid color-mix(in srgb, ${iconColor} 28%, var(--surface))`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: iconColor,
      flex: 'none',
      display: 'inline-flex',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      color: titleColor
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--text-secondary)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Callout.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CHOICE_CSS = `
.hrn-choice{display:inline-flex;align-items:flex-start;gap:var(--space-2-5);cursor:pointer;font-family:var(--font-sans);font-size:var(--text-base);line-height:1.35;color:var(--text-primary);user-select:none}
.hrn-choice__input{position:absolute;opacity:0;width:1px;height:1px}
.hrn-choice__box{position:relative;width:18px;height:18px;flex:none;margin-top:1px;border:1px solid var(--border-strong);background:var(--surface);transition:background var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)}
.hrn-choice--check .hrn-choice__box{border-radius:var(--radius-xs)}
.hrn-choice--radio .hrn-choice__box{border-radius:var(--radius-full)}
.hrn-choice:hover .hrn-choice__box{border-color:var(--ink-300)}
.hrn-choice__box::after{content:"";position:absolute;transition:transform var(--dur-fast) var(--ease-out);transform:scale(0)}
.hrn-choice--check .hrn-choice__box::after{left:5px;top:1px;width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0)}
.hrn-choice--radio .hrn-choice__box::after{left:50%;top:50%;width:8px;height:8px;border-radius:50%;background:var(--slate-500);transform:translate(-50%,-50%) scale(0)}
.hrn-choice__input:checked + .hrn-choice--check .hrn-choice__box,.hrn-choice--check .hrn-choice__input:checked + .hrn-choice__box{background:var(--slate-500);border-color:var(--slate-500)}
.hrn-choice--check .hrn-choice__input:checked + .hrn-choice__box::after{transform:rotate(45deg) scale(1)}
.hrn-choice--radio .hrn-choice__input:checked + .hrn-choice__box{border-color:var(--slate-500)}
.hrn-choice--radio .hrn-choice__input:checked + .hrn-choice__box::after{transform:translate(-50%,-50%) scale(1)}
.hrn-choice__input:focus-visible + .hrn-choice__box{box-shadow:var(--focus-ring)}
.hrn-choice__input:disabled + .hrn-choice__box{opacity:.5}
.hrn-choice:has(.hrn-choice__input:disabled){cursor:not-allowed;color:var(--text-muted)}
.hrn-switch{display:inline-flex;align-items:center;gap:var(--space-2-5);cursor:pointer;font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);user-select:none}
.hrn-switch__input{position:absolute;opacity:0;width:1px;height:1px}
.hrn-switch__track{position:relative;width:40px;height:22px;flex:none;border-radius:var(--radius-full);background:var(--ink-200);transition:background var(--dur) var(--ease-standard)}
.hrn-switch__track::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:var(--shadow-sm);transition:transform var(--dur) var(--ease-standard)}
.hrn-switch__input:checked + .hrn-switch__track{background:var(--slate-500)}
.hrn-switch__input:checked + .hrn-switch__track::after{transform:translateX(18px)}
.hrn-switch__input:focus-visible + .hrn-switch__track{box-shadow:var(--focus-ring)}
.hrn-switch__input:disabled + .hrn-switch__track{opacity:.5}`;
function ensureChoiceCss() {
  if (typeof document === 'undefined' || document.getElementById('hrn-choice-css')) return;
  const s = document.createElement('style');
  s.id = 'hrn-choice-css';
  s.textContent = CHOICE_CSS;
  document.head.appendChild(s);
}
function Checkbox({
  className = '',
  children,
  ...rest
}) {
  ensureChoiceCss();
  return /*#__PURE__*/React.createElement("label", {
    className: ['hrn-choice', 'hrn-choice--check', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    className: "hrn-choice__input"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "hrn-choice__box"
  }), children != null && /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { ensureChoiceCss, Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Enveloppe un contrôle de formulaire : label + aide + message d'erreur. */
function Field({
  label,
  htmlFor,
  description,
  error,
  required = false,
  className = '',
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1-5)'
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger-500)',
      marginLeft: 2
    }
  }, "*")), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: '-2px'
    }
  }, description), children, error && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--danger-600)'
    }
  }, error));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const FIELD_CSS = `
.hrn-field{font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);background:var(--surface);
  border:1px solid var(--border-strong);border-radius:var(--radius-sm);width:100%;box-sizing:border-box;
  transition:border-color var(--dur-fast) var(--ease-standard),box-shadow var(--dur-fast) var(--ease-standard);outline:none;-webkit-font-smoothing:antialiased}
.hrn-field::placeholder{color:var(--text-muted)}
.hrn-field:hover{border-color:var(--ink-300)}
.hrn-field:focus{border-color:var(--slate-400);box-shadow:var(--focus-ring)}
.hrn-field:disabled{opacity:.55;cursor:not-allowed;background:var(--surface-2)}
.hrn-field--invalid{border-color:var(--danger-500)}
.hrn-field--invalid:focus{box-shadow:0 0 0 3px rgba(181,67,58,.22)}
.hrn-field--sm{height:var(--field-height-sm);padding:0 var(--space-3);font-size:var(--text-sm)}
.hrn-field--md{height:var(--field-height);padding:0 var(--space-3)}
.hrn-field--area{min-height:6.5rem;height:auto;padding:var(--space-3);line-height:var(--leading-normal);resize:vertical}
.hrn-fieldwrap{position:relative;width:100%}
.hrn-fieldwrap__ic{position:absolute;left:var(--space-3);top:50%;transform:translateY(-50%);display:inline-flex;color:var(--text-muted);pointer-events:none}
.hrn-fieldwrap__ic svg{width:1.15rem;height:1.15rem;display:block}
.hrn-fieldwrap--icon .hrn-field{padding-left:calc(var(--space-3) + 1.15rem + var(--space-2))}
.hrn-select{appearance:none;-webkit-appearance:none;background-image:none;padding-right:calc(var(--space-3) + 1.1rem);cursor:pointer}
.hrn-selectwrap{position:relative;width:100%}
.hrn-selectwrap__caret{position:absolute;right:var(--space-3);top:50%;width:0;height:0;margin-top:-2px;
  border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--text-secondary);pointer-events:none}`;
function ensureFieldCss() {
  if (typeof document === 'undefined' || document.getElementById('hrn-field-css')) return;
  const s = document.createElement('style');
  s.id = 'hrn-field-css';
  s.textContent = FIELD_CSS;
  document.head.appendChild(s);
}
function Input({
  size = 'md',
  invalid = false,
  iconLeft,
  className = '',
  ...rest
}) {
  ensureFieldCss();
  const cls = ['hrn-field', `hrn-field--${size}`, invalid && 'hrn-field--invalid', className].filter(Boolean).join(' ');
  const input = /*#__PURE__*/React.createElement("input", _extends({
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest));
  if (!iconLeft) return input;
  return /*#__PURE__*/React.createElement("span", {
    className: "hrn-fieldwrap hrn-fieldwrap--icon"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hrn-fieldwrap__ic"
  }, iconLeft), input);
}
Object.assign(__ds_scope, { ensureFieldCss, Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  className = '',
  children,
  ...rest
}) {
  __ds_scope.ensureChoiceCss();
  return /*#__PURE__*/React.createElement("label", {
    className: ['hrn-choice', 'hrn-choice--radio', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    className: "hrn-choice__input"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "hrn-choice__box"
  }), children != null && /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  size = 'md',
  invalid = false,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.ensureFieldCss();
  const cls = ['hrn-field', 'hrn-select', `hrn-field--${size}`, invalid && 'hrn-field--invalid', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", {
    className: "hrn-selectwrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    className: "hrn-selectwrap__caret"
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  className = '',
  children,
  ...rest
}) {
  __ds_scope.ensureChoiceCss();
  return /*#__PURE__*/React.createElement("label", {
    className: ['hrn-switch', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    className: "hrn-switch__input"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "hrn-switch__track"
  }), children != null && /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  invalid = false,
  className = '',
  rows = 4,
  ...rest
}) {
  __ds_scope.ensureFieldCss();
  const cls = ['hrn-field', 'hrn-field--area', invalid && 'hrn-field--invalid', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("textarea", _extends({
    className: cls,
    rows: rows,
    "aria-invalid": invalid || undefined
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

})();
