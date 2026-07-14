const statusTones = ['ok', 'warn', 'crit', 'pend', 'rej'];

module.exports = {
  content: [
    './index.html',
    './app/**/*.js',
  ],
  safelist: [
    ...statusTones.flatMap(tone => [
      `bg-st-${tone}fg`,
      `bg-st-${tone}bg`,
      `border-st-${tone}bd`,
      `text-st-${tone}fg`,
    ]),
    'bg-tx-tertiary',
    'ft-pdf',
    'ft-png',
    'ft-fig',
    'ft-doc',
    {
      pattern: /^(bg|text|border)-(bg|bd|tx|brand|st)-(primary|secondary|tertiary|default|emphasis|strong|hover|light|okfg|okbg|okbd|warnfg|warnbg|warnbd|critfg|critbg|critbd|pendfg|pendbg|pendbd|rejfg|rejbg|rejbd)$/,
    },
    {
      pattern: /^(ring|bg)-brand-primary\/(10|15|20|30|40|50)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#FFFFFF', secondary: '#FAFAFA', tertiary: '#F5F5F5' },
        bd: { default: '#E5E5E5', emphasis: '#D4D4D4', strong: '#A3A3A3' },
        tx: { primary: '#0A0A0A', secondary: '#525252', tertiary: '#A3A3A3', inverse: '#FFFFFF' },
        brand: { primary: '#10B981', hover: '#059669', light: '#ECFDF5', ring: 'rgba(16,185,129,0.18)' },
        st: {
          okfg: '#10B981', okbg: '#ECFDF5', okbd: '#A7F3D0',
          warnfg: '#F59E0B', warnbg: '#FFFBEB', warnbd: '#FDE68A',
          critfg: '#EF4444', critbg: '#FEF2F2', critbd: '#FECACA',
          pendfg: '#3B82F6', pendbg: '#EFF6FF', pendbd: '#BFDBFE',
          rejfg: '#6B7280', rejbg: '#F3F4F6', rejbd: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        logo: ['"Orbitron"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.04)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 10px 25px rgba(0,0,0,0.1)',
      },
    },
  },
};
