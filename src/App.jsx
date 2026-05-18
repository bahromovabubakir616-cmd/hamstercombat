import { useEffect, useRef, useState } from "react";
import "./App.css";

const GLYPHS = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

const PV = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000,
};

const names = {
  w: "Oq",
  b: "Qora",
  r: "Qizil",
};

function App() {
  const [gt, setGt] = useState("chess");
  const [bot, setBot] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [over, setOver] = useState(false);
  const [turn, setTurn] = useState("w");
  const [hist, setHist] = useState([]);
  const [sel, setSel] = useState(null);
  const [hints, setHints] = useState([]);
  const [cb, setCb] = useState([]);
  const [ck, setCk] = useState([]);
  const [ep, setEp] = useState(null);
  const [cr, setCr] = useState({ wK: 1, wQ: 1, bK: 1, bQ: 1 });
  const [cw, setCw] = useState([]);
  const [cbk, setCbk] = useState([]);
  const [chain, setChain] = useState(false);
  const [chainRc, setChainRc] = useState(null);
  const [smsg, setSmsg] = useState("");
  const [thinking, setThinking] = useState(false);

  const cbRef = useRef(cb);
  const ckRef = useRef(ck);
  const turnRef = useRef(turn);
  const overRef = useRef(over);
  const botRef = useRef(bot);
  const gtRef = useRef(gt);

  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);
  useEffect(() => {
    ckRef.current = ck;
  }, [ck]);
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);
  useEffect(() => {
    overRef.current = over;
  }, [over]);
  useEffect(() => {
    botRef.current = bot;
  }, [bot]);
  useEffect(() => {
    gtRef.current = gt;
  }, [gt]);

  useEffect(() => {
    if (bot && !over && turn === "b") {
      if (gt === "chess") {
        botChess();
      } else {
        botCK();
      }
    }
  }, [bot, turn, over, gt]);

  function selG(game) {
    setGt(game);
    setSel(null);
    setHints([]);
  }

  function togBot() {
    setBot((prev) => !prev);
  }

  function toMenu() {
    setMenuVisible(true);
  }

  function startG() {
    setMenuVisible(false);
    if (gt === "chess") initChess();
    else initCK();
  }

  function initChess() {
    setEp(null);
    setCr({ wK: 1, wQ: 1, bK: 1, bQ: 1 });
    setTurn("w");
    setSel(null);
    setHints([]);
    setHist([]);
    setCw([]);
    setCbk([]);
    setOver(false);
    setThinking(false);
    setSmsg("");

    const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
    const board = [];
    for (let r = 0; r < 8; r++) {
      board[r] = [];
      for (let c = 0; c < 8; c++) {
        board[r][c] =
          r === 0
            ? "b" + back[c]
            : r === 1
              ? "bP"
              : r === 6
                ? "wP"
                : r === 7
                  ? "w" + back[c]
                  : null;
      }
    }
    setCb(board);
  }

  function initCK() {
    setTurn("r");
    setSel(null);
    setHints([]);
    setHist([]);
    setOver(false);
    setChain(false);
    setChainRc(null);
    setThinking(false);
    setSmsg("");

    const board = [];
    for (let r = 0; r < 8; r++) {
      board[r] = [];
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) board[r][c] = { col: "b", king: false };
          else if (r > 4) board[r][c] = { col: "r", king: false };
          else board[r][c] = null;
        } else {
          board[r][c] = null;
        }
      }
    }
    setCk(board);
  }

  function ib(a, b) {
    return a >= 0 && a < 8 && b >= 0 && b < 8;
  }

  function emp(bd, a, b) {
    return !bd[a][b];
  }

  function ene(bd, a, b, col) {
    return bd[a][b] && bd[a][b][0] !== col;
  }

  function cRaw(r, c, bd) {
    const p = bd[r][c];
    if (!p) return [];
    const col = p[0];
    const t = p[1];
    const mvs = [];

    const slide = (dr, dc) => {
      let rr = r + dr;
      let cc = c + dc;
      while (ib(rr, cc)) {
        if (emp(bd, rr, cc)) mvs.push([rr, cc]);
        else {
          if (ene(bd, rr, cc, col)) mvs.push([rr, cc]);
          break;
        }
        rr += dr;
        cc += dc;
      }
    };

    if (t === "P") {
      const d = col === "w" ? -1 : 1;
      const sr = col === "w" ? 6 : 1;
      if (ib(r + d, c) && emp(bd, r + d, c)) {
        mvs.push([r + d, c]);
        if (r === sr && emp(bd, r + 2 * d, c)) mvs.push([r + 2 * d, c]);
      }
      [-1, 1].forEach((dc) => {
        if (
          ib(r + d, c + dc) &&
          (ene(bd, r + d, c + dc, col) ||
            (ep && ep[0] === r + d && ep[1] === c + dc))
        )
          mvs.push([r + d, c + dc]);
      });
    }

    if (t === "N") {
      [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ].forEach((x) => {
        if (
          ib(r + x[0], c + x[1]) &&
          (emp(bd, r + x[0], c + x[1]) || ene(bd, r + x[0], c + x[1], col))
        )
          mvs.push([r + x[0], c + x[1]]);
      });
    }

    if (t === "B" || t === "Q") {
      [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].forEach((x) => {
        slide(x[0], x[1]);
      });
    }

    if (t === "R" || t === "Q") {
      [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].forEach((x) => {
        slide(x[0], x[1]);
      });
    }

    if (t === "K") {
      [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ].forEach((x) => {
        if (
          ib(r + x[0], c + x[1]) &&
          (emp(bd, r + x[0], c + x[1]) || ene(bd, r + x[0], c + x[1], col))
        )
          mvs.push([r + x[0], c + x[1]]);
      });
      const kr = col === "w" ? 7 : 0;
      if (
        cr[col + "K"] &&
        cr[col + "Q"] &&
        !bd[kr][1] &&
        !bd[kr][2] &&
        !bd[kr][3] &&
        !sqAtk(kr, 2, col, bd) &&
        !sqAtk(kr, 3, col, bd) &&
        !cChk(col, bd)
      )
        mvs.push([kr, 2, "cq"]);
      if (
        cr[col + "K"] &&
        !bd[kr][5] &&
        !bd[kr][6] &&
        !sqAtk(kr, 5, col, bd) &&
        !sqAtk(kr, 6, col, bd) &&
        !cChk(col, bd)
      )
        mvs.push([kr, 6, "ck"]);
    }

    return mvs;
  }

  function sqAtk(r, c, col, bd) {
    const opp = col === "w" ? "b" : "w";
    for (let rr = 0; rr < 8; rr++) {
      for (let cc = 0; cc < 8; cc++) {
        if (bd[rr][cc] && bd[rr][cc][0] === opp) {
          const ms = cRaw(rr, cc, bd);
          for (let i = 0; i < ms.length; i++) {
            if (ms[i][0] === r && ms[i][1] === c) return true;
          }
        }
      }
    }
    return false;
  }

  function cChk(col, bd) {
    let kr = -1;
    let kc = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (bd[r][c] === col + "K") {
          kr = r;
          kc = c;
        }
      }
    }
    return sqAtk(kr, kc, col, bd);
  }

  function cApply(r, c, tr, tc, bd, sp) {
    const nb = bd.map((row) => row.slice());
    const p = nb[r][c];
    nb[tr][tc] = p;
    nb[r][c] = null;
    if (p && p[1] === "P" && Math.abs(tc - c) === 1 && !bd[tr][tc]) {
      nb[r][tc] = null;
    }
    if (sp === "ck") {
      nb[r][5] = nb[r][7];
      nb[r][7] = null;
    }
    if (sp === "cq") {
      nb[r][3] = nb[r][0];
      nb[r][0] = null;
    }
    if (p && p[1] === "P" && (tr === 0 || tr === 7)) nb[tr][tc] = p[0] + "Q";
    return nb;
  }

  function cLegal(r, c, bd) {
    return cRaw(r, c, bd).filter(
      (m) => !cChk(bd[r][c][0], cApply(r, c, m[0], m[1], bd, m[2])),
    );
  }

  function cAllMvs(col, bd) {
    const res = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (bd[r][c] && bd[r][c][0] === col) {
          cLegal(r, c, bd).forEach((m) => {
            res.push({ r, c, tr: m[0], tc: m[1], sp: m[2] });
          });
        }
      }
    }
    return res;
  }

  function chessClick(r, c) {
    if (over || (bot && turn === "b")) return;

    if (sel) {
      const hit = hints.find((h) => h[0] === r && h[1] === c);
      if (hit) {
        doChess(sel[0], sel[1], r, c, hit[2]);
        return;
      }
      setSel(null);
      setHints([]);
    }

    const p = cb[r]?.[c];
    if (p && p[0] === turn) {
      setSel([r, c]);
      setHints(cLegal(r, c, cb));
    }
  }

  function doChess(r, c, tr, tc, sp) {
    const p = cb[r][c];
    const cap = cb[tr][tc];
    let epCap = null;
    if (p[1] === "P" && Math.abs(tc - c) === 1 && !cb[tr][tc]) {
      epCap = cb[r][tc];
    }

    let nextEp = null;
    if (p[1] === "P" && Math.abs(tr - r) === 2) nextEp = [(r + tr) / 2, tc];

    const newBoard = cApply(r, c, tr, tc, cb, sp);
    setCb(newBoard);
    setEp(nextEp);

    if (p === "wK") setCr((prev) => ({ ...prev, wK: 0, wQ: 0 }));
    if (p === "bK") setCr((prev) => ({ ...prev, bK: 0, bQ: 0 }));
    if (r === 7 && c === 0) setCr((prev) => ({ ...prev, wQ: 0 }));
    if (r === 7 && c === 7) setCr((prev) => ({ ...prev, wK: 0 }));
    if (r === 0 && c === 0) setCr((prev) => ({ ...prev, bQ: 0 }));
    if (r === 0 && c === 7) setCr((prev) => ({ ...prev, bK: 0 }));

    if (cap) {
      if (turn === "w") setCw((prev) => [...prev, cap[1]]);
      else setCbk((prev) => [...prev, cap[1]]);
    }
    if (epCap) {
      if (turn === "w") setCw((prev) => [...prev, "P"]);
      else setCbk((prev) => [...prev, "P"]);
    }

    const note =
      sp === "ck"
        ? "O-O"
        : sp === "cq"
          ? "O-O-O"
          : `${p[1] !== "P" ? p[1] : ""}${String.fromCharCode(97 + c)}${8 - r}${cap || epCap ? "x" : ""}${String.fromCharCode(97 + tc)}${8 - tr}`;

    setHist((prev) => [...prev, note]);
    setSel(null);
    setHints([]);

    const nextTurn = turn === "w" ? "b" : "w";
    setTurn(nextTurn);

    chessEnd(newBoard, nextTurn);
  }

  function chessEnd(board, nextTurn) {
    const wM = cAllMvs("w", board).length;
    const bM = cAllMvs("b", board).length;
    if (!wM) {
      setSmsg(cChk("w", board) ? "Qora galaba — Shahmat!" : "Pat — Durang!");
      setOver(true);
    } else if (!bM) {
      setSmsg(cChk("b", board) ? "Oq galaba — Shahmat!" : "Pat — Durang!");
      setOver(true);
    } else if (cChk("w", board)) {
      setSmsg("Oq shoh xavf ostida!");
    } else if (cChk("b", board)) {
      setSmsg("Qora shoh xavf ostida!");
    } else {
      setSmsg("");
    }
  }

  function evalC(bd) {
    let s = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = bd[r][c];
        if (p) {
          const v = PV[p[1]] || 0;
          s += p[0] === "w" ? -v : v;
        }
      }
    }
    return s;
  }

  function cMM(bd, dep, a, b, mx) {
    if (!dep) return evalC(bd);
    const col = mx ? "b" : "w";
    const mvs = cAllMvs(col, bd);
    if (!mvs.length) return mx ? -9999 : 9999;
    if (mx) {
      let best = -Infinity;
      for (let i = 0; i < mvs.length; i++) {
        const nb = cApply(
          mvs[i].r,
          mvs[i].c,
          mvs[i].tr,
          mvs[i].tc,
          bd,
          mvs[i].sp,
        );
        best = Math.max(best, cMM(nb, dep - 1, a, b, false));
        a = Math.max(a, best);
        if (b <= a) break;
      }
      return best;
    }
    let best2 = Infinity;
    for (let j = 0; j < mvs.length; j++) {
      const nb2 = cApply(
        mvs[j].r,
        mvs[j].c,
        mvs[j].tr,
        mvs[j].tc,
        bd,
        mvs[j].sp,
      );
      best2 = Math.min(best2, cMM(nb2, dep - 1, a, b, true));
      b = Math.min(b, best2);
      if (b <= a) break;
    }
    return best2;
  }

  function botChess() {
    if (overRef.current || turnRef.current !== "b") return;
    setThinking(true);
    setTimeout(() => {
      if (overRef.current || turnRef.current !== "b") {
        setThinking(false);
        return;
      }
      const board = cbRef.current;
      const mvs = cAllMvs("b", board);
      if (!mvs.length) {
        setThinking(false);
        return;
      }
      let best = -Infinity;
      let bm = mvs[0];
      for (let i = 0; i < mvs.length; i++) {
        const nb = cApply(
          mvs[i].r,
          mvs[i].c,
          mvs[i].tr,
          mvs[i].tc,
          board,
          mvs[i].sp,
        );
        const v = cMM(nb, 2, -Infinity, Infinity, false);
        if (v > best) {
          best = v;
          bm = mvs[i];
        }
      }
      setThinking(false);
      doChess(bm.r, bm.c, bm.tr, bm.tc, bm.sp);
    }, 30);
  }

  function ckClone(bd) {
    return bd.map((row) =>
      row.map((cell) => (cell ? { col: cell.col, king: cell.king } : null)),
    );
  }

  function ckJumps(r, c, bd) {
    const p = bd[r][c];
    if (!p) return [];
    const dirs = p.king
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : p.col === "r"
        ? [
            [-1, -1],
            [-1, 1],
          ]
        : [
            [1, -1],
            [1, 1],
          ];
    const res = [];
    for (let i = 0; i < dirs.length; i++) {
      const dr = dirs[i][0];
      const dc = dirs[i][1];
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      const mid = bd[mr][mc];
      if (mid && mid.col !== p.col && !bd[lr][lc])
        res.push({ r, c, tr: lr, tc: lc, cr: mr, cc: mc });
    }
    return res;
  }

  function ckNorm(r, c, bd) {
    const p = bd[r][c];
    if (!p) return [];
    const dirs = p.king
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : p.col === "r"
        ? [
            [-1, -1],
            [-1, 1],
          ]
        : [
            [1, -1],
            [1, 1],
          ];
    const res = [];
    for (let i = 0; i < dirs.length; i++) {
      const nr = r + dirs[i][0];
      const nc = c + dirs[i][1];
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !bd[nr][nc])
        res.push({ r, c, tr: nr, tc: nc, cr: -1, cc: -1 });
    }
    return res;
  }

  function ckAllJumps(col, bd) {
    let res = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (bd[r][c] && bd[r][c].col === col)
          res = res.concat(ckJumps(r, c, bd));
      }
    }
    return res;
  }

  function ckAllMoves(col, bd) {
    const j = ckAllJumps(col, bd);
    if (j.length) return j;
    let res = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (bd[r][c] && bd[r][c].col === col)
          res = res.concat(ckNorm(r, c, bd));
      }
    }
    return res;
  }

  function ckApply(mv, bd) {
    const nb = ckClone(bd);
    const p = nb[mv.r][mv.c];
    nb[mv.tr][mv.tc] = p;
    nb[mv.r][mv.c] = null;
    if (mv.cr >= 0) nb[mv.cr][mv.cc] = null;
    if ((p.col === "r" && mv.tr === 0) || (p.col === "b" && mv.tr === 7))
      nb[mv.tr][mv.tc].king = true;
    return nb;
  }

  function checkersClick(r, c) {
    if (over) return;
    if (bot && turn === "b") return;
    if (chain) {
      const hit = hints.find((h) => h.tr === r && h.tc === c);
      if (hit) {
        execCK(hit);
      }
      return;
    }
    if (sel) {
      const hit = hints.find((h) => h.tr === r && h.tc === c);
      if (hit) {
        execCK(hit);
        return;
      }
      setSel(null);
      setHints([]);
    }
    const p = ck[r]?.[c];
    if (p && p.col === turn) {
      setSel([r, c]);
      const gj = ckAllJumps(turn, ck);
      setHints(gj.length ? ckJumps(r, c, ck) : ckNorm(r, c, ck));
    }
  }

  function execCK(mv) {
    const nextBoard = ckApply(mv, ck);
    setCk(nextBoard);
    const wasJump = mv.cr >= 0;
    const promoted =
      (nextBoard[mv.tr][mv.tc].col === "r" && mv.tr === 0) ||
      (nextBoard[mv.tr][mv.tc].col === "b" && mv.tr === 7);
    const notation = `${String.fromCharCode(97 + mv.c)}${8 - mv.r}${wasJump ? "x" : "-"}${String.fromCharCode(
      97 + mv.tc,
    )}${8 - mv.tr}`;
    setHist((prev) => [...prev, notation]);

    if (wasJump && !promoted) {
      const nextJumps = ckJumps(mv.tr, mv.tc, nextBoard);
      if (nextJumps.length > 0) {
        setChain(true);
        setChainRc([mv.tr, mv.tc]);
        setSel([mv.tr, mv.tc]);
        setHints(nextJumps);
        return;
      }
    }
    endCKTurn();
  }

  function endCKTurn() {
    setChain(false);
    setChainRc(null);
    setSel(null);
    setHints([]);
    setTurn((prev) => (prev === "r" ? "b" : "r"));
    ckEnd();
  }

  function ckEnd() {
    const cnt = ckCount();
    if (cnt.r === 0) {
      setSmsg("Qora galaba!");
      setOver(true);
      return;
    }
    if (cnt.b === 0) {
      setSmsg("Qizil galaba!");
      setOver(true);
      return;
    }
    if (!ckAllMoves(turn, ck).length) {
      setSmsg(`${turn === "r" ? "Qora" : "Qizil"} galaba — raqib qotdi!`);
      setOver(true);
    }
  }

  function ckCount() {
    let r = 0;
    let b = 0;
    for (let rr = 0; rr < 8; rr++) {
      for (let cc = 0; cc < 8; cc++) {
        const p = ck[rr][cc];
        if (p) {
          if (p.col === "r") r++;
          else b++;
        }
      }
    }
    return { r, b };
  }

  function evalCK(bd) {
    let s = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = bd[r][c];
        if (p) {
          const v = p.king ? 200 : 100;
          s += p.col === "b" ? v : -v;
        }
      }
    }
    return s;
  }

  function ckMM(bd, dep, a, b, mx) {
    if (!dep) return evalCK(bd);
    const col = mx ? "b" : "r";
    const mvs = ckAllMoves(col, bd);
    if (!mvs.length) return mx ? -5000 : 5000;
    if (mx) {
      let best = -Infinity;
      for (let i = 0; i < mvs.length; i++) {
        const nb = ckApply(mvs[i], bd);
        best = Math.max(best, ckMM(nb, dep - 1, a, b, false));
        a = Math.max(a, best);
        if (b <= a) break;
      }
      return best;
    }
    let best2 = Infinity;
    for (let j = 0; j < mvs.length; j++) {
      const nb2 = ckApply(mvs[j], bd);
      best2 = Math.min(best2, ckMM(nb2, dep - 1, a, b, true));
      b = Math.min(b, best2);
      if (b <= a) break;
    }
    return best2;
  }

  function botCK() {
    if (overRef.current || turnRef.current !== "b") return;
    setThinking(true);
    setTimeout(() => {
      if (overRef.current || turnRef.current !== "b") {
        setThinking(false);
        return;
      }
      const board = ckRef.current;
      const mvs = ckAllMoves("b", board);
      if (!mvs.length) {
        setThinking(false);
        return;
      }
      let best = -Infinity;
      let bm = mvs[0];
      for (let i = 0; i < mvs.length; i++) {
        const nb = ckApply(mvs[i], board);
        const v = ckMM(nb, 3, -Infinity, Infinity, false);
        if (v > best) {
          best = v;
          bm = mvs[i];
        }
      }
      setThinking(false);
      execCK(bm);
    }, 30);
  }

  const boardRows = Array.from({ length: 8 }, (_, i) => i);

  const selectedSquareClass = (r, c) => sel && sel[0] === r && sel[1] === c;
  const hintSquareClass = (r, c) =>
    hints.some((h) => (h[0] === r && h[1] === c) || (h.tr === r && h.tc === c));

  const infoText =
    gt === "chess"
      ? `Oq oldi: ${cw.map((x) => GLYPHS["b" + x]).join("") || "—"}<br>Qora oldi: ${cbk.map((x) => GLYPHS["w" + x]).join("") || "—"}`
      : `Qizil: ${ckCount().r} ta<br>Qora: ${ckCount().b} ta`;

  const badgeText = over ? "O'yin tugadi" : names[turn] || turn + " navbati";

  return (
    <div id="app">
      {menuVisible ? (
        <div id="menu">
          <div className="gtitle">BOARD GAMES</div>
          <div className="gsub">CHESS &amp; CHECKERS</div>
          <div className="gcards">
            <div
              className={`gcard ${gt === "chess" ? "sel" : ""}`}
              id="cc"
              onClick={() => selG("chess")}
            >
              <div className="ci">♟</div>
              <div className="cn">Shaxmat</div>
              <div className="cd">Barcha qoidalar, AI bot</div>
            </div>
            <div
              className={`gcard ${gt === "checkers" ? "sel" : ""}`}
              id="ck"
              onClick={() => selG("checkers")}
            >
              <div className="ci">⛂</div>
              <div className="cn">Shashka</div>
              <div className="cd">Zanjirli sakrash, AI bot</div>
            </div>
          </div>
          <div className="botrow">
            <span>2 o'yinchi</span>
            <div
              className={`tog ${bot ? "on" : ""}`}
              id="btog"
              onClick={togBot}
            >
              <div className="togdot"></div>
            </div>
            <span>Bot bilan</span>
          </div>
          <button className="sbtn" onClick={startG}>
            Boshlash
          </button>
        </div>
      ) : (
        <div id="garea">
          <div className="topbar">
            <button className="bbtn" onClick={toMenu}>
              ← Menyu
            </button>
            <span className="tbadge" id="tbadge">
              {badgeText}
            </span>
            <span className="smsg" id="smsg">
              {smsg}
            </span>
          </div>
          <div className="bwrap">
            <div id="board">
              {boardRows.map((r) =>
                boardRows.map((c) => {
                  const dark = (r + c) % 2 !== 0;
                  const sqClass = ["sq", dark ? "dk" : "lt"];
                  if (selectedSquareClass(r, c)) sqClass.push("sel2");
                  if (hintSquareClass(r, c)) sqClass.push("hnt");
                  const clickHandler =
                    gt === "chess"
                      ? () => chessClick(r, c)
                      : () => checkersClick(r, c);
                  const piece = gt === "chess" ? cb[r]?.[c] : ck[r]?.[c];

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={sqClass.join(" ")}
                      onClick={clickHandler}
                    >
                      {gt === "chess" && piece ? (
                        <span className={piece[0] === "w" ? "pw" : "pb"}>
                          {GLYPHS[piece]}
                        </span>
                      ) : null}
                      {gt === "checkers" && piece ? (
                        <div
                          className={`ckp ${piece.col === "r" ? "ckr" : "ckb"}`}
                        >
                          {piece.king ? "♛" : ""}
                        </div>
                      ) : null}
                    </div>
                  );
                }),
              )}
            </div>
            <div className="spanel">
              <div className="psec">
                <div className="plbl">Ma'lumot</div>
                <div
                  id="info"
                  style={{ fontSize: 12, color: "#888", lineHeight: 2 }}
                  dangerouslySetInnerHTML={{ __html: infoText }}
                />
                <div
                  className="chain-hint"
                  id="chainhint"
                  style={{ display: chain ? "block" : "none" }}
                >
                  &#9650; Davom eting!
                </div>
              </div>
              <div className="psec">
                <div className="plbl">Yurishlar</div>
                <div className="mhist" id="mhist">
                  {hist.map((m, i) => (
                    <div key={i} style={{ lineHeight: 1.5 }}>
                      <span style={{ color: "#444" }}>{i + 1}.</span> {m}
                    </div>
                  ))}
                </div>
              </div>
              <div
                id="thkdiv"
                style={{
                  display: thinking ? "block" : "none",
                  padding: "4px 0",
                }}
              >
                <span className="think">Bot o'ylayapti...</span>
              </div>
              <button
                className="bbtn"
                style={{ width: "100%", marginTop: 4 }}
                onClick={gt === "chess" ? initChess : initCK}
              >
                &#8635; Yangi o'yin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
