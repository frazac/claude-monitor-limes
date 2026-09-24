const LANG_KEY = 'claude-monitor-lang';
function detectLocale() {
  return (navigator.language || 'en').toLowerCase().startsWith('it') ? 'it' : 'en';
}
let LOCALE = localStorage.getItem(LANG_KEY) || detectLocale();

const ICONS = {
  coffee: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 11.6V15C17 18.3137 14.3137 21 11 21H9C5.68629 21 3 18.3137 3 15V11.6C3 11.2686 3.26863 11 3.6 11H16.4C16.7314 11 17 11.2686 17 11.6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 9C12 8 12.7143 7 14.1429 7V7C15.7208 7 17 5.72081 17 4.14286V3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 9V8.5C8 6.84315 9.34315 5.5 11 5.5V5.5C12.1046 5.5 13 4.60457 13 3.5V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 11H18.5C19.8807 11 21 12.1193 21 13.5C21 14.8807 19.8807 16 18.5 16H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1471 21.2646L12 21.2351L11.8529 21.2646C9.47627 21.7399 7.23257 21.4756 5.59352 20.1643C3.96312 18.86 2.75 16.374 2.75 12C2.75 7.52684 3.75792 5.70955 5.08541 5.04581C5.77977 4.69863 6.67771 4.59759 7.82028 4.72943C8.96149 4.86111 10.2783 5.21669 11.7628 5.71153L12.0235 5.79841L12.2785 5.69638C14.7602 4.70367 16.9909 4.3234 18.5578 5.05463C20.0271 5.7403 21.25 7.59326 21.25 12C21.25 16.374 20.0369 18.86 18.4065 20.1643C16.7674 21.4756 14.5237 21.7399 12.1471 21.2646Z" stroke="currentColor" stroke-width="1.5"></path><path d="M12 5.5C12 3 11 2 9 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 6V21" stroke="currentColor" stroke-width="1.5"></path><path d="M15 12L15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  pizza: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9.01L14.01 8.99889" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 8.01L8.01 7.99889" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 14.01L8.01 13.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 19L2.23626 3.0041C2.13087 2.55618 2.54815 2.16122 2.98961 2.29106L19 7" stroke="currentColor" stroke-width="1.5"></path><path d="M22.198 8.42467C22.4324 7.48703 21.8623 6.5369 20.9247 6.30249C19.987 6.06808 19.0369 6.63816 18.8025 7.5758C18.4106 9.14318 16.9015 11.6241 14.5753 13.9503C12.2743 16.2513 9.42714 18.1442 6.60672 18.7951C5.66497 19.0124 5.07771 19.952 5.29504 20.8937C5.51236 21.8355 6.45198 22.4227 7.39373 22.2054C11.0734 21.3563 14.4762 18.9991 17.0502 16.4252C19.5989 13.8764 21.5898 10.8573 22.198 8.42467Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 12L23 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 2V1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 23V22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 20L19 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 4L19 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 20L5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 4L5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 12L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5066C3 16.7497 7.25034 21 12.4934 21C16.2209 21 19.4466 18.8518 21 15.7259C12.4934 15.7259 8.27411 11.5066 8.27411 3C5.14821 4.55344 3 7.77915 3 11.5066Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  // icone extra di default per l'asse dei confini quando personalizzi il numero
  // di fasce oltre le 4 tematiche (caffè/mela/pizza/letto): usale nell'ordine
  // che preferisci, o sostituiscile con le tue nel pool più sotto.
  extra1: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 14C9 15.6099 10.3771 16 12.0758 16C14.9661 16 15.9206 14.3333 13.9982 11C11.3069 14 10.9224 9.33333 11.3069 8C10.1534 10 9 11.8785 9 14Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 16C15.1559 16 17 13.9024 17 10.3125C17 6.72265 12 3 12 3C12 3 7 6.72265 7 10.3125C7 13.9024 8.84409 16 12 16Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4.27258 21.0703L19.7274 16.9292" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M4.27259 16.9292L12 18.9998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M19.7274 21.0703L15.8637 20.035" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>',
  extra2: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12H17M8 12L6 10H2L4 12L2 14H6L8 12ZM17 12L15 10M17 12L15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 22.5C18.7614 22.5 21 17.799 21 12C21 6.20101 18.7614 1.5 16 1.5C13.2386 1.5 11 6.20101 11 12C11 17.799 13.2386 22.5 16 22.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra3: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 7C15.1046 7 16 6.10457 16 5C16 3.89543 15.1046 3 14 3C12.8954 3 12 3.89543 12 5C12 6.10457 12.8954 7 14 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15C16.3431 15 15 16.3431 15 18C15 19.6569 16.3431 21 18 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.5 18L13 14L8.11768 12L11.1179 8.50006L14.1179 11.0001L17.6179 11.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra4: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19L7.33333 20L16.6667 20L19 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 22.01L8.01 21.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 22.01L16.01 21.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 7.8335C7 7.8335 8.82843 6.91929 10 6.3335C12 5.3335 14.2705 6.90111 14.2705 6.90111L9.96227 10.0363L14 13.3335V17.3335" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.54875 13.3445L8.30818 14.1716H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.1653 9.20935H17.887" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 6C18.1046 6 19 5.10457 19 4C19 2.89543 18.1046 2 17 2C15.8954 2 15 2.89543 15 4C15 5.10457 15.8954 6 17 6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra5: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V13.6C3 13.2686 3.26863 13 3.6 13H21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 20L17 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 20L7 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 13V7C21 4.79086 19.2091 3 17 3H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.4 8H8.60003C8.26865 8 8.00393 7.7317 8.04019 7.4023C8.18624 6.07539 8.86312 3 12 3C15.1369 3 15.8138 6.07539 15.9598 7.4023C15.9961 7.73169 15.7314 8 15.4 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra6: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.7781 4.04337C17.7007 2.08074 14.9382 1 12 1C9.0618 1 6.29934 2.08089 4.2217 4.04337C2.14423 6.00617 1 8.61557 1 11.3911C1 11.7274 1.28853 12 1.64437 12C2.00038 12 2.28891 11.7274 2.28891 11.3911C2.28891 10.3784 3.16123 9.55439 4.23328 9.55439C6.12573 9.55439 5.43138 12 6.82219 12C8.21299 12 7.51871 9.55439 9.41109 9.55439C11.3035 9.55439 12 12 12 12C12 12 12.6965 9.55439 14.5889 9.55439C16.4813 9.55439 15.988 12 17.1778 12C18.3677 12 17.8743 9.55439 19.7667 9.55439C20.8388 9.55439 21.7111 10.3784 21.7111 11.3911C21.7111 11.7274 21.9996 12 22.3556 12C22.7115 12 23 11.7274 23 11.3911C23 8.61557 21.8559 6.00617 19.7781 4.04337Z" stroke="currentColor" stroke-width="1.5"></path><path d="M12 12C12 12 12 16.0948 12 20C12 24 6 24 6 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra7: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 12.5C17.2761 12.5 17.5 12.2761 17.5 12C17.5 11.7239 17.2761 11.5 17 11.5C16.7239 11.5 16.5 11.7239 16.5 12C16.5 12.2761 16.7239 12.5 17 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7 12.5C7.27614 12.5 7.5 12.2761 7.5 12C7.5 11.7239 7.27614 11.5 7 11.5C6.72386 11.5 6.5 11.7239 6.5 12C6.5 12.2761 6.72386 12.5 7 12.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra8: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 15.5V2.6C2 2.26863 2.26863 2 2.6 2H21.4C21.7314 2 22 2.26863 22 2.6V15.5M2 15.5V17.4C2 17.7314 2.26863 18 2.6 18H21.4C21.7314 18 22 17.7314 22 17.4V15.5M2 15.5H22M9 22H10.5M10.5 22V18M10.5 22H13.5M13.5 22H15M13.5 22L13.5 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra9: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.5 8C11.7761 8 12 7.77614 12 7.5C12 7.22386 11.7761 7 11.5 7C11.2239 7 11 7.22386 11 7.5C11 7.77614 11.2239 8 11.5 8Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.5 11C7.77614 11 8 10.7761 8 10.5C8 10.2239 7.77614 10 7.5 10C7.22386 10 7 10.2239 7 10.5C7 10.7761 7.22386 11 7.5 11Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.5 13C11.7761 13 12 12.7761 12 12.5C12 12.2239 11.7761 12 11.5 12C11.2239 12 11 12.2239 11 12.5C11 12.7761 11.2239 13 11.5 13Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra10: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M16 8.77975C16 9.38118 15.7625 9.95883 15.3383 10.3861C14.3619 11.3701 13.415 12.3961 12.4021 13.3443C12.17 13.5585 11.8017 13.5507 11.5795 13.3268L8.6615 10.3861C7.7795 9.49725 7.7795 8.06225 8.6615 7.17339C9.55218 6.27579 11.0032 6.27579 11.8938 7.17339L11.9999 7.28027L12.1059 7.17345C12.533 6.74286 13.1146 6.5 13.7221 6.5C14.3297 6.5 14.9113 6.74284 15.3383 7.17339C15.7625 7.60073 16 8.17835 16 8.77975Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path><path d="M6 17L20 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M6 21L20 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra11: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.48901 17.7273H18.3556M8.48901 17.7273V21H18.3556V17.7273M8.48901 17.7273C5.20016 15.5455 3.55573 10.0909 4.10387 8.45455C4.54239 7.14545 6.47916 7.54545 7.39273 7.90909C7.39273 4.09091 9.03715 3 13.4223 3C17.8074 3 20 4.09091 20 9.54545C20 13.9091 18.9037 16.8182 18.3556 17.7273" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.39282 7.90909C7.75825 8.27272 8.81799 9 10.1335 9C11.4491 9 13.9705 9 15.0668 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.39282 7.90909C7.39282 11.7273 9.03725 12.2727 10.1335 12.2727" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra12: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 7C17.1046 7 18 6.10457 18 5C18 3.89543 17.1046 3 16 3C14.8954 3 14 3.89543 14 5C14 6.10457 14.8954 7 16 7ZM16 7C16 7 16 13.0948 16 17C16 23 6 23 6 17V13L8 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra13: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.4 7H4.6C4.26863 7 4 7.26863 4 7.6V16.4C4 16.7314 4.26863 17 4.6 17H7.4C7.73137 17 8 16.7314 8 16.4V7.6C8 7.26863 7.73137 7 7.4 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.4 7H16.6C16.2686 7 16 7.26863 16 7.6V16.4C16 16.7314 16.2686 17 16.6 17H19.4C19.7314 17 20 16.7314 20 16.4V7.6C20 7.26863 19.7314 7 19.4 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M1 14.4V9.6C1 9.26863 1.26863 9 1.6 9H3.4C3.73137 9 4 9.26863 4 9.6V14.4C4 14.7314 3.73137 15 3.4 15H1.6C1.26863 15 1 14.7314 1 14.4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M23 14.4V9.6C23 9.26863 22.7314 9 22.4 9H20.6C20.2686 9 20 9.26863 20 9.6V14.4C20 14.7314 20.2686 15 20.6 15H22.4C22.7314 15 23 14.7314 23 14.4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 12H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra14: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.5714 15.0036L15.4286 16.8486C15.4286 16.8486 19.2857 17.6678 19.2857 19.6162C19.2857 21 17.5714 21 17.5714 21H13L10.75 19.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.42864 15.0036L8.5715 16.8486C8.5715 16.8486 4.71436 17.6678 4.71436 19.6162C4.71436 21 6.42864 21 6.42864 21H8.50007L10.7501 19.75L13.5001 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 15.9261C3 15.9261 5.14286 15.4649 6.42857 15.0036C7.71429 8.54595 11.5714 9.00721 12 9.00721C12.4286 9.00721 16.2857 8.54595 17.5714 15.0036C18.8571 15.4649 21 15.9261 21 15.9261" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7C13.1046 7 14 6.10457 14 5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5C10 6.10457 10.8954 7 12 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra15: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 20.2895V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7.96125C7.35368 17 6.77906 17.2762 6.39951 17.7506L4.06852 20.6643C3.71421 21.1072 3 20.8567 3 20.2895Z" stroke="currentColor" stroke-width="1.5"></path><path d="M10.5 10H8.5C7.94772 10 7.5 9.55228 7.5 9V8C7.5 7.44772 7.94772 7 8.5 7H9.5C10.0523 7 10.5 7.44772 10.5 8V10ZM10.5 10C10.5 11 9.5 12 8.5 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M16.5 10H14.5C13.9477 10 13.5 9.55228 13.5 9V8C13.5 7.44772 13.9477 7 14.5 7H15.5C16.0523 7 16.5 7.44772 16.5 8V10ZM16.5 10C16.5 11 15.5 12 14.5 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>',
  extra16: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18 19H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 16.4V7.6C2 7.26863 2.26863 7 2.6 7H21.4C21.7314 7 22 7.26863 22 7.6V16.4C22 16.7314 21.7314 17 21.4 17H2.6C2.26863 17 2 16.7314 2 16.4Z" stroke="currentColor" stroke-width="1.5"></path><path d="M5 10.01L5.01 9.99889" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 10.01L8.01 9.99889" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 10.01L11.01 9.99889" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 14.01L5.01 13.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 14.01L8.01 13.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 14.01L11.01 13.9989" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 14C18.1046 14 19 13.1046 19 12C19 10.8954 18.1046 10 17 10C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra17: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.03919 4.2939C3.01449 4.10866 3.0791 3.92338 3.23133 3.81499C3.9272 3.31953 6.3142 2 12 2C17.6858 2 20.0728 3.31952 20.7687 3.81499C20.9209 3.92338 20.9855 4.10866 20.9608 4.2939L19.2616 17.0378C19.0968 18.2744 18.3644 19.3632 17.2813 19.9821L16.9614 20.1649C13.8871 21.9217 10.1129 21.9217 7.03861 20.1649L6.71873 19.9821C5.6356 19.3632 4.90325 18.2744 4.73838 17.0378L3.03919 4.2939Z" stroke="currentColor" stroke-width="1.5"></path><path d="M3 5C5.57143 7.66666 18.4286 7.66662 21 5" stroke="currentColor" stroke-width="1.5"></path><path d="M4 13C5.03151 14.2034 7.92505 14.8638 11 14.981C12.3455 15.0323 13.7258 14.9796 15 14.823C17.2664 14.5443 19.1972 13.9366 20 13" stroke="currentColor" stroke-width="1.5"></path><path d="M4 13C6.28571 10.3333 17.7143 10.3334 20 13" stroke="currentColor" stroke-width="1.5"></path></svg>',
  extra18: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 8.5L9.8 9L2.35172 12.3856C2.13752 12.4829 2 12.6965 2 12.9318V13.0682C2 13.3035 2.13752 13.5171 2.35172 13.6144L11.1724 17.6238C11.6982 17.8628 12.3018 17.8628 12.8276 17.6238L21.6483 13.6144C21.8625 13.5171 22 13.3035 22 13.0682V12.9318C22 12.6965 21.8625 12.4829 21.6483 12.3856L14.2 9L13 8.5" stroke="currentColor" stroke-width="1.5"></path><path d="M22 13V17.112C22 17.3482 21.8615 17.5623 21.6462 17.6592L12.8207 21.6307C12.2988 21.8655 11.7012 21.8655 11.1793 21.6307L2.35378 17.6592C2.13847 17.5623 2 17.3482 2 17.112V13" stroke="currentColor" stroke-width="1.5"></path><path d="M12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 8V13C11 13.5523 11.4477 14 12 14V14C12.5523 14 13 13.5523 13 13V8" stroke="currentColor" stroke-width="1.5"></path><path d="M16 13H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra19: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 16L2 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 9V7C4 5.89543 4.89543 5 6 5L18 5C19.1046 5 20 5.89543 20 7V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 9C18.8954 9 18 9.89543 18 11V13H6V11C6 9.89543 5.10457 9 4 9C2.89543 9 2 9.89543 2 11V17H22V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 16L22 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra20: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22L12 14M12 10L12 14M12 14L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 18H7.5C4.46243 18 2 15.5376 2 12.5C2 9.46243 4.46243 7 7.5 7H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 18H16.5C19.5376 18 22 15.5376 22 12.5C22 9.63102 19.8033 7.27508 17 7.02246" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
  extra21: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19C7.20914 19 9 17.2091 9 15C9 12.7909 7.20914 11 5 11C2.79086 11 1 12.7909 1 15C1 17.2091 2.79086 19 5 19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.5 7.5L14.5 7.5M19 15L15 7.5L14.5 7.5M14.5 7.5L16.5 4.5M16.5 4.5L14 4.5M16.5 4.5L18.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 15L8.5 7.5L12 14L15 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.5 7.5C8.16667 6.5 7 4.5 5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19 19C21.2091 19 23 17.2091 23 15C23 12.7909 21.2091 11 19 11C16.7909 11 15 12.7909 15 15C15 17.2091 16.7909 19 19 19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
};

// =========================================================================
// PERSONALIZZAZIONE: fasce della giornata (righe del calendario), giorni
// mostrati (colonne) e icone che segnano i confini tra le fasce.
//
// Preset di default (nessuna personalizzazione salvata): 3 fasce fisse
// (mattina/pomeriggio/sera, orari asimmetrici pensati per una giornata tipo)
// con le 4 icone tematiche originali, 7 giorni — comportamento identico a
// sempre.
//
// Se l'utente personalizza (dal pannello nella dashboard, che genera un
// comando `configure-slots.py --apply` da incollare in terminale — oppure a
// mano da terminale con lo stesso script — condiviso con statusline.py via
// data/slot-config.json, vedi loadSlotConfig()), le fasce diventano un
// elenco esplicito di confini orari (`boundaries`, N+1 valori per N fasce,
// anche di durata diversa tra loro — es. una fascia notturna più lunga)
// invece della divisione equa di prima, con chiavi numeriche ("0".."N-1")
// al posto dei nomi mattina/pomeriggio/sera. Ogni confine ha un'icona
// derivata deterministicamente dalla propria ora (vedi defaultIconForHour),
// pescata dal pool DEFAULT_BOUNDARY_ICON_POOL qui sotto — nessun picker per
// sceglierla a mano nel pannello (per ora), ma un file scritto/editato a
// mano può comunque includere un campo "icons" esplicito che ha sempre la
// precedenza sul default automatico.
// =========================================================================
const DEFAULT_SLOT_KEYS = ['mattina', 'pomeriggio', 'sera'];
const DEFAULT_SLOT_BOUNDS = { mattina: { start: 0, end: 12 }, pomeriggio: { start: 12, end: 19 }, sera: { start: 19, end: 24 } };
const DEFAULT_BOUNDARY_ICON_KEYS = ['coffee', 'apple', 'pizza', 'bed'];
const DEFAULT_BOUNDARY_ICON_POOL = [
  'coffee', 'apple', 'pizza', 'bed', 'extra1', 'extra2', 'extra3', 'extra4', 'extra5', 'extra6', 'extra7', 'extra8',
  'extra9', 'extra10', 'extra11', 'extra12', 'extra13', 'extra14', 'extra15', 'extra16', 'extra17', 'extra18', 'extra19', 'extra20', 'extra21',
];
const DEFAULT_DAY_COUNT = 7;

let SLOT_KEYS = DEFAULT_SLOT_KEYS;
let SLOT_BOUNDS = DEFAULT_SLOT_BOUNDS;
let BOUNDARY_ICON_KEYS = DEFAULT_BOUNDARY_ICON_KEYS;
let DAY_COUNT = DEFAULT_DAY_COUNT;
let usingDefaultSlotPreset = true;

// icona di default per un confine, in base alla sua ora (0-24): con 25 icone
// nel pool e 25 ore intere possibili (0..24 inclusi), ogni ora ha un'icona
// distinta, senza collisioni tra primo e ultimo confine della giornata.
function defaultIconForHour(h) {
  return DEFAULT_BOUNDARY_ICON_POOL[Math.floor(h) % DEFAULT_BOUNDARY_ICON_POOL.length];
}

// costruisce fasce da un elenco esplicito di confini orari (cfg.boundaries,
// N+1 valori per N fasce, anche di durata diversa tra loro); slot_for_hour
// (qui e in statusline.py, dove la stessa logica è duplicata in Python)
// assegna ogni ora dentro [boundaries[0], boundaries[last]) allo slot
// corrispondente, e qualunque ora FUORI da quell'intervallo all'ultimo slot
// (stesso comportamento del preset di default, dove "sera" raccoglie anche
// l'eventuale notte fuori 0-24).
function buildSlotsFromConfig(cfg) {
  const b = cfg.boundaries;
  const n = b.length - 1;
  const keys = Array.from({ length: n }, (_, i) => String(i));
  const bounds = {};
  keys.forEach((key, i) => { bounds[key] = { start: b[i], end: b[i + 1] }; });
  const icons = b.map((h, i) => (cfg.icons && cfg.icons[i]) || defaultIconForHour(h));
  const dayCount = cfg.day_count || DEFAULT_DAY_COUNT;
  return { keys, bounds, icons, dayCount };
}

function isValidBoundaries(b) {
  if (!Array.isArray(b) || b.length < 2 || b.length > 13) return false;
  for (let i = 0; i < b.length; i++) {
    if (typeof b[i] !== 'number' || Number.isNaN(b[i])) return false;
    if (i > 0 && b[i] <= b[i - 1]) return false;
  }
  return true;
}

// data/slot-config.json non esiste finché non lanci `configure-slots.py` (stesso
// pattern di data/display-config.json per la scelta della statusline): in sua
// assenza si resta sul preset di default sopra, invariato.
async function loadSlotConfig() {
  try {
    const res = await fetch('data/slot-config.json?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg || !isValidBoundaries(cfg.boundaries)) return;
    const built = buildSlotsFromConfig(cfg);
    SLOT_KEYS = built.keys;
    SLOT_BOUNDS = built.bounds;
    BOUNDARY_ICON_KEYS = built.icons;
    DAY_COUNT = Math.max(1, Math.min(7, built.dayCount));
    usingDefaultSlotPreset = false;
  } catch (e) {
    // nessun file, o non valido: resta sul preset di default
  }
}
// =========================================================================

// traduzioni caricate da file esterni (i18n/it.js, i18n/en.js): per aggiungere
// una lingua basta un nuovo i18n/<lang>.js con lo stesso set di chiavi, più il
// suo <script> in fondo all'head e l'opzione nel lang-switch.
const STRINGS = window.I18N;
let T = STRINGS[LOCALE];

const POLL_MS = 5000;
const STALE_THRESHOLD_MS = 20 * 60 * 1000; // dati più vecchi di 20 min: statusline.py scrive solo con una sessione Claude Code interattiva attiva
const PLAN_KEY = 'claude-monitor-plan';
const PLAN_SLOT_SIGNATURE_KEY = 'claude-monitor-plan-slot-signature'; // config fasce sotto cui PLAN_KEY è stato scritto, vedi currentSlotSignature()
const NAMED_PLANS_KEY = 'claude-monitor-named-plans';
const MAX_SAVED_PLANS = 112; // come le settimane dell'anno
const THEME_KEY = 'claude-monitor-theme';
const TZ_KEY = 'claude-monitor-tz';
const HOUR12_KEY = 'claude-monitor-hour12';
const TIMEZONES = ['local', 'UTC', 'Europe/Rome', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Shanghai'];

let planDays = null; // costruito una volta noto resets_at
let planCompatStatus = 'compatible'; // 'compatible' | 'incompatible' | 'unknown' — vedi planIsCompatibleWith
let lastData = null; // ultimo state.json valido, per riformattare gli orari senza ripollare

// ora di ciascun confine, ricostruita da SLOT_BOUNDS: N fasce hanno N+1
// confini (l'inizio di ognuna + la fine dell'ultima), stessa lunghezza di
// BOUNDARY_ICON_KEYS.
function currentBoundaryHours() {
  const hours = SLOT_KEYS.map(k => SLOT_BOUNDS[k].start);
  hours.push(SLOT_BOUNDS[SLOT_KEYS[SLOT_KEYS.length - 1]].end);
  return hours;
}

// =========================================================================
// firma della configurazione fasce sotto cui un piano (corrente o nominato)
// è stato salvato: le chiavi weekday:slotKey usano SLOT_KEYS, che con due
// config diverse ma con lo stesso numero di fasce sarebbero identiche pur
// avendo orari diversi — per questo la firma porta gli orari grezzi
// (boundaries), non le chiavi derivate. Cambiare fasce/giorni senza questa
// firma faceva ricadere silenziosamente ogni slot sul default (vedi
// defaultActive), con rischio di sovrascrivere il piano vero: vedi
// planCompatStatus e persistPlanGuarded più sotto.
// =========================================================================
function currentSlotSignature() {
  return { boundaries: currentBoundaryHours(), day_count: DAY_COUNT };
}

function defaultSlotSignature() {
  const hours = DEFAULT_SLOT_KEYS.map(k => DEFAULT_SLOT_BOUNDS[k].start);
  hours.push(DEFAULT_SLOT_BOUNDS[DEFAULT_SLOT_KEYS[DEFAULT_SLOT_KEYS.length - 1]].end);
  return { boundaries: hours, day_count: DEFAULT_DAY_COUNT };
}

// day_count non entra nel confronto: non influenza le chiavi weekday:slotKey,
// solo quante colonne-giorno sono visibili.
function slotSignaturesCompatible(a, b) {
  if (!a || !b || a.boundaries.length !== b.boundaries.length) return false;
  return a.boundaries.every((h, i) => Math.abs(h - b.boundaries[i]) < 1e-9);
}

// dati salvati prima di questa fix non hanno una firma: se la config attiva
// ora è ancora il preset di default, per esclusione devono essere stati
// creati sotto quello stesso preset; se la config attiva è già custom, non
// c'è modo di saperlo (non inventiamo una firma per dati potenzialmente già
// scritti sotto un'altra config custom precedente).
function effectiveSignatureForCompatCheck(storedSignature) {
  if (storedSignature) return storedSignature;
  return usingDefaultSlotPreset ? defaultSlotSignature() : null;
}

// tri-stato di compatibilità di una firma salvata rispetto a una firma
// target (la config attiva ora, oppure una config candidata non ancora
// applicata quando si valuta il pannello di personalizzazione).
function planIsCompatibleWith(storedSignature, targetSignature) {
  const effective = effectiveSignatureForCompatCheck(storedSignature);
  if (!effective) return 'unknown';
  return slotSignaturesCompatible(effective, targetSignature) ? 'compatible' : 'incompatible';
}

function loadPlanSlotSignature() {
  try { return JSON.parse(localStorage.getItem(PLAN_SLOT_SIGNATURE_KEY) || 'null'); }
  catch (e) { return null; }
}
function savePlanSlotSignature(sig) {
  localStorage.setItem(PLAN_SLOT_SIGNATURE_KEY, JSON.stringify(sig));
}

function buildExplanationHTML() {
  const boundaryHours = currentBoundaryHours();
  // sul preset di default le 4 icone hanno un'etichetta testuale fissa
  // (sveglia/pranzo/cena/a nanna); su una configurazione personalizzata,
  // dove le etichette fisse non hanno più senso per un numero qualunque di
  // confini, si mostra l'orario del confine al loro posto — autoesplicativo,
  // nessuna nuova chiave i18n necessaria.
  const boundaryLine = BOUNDARY_ICON_KEYS.map((iconKey, i) => {
    const caption = usingDefaultSlotPreset ? (T.boundaryLabels[i] || '') : hourLabel(boundaryHours[i]);
    return caption + ' <span class="inline-icon">' + ICONS[iconKey] + '</span>';
  }).join(' · ');
  return '<p>' + T.explanation + '</p>' +
    '<p>' + T.boundaryIntro + ' ' + boundaryLine + '.</p>' +
    '<p>' + T.planSaved + ' (<a href="cookies.html">' + T.planSavedDetails + '</a>)' + T.planSavedRest + '</p>';
}

function applyStrings() {
  document.documentElement.lang = LOCALE;
  document.title = T.title;
  document.getElementById('title').textContent = T.title;
  document.getElementById('tagline').textContent = T.tagline;
  document.getElementById('lbl-session').textContent = T.session;
  document.getElementById('lbl-week').textContent = T.week;
  document.getElementById('lbl-week-reset').textContent = T.weekReset;
  document.getElementById('lbl-session-reset').textContent = T.sessionReset;
  document.getElementById('lbl-threshold').textContent = T.threshold;
  document.getElementById('lbl-plan-target-slot').textContent = T.planTargetSlot;
  document.getElementById('lbl-plan-target-day').textContent = T.planTargetDay;
  document.getElementById('lbl-legend-plan').textContent = T.legendPlan;
  document.getElementById('lbl-legend-log').textContent = T.legendLog;
  document.getElementById('lbl-legend-under').textContent = T.legendUnder;
  document.getElementById('lbl-legend-over').textContent = T.legendOver;
  document.getElementById('reset-plan').textContent = T.resetPlan;
  document.getElementById('plan-name').placeholder = T.planNamePlaceholder;
  document.getElementById('save-plan').textContent = T.savePlan;
  document.getElementById('explanation').innerHTML = buildExplanationHTML();
  document.getElementById('icon-sun').innerHTML = ICONS.sun;
  document.getElementById('icon-moon').innerHTML = ICONS.moon;
  document.getElementById('icon-globe').innerHTML = ICONS.globe;
  document.getElementById('lbl-privacy-link2').textContent = T.privacyLink;
  document.getElementById('lbl-storage-link2').textContent = T.storageLink;
  document.getElementById('lbl-saved-plans-link').textContent = T.savedPlansLink;
  document.getElementById('lbl-icons-credit').innerHTML = T.iconsCreditPrefix +
    '<a href="https://iconoir.com/" target="_blank" rel="noopener">iconoir.com</a> &amp; ' +
    '<a href="https://lucide.dev/" target="_blank" rel="noopener">lucide.dev</a>';
  document.getElementById('lbl-made-with').innerHTML = T.madeWithPrefix +
    '<a href="https://short.masterismi.com/sitoistituzionale" target="_blank" rel="noopener">masterismi.com</a>' +
    T.madeWithSuffix;
  setStreamBanner(streamState);

  document.getElementById('customize-title').textContent = T.customizeTitle;
  document.getElementById('customize-intro').textContent = T.customizeIntro;
  document.getElementById('customize-day-count-label').textContent = T.customizeDayCountLabel;
  document.getElementById('customize-boundaries-label').textContent = T.customizeBoundariesLabel;
  document.getElementById('customize-add-boundary').textContent = T.customizeAddBoundary;
  document.getElementById('customize-warning').textContent = T.customizeWarning;
  document.getElementById('customize-generate').textContent = T.customizeGenerate;
  document.getElementById('customize-close').textContent = T.customizeClose;
  document.getElementById('customize-copy').textContent = T.customizeCopy;
  document.getElementById('customize-result-intro').textContent = T.customizeResultIntro;

  document.getElementById('plan-compat-regenerate').textContent = T.planCompatRegenerate;
  document.getElementById('plan-compat-adopt').textContent = T.planCompatAdopt;

  document.getElementById('plan-conflict-title').textContent = T.planConflictTitle;
  document.getElementById('plan-conflict-regenerate').textContent = T.planConflictRegenerate;
  document.getElementById('plan-conflict-cancel').textContent = T.planConflictCancel;
}

let streamState = 'disconnected';
let lastScriptDir = null;
let lastRaw = null; // ultimo state.json letto, anche se non "ok"

// 'connected': dati freschi; 'nolimits': l'hook viene chiamato ma Claude Code non
// manda rate_limits (CLI non loggata / nessun messaggio inviato); 'disconnected':
// nessuna chiamata all'hook da più di STALE_THRESHOLD_MS
function computeStreamState() {
  const d = lastRaw;
  if (!d) return 'disconnected';
  const now = Date.now();
  const hookAt = (d.hook_at || d.updated_at || 0) * 1000;
  if (d.status === 'ok' && now - d.updated_at * 1000 <= STALE_THRESHOLD_MS) return 'connected';
  if (now - hookAt <= STALE_THRESHOLD_MS) return 'nolimits';
  return 'disconnected';
}

function setStreamBanner(state) {
  streamState = state;
  const banner = document.getElementById('stream-banner');
  banner.classList.toggle('connected', state === 'connected');
  banner.classList.toggle('disconnected', state !== 'connected');
  const title = { connected: T.streamConnected, nolimits: T.streamNoLimits, disconnected: T.streamDisconnected }[state];
  document.getElementById('stream-banner-title').textContent = title;
  const cmd = lastScriptDir
    ? "cd '" + lastScriptDir + "' && python3 install-statusline.py"
    : 'python3 install-statusline.py';
  document.getElementById('stream-banner-cmd').innerHTML =
    '<p>' + T.streamStep1 + ' ' + copyableCode(cmd) + '</p>' +
    '<p>' + T.streamStep2Prefix + copyableCode('claude') + T.streamStep2Suffix + '</p>';
}

const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

function copyableCode(text) {
  return '<span class="copyable"><code>' + escapeHTML(text) + '</code>' +
    '<button type="button" class="copy-btn" data-copy="' + escapeHTML(text) + '" title="' + escapeHTML(T.copy) +
    '" aria-label="' + escapeHTML(T.copy) + '">' + COPY_ICON + '</button></span>';
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // clipboard API assente fuori da un contesto sicuro (es. http su IP di rete)
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  await copyText(btn.dataset.copy);
  btn.innerHTML = CHECK_ICON;
  btn.title = T.copied;
  setTimeout(() => { btn.innerHTML = COPY_ICON; btn.title = T.copy; }, 1500);
});

function parseResetDate(str) {
  // formato "dd/mm/yyyy HH:MM"
  const [datePart, timePart] = str.split(' ');
  const [dd, mm, yyyy] = datePart.split('/').map(Number);
  const [HH, MI] = timePart.split(':').map(Number);
  return new Date(yyyy, mm - 1, dd, HH, MI, 0);
}

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoDateLocal(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function computeDisplayDays(resetsAt, dayCount) {
  const windowStart = new Date(resetsAt.getTime() - 7 * 86400 * 1000);
  let startDate;
  if (windowStart.getHours() < 11) {
    startDate = dateOnly(windowStart);
  } else {
    startDate = new Date(dateOnly(windowStart).getTime() + 86400 * 1000);
  }
  const result = [];
  for (let offset = 0; offset < dayCount; offset++) {
    result.push(new Date(startDate.getTime() + offset * 86400 * 1000));
  }
  return result;
}

function loadPlan() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  // choke point unico: qualunque scrittura di PLAN_KEY resta sincronizzata
  // con la config fasce attiva in quel momento, senza doverci pensare ad
  // ogni call site.
  savePlanSlotSignature(currentSlotSignature());
}

function loadNamedPlans() {
  try {
    return JSON.parse(localStorage.getItem(NAMED_PLANS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveNamedPlans(named) {
  localStorage.setItem(NAMED_PLANS_KEY, JSON.stringify(named));
}

// i piani nominati salvati prima dell'introduzione di savedAt sono ancora lo
// snapshot "nudo" ({"weekday:slotKey": bool}); quelli nuovi sono avvolti in
// {snapshot, savedAt}. Questi due accessor normalizzano entrambi i formati,
// così il resto del codice (qui e in saved-plans.js) non deve distinguerli.
function planEntrySnapshot(entry) {
  return entry && typeof entry === 'object' && entry.snapshot ? entry.snapshot : entry;
}
function planEntrySavedAt(entry) {
  return entry && typeof entry === 'object' && entry.savedAt ? entry.savedAt : null;
}
function planEntrySlotSignature(entry) {
  return entry && typeof entry === 'object' && entry.slotSignature ? entry.slotSignature : null;
}
function lastSavedPlanName(named) {
  let best = null;
  let bestTime = -Infinity;
  Object.keys(named).forEach(name => {
    const savedAt = planEntrySavedAt(named[name]);
    if (!savedAt) return;
    const t = new Date(savedAt).getTime();
    if (t > bestTime) { bestTime = t; best = name; }
  });
  return best;
}

// le chiavi di piano usano il numero del giorno (0-6, come Date.getDay()) e non
// l'abbreviazione localizzata, così il piano salvato non dipende dalla lingua.
function defaultActive(weekdayNum, key) {
  if (weekdayNum === 0 || weekdayNum === 6) return false; // domenica, sabato
  return SLOT_KEYS.indexOf(key) < 2; // le prime due fasce del giorno sono attive di default
}

function buildDayModel(dates, plan) {
  return dates.map(d => {
    const weekdayNum = d.getDay();
    const slots = SLOT_KEYS.map(key => {
      const planKey = weekdayNum + ':' + key;
      const active = Object.prototype.hasOwnProperty.call(plan, planKey) ? plan[planKey] : defaultActive(weekdayNum, key);
      return { key, active };
    });
    return { date: d, weekdayNum, slots };
  });
}

function persistPlan(days) {
  const plan = {};
  days.forEach(day => {
    day.slots.forEach(slot => { plan[day.weekdayNum + ':' + slot.key] = slot.active; });
  });
  savePlan(plan);
}

// il piano a schermo può essere un fallback ai default dovuto a un mismatch
// tra la config fasce con cui PLAN_KEY fu salvato e quella attiva ora (vedi
// planCompatStatus): in quel caso NON è il piano reale dell'utente per
// questa config, quindi non va persistito — altrimenti il primo click su
// una tile sovrascriverebbe per sempre il piano vero con dei default.
function persistPlanGuarded(days) {
  if (planCompatStatus !== 'compatible') {
    renderPlanCompatBanner();
    return;
  }
  persistPlan(days);
}

function planSnapshot(days) {
  const plan = {};
  days.forEach(day => {
    day.slots.forEach(slot => { plan[day.weekdayNum + ':' + slot.key] = slot.active; });
  });
  return plan;
}

function flatten(days) {
  const tiles = [];
  days.forEach((day, dayIdx) => {
    day.slots.forEach((slot, slotIdx) => tiles.push({ day, dayIdx, slot, slotIdx }));
  });
  return tiles;
}

function computePlanTargets(days, now) {
  const all = flatten(days);
  const total = all.filter(t => t.slot.active).length;
  const weight = total > 0 ? 100 / total : 0;
  const today = dateOnly(now);
  const nowHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  let targetDay = 0;
  let targetSlot = 0;
  let currentTile = null;
  let counter = 0;
  const numbering = new Map(); // "dayIdx:slotKey" -> numero progressivo

  for (const t of all) {
    if (t.slot.active) {
      counter++;
      numbering.set(t.dayIdx + ':' + t.slot.key, counter);
    }
    const tDate = dateOnly(t.day.date);
    if (tDate.getTime() < today.getTime()) {
      if (t.slot.active) { targetDay += weight; targetSlot += weight; }
    } else if (tDate.getTime() === today.getTime()) {
      if (t.slot.active) targetDay += weight;
      const b = SLOT_BOUNDS[t.slot.key];
      if (nowHour >= b.start) {
        if (t.slot.active) targetSlot += weight;
      }
      if (nowHour >= b.start && nowHour < b.end) {
        const fraction = (nowHour - b.start) / (b.end - b.start);
        currentTile = { dayIdx: t.dayIdx, slotKey: t.slot.key, fraction, start: b.start, end: b.end };
      }
    }
  }
  return { total, weight, targetDay, targetSlot, currentTile, numbering };
}

function renderPlan() {
  if (!planDays) return;
  const now = new Date();
  const { targetDay, targetSlot, weight, currentTile, numbering } = computePlanTargets(planDays, now);

  document.getElementById('plan-target-slot').textContent = targetSlot.toFixed(0) + '%';
  document.getElementById('plan-target-day').textContent = targetDay.toFixed(0) + '%';

  // "soglia attuale" dipende dal piano: confronta l'uso reale con la soglia di fine slot
  // (non con la quota fissa del backend), così cambia in base a quanti slot hai pianificato.
  const usedPct = (lastData && lastData.status === 'ok') ? lastData.used_pct : null;
  const overPace = usedPct !== null ? usedPct > targetSlot : null;
  const thresholdEl = document.getElementById('threshold');
  const thresholdRow = document.getElementById('threshold-row');
  if (usedPct !== null) {
    const diff = usedPct - targetSlot;
    const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(0) + '%';
    thresholdEl.textContent = diffStr + ' ' + (overPace ? T.overLimit : T.underLimit);
    thresholdRow.classList.toggle('over', overPace);
    thresholdRow.classList.toggle('under', !overPace);
  } else {
    thresholdEl.textContent = '--';
    thresholdRow.classList.remove('over', 'under');
  }

  // righe più basse quando le fasce sono di più (fino a 12): rimane leggibile
  // sia col preset di default (3 fasce, 46px) sia con configurazioni più fitte.
  const tileHeight = Math.max(24, 46 - (SLOT_KEYS.length - 3) * 2);
  document.documentElement.style.setProperty('--tile-h', tileHeight + 'px');
  document.documentElement.style.setProperty('--day-count', DAY_COUNT);

  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  // riga di intestazione: 7 giorni, dalla colonna 2 in poi (la colonna 1 è
  // riservata all'asse delle icone, vedi sotto)
  planDays.forEach((day, dayIdx) => {
    const head = document.createElement('div');
    head.className = 'daycol-head';
    head.style.gridColumn = String(dayIdx + 2);
    head.style.gridRow = '1';
    head.innerHTML = '<div class="dow">' + T.dow[day.weekdayNum] + '</div><div class="date">' +
      String(day.date.getDate()).padStart(2, '0') + '/' + String(day.date.getMonth() + 1).padStart(2, '0') + '</div>';
    grid.appendChild(head);
  });

  // bottone rotondo "personalizza": una vera colonna finale del grid (non un
  // overlay assoluto — questa codebase non ha breakpoint responsive, quindi
  // un posizionamento assoluto "appena fuori" dalla griglia rischierebbe
  // clipping su viewport stretti). Va ricreato ad ogni renderPlan() perché
  // grid.innerHTML viene svuotato sopra, come già per il resto della griglia.
  const customizeBtn = document.createElement('button');
  customizeBtn.type = 'button';
  customizeBtn.className = 'customize-btn';
  customizeBtn.style.gridColumn = String(DAY_COUNT + 2);
  customizeBtn.style.gridRow = '1';
  customizeBtn.title = T.customizeTitle;
  customizeBtn.setAttribute('aria-label', T.customizeTitle);
  customizeBtn.innerHTML = ICONS.extra16; // forma a cursori/equalizzatore, usata come icona "impostazioni"
  customizeBtn.addEventListener('click', () => openCustomizeDialog());
  grid.appendChild(customizeBtn);

  // asse verticale: colonna 1 del grid, subgrid sulle righe delle fasce (righe 2..N+1)
  // così eredita esattamente le stesse linee di riga del grid principale — nessun
  // offset o altezza calcolati a mano. Ogni icona è posizionata sul *confine* tra le
  // fasce (non al centro di una fascia): le prime SLOT_KEYS.length sull'inizio della
  // propria riga (allineate al bordo superiore), l'ultima sulla fine dell'ultima riga.
  const axis = document.createElement('div');
  axis.className = 'axis-cell';
  axis.style.gridColumn = '1';
  axis.style.gridRow = '2 / span ' + SLOT_KEYS.length;
  BOUNDARY_ICON_KEYS.forEach((key, i) => {
    const icon = document.createElement('div');
    icon.className = 'axis-icon';
    icon.innerHTML = ICONS[key];
    icon.style.gridColumn = '1'; // esplicito: l'ultima icona condivide la riga della penultima
    // (entrambe ai due bordi dell'ultima fascia), senza questo l'auto-placement le
    // metterebbe in colonne diverse pensando che si sovrappongano
    if (i < SLOT_KEYS.length) {
      icon.style.gridRow = String(i + 1);
      icon.style.alignSelf = 'start';
      icon.style.transform = 'translateY(-50%)';
    } else {
      icon.style.gridRow = String(SLOT_KEYS.length);
      icon.style.alignSelf = 'end';
      icon.style.transform = 'translateY(50%)';
    }
    axis.appendChild(icon);
  });
  grid.appendChild(axis);

  for (let row = 0; row < SLOT_KEYS.length; row++) {
    planDays.forEach((day, dayIdx) => {
      const slot = day.slots[row];
      const cell = document.createElement('div');
      const workedKey = isoDateLocal(day.date) + ':' + slot.key;
      const worked = !!(lastData && lastData.worked_slots && lastData.worked_slots[workedKey]);
      cell.className = 'tile ' + (slot.active ? 'active' : 'inactive') + (worked ? ' worked' : '');
      cell.style.gridColumn = String(dayIdx + 2);
      cell.style.gridRow = String(row + 2);
      const num = numbering.get(dayIdx + ':' + slot.key);
      cell.textContent = slot.active ? String(num) : '–';
      cell.title = (slot.active ? T.deactivate : T.activate);

      cell.addEventListener('click', () => {
        slot.active = !slot.active;
        persistPlanGuarded(planDays);
        renderPlan();
      });

      const isCurrent = currentTile && currentTile.dayIdx === dayIdx && currentTile.slotKey === slot.key;
      if (isCurrent) {
        cell.classList.add('current', overPace ? 'over' : 'under');
        const marker = document.createElement('div');
        marker.className = 'now-marker' + (overPace ? ' over' : '');
        marker.style.left = (currentTile.fraction * 100) + '%';
        marker.title = formatTime(now) + ' — ' + hourLabel(currentTile.start) + '–' + hourLabel(currentTile.end);
        cell.appendChild(marker);
      }

      grid.appendChild(cell);
    });
  }

  // riga finale: quota della settimana rappresentata da ciascun giorno, calcolata
  // sugli slot attivi di quel giorno (non sul tempo trascorso, a differenza di
  // "soglia di fine giornata" che riguarda solo oggi).
  const footerRow = SLOT_KEYS.length + 2;
  planDays.forEach((day, dayIdx) => {
    const activeCount = day.slots.filter(s => s.active).length;
    const dayShare = activeCount * weight;
    const foot = document.createElement('div');
    foot.className = 'daycol-target';
    foot.style.gridColumn = String(dayIdx + 2);
    foot.style.gridRow = String(footerRow);
    foot.textContent = dayShare.toFixed(0) + '%';
    grid.appendChild(foot);
  });
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function refreshLoadSelect() {
  const select = document.getElementById('load-plan');
  const named = loadNamedPlans();
  const names = Object.keys(named).sort();
  select.innerHTML = '<option value="">' + T.loadPlanDefault + '</option>' +
    names.map(n => '<option value="' + escapeHTML(n) + '">' + escapeHTML(n) + '</option>').join('');
  // all'apertura, mostra subito quale piano è stato salvato per ultimo (senza
  // applicarlo al piano corrente: è solo un'indicazione, il piano a schermo
  // resta quello che era già attivo, letto da PLAN_KEY come sempre)
  const last = lastSavedPlanName(named);
  if (last) select.value = last;
  lastLoadSelectValue = select.value;
}

function setupPlanToolbar() {
  document.getElementById('reset-plan').addEventListener('click', () => {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(PLAN_SLOT_SIGNATURE_KEY);
    if (planDays) {
      planDays.forEach(day => day.slots.forEach(slot => { slot.active = defaultActive(day.weekdayNum, slot.key); }));
      persistPlan(planDays); // azione esplicita e intenzionale: il risultato è per definizione coerente con la config attiva
      planCompatStatus = 'compatible';
      renderPlanCompatBanner();
    }
    renderPlan();
  });

  document.getElementById('save-plan').addEventListener('click', () => {
    const input = document.getElementById('plan-name');
    const name = input.value.trim();
    if (!name || !planDays) return;
    const named = loadNamedPlans();
    if (!Object.prototype.hasOwnProperty.call(named, name) && Object.keys(named).length >= MAX_SAVED_PLANS) {
      alert(T.maxPlansReached);
      return;
    }
    named[name] = { snapshot: planSnapshot(planDays), savedAt: new Date().toISOString(), slotSignature: currentSlotSignature() };
    saveNamedPlans(named);
    refreshLoadSelect();
    document.getElementById('load-plan').value = name;
    lastLoadSelectValue = name;
    input.value = '';
  });

  document.getElementById('load-plan').addEventListener('change', e => {
    const name = e.target.value;
    if (!name || !planDays) return;
    const named = loadNamedPlans();
    const entry = named[name];
    const snapshot = planEntrySnapshot(entry);
    if (!snapshot) return;

    const namedCompat = planIsCompatibleWith(planEntrySlotSignature(entry), currentSlotSignature());
    const currentUnsaved = planCompatStatus !== 'compatible';
    if (namedCompat !== 'compatible' || currentUnsaved) {
      openPlanConflictDialog(name, entry, namedCompat, currentUnsaved);
      return; // non tocca planDays/PLAN_KEY finché l'utente non sceglie nel dialog
    }
    applyNamedPlan(name, entry);
  });

  refreshLoadSelect();
}

// valore mostrato dalla <select> "load-plan" prima di un tentativo di
// caricamento: usato per riportarla lì se l'utente annulla dal dialog di
// conflitto (vedi openPlanConflictDialog), invece di lasciarla sul nome che
// non è stato effettivamente caricato.
let lastLoadSelectValue = '';

function applyNamedPlan(name, entry) {
  const snapshot = planEntrySnapshot(entry);
  planDays.forEach(day => day.slots.forEach(slot => {
    const key = day.weekdayNum + ':' + slot.key;
    slot.active = Object.prototype.hasOwnProperty.call(snapshot, key) ? snapshot[key] : defaultActive(day.weekdayNum, slot.key);
  }));
  persistPlan(planDays); // sicuro qui: il piano applicato è per definizione coerente con la config attiva
  lastLoadSelectValue = name;
  planCompatStatus = 'compatible';
  renderPlanCompatBanner();
  renderPlan();
}

// --- banner "piano non salvato per questa configurazione": visibile finché
// planCompatStatus non è 'compatible' (vedi persistPlanGuarded). Non è un
// <dialog> perché non deve bloccare l'uso della pagina: l'utente può
// continuare a guardare i numeri, solo senza poterli salvare finché non
// risolve. ---
function renderPlanCompatBanner() {
  const banner = document.getElementById('plan-compat-banner');
  if (planCompatStatus === 'compatible') { banner.hidden = true; return; }
  banner.hidden = false;
  document.getElementById('plan-compat-banner-title').textContent = T.planCompatBannerTitle;
  document.getElementById('plan-compat-banner-body').textContent =
    planCompatStatus === 'unknown' ? T.planCompatBannerUnknownBody : T.planCompatBannerBody;
  // "Rigenera comando" ha senso solo se conosciamo gli orari originali: in
  // stato 'unknown' (dati legacy sotto una config custom precedente) non
  // c'è nulla da cui ripartire.
  document.getElementById('plan-compat-regenerate').hidden = planCompatStatus === 'unknown';
}

function setupPlanCompatBanner() {
  document.getElementById('plan-compat-regenerate').addEventListener('click', () => {
    const target = effectiveSignatureForCompatCheck(loadPlanSlotSignature());
    if (!target) return;
    openCustomizeDialog(target);
    generateCustomizeCommand();
  });
  document.getElementById('plan-compat-adopt').addEventListener('click', () => {
    if (!confirm(T.planCompatAdoptConfirm)) return;
    persistPlan(planDays); // bypass intenzionale del guard: azione esplicita dell'utente
    planCompatStatus = 'compatible';
    renderPlanCompatBanner();
  });
}

// --- dialog di conflitto al caricamento di un piano nominato incompatibile
// con la config attiva (o quando il piano corrente a schermo non è ancora
// salvato per questa config): propone di rigenerare il comando per tornare
// alla config originale, oppure di annullare senza toccare nulla — mai un
// fallback silenzioso ai default. ---
function openPlanConflictDialog(name, entry, namedCompat, currentUnsaved) {
  const namedPrefix = namedCompat === 'unknown' ? T.planConflictNamedUnknownBodyPrefix : T.planConflictNamedBodyPrefix;
  const namedMiddle = namedCompat === 'unknown' ? T.planConflictNamedUnknownBodyMiddle : T.planConflictNamedBodyMiddle;
  document.getElementById('plan-conflict-body-named').textContent = namedPrefix + name + namedMiddle;

  const currentBody = document.getElementById('plan-conflict-body-current');
  currentBody.hidden = !currentUnsaved;
  if (currentUnsaved) currentBody.textContent = T.planConflictCurrentUnsavedBody;

  const namedSignature = effectiveSignatureForCompatCheck(planEntrySlotSignature(entry));
  const dialog = document.getElementById('plan-conflict-dialog');
  const regenerateBtn = document.getElementById('plan-conflict-regenerate');
  regenerateBtn.hidden = namedCompat === 'compatible' || !namedSignature;
  regenerateBtn.onclick = () => {
    dialog.close();
    document.getElementById('load-plan').value = lastLoadSelectValue; // il piano nominato non è stato caricato, solo la sua config riproposta
    openCustomizeDialog(namedSignature);
    generateCustomizeCommand();
  };

  dialog.showModal();
}

function setupPlanConflictDialog() {
  const dialog = document.getElementById('plan-conflict-dialog');
  dialog.querySelector('form').addEventListener('submit', e => e.preventDefault());
  // la select torna sempre al valore precedente su ogni via d'uscita che non
  // carica davvero il piano nominato: bottone Annulla, e il tasto Esc nativo
  // del <dialog> (evento 'cancel', distinto da 'close' — quest'ultimo non è
  // stato affidabile in tutti i contesti, quindi si agisce esplicitamente
  // sui due trigger invece di delegare a 'close').
  const revert = () => { document.getElementById('load-plan').value = lastLoadSelectValue; };
  document.getElementById('plan-conflict-cancel').addEventListener('click', () => { dialog.close(); revert(); });
  dialog.addEventListener('cancel', revert);
}

// --- personalizzazione fasce/giorni: il pannello non scrive nulla da solo,
// genera un comando `configure-slots.py --apply '<json>'` da incollare in
// terminale una tantum — mantiene web e statusline.py sincronizzati sullo
// stesso data/slot-config.json, come già oggi per il flusso interattivo. ---
let customizeBoundaries = []; // stato di lavoro del pannello, aperto = copia di currentBoundaryHours()

function renderCustomizeBoundaries() {
  const container = document.getElementById('customize-boundaries');
  container.innerHTML = '';
  customizeBoundaries.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'customize-boundary-row';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '24';
    input.step = '0.25';
    input.value = h;
    input.addEventListener('change', () => {
      const v = parseFloat(input.value);
      if (!Number.isNaN(v)) customizeBoundaries[i] = v;
      refreshCustomizeAffectedWarning();
    });
    row.appendChild(input);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'customize-remove-btn';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', T.customizeRemoveBoundary);
    removeBtn.disabled = customizeBoundaries.length <= 2;
    removeBtn.addEventListener('click', () => {
      if (customizeBoundaries.length <= 2) return;
      customizeBoundaries.splice(i, 1);
      renderCustomizeBoundaries();
    });
    row.appendChild(removeBtn);
    container.appendChild(row);
  });
  refreshCustomizeAffectedWarning();
}

// seedSignature: se presente, precompila il pannello con una config diversa
// da quella attiva ora (es. la config sotto cui un piano incompatibile fu
// salvato, per rigenerare il comando che la ripristina — vedi
// openPlanConflictDialog/renderPlanCompatBanner). Senza, si parte dalla
// config attualmente in uso, come sempre.
function openCustomizeDialog(seedSignature) {
  const sig = seedSignature || currentSlotSignature();
  customizeBoundaries = sig.boundaries.slice();
  document.getElementById('customize-day-count').value = sig.day_count;
  renderCustomizeBoundaries();
  document.getElementById('customize-error').hidden = true;
  document.getElementById('customize-result').hidden = true;
  document.getElementById('customize-dialog').showModal();
}

// quanti piani salvati (corrente + nominati) diventerebbero incompatibili
// con una firma candidata — mostrato dal vivo nel pannello di
// personalizzazione, PRIMA di generare il comando (vedi
// refreshCustomizeAffectedWarning).
function countAffectedPlans(candidateSignature) {
  let affected = 0;
  if (Object.keys(loadPlan()).length > 0 &&
      planIsCompatibleWith(loadPlanSlotSignature(), candidateSignature) !== 'compatible') {
    affected++;
  }
  const named = loadNamedPlans();
  Object.keys(named).forEach(name => {
    if (planIsCompatibleWith(planEntrySlotSignature(named[name]), candidateSignature) !== 'compatible') affected++;
  });
  return affected;
}

function refreshCustomizeAffectedWarning() {
  const el = document.getElementById('customize-affected-plans');
  const candidate = { boundaries: customizeBoundaries, day_count: DAY_COUNT }; // day_count non entra nel confronto di compatibilità
  const n = countAffectedPlans(candidate);
  el.hidden = n === 0;
  if (n > 0) el.textContent = T.customizeAffectedPlansPrefix + n + T.customizeAffectedPlansMiddle;
}

function generateCustomizeCommand() {
  const dayCount = parseInt(document.getElementById('customize-day-count').value, 10);
  const errorEl = document.getElementById('customize-error');
  const resultEl = document.getElementById('customize-result');

  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 7) {
    errorEl.textContent = T.customizeErrorDayCount;
    errorEl.hidden = false;
    resultEl.hidden = true;
    return;
  }
  if (!isValidBoundaries(customizeBoundaries) || customizeBoundaries[0] < 0 ||
      customizeBoundaries[customizeBoundaries.length - 1] > 24) {
    errorEl.textContent = T.customizeErrorBoundaries;
    errorEl.hidden = false;
    resultEl.hidden = true;
    return;
  }
  errorEl.hidden = true;
  const cfg = { boundaries: customizeBoundaries.slice(), day_count: dayCount };
  const command = "python3 configure-slots.py --apply '" + JSON.stringify(cfg) + "'";
  document.getElementById('customize-command').textContent = command;
  resultEl.hidden = false;
}

function setupCustomizeDialog() {
  const dialog = document.getElementById('customize-dialog');
  // niente submit nativo del <form> (rischierebbe di ricaricare la pagina
  // premendo Invio in un campo numerico): solo bottoni con azioni JS proprie.
  dialog.querySelector('form').addEventListener('submit', e => e.preventDefault());
  document.getElementById('customize-add-boundary').addEventListener('click', () => {
    if (customizeBoundaries.length >= 13) return;
    const last = customizeBoundaries[customizeBoundaries.length - 1];
    customizeBoundaries.push(Math.min(24, last + 1));
    renderCustomizeBoundaries();
  });
  document.getElementById('customize-generate').addEventListener('click', generateCustomizeCommand);
  document.getElementById('customize-close').addEventListener('click', () => dialog.close());
  document.getElementById('customize-copy').addEventListener('click', () => {
    const text = document.getElementById('customize-command').textContent;
    const btn = document.getElementById('customize-copy');
    navigator.clipboard.writeText(text).then(() => {
      const original = T.customizeCopy;
      btn.textContent = T.customizeCopied;
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  });
}

// --- banner informativo su local storage (non cookie) ---
const CONSENT_KEY = 'claude-monitor-consent-ack';
function refreshConsentText() {
  document.getElementById('consent-text').innerHTML = T.consentText;
}
function setupConsentBanner() {
  refreshConsentText();
  const banner = document.getElementById('consent-banner');
  if (!localStorage.getItem(CONSENT_KEY)) {
    banner.hidden = false;
  }
  document.getElementById('consent-ok').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, '1');
    banner.hidden = true;
  });
}

// --- lingua IT/EN: pill con le due lingue cliccabili separatamente (stile orco.it) ---
function updateLangSwitchUI() {
  document.getElementById('lang-opt-it').classList.toggle('active', LOCALE === 'it');
  document.getElementById('lang-opt-en').classList.toggle('active', LOCALE === 'en');
}
function setLocale(lang) {
  LOCALE = lang;
  localStorage.setItem(LANG_KEY, lang);
  T = STRINGS[LOCALE];
  applyStrings();
  renderPlanCompatBanner(); // il banner (se visibile) mostra testo da T, non ricostruito da applyStrings
  refreshLoadSelect();
  renderTzOptions();
  refreshFormatUI();
  refreshConsentText();
  updateLangSwitchUI();
  if (lastData) render(lastData);
}
function setupLangSwitch() {
  document.getElementById('lang-opt-it').addEventListener('click', () => setLocale('it'));
  document.getElementById('lang-opt-en').addEventListener('click', () => setLocale('en'));
  updateLangSwitchUI();
}

// --- tema chiaro/scuro ---
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function effectiveTheme() {
  return localStorage.getItem(THEME_KEY) || (systemPrefersDark() ? 'dark' : 'light');
}
function applyTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const knob = document.getElementById('theme-knob');
  knob.style.transform = effectiveTheme() === 'dark' ? 'translateX(24px)' : 'translateX(0)';
}
function setupThemeSwitch() {
  document.getElementById('theme-switch').addEventListener('click', () => {
    localStorage.setItem(THEME_KEY, effectiveTheme() === 'dark' ? 'light' : 'dark');
    applyTheme();
  });
  applyTheme();
}

// --- fuso orario e formato ora ---
function getTz() { return localStorage.getItem(TZ_KEY) || 'local'; }
function getHour12() { return localStorage.getItem(HOUR12_KEY) === '1'; }

function formatDateTime(date) {
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: getHour12() };
  const tz = getTz();
  if (tz !== 'local') opts.timeZone = tz;
  return date.toLocaleString(T.localeCode, opts);
}
function formatTime(date) {
  const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: getHour12() };
  const tz = getTz();
  if (tz !== 'local') opts.timeZone = tz;
  return date.toLocaleTimeString(T.localeCode, opts);
}
function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return hours + T.hourUnit + ' ' + minutes + T.minuteUnit;
  return minutes + T.minuteUnit;
}
// formatta un'ora astratta di confine slot (0-24, non legata a una data/tz
// precisa) rispettando il toggle 24h/AM-PM già in pagina.
function hourLabel(h) {
  const totalMinutes = Math.round((((h % 24) + 24) % 24) * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  if (getHour12()) {
    const period = hh < 12 ? 'AM' : 'PM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + ':' + String(mm).padStart(2, '0') + ' ' + period;
  }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function updateTimeDisplays() {
  if (!lastData || lastData.status !== 'ok') {
    setStreamBanner(computeStreamState());
    return;
  }
  const now = Date.now();

  const weekResetDate = parseResetDate(lastData.reset_date);
  const daysLeft = Math.max(0, Math.ceil((weekResetDate.getTime() - now) / 86400000));
  document.getElementById('week-reset').textContent = formatDateTime(weekResetDate) +
    ' (' + T.inPrefix + daysLeft + T.dayUnit + ')';

  if (lastData.five_hour_reset_date) {
    const sessionResetDate = parseResetDate(lastData.five_hour_reset_date);
    const hoursLeft = Math.max(0, Math.ceil((sessionResetDate.getTime() - now) / 3600000));
    document.getElementById('hour-reset').textContent = formatDateTime(sessionResetDate) +
      ' (' + T.inPrefix + hoursLeft + T.hourUnit + ')';
  } else {
    document.getElementById('hour-reset').textContent = '--';
  }

  const updatedAtDate = new Date(lastData.updated_at * 1000);
  const staleMs = now - updatedAtDate.getTime();
  const isStale = staleMs > STALE_THRESHOLD_MS;
  setUpdatedMessage(
    (isStale ? T.staleDataPrefix + formatDuration(staleMs) + ' — ' : T.updatedPrefix) + formatTime(updatedAtDate),
    isStale
  );
  setStreamBanner(computeStreamState());
}

function renderTzOptions() {
  const select = document.getElementById('tz-select');
  const current = select.value || getTz();
  select.innerHTML = TIMEZONES.map(tz =>
    '<option value="' + tz + '">' + (tz === 'local' ? T.localTz : tz) + '</option>'
  ).join('');
  select.value = current;
}

function refreshFormatUI() {
  const isAmpm = getHour12();
  document.getElementById('format-knob').style.transform = isAmpm ? 'translateX(24px)' : 'translateX(0)';
  document.getElementById('fmt-label-24h').classList.toggle('active', !isAmpm);
  document.getElementById('fmt-label-ampm').classList.toggle('active', isAmpm);
}

function setupTzControls() {
  renderTzOptions();
  const select = document.getElementById('tz-select');
  select.addEventListener('change', () => {
    localStorage.setItem(TZ_KEY, select.value);
    updateTimeDisplays();
  });

  refreshFormatUI();
  document.getElementById('format-toggle').addEventListener('click', () => {
    localStorage.setItem(HOUR12_KEY, getHour12() ? '0' : '1');
    refreshFormatUI();
    updateTimeDisplays();
  });
}

function setUpdatedMessage(text, isError) {
  const updated = document.getElementById('updated');
  updated.textContent = text;
  updated.classList.toggle('error', !!isError);
}

function render(data) {
  lastRaw = data;
  if (data && data.script_dir) lastScriptDir = data.script_dir;
  if (!data || data.status !== 'ok') {
    document.getElementById('week-pct').textContent = '--%';
    document.getElementById('hour-pct').textContent = '--%';
    setUpdatedMessage(data && data.status === 'n/d' ? T.noApiResponse : T.waitingData, data && data.status === 'n/d');
    setStreamBanner(computeStreamState());
    return;
  }
  lastData = data;

  document.getElementById('hour-pct').textContent = (data.five_hour_pct !== null && data.five_hour_pct !== undefined)
    ? data.five_hour_pct.toFixed(0) + '%' : '--%';
  document.getElementById('hour-bar-fill').style.width = (data.five_hour_pct || 0) + '%';
  document.getElementById('week-pct').textContent = data.used_pct.toFixed(0) + '%';
  document.getElementById('week-bar-fill').style.width = data.used_pct + '%';

  updateTimeDisplays();

  if (!planDays && data.reset_date) {
    const resetsAt = parseResetDate(data.reset_date);
    const dates = computeDisplayDays(resetsAt, DAY_COUNT);
    const storedPlan = loadPlan();
    planDays = buildDayModel(dates, storedPlan);
    planCompatStatus = Object.keys(storedPlan).length === 0
      ? 'compatible' // nessun dato pregresso da proteggere
      : planIsCompatibleWith(loadPlanSlotSignature(), currentSlotSignature());
    renderPlanCompatBanner();
  }
  renderPlan();
}

// metti a true dalla console del browser (window.DEBUG_PAUSE_REFRESH = true) per
// bloccare i refresh automatici e lavorare sui devtools senza che il DOM del
// calendario venga ricostruito sotto di te ogni pochi secondi
window.DEBUG_PAUSE_REFRESH = false;

async function poll() {
  if (window.DEBUG_PAUSE_REFRESH) return;
  try {
    const res = await fetch('data/state.json?_=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      render(await res.json());
    } else {
      lastRaw = null;
      setUpdatedMessage(T.stateNotFound, true);
      setStreamBanner('disconnected');
    }
  } catch (e) {
    lastRaw = null;
    setUpdatedMessage(T.stateNotFound, true);
    setStreamBanner('disconnected');
  }
}

(async function init() {
  await loadSlotConfig(); // deve completare prima del primo render: SLOT_KEYS/SLOT_BOUNDS
  // influenzano sia il testo (buildExplanationHTML) sia il modello del piano
  applyStrings();
  setupPlanToolbar();
  setupPlanCompatBanner();
  setupPlanConflictDialog();
  setupCustomizeDialog();
  setupThemeSwitch();
  setupTzControls();
  setupConsentBanner();
  setupLangSwitch();
  poll();
  setInterval(poll, POLL_MS);
  setInterval(() => { if (!window.DEBUG_PAUSE_REFRESH) renderPlan(); }, 30000); // aggiorna la posizione dell'asticella anche senza nuovi dati
})();
