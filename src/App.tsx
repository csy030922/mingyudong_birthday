import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, CheckCircle2, Lock, KeyRound, Calendar, Heart, Gift, HelpCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Coupon {
  id: string;
  title: string;
  subTitle: string;
  description: string;
  tag: string;
  barcode: string;
  themeColor: string;
  textColor: string;
  expiryDate: string;
}

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    title: '무조건 소원 들어주기',
    subTitle: 'SPECIAL VOUCHER',
    description: '어떤 소원이든 딱 하나 무조건 들어줄게!',
    tag: 'LIMITED 1회',
    barcode: '||| | |||| | ||| |',
    themeColor: 'bg-indigo-600',
    textColor: 'text-indigo-600',
    expiryDate: '2026.12.31까지',
  },
  {
    id: 'coupon-2',
    title: '야식 쏘기',
    subTitle: 'FOOD VOUCHER',
    description: '밤늦게 출출할 때 언제든 바로 배달시켜줄게!',
    tag: 'YUMMY',
    barcode: '|| ||| | ||| || ||',
    themeColor: 'bg-blue-600',
    textColor: 'text-blue-600',
    expiryDate: '2026.12.31까지',
  },
  {
    id: 'coupon-3',
    title: '일일 전용 꿀심부름권',
    subTitle: 'HELPER VOUCHER',
    description: '소소한 심부름 중 딱 하나 대신 해드려용',
    tag: 'SERVICE',
    barcode: '| |||| | || ||| ||',
    themeColor: 'bg-rose-500',
    textColor: 'text-rose-500',
    expiryDate: '2026.12.31까지',
  },
  {
    id: 'coupon-4',
    title: '데이트 코스 풀전담',
    subTitle: 'DATE VOUCHER',
    description: '전부 내가 기획해서 데이트코스 만들어줄게!',
    tag: 'DATE',
    barcode: '||| || | ||| | |||',
    themeColor: 'bg-amber-500',
    textColor: 'text-amber-500',
    expiryDate: '2026.12.31까지',
  },
  {
    id: 'coupon-5',
    title: '미안해권',
    subTitle: 'PEACE VOUCHER',
    description: '이 쿠폰 쓰면 무조건 내가 미안한걸로...',
    tag: 'PEACE',
    barcode: '|| || ||| | ||| ||',
    themeColor: 'bg-emerald-600',
    textColor: 'text-emerald-600',
    expiryDate: '2026.12.31까지',
  },
];

// 이스터에그 시크릿 쿠폰
const SECRET_COUPON: Coupon = {
  id: 'coupon-secret',
  title: '오늘 저녁은 무조건 교촌이다! 🍗 ',
  subTitle: 'SECRET VOUCHER',
  description: '교촌을 무조건 먹고 싶은 날에 사용해!\n(단, 민규동이 쏘기)',
  tag: '🔑 HIDDEN SECRET 🔑',
  barcode: '||||||||||||||||||',
  themeColor: 'bg-pink-600',
  textColor: 'text-pink-600',
  expiryDate: '2026.12.31까지',
};

// 화면 구석구석에 흩어질 10개 좌표 설정 (픽셀/퍼센트 조합)
const EMOJI_POSITIONS = [
  { top: '35px', right: '18px' },     // 헤더 우측 상단
  { top: '85px', left: '22px' },      // 서브헤더 좌측
  { top: '190px', right: '12px' },    // 첫 번째 티켓 우측 여백
  { top: '290px', left: '10px' },     // 두 번째 티켓 좌측 여백
  { top: '380px', right: '25px' },    // 세 번째 티켓 구석
  { top: '480px', left: '16px' },     // 네 번째 티켓 근처
  { top: '570px', right: '15px' },    // 다섯 번째 티켓 옆
  { bottom: '70px', left: '28px' },   // 리스트 하단 좌측
  { bottom: '50px', right: '45px' },  // 푸터 위쪽
  { bottom: '15px', right: '12px' },  // 푸터 맨 우측 구석
];

