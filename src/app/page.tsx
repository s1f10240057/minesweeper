'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';

const create_lst = (argx: number, argy: number) =>
  Array.from({ length: argy }, () => Array(argx).fill(0) as number[]);

const numTostr = (argnum: number) => {
  if (argnum < 0) {
    return '000';
  }
  if (argnum.toString().length > 3) {
    return '999';
  } else {
    let result = argnum.toString();
    while (result.length < 3) {
      result = `0${result}`;
    }
    return result;
  }
};

const getRandomIntRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const calcTotal = (
  x: number,
  y: number,
  arguserInput: number[][],
  argbombMap: number[][],
  dirlst: number[][],
) => {
  const counter =
    arguserInput[y][x] === 1
      ? dirlst.reduce((acc, [dx, dy]) => {
          const tx = x + dx,
            ty = y + dy;
          return acc + (arguserInput[ty] !== undefined && argbombMap[ty][tx] === 1 ? 1 : 0);
        }, 0)
      : 0;
  return counter === 0 ? (argbombMap[y][x] === 1 ? 11 : 0) : counter;
};

const rensa = (
  x: number,
  y: number,
  arguserInputs: number[][],
  argbombMap: number[][],
  argdirLst: number[][],
) => {
  arguserInputs[y][x] = 1;
  if (calcTotal(x, y, arguserInputs, argbombMap, argdirLst) === 0) {
    for (let i: number = 0; i < 8; i++) {
      const targetX = x + argdirLst[i][0];
      const targetY = y + argdirLst[i][1];
      if (arguserInputs[targetY] !== undefined && arguserInputs[targetY][targetX] === 0) {
        rensa(targetX, targetY, arguserInputs, argbombMap, argdirLst);
      }
    }
  }
};

