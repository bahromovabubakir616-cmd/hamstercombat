import React, { useEffect, useState } from 'react';
import icon from './assets/icon.svg';
import hamster from './assets/hamster.png';
import Union from './assets/Union.png';
import Mine from './assets/Mine.png';
import Friends from './assets/Friends.png';
import Coin from './assets/Coin.png';
import Coin1 from './assets/Coin1.png';
import './App.css';

const App = () => {

  const [page, setPage] = useState("earn");

  const [count, setCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [amount, setAmount] = useState(1);

  const [limit, setLimit] = useState(100);
  const [balance, setBalance] = useState(100);

  const [finish, setFinish] = useState(200);

  // 🔥 TAP
  const bosish = () => {
    if (balance < amount) return;

    setCount((prev) => {
      const newCount = prev + amount;

      if (newCount >= finish) {
        setLevel((l) => l + 1);
        setAmount((a) => a + 1);

        setLimit((l) => Math.floor(l * 1.5));
        setBalance((b) => Math.floor(b * 1.5));

        setFinish((f) => f * 2);
      }

      return newCount;
    });

    setBalance((prev) => prev - amount);
  };

  // 🔋 ENERGY REGEN
  useEffect(() => {
    const timer = setInterval(() => {
      setBalance((prev) => (prev < limit ? prev + 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [limit]);

  return (
    <div className="container">

      {/* 🔹 HEADER */}
      <header className='header'>
        <div>
          <p>Earn per tap</p>
          <img src={icon} alt="" />
          <h1>+{amount}</h1>
        </div>

        <div>
          <p>Level</p>
          <h1>{level}</h1>
          <h2 className='hh'>{limit}</h2>
        </div>

        <div>
          <p>Profit per hour</p>
          <img src={icon} alt="" />
          <h2>+{(level * 120).toLocaleString()}</h2>
        </div>
      </header>

      {/* 🔹 PAGE CONTENT ONLY */}
      {page === "earn" && (
        <>
          <h1 className="counter">
            <img src={icon} alt="" className='imm' />
            {count}
          </h1>

          <div className="level">
            <div
              style={{
                width: `${(count / finish) * 100}%`,
                height: "100%",
                background: "linear-gradient(to right,#7f5af0,#2cb67d)",
                borderRadius: "10px"
              }}
            ></div>
          </div>
        </>
      )}

      {page === "mine" && <h1 style={{textAlign:"center"}}>Mine ⛏</h1>}
      {page === "friends" && <h1 style={{textAlign:"center"}}>Friends 👥</h1>}
      {page === "exchange" && <h1 style={{textAlign:"center"}}>Exchange 🔄</h1>}
      {page === "airdrop" && <h1 style={{textAlign:"center"}}>Airdrop 🎁</h1>}
      {page === "combat" && <h1 style={{textAlign:"center"}}>Combat 🥊</h1>}

      {/* 🔥 HAMSTER GLOBAL (HECH QAYSI PAGEDA YO‘QOLMAYDI) */}
      <div className='hamster' onClick={bosish}>
        <img src={hamster} alt="" className='imgg' />
      </div>

      {/* ENERGY */}
      <div className="energy-section">
        <div className="energy">
          ⚡ {balance} / {limit}
        </div>
        <div className="boost">Boost</div>
      </div>

      {/* 🔹 FOOTER NAVIGATION */}
      <div className="footer">

        <div className="footer-item" onClick={() => setPage("exchange")}>
          <img src={Union} alt="" />
          <span>Exchange</span>
        </div>

        <div className="footer-item" onClick={() => setPage("mine")}>
          <img src={Mine} alt="" />
          <span>Mine</span>
        </div>

        <div className="footer-item" onClick={() => setPage("friends")}>
          <img src={Friends} alt="" />
          <span>Friends</span>
        </div>

        <div className="footer-item" onClick={() => setPage("earn")}>
          <img src={Coin} alt="" />
          <span>Earn</span>
        </div>

        <div className="footer-item active" onClick={() => setPage("airdrop")}>
          <img src={Coin1} alt="" />
          <span>Airdrop</span>
        </div>

      </div>

    </div>
  );
};

export default App;