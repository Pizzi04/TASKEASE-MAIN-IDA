// React arriva come variabile globale dal CDN (UMD): qui la riesportiamo per gli import del sorgente.
const R = window.React;
export default R;
export const { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect, Fragment, createElement } = R;