export default function Home() {
  const dirLst = useMemo(
    () => [
      [1, 0], //右
      [1, 1], //右上
      [0, 1], // 上
      [-1, 1], // 左上
      [-1, 0], //左
      [-1, -1], //左下
      [0, -1], //下
      [1, -1], //右下
    ],
    [],
  );

  const [seconds, setSeconds] = useState(0);
  const [boardsize, setboardsize] = useState([9, 9]);
  const [userInputs, setuserInputs] = useState(create_lst(boardsize[0], boardsize[1]));
  const [bombMap, setbombMap] = useState(create_lst(boardsize[0], boardsize[1]));
  const [bombnum, setbombnum] = useState(10);
  const [selectedClass, setSelectedclass] = useState(0);

  const inputRefX = useRef<HTMLInputElement>(null);
  const inputRefY = useRef<HTMLInputElement>(null);
  const inputRefZ = useRef<HTMLInputElement>(null);
  const didInit = useRef(false);

  const partSize = 100;

  const classLst = [
    ['初級', 9, 9, 10],
    ['中級', 16, 16, 40],
    ['上級', 30, 16, 99],
    ['カスタム', 9, 9, 10],
  ];

  const clearCheck = (arguserInputs: number[][], argbombMap: number[][]) => {
    return arguserInputs.every((row, y) =>
      row.every((cell, x) => !(cell === 0 && argbombMap[y][x] === 0)),
    );
  };

  const overCheck = (arguserInputs: number[][], argbombMap: number[][]) => {
    return arguserInputs.some((row, y) =>
      row.some((cell, x) => cell === 1 && argbombMap[y][x] === 1),
    );
  };

  const flagCheck = (arguserInputs: number[][]) => {
    return arguserInputs.flat().filter((v) => v === 2 || v === 3).length;
  };

  const putBomb = (x: number, y: number, argBombmap: number[][]) => {
    const cpmap = structuredClone(argBombmap);
    const putedLst: string[] = [`${x},${y}`];
    for (let n: number = 0; n < bombnum; n++) {
      while (true) {
        const x = getRandomIntRange(0, boardsize[0] - 1);
        const y = getRandomIntRange(0, boardsize[1] - 1);
        const key = `${x},${y}`;
        if (!putedLst.includes(key)) {
          cpmap[y][x] = 1;
          putedLst.push(key);
          break;
        }
      }
    }
    return cpmap;
  };

  const click = (
    argevent: React.MouseEvent<HTMLDivElement>,
    x: number,
    y: number,
    argbombMap: number[][],
  ) => {
    let cloneBombMap = structuredClone(argbombMap);
    let newuserInputs = structuredClone(userInputs);

    if (argevent.button === 0) {
      if (!didInit.current) {
        didInit.current = true;
        cloneBombMap = putBomb(x, y, bombMap);
        setbombMap(cloneBombMap);
      }
      if (userInputs[y][x] === 0) {
        rensa(x, y, newuserInputs, cloneBombMap, dirLst);
        if (cloneBombMap[y][x] === 1) {
          newuserInputs = newuserInputs.map((row, y2) =>
            row.map((i, x2) => {
              return cloneBombMap[y2][x2] === 1 ? 1 : i;
            }),
          );
        }
        setuserInputs(newuserInputs);
      }
    } else {
      newuserInputs[y][x] += newuserInputs[y][x] === 0 ? 2 : 1;
      newuserInputs[y][x] %= 4;
      setuserInputs(newuserInputs);
    }
  };

  const reset = () => {
    setuserInputs((prev) =>
      prev.map((row) =>
        row.map(() => {
          return 0;
        }),
      ),
    );
    setbombMap((prev) =>
      prev.map((row) =>
        row.map(() => {
          return 0;
        }),
      ),
    );
    setSeconds(0);
    didInit.current = false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newsize = selectClass(Number(e.target.value)) as number[];
    if (newsize[0].toString() === 'カスタム') {
      newsize[1] = boardsize[0];
      newsize[2] = boardsize[1];
      newsize[3] = bombnum;
    }
    setboardsize([newsize[1], newsize[2]]);
    const newlst = create_lst(newsize[1], newsize[2]);
    setbombnum(newsize[3]);
    setbombMap(newlst);
    setuserInputs(newlst);
    setSeconds(0);
    didInit.current = false;
  };

  const selectClass = (value: number) => {
    setSelectedclass(value);
    return classLst[value];
  };

  const custom_change = () => {
    if (inputRefX.current && inputRefY.current && inputRefZ.current) {
      const newsize = [Number(inputRefX.current.value), Number(inputRefY.current.value)];
      const newbombnum = Number(inputRefZ.current.value);
      if (newsize[0] < 1 || newsize[1] < 1 || newbombnum < 1) {
        alert('入力内容が不正です！！');
        return;
      }
      setboardsize(newsize);
      const newlst = create_lst(newsize[0], newsize[1]);
      setbombnum(newbombnum);
      setbombMap(newlst);
      setuserInputs(newlst);
      setSeconds(0);
      didInit.current = false;
    }
  };

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', preventContextMenu);
    if (didInit.current === true) {
      let interval: NodeJS.Timeout | undefined;

      if (!overCheck(userInputs, bombMap) && !clearCheck(userInputs, bombMap)) {
        interval = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      }

      return () => {
        document.removeEventListener('contextmenu', preventContextMenu);
        if (interval) clearInterval(interval);
      };
    }
  }, [userInputs, bombMap]);

  return (
    <div className={`${styles.container}  ${boardsize[0] < 40 && styles.flexColumn}`}>
      <label htmlFor="pref">難易度</label>
      <select name="pref" className={styles.flexColumn} onChange={handleChange}>
        <option value="0">初級</option>
        <option value="1">中級</option>
        <option value="2">上級</option>
        <option value="3">カスタム</option>
      </select>
      <div
        className={styles.flexColumn}
        style={{ display: `${selectedClass === 3 ? `flex` : `None`} ` }}
      >
        <div className={styles.numberSelect}>
          x:
          <input
            type="number"
            className={styles.options}
            ref={inputRefX}
            defaultValue={boardsize[0]}
          />
          y:
          <input
            type="number"
            className={styles.options}
            ref={inputRefY}
            defaultValue={boardsize[1]}
          />
          爆弾数:
          <input type="number" className={styles.options} ref={inputRefZ} defaultValue={bombnum} />
        </div>
        <button className={styles.chageBtn} onClick={() => custom_change()}>
          更新
        </button>
      </div>
      <div
        className={`${styles.bigboard} ${styles.flexColumn}`}
        style={{ width: `${boardsize[0] * 30 + 50}px`, height: `${boardsize[1] * 30 + 120}px` }}
      >
        <div style={{ height: `${partSize}px` }} />
        <div className={`${styles.scoreboard}`} style={{ width: `${boardsize[0] * 30 + 8}px` }}>
          <div className={styles.numberSelect}>
            <div className={styles.num}>{numTostr(bombnum - flagCheck(userInputs))}</div>
            <div
              className={`${styles.face} ${styles.btnBorder}`}
              style={{
                backgroundPosition: `${overCheck(userInputs, bombMap) === true ? -391 : clearCheck(userInputs, bombMap) ? -361 : -331}px`,
              }}
              onClick={() => reset()}
            />
            <div className={styles.num}>{numTostr(seconds)}</div>
          </div>
        </div>

        <div style={{ height: `${partSize}px` }} />

        <div
          className={`${styles.board} ${styles.btnBorderReverse}`}
          style={{ width: `${boardsize[0] * 30 + 8}px`, height: `${boardsize[1] * 30 + 8}px` }}
        >
          {userInputs.map((row, y) =>
            row.map((item, x) =>
              item === 0 ? (
                <div
                  className={`${styles.btn} ${styles.btnBorder}`}
                  key={`${x}-${y}`}
                  onMouseDown={(event) => click(event, x, y, bombMap)}
                />
              ) : item === 1 ? (
                <div
                  className={styles.sampleCell}
                  key={`${x}-${y}`}
                  style={{
                    backgroundPosition:
                      bombMap[y][x] === 0
                        ? `${(calcTotal(x, y, userInputs, bombMap, dirLst) - 1) * -30}px`
                        : `-300px`,
                  }}
                />
              ) : item === 2 ? (
                <div key={`${x}-${y}`}>
                  <div
                    className={`${styles.btn} ${styles.btnBorder}`}
                    key={`${x}-${y}`}
                    onMouseDown={(event) => click(event, x, y, bombMap)}
                  >
                    <div
                      className={styles.flag}
                      style={{
                        backgroundPosition: `${-198}px`,
                        zIndex: '999',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div key={`${x}-${y}`}>
                  <div
                    className={`${styles.btn} ${styles.btnBorder}`}
                    key={`${x}-${y}`}
                    onMouseDown={(event) => click(event, x, y, bombMap)}
                  >
                    <div
                      className={styles.flag}
                      style={{
                        zIndex: '999',
                        backgroundPosition: `${-176}px`,
                      }}
                    />
                  </div>
                </div>
              ),
            ),
          )}
        </div>
        <div style={{ height: `${partSize}px` }} />
      </div>
    </div>
  );
}
