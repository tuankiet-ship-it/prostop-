import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, Bell, Compass, Home, MessageSquare, 
  Settings as SettingsIcon, Play, AlertTriangle, 
  Check, Volume2, Sparkles, Send, Loader2, ArrowLeft, Trophy, Flame
} from 'lucide-react';
import { 
  UserProfile, CompletedChallenge, CoachMessage, ChallengeType 
} from '../types';

interface PhoneSimulatorProps {
  profile: UserProfile | null;
  onAddChallenge: (type: ChallengeType, title: string, xp: number) => void;
  onUpdateLimit: (minutes: number) => void;
  onIncrementUsage: (minutes: number) => void;
  onSyncXpAndStreak: (xp: number, streakDelta: number, timeSaved: number, taskFinished: boolean) => void;
}

export default function PhoneSimulator({
  profile,
  onAddChallenge,
  onUpdateLimit,
  onIncrementUsage,
  onSyncXpAndStreak
}: PhoneSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'coach' | 'stats'>('home');
  
  // Simulation states
  const [showSmartPause, setShowSmartPause] = useState(false);
  const [smartPauseTimer, setSmartPauseTimer] = useState(10);
  const [smPauseReason, setSmPauseReason] = useState<string | null>(null);
  const [selectedSocialApp, setSelectedSocialApp] = useState<'TikTok' | 'Instagram' | 'Facebook' | 'YouTube'>('TikTok');
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownFinished, setCountdownFinished] = useState(false);

  // Challenge game modes
  const [activePlayChallenge, setActivePlayChallenge] = useState<ChallengeType | null>(null);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [quizSuccess, setQuizSuccess] = useState<boolean | null>(null);
  
  // Custom workout/reading progress
  const [workoutTicker, setWorkoutTicker] = useState(5);
  const [workoutActive, setWorkoutActive] = useState(false);

  // AI assistant chat messages
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      userId: profile?.uid || 'guest',
      sender: 'ai',
      text: 'Xin chào! Tôi là Coach Stop 🧠. Tôi nhận thấy bạn đang nỗ lực cắt giảm lướt MXH và dành thời gian phát triển bản thân. Nhắn gì đó cho tôi để tôi phân tích thói quen của bạn nhé!',
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Daily limits list
  const limitsOptions = [30, 60, 120, 180];

  // Daily screen limit percentages
  const currentLimit = profile?.dailyLimitMinutes || 60;
  const currentUsage = profile?.currentUsageMinutes || 0;
  const percentage = Math.min(Math.round((currentUsage / currentLimit) * 100), 100);
  const isLimitReached = currentUsage >= currentLimit;

  // Active messages auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (countdownActive && smartPauseTimer > 0) {
      interval = setInterval(() => {
        setSmartPauseTimer(prev => prev - 1);
      }, 1000);
    } else if (smartPauseTimer === 0 && countdownActive) {
      setCountdownFinished(true);
      setCountdownActive(false);
    }
    return () => clearInterval(interval);
  }, [countdownActive, smartPauseTimer]);

  // Workout stopwatch simulation
  useEffect(() => {
    let interval: any;
    if (workoutActive && workoutTicker > 0) {
      interval = setInterval(() => {
        setWorkoutTicker(prev => prev - 1);
      }, 1000);
    } else if (workoutTicker === 0 && workoutActive) {
      setWorkoutActive(false);
    }
    return () => clearInterval(interval);
  }, [workoutActive, workoutTicker]);

  const handleSimulateOpenApp = (appName: 'TikTok' | 'Instagram' | 'Facebook' | 'YouTube') => {
    setSelectedSocialApp(appName);
    setSmartPauseTimer(10);
    setSmPauseReason(null);
    setCountdownActive(false);
    setCountdownFinished(false);
    setShowSmartPause(true);
  };

  const startPauseCountdown = (reason: string) => {
    setSmPauseReason(reason);
    setCountdownActive(true);
  };

  const handleSmartDecisionRightWay = () => {
    // Choose learning over opening TikTok
    setShowSmartPause(false);
    onSyncXpAndStreak(35, 1, 10, false); // Quick reward +35 XP, increases saved time by 10m
    
    // Toast simulation
    const alertId = 't_' + Date.now();
    setChatMessages(prev => [
      ...prev,
      {
        id: alertId,
        userId: 'system',
        sender: 'ai',
        text: '🏅 Tuyệt vời! Bạn đã chọn từ bỏ lướt mạng xã hội sau thời gian suy ngẫm này. Thưởng ngay: **+35 XP** và **+10 phút** thời gian rảnh rỗi!',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const handleForceOpenSocialApp = () => {
    // Force open app, increases usage
    setShowSmartPause(false);
    onIncrementUsage(15); // Adds 15 mins of social media browsing
  };

  const handleStartChallenge = (type: ChallengeType) => {
    setActivePlayChallenge(type);
    if (type === 'workout') {
      setWorkoutTicker(5);
      setWorkoutActive(true);
    }
    // reset quiz selections
    setQuizAnswerSelected(null);
    setQuizSuccess(null);
  };

  const handleCompleteChallengeAction = () => {
    if (!activePlayChallenge) return;
    
    let xpEarned = 40;
    let title = 'English Challenge';

    if (activePlayChallenge === 'learn') {
      xpEarned = 40;
      title = 'Học 5 từ Tiếng Anh mới';
    } else if (activePlayChallenge === 'article') {
      xpEarned = 40;
      title = 'Đọc bài báo quản lý dopamine';
    } else if (activePlayChallenge === 'workout') {
      xpEarned = 50;
      title = 'Tập thể hình / Push-ups 5 phút';
    } else if (activePlayChallenge === 'speak') {
      xpEarned = 70;
      title = 'Luyện phát âm câu nói động lực';
    } else if (activePlayChallenge === 'quiz') {
      if (!quizSuccess) return; // Must have verified quiz correctness
      xpEarned = 80;
      title = 'Giải đố năng lực bản thân';
    } else if (activePlayChallenge === 'podcast') {
      xpEarned = 50;
      title = 'Nghe tóm tắt lướt thụ động';
    }

    onAddChallenge(activePlayChallenge, title, xpEarned);
    setActivePlayChallenge(null);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: CoachMessage = {
      id: 'user_' + Date.now(),
      userId: profile?.uid || 'guest',
      sender: 'user',
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAiLoading(true);

    try {
      // Send chat messages log to Express Server proxied call to server-side Gemini flash
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg.text,
          chatHistory: chatMessages.slice(-6), // Send last 6 messages
          userProfile: profile
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            userId: 'ai_coach',
            sender: 'ai',
            text: data.reply,
            createdAt: new Date().toISOString()
          }
        ]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: 'ai_err_' + Date.now(),
          userId: 'ai_coach',
          sender: 'ai',
          text: '⚠️ Không thể đồng bộ kết nối AI Coach lúc này. Hãy kiểm tra khóa hoặc thử lại sau.',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="lg:col-span-4 flex flex-col items-center">
      
      {/* Absolute smartphone Mockup Chassis Wrapper */}
      <div className="relative w-[340px] h-[670px] rounded-[48px] border-[14px] border-zinc-800 bg-[#0b0b0b] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden ring-4 ring-cyan-500/15 active:shadow-cyan-500/15 transition-all">
        
        {/* Dynamic iPhone notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-[26px] bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-around px-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-blue-500/20"></div>
          <div className="w-12 h-1.5 rounded-full bg-[#222]"></div>
        </div>

        {/* 1. Header indicators */}
        <div className="pt-8 px-6 pb-2 text-xs flex justify-between items-center text-gray-400 bg-black/40 border-b border-white/5 z-40">
          <span className="font-semibold select-none font-mono">07:15 AM</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="bg-[#0f1] px-1 rounded-[3px] text-[9px] text-[#000] font-bold font-mono">5G LTE</span>
          </div>
        </div>

        {/* Companion Screen Content */}
        <div className="h-[555px] overflow-y-auto relative text-white bg-[#070b13]">
          
          {/* A. Smart Pause Overriding Modal Screen */}
          {showSmartPause && (
            <div className="absolute inset-0 bg-[#070c14]/95 z-50 p-5 flex flex-col justify-between items-center text-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center border border-blue-500/30 mx-auto mt-6 mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Smart Pause Kích Hoạt</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                  Bạn chuẩn bị mở <strong className="text-white bg-blue-500/20 px-1 py-0.5 rounded">{selectedSocialApp}</strong>. Hãy dừng lại suy nghĩ 10 giây.
                </p>
              </div>

              {/* Multi-choice options */}
              {!smPauseReason ? (
                <div className="w-full space-y-2 px-2">
                  <p className="text-xs font-semibold text-gray-300 mb-2">Tại sao bạn muốn mở ứng dụng này?</p>
                  {[
                    'Nhắn tin nhanh với bạn bè',
                    'Cần tìm tài liệu học tập',
                    'Muốn xả stress giải trí',
                    'Tôi đang rảnh rỗi / Đu bám trend',
                    'Bấm thói quen vô thức / Không biết nữa'
                  ].map((reason, i) => (
                    <button
                      key={i}
                      onClick={() => startPauseCountdown(reason)}
                      className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      ○ {reason}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs text-blue-400 font-medium">Lý do chọn: &quot;{smPauseReason}&quot;</p>
                  
                  {/* Countdown Circle */}
                  <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 flex items-center justify-center bg-blue-500/5 select-none relative">
                    <span className="text-4xl font-black font-mono text-blue-400 animate-pulse">{smartPauseTimer}</span>
                    <span className="text-[10px] absolute bottom-3 text-gray-500">giây</span>
                  </div>

                  <p className="text-xs text-gray-400 max-w-[200px]">
                    Thời gian chờ này giúp kích thích vỏ não đưa ra quyết định lý trí thay vì cuộn lướt vô thức.
                  </p>
                </div>
              )}

              {/* Selection footer */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleSmartDecisionRightWay}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs rounded-lg shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Không lướt nữa, rèn luyện thôi! (+35 XP)
                </button>
                
                <button
                  type="button"
                  onClick={handleForceOpenSocialApp}
                  disabled={!countdownFinished}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-[11px] text-gray-500 hover:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-20 disabled:hover:text-gray-500"
                >
                  Bỏ qua, vẫn muốn lướt {selectedSocialApp} {!countdownFinished && `(Chờ ${smartPauseTimer}s)`}
                </button>
              </div>
            </div>
          )}

          {/* B. Challenge gameplay overlay window */}
          {activePlayChallenge && (
            <div className="absolute inset-0 bg-[#09101d] z-40 p-5 flex flex-col justify-between">
              <div>
                <button 
                  onClick={() => setActivePlayChallenge(null)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Thống kê
                </button>

                {activePlayChallenge === 'learn' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] bg-blue-500/15 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Challenge: Hoàn thành từ vựng
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3">Học 5 từ vựng hữu ích hôm nay</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { word: 'Addictive', meaning: 'Gây nghiện (vô thức)' },
                        { word: 'Mindfulness', meaning: 'Tỉnh thức, kiểm soát hành động' },
                        { word: 'Nootropics', meaning: 'Chất kích hoạt tập trung trí tuệ' },
                        { word: 'Dopamine', meaning: 'Hoóc-môn tìm kiếm phần thưởng' },
                        { word: 'Self-discipline', meaning: 'Tính tự giác kỷ luật bản thân' }
                      ].map((v, idx) => (
                        <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                          <p className="text-xs font-bold text-emerald-400 font-mono">{v.word}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{v.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePlayChallenge === 'article' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase">
                        Challenge: Đọc tin nhanh
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3 mb-2">Cám Giỗ Cơ Chế Cuộn Vô Tận</h4>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-[11px] leading-relaxed text-gray-300">
                      Cơ chế lướt của TikTok hay Reels dựa trên cơ cấu <strong>&quot;biến thiên phần thưởng&quot;</strong>, giống như một chiếc máy đánh bạc kéo tay sòng bài. Não bạn không biết lướt tiếp sau có nội dung gì, kích hoạt tò mò tột độ. Nhận thức được cơ chế này là chìa khóa tháo gỡ thói quen lười biếng.
                    </div>
                  </div>
                )}

                {activePlayChallenge === 'workout' && (
                  <div className="space-y-4 text-center mt-6">
                    <span className="text-[10px] bg-red-500/15 border border-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase">
                      Workout: Đồng hồ Squat / Pushup
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-4">Tập hít đất hoặc Squat 5 hiệp</h4>
                    
                    <div className="w-24 h-24 rounded-full border-4 border-red-500/20 bg-red-500/5 mx-auto flex items-center justify-center relative mt-4">
                      {workoutTicker > 0 ? (
                        <span className="text-4xl font-extrabold font-mono text-red-500 animate-ping">{workoutTicker}</span>
                      ) : (
                        <span className="text-lg font-bold text-emerald-400">Xong!</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Dòng máu sẽ lưu thông lên não ngay, xua tan cơn thèm dopamine rẻ tiền.</p>
                  </div>
                )}

                {activePlayChallenge === 'quiz' && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-[10px] bg-purple-500/15 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-bold">
                        Challenge: Giải Đố Tư Duy
                      </span>
                      <h4 className="text-xs font-bold text-white mt-3">Tại sao mạng xã hội lôi cuốn khiến người dùng lười vận động?</h4>
                    </div>

                    <div className="space-y-2 mt-4">
                      {[
                        'Họ được trả tiền để xem video liên tục',
                        'Mạng xã hội kích hoạt hoóc-môn Dopamine tức thời',
                        'Nội dung lướt thực sự mang tính học hỏi cao',
                        'Không hoạt động vì năng lượng cơ thể cạn kiệt'
                      ].map((ans, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setQuizAnswerSelected(i);
                            setQuizSuccess(i === 1); // Option 1 (index 1) is correct
                          }}
                          className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all ${
                            quizAnswerSelected === i 
                            ? (i === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400')
                            : 'bg-white/5 border-white/5 text-gray-300'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {ans}
                        </button>
                      ))}
                    </div>

                    {quizAnswerSelected !== null && (
                      <p className={`text-[11px] text-center font-bold mt-2 ${quizSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
                        {quizSuccess ? '🎉 Chính xác! Bạn nhận được đầy đủ +80 XP' : '❌ Sai rồi, đáp án b là chính xác nhất!'}
                      </p>
                    )}
                  </div>
                )}

                {activePlayChallenge === 'speak' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full font-bold">
                        Challenge: Luyện Thuyết Trình
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-3">Hãy đọc to câu nói động lực này:</h4>
                    </div>
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-center italic text-xs text-yellow-300 leading-relaxed font-semibold">
                      &quot;Stop scrolling for dopamine. Start growing for your future.&quot;
                    </div>
                  </div>
                )}

                {activePlayChallenge === 'podcast' && (
                  <div className="space-y-4 text-center mt-6">
                    <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full font-bold">
                      Podcast: Lắng nghe âm thanh
                    </span>
                    <h4 className="text-base font-semibold text-white mt-2">Dòng suy tư: Bí quyết rèn luyện tính tập trung cao</h4>
                    <p className="text-xs text-gray-400 mt-2">Đang phát audio mô phỏng... Hoặc nghe Coach dặn dò học bài.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCompleteChallengeAction}
                  disabled={activePlayChallenge === 'quiz' && !quizSuccess}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-xs font-bold text-white rounded-lg shadow-lg disabled:opacity-25"
                >
                  Đánh dấu hoàn thành & Thu hoạch XP
                </button>
                <button
                  onClick={() => setActivePlayChallenge(null)}
                  className="w-full py-1.5 text-xs text-gray-500 hover:text-white"
                >
                  Quay lại
                </button>
              </div>
            </div>
          )}


          {/* SCREEN CONTENT tabs render */}

          {activeTab === 'home' && (
            <div className="p-4 space-y-4">
              
              {/* Profile Top header widget */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white shrink-0">
                    {profile ? profile.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[120px]">
                      {profile ? profile.displayName : 'Guest User'}
                    </h4>
                    <span className="text-[10px] text-emerald-400 select-none flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Level {profile ? profile.level : 'Bronze'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-mono">Streak</span>
                  <span className="text-xs font-black font-mono text-orange-400 flex items-center gap-0.5 justify-end">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    {profile ? profile.streak : 0} ngày
                  </span>
                </div>
              </div>

              {/* Real-time Usage status bar widget */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white">Lượng sử dụng MXH</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Mục tiêu: {currentLimit} phút</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-blue-400">{currentUsage}/{currentLimit}</span>
                    <span className="text-[10px] text-gray-400 ml-1">phút</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage >= 100 
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                      : percentage >= 75 
                      ? 'bg-orange-500' 
                      : 'bg-[#0f1]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                  <span>Usage: {percentage}%</span>
                  <span>Còn {Math.max(currentLimit - currentUsage, 0)} phút lướt</span>
                </div>

                {/* Simulated Social app controls */}
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 mt-2">
                  <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wide">Mở mạng xã hội giả lập:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleSimulateOpenApp('TikTok')}
                      className="py-1 px-2 text-[10px] bg-white/5 hover:bg-white/10 font-bold rounded text-white flex items-center justify-center gap-1"
                    >
                      TikTok
                    </button>
                    <button 
                      onClick={() => handleSimulateOpenApp('Instagram')}
                      className="py-1 px-2 text-[10px] bg-white/5 hover:bg-white/10 font-bold rounded text-white flex items-center justify-center gap-1"
                    >
                      Instagram
                    </button>
                  </div>
                </div>
              </div>

              {/* Adjust limit selector */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <span className="text-xs font-bold text-white block mb-2 font-mono">Đổi giới hạn ngày:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {limitsOptions.map((lim, idx) => (
                    <button
                      key={idx}
                      onClick={() => onUpdateLimit(lim)}
                      className={`py-1.5 px-1 text-[11px] font-bold font-mono rounded-lg transition-all border ${
                        currentLimit === lim 
                        ? 'bg-blue-500/15 border-blue-500 text-white shadow' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {lim === 30 ? '30m' : lim === 60 ? '1h' : lim === 120 ? '2h' : '3h'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display if LIMIT EXCEEDED */}
              {isLimitReached ? (
                <div className="border border-red-500/30 bg-red-500/10 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 select-none">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-tight">Kịch hoạt Limit Reached</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-200">
                    Bạn đã lướt hết thời gian quý báu! Thay vì cuộn tiếp mệt mỏi, hãy hoàn thành thử thách lành mạnh ngay:
                  </p>

                  <div className="space-y-1.5">
                    <button 
                      onClick={() => handleStartChallenge('learn')}
                      className="w-full text-left p-2 rounded-lg bg-[#070b13] border border-white/5 flex justify-between items-center hover:border-blue-400"
                    >
                      <span className="text-[10px] text-white font-medium">📚 Học 5 từ Tiếng Anh</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">+40 XP</span>
                    </button>

                    <button 
                      onClick={() => handleStartChallenge('quiz')}
                      className="w-full text-left p-2 rounded-lg bg-[#070b13] border border-white/5 flex justify-between items-center hover:border-purple-400"
                    >
                      <span className="text-[10px] text-white font-medium">🧠 Trả lời Trắc nghiệm</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">+80 XP</span>
                    </button>

                    <button 
                      onClick={() => handleStartChallenge('workout')}
                      className="w-full text-[#fff] text-left p-2 rounded-lg bg-[#070b13] border border-white/5 flex justify-between items-center hover:border-red-400"
                    >
                      <span className="text-[10px] text-white font-medium">💪 Vận động giãn cơ 5 phút</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">+50 XP</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Thay Thế Thói Quen Nhỏ
                  </span>
                  <p className="text-[11px] text-gray-400 leading-normal mb-3">
                    Bất kỳ lúc nào rảnh, hãy hoàn thành nhanh hoạt động để vượt lên các đối thủ trên bảng xếp hạng quốc tế!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleStartChallenge('article')}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-left border border-white/5"
                    >
                      <span className="text-[10px] text-white block">📰 Đọc bài trí tuệ</span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold font-semibold block mt-1">+40 XP</span>
                    </button>

                    <button 
                      onClick={() => handleStartChallenge('podcast')}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-left border border-white/5"
                    >
                      <span className="text-[10px] text-white block">🎧 Nghe Podcast</span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold block mt-1">+50 XP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'coach' && (
            <div className="h-full flex flex-col justify-between p-3 bg-[#080d17]">
              
              {/* Chat head */}
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Coach Stop Assistant</h5>
                    <span className="text-[9px] text-gray-400">Powered by Gemini 3.5</span>
                  </div>
                </div>
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  • Online
                </span>
              </div>

              {/* Chat logs */}
              <div className="flex-1 overflow-y-auto space-y-2 p-1 max-h-[360px]">
                {chatMessages.map((msg) => {
                  const isSystem = msg.userId === 'system';
                  const isUser = msg.sender === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs ${
                          isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : isSystem 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                        }`}
                      >
                        {/* Parse bold formatted markdown elements simply */}
                        <p className="whitespace-pre-line leading-relaxed text-[11px]">
                          {msg.text.split('**').map((tok, idx) => {
                            if (idx % 2 === 1) return <strong key={idx} className="text-emerald-400 font-extrabold">{tok}</strong>;
                            return tok;
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      Coach đang phân tích...
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat input form */}
              <form onSubmit={handleSendChatMessage} className="mt-2 flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="Hỏi Coach Stop cách vượt cơn thèm lướt..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[#050912] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-gray-500 truncate"
                  disabled={aiLoading}
                />
                <button 
                  type="submit" 
                  disabled={aiLoading || !inputText.trim()}
                  className="px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl flex items-center justify-center text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}


          {activeTab === 'stats' && (
            <div className="p-4 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/15 flex items-center justify-center border border-purple-500/30 mx-auto mt-4">
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Thành Tích Tích Lũy</h4>
              <p className="text-xs text-gray-400 max-w-[240px] mx-auto">
                Bảng xếp hạng, danh mục nhiệm vụ, biểu đồ thị trường đều đồng bộ theo thời gian thực 100% khi bạn bấm học tập và rèn luyện.
              </p>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Dopamine saved:</span>
                  <span className="text-emerald-400 font-bold font-mono">+{profile ? profile.timeSavedMinutes : 0} Phút</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Mất đi do lướt MXH:</span>
                  <span className="text-red-400 font-bold font-mono">-{profile ? profile.currentUsageMinutes : 0} Phút</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Hoạt động lành mạnh hoàn thành:</span>
                  <span className="text-white font-bold font-mono">{profile ? profile.skillsLearnedCount : 0} Thử thách</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Smartphone Dynamic Bottom-Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/60 border-t border-white/5 z-40 flex justify-around items-center">
          <button 
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px] font-medium font-semibold tracking-wide">Trang Chủ</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'coach' ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[9px] font-medium font-semibold tracking-wide">AI Coach</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'stats' ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[9px] font-medium font-semibold tracking-wide">Xếp Hạng</span>
          </button>
        </div>

      </div>

    </div>
  );
}