const CORRECT_PIN = '1002'; // 서영 인증 비밀번호
const GATE_ANSWER = '1109'; // 게이트 퀴즈 정답 (생일 4자리)

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bday_gate_passed') === 'true';
  });
  const [gateInput, setGateInput] = useState<string>('');
  const [gateError, setGateError] = useState<boolean>(false);

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const hasSecret = localStorage.getItem('bday_secret_unlocked_v2') === 'true';
    return hasSecret ? [...INITIAL_COUPONS, SECRET_COUPON] : INITIAL_COUPONS;
  });

  const [usedCoupons, setUsedCoupons] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('bday_ticket_coupons_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [tearingId, setTearingId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // 10개 중 1개 당첨, 5번 기회
  const [winningIndex, setWinningIndex] = useState<number>(() => Math.floor(Math.random() * 10));
  const [clickedIndices, setClickedIndices] = useState<number[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);
  const [showSecretModal, setShowSecretModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('bday_ticket_coupon_v2', JSON.stringify(usedCoupons));
  }, [usedCoupons]);

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gateInput === GATE_ANSWER) {
      sessionStorage.setItem('bday_gate_passed', 'true');
      setIsAuthenticated(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } else {
      setGateError(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  };

  // 흩어진 돋보기 클릭
  const handleEmojiClick = (index: number) => {
    const isUnlocked = localStorage.getItem('bday_secret_unlocked_v2') === 'true';
    if (isUnlocked || clickedIndices.includes(index) || attemptsLeft <= 0) return;

    const newClicked = [...clickedIndices, index];
    setClickedIndices(newClicked);

    if (index === winningIndex) {
      localStorage.setItem('bday_secret_unlocked_v2', 'true');
      setCoupons((prev) => [...prev, SECRET_COUPON]);
      setShowSecretModal(true);

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#f43f5e', '#fb7185', '#ffeaa7'],
      });
    } else {
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      if (navigator.vibrate) navigator.vibrate([150]);

      if (newAttempts <= 0) {
        setShowGameOverModal(true);
      }
    }
  };

  const resetSearchGame = () => {
    setWinningIndex(Math.floor(Math.random() * 10));
    setClickedIndices([]);
    setAttemptsLeft(5);
    setShowGameOverModal(false);
  };

  const handleCloseModal = () => {
    setSelectedCoupon(null);
    setPinInput('');
    setPinError(false);
  };

  const handleConfirmUse = (coupon: Coupon) => {
    if (pinInput !== CORRECT_PIN) {
      setPinError(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      return;
    }

    setTearingId(coupon.id);
    if (navigator.vibrate) navigator.vibrate([100, 30, 100]);

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
    });

    setTimeout(() => {
      const now = new Date().toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setUsedCoupons((prev) => ({
        ...prev,
        [coupon.id]: now,
      }));

      setTearingId(null);
      handleCloseModal();
    }, 800);
  };

  const isSecretUnlocked = localStorage.getItem('bday_secret_unlocked_v2') === 'true';

  return (
    <div className="min-h-screen bg-[#e0f2fe] flex justify-center items-center p-0 sm:p-4 font-sans select-none">
      {/* 모바일 폰 Frame (relative) */}
      <div className="w-full max-w-[420px] min-h-screen sm:min-h-[840px] bg-[#f0f9ff] sm:rounded-[36px] sm:shadow-2xl border-0 sm:border-[6px] border-white flex flex-col overflow-hidden relative">
        
        {!isAuthenticated ? (
          /* 1. 로그인 게이트 */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-blue-50 to-indigo-50">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-4 rounded-full bg-white shadow-lg text-blue-600 mb-4">
              <Gift className="w-10 h-10 stroke-[2.5]" />
            </motion.div>
            <h2 className="text-xl font-black text-gray-800 mb-1">HAPPY BIRTHDAY! 🎂</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">본인 확인을 위해 암호를 입력해 주세요.</p>

            <form onSubmit={handleGateSubmit} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={4}
                value={gateInput}
                onChange={(e) => {
                  setGateInput(e.target.value);
                  setGateError(false);
                }}
                placeholder="오늘 기준으로 우리가 연애한 지 며칠째?"
                className={`w-full text-center py-3 px-4 rounded-2xl border text-base font-bold tracking-widest bg-white shadow-sm focus:outline-none transition ${
                  gateError ? 'border-rose-500 text-rose-600' : 'border-blue-200 text-gray-800'
                }`}
              />
              {gateError && (
                <p className="text-[11px] text-rose-500 font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 암호가 맞지 않습니다!
                </p>
              )}
              <button type="submit" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-md active:scale-95 transition">
                티켓북 열기 ✨
              </button>
            </form>
          </div>
        ) : (
          /* 2. 메인 티켓북 */
          <>
            {/* 헤더 */}
            <header className="pt-8 pb-4 px-6 text-center relative z-10">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BIRTHDAY TICKET VOUCHER</span>
              </div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                '민규동'만을 위한 전용 티켓북 🤍
              </h1>
              <p className="text-xs text-blue-500 font-semibold mt-1">
                오직 '민규동'만을 위한 티켓이므로 양도는 안됩니다.
              </p>
            </header>

            {/* 티켓 스크롤 리스트 */}
            <main className="flex-1 overflow-y-auto px-4 py-2 space-y-5 pb-6 z-10 relative">
              {coupons.map((coupon, idx) => {
                const isUsed = !!usedCoupons[coupon.id];
                const isTearing = tearingId === coupon.id;
                const usedDate = usedCoupons[coupon.id];
                const isSelected = selectedCoupon?.id === coupon.id;

                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="relative w-full"
                  >
                    {/* 티켓 메인 카드 */}
                    <div
                      onClick={() => !isUsed && setSelectedCoupon(coupon)}
                      className={`w-full flex items-stretch rounded-xl shadow-md overflow-hidden transition-all ${
                        isUsed ? 'opacity-60 grayscale-[0.5]' : 'cursor-pointer hover:scale-[1.01]'
                      }`}
                    >
                      <div className={`w-16 ${coupon.themeColor} text-white flex flex-col justify-between items-center py-3 px-1 relative select-none shrink-0`}>
                        <span className="text-[10px] font-black tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
                          {coupon.subTitle}
                        </span>
                        <TicketIcon className="w-5 h-5 opacity-80" />
                        <span className="text-[9px] font-mono opacity-80">2026</span>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f0f9ff] rounded-full z-10" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#f0f9ff] rounded-full z-10" />
                      </div>

                      <div className="w-[2px] bg-white border-l-2 border-dashed border-gray-300 relative z-10 shrink-0" />

                      <motion.div
                        animate={isTearing ? { x: 120, rotate: 12, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.7, ease: 'easeInOut' }}
                        className="flex-1 bg-white p-3.5 flex flex-col justify-between relative border-y border-r border-gray-200 rounded-r-xl min-w-0"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1 gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 shrink-0 ${coupon.textColor}`}>
                              {coupon.tag}
                            </span>
                            <span className="text-[10px] font-mono tracking-tighter text-gray-400 truncate">
                              {coupon.barcode}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-gray-800 leading-snug">{coupon.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 leading-snug">{coupon.description}</p>
                        </div>

                        {/* 줄바꿈 현상 완벽 방지 하단 레이아웃 */}
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-1 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1 font-mono text-gray-400 shrink-0">
                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                            {coupon.expiryDate}
                          </span>

                          {isUsed ? (
                            <span className="text-rose-500 font-bold flex items-center gap-0.5 font-mono text-[9px] shrink-0">
                              <CheckCircle2 className="w-3 h-3 shrink-0" /> USED ({usedDate})
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-blue-600 underline underline-offset-2 shrink-0">
                              티켓 사용하기 →
                            </span>
                          )}
                        </div>

                        {isUsed && (
                          <div className="absolute right-2 top-2 border-2 border-rose-500 text-rose-500 font-black text-[10px] px-1.5 py-0.5 rounded rotate-[-15deg] opacity-80 pointer-events-none">
                            COMPLETED
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* 선택한 티켓 카드 바로 위에 뜨는 오버레이 모달 */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 z-30 bg-white rounded-xl border-2 border-blue-400 shadow-xl p-3 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                              <KeyRound className="w-4 h-4" />
                              <span>티켓 사용 인증</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">{coupon.expiryDate}</span>
                          </div>

                          <div className="my-1 text-center">
                            <p className="text-xs font-bold text-gray-700 mb-1 flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3 text-blue-600" /> 서영 인증 비밀번호
                            </p>
                            <input
                              type="password"
                              maxLength={4}
                              value={pinInput}
                              onChange={(e) => {
                                setPinInput(e.target.value);
                                setPinError(false);
                              }}
                              placeholder="비밀번호 4자리"
                              className={`w-full text-center py-2 px-3 rounded-lg border text-base tracking-widest font-bold focus:outline-none transition ${
                                pinError ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 bg-gray-50'
                              }`}
                            />
                            {pinError && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1">
                                비밀번호가 올바르지 않습니다!
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseModal();
                              }}
                              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs"
                            >
                              취소
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmUse(coupon);
                              }}
                              className={`flex-1 py-2 rounded-lg ${coupon.themeColor} text-white font-bold text-xs shadow-sm`}
                            >
                              티켓 사용 🎟️
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </main>

            {/* 푸터 */}
            <footer className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono z-10">
              <span>VALID UNTIL 2026.12.31</span>
              {!isSecretUnlocked && (
                <span className="text-blue-500 font-bold">
                  🔍 보물찾기 남은기회: {attemptsLeft}회
                </span>
              )}
            </footer>

            {/* 🌟 숨겨진 10개 돋보기 이모지 */}
            {!isSecretUnlocked &&
              EMOJI_POSITIONS.map((pos, i) => {
                const isClicked = clickedIndices.includes(i);
                const isWinning = i === winningIndex;

                return (
                  <button
                    key={i}
                    onClick={() => handleEmojiClick(i)}
                    disabled={isClicked || attemptsLeft <= 0}
                    style={pos}
                    className={`absolute z-20 text-[11px] p-1 transition select-none ${
                      isClicked
                        ? isWinning
                          ? 'text-pink-600 font-bold bg-pink-100 rounded-full'
                          : 'opacity-20 line-through'
                        : 'opacity-30 hover:opacity-100 hover:scale-150 cursor-pointer'
                    }`}
                  >
                    {isClicked ? (isWinning ? '💖' : '❌') : '🔍'}
                  </button>
                );
              })}
          </>
        )}

        {/* 보물찾기 성공 모달 */}
        <AnimatePresence>
          {showSecretModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSecretModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-3xl p-6 text-center border-4 border-pink-300 shadow-2xl relative"
              >
                <div className="inline-block p-3 rounded-full bg-pink-100 text-pink-500 mb-3">
                  <Heart className="w-8 h-8 fill-pink-500" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-1">보물찾기 성공! 🎉</h3>
                <p className="text-xs text-pink-600 font-bold mb-3">숨겨진 당첨 돋보기를 찾았어!</p>
                <p className="text-xs text-gray-600 bg-pink-50 p-3 rounded-xl border border-pink-100 mb-5 leading-relaxed">
                  쿠폰북 맨 아래에 <span className="font-bold text-pink-600">[시크릿 쿠폰]</span>이 새로 생성되었습니다! 💋
                </p>
                <button onClick={() => setShowSecretModal(false)} className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs shadow-md">
                  확인하러 가기 ✨
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 보물찾기 실패 모달 */}
        <AnimatePresence>
          {showGameOverModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetSearchGame}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-3xl p-6 text-center border-2 border-gray-200 shadow-2xl relative"
              >
                <div className="inline-block p-3 rounded-full bg-gray-100 text-gray-500 mb-3">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">아쉽다! 실패 🙈</h3>
                <p className="text-xs text-gray-500 mb-5">5번 기회 안에 못 찾았어! 돋보기 위치가 재설정됩니다!</p>
                <button onClick={resetSearchGame} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 시도하기</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function TicketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}