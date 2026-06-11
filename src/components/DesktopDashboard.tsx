import React, { useState } from 'react';
import { 
  Flame, Zap, Clock, BookOpen, Award, Users, 
  TrendingUp, TrendingDown, ArrowUpRight, HelpCircle, 
  Activity, Star, ChevronRight, PlusCircle, CheckCircle2 
} from 'lucide-react';
import { 
  UserProfile, Group, CompletedChallenge, MarketTrend, DailyMission 
} from '../types';

interface DesktopDashboardProps {
  profile: UserProfile | null;
  completedChallenges: CompletedChallenge[];
  groups: Group[];
  isLoading: boolean;
  onUpdateWeeklyMission: (missionId: string, xpDelta: number) => void;
  onJoinGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => void;
  onGoogleSignIn: () => void;
}

export default function DesktopDashboard({
  profile,
  completedChallenges,
  groups,
  isLoading,
  onUpdateWeeklyMission,
  onJoinGroup,
  onCreateGroup,
  onGoogleSignIn
}: DesktopDashboardProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Live market demand mock dataset
  const marketTrends: MarketTrend[] = [
    { skill: 'AI Prompting', change: '+31%', isPositive: true, value: 'High Demand' },
    { skill: 'Python Coding', change: '+22%', isPositive: true, value: 'Trending' },
    { skill: 'Data Analysis', change: '+18%', isPositive: true, value: 'Vital' },
    { skill: 'English Communication', change: '+15%', isPositive: true, value: 'Key Skill' },
    { skill: 'Excel Master', change: '+11%', isPositive: true, value: 'Basic' },
    { skill: 'Digital Marketing', change: '+8%', isPositive: true, value: 'Rising' }
  ];

  // Daily Missions
  const defaultMissions: DailyMission[] = [
    { id: 'm1', title: 'Học 5 từ tiếng Anh mới', isChecked: false, xpReward: 50 },
    { id: 'm2', title: 'Đọc 1 bài báo kiến thức ngắn', isChecked: false, xpReward: 50 },
    { id: 'm3', title: 'Luyện nói tiếng Anh / Thuyết trình', isChecked: false, xpReward: 70 },
    { id: 'm4', title: 'Tập thể dục 5 phút', isChecked: false, xpReward: 50 },
    { id: 'm5', title: 'Học 1 bài học lập trình ngắn', isChecked: false, xpReward: 80 }
  ];

  const [activeMissions, setActiveMissions] = useState<DailyMission[]>(defaultMissions);

  // Handle mission check (syncs XP reward to Firestore via prop in parent)
  const handleToggleMission = (missionId: string, checked: boolean) => {
    setActiveMissions(prev => 
      prev.map(m => {
        if (m.id === missionId) {
          // If turning on, add XP. If turning off, deduct.
          const xpDelta = checked ? m.xpReward : -m.xpReward;
          onUpdateWeeklyMission(m.title, xpDelta);
          return { ...m, isChecked: checked };
        }
        return m;
      })
    );
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim());
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  // Static list for ranking competition
  const mockLeaderboard = [
    { rank: 1, name: 'Emma Watson', xp: 8020, level: 'Diamond' },
    { rank: 2, name: 'Alex Nguyen', xp: 8350, level: 'Legend' },
    { rank: 3, name: 'John Doe', xp: 7810, level: 'Diamond' },
    ...(profile ? [{ rank: 15, name: profile.displayName || 'Bạn', xp: profile.xp, level: profile.level }] : [])
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 lg:col-span-8">
      {/* 1. Header Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 lg:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            PROSTOP PLATFORM • SECURE ONLINE
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-serif italic">
            Stop Scrolling. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent not-italic font-sans font-black tracking-tighter uppercase block mt-1.5 text-3xl lg:text-4xl">
              Start Growing.
            </span>
          </h1>
          <p className="text-zinc-400 max-w-xl text-sm lg:text-base leading-relaxed">
            Học tập thực tế, kiểm soát cám dỗ mạng xã hội bằng thời gian chờ thông minh và đồng bộ hóa thành tích thời gian thực với ứng dụng đồng hành di động.
          </p>
        </div>

        {!profile ? (
          <div className="space-y-3 w-full md:w-auto shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">ĐỒNG BỘ DỮ LIỆU CLOUD:</p>
            <button 
              id="desktop_google_auth_btn"
              onClick={onGoogleSignIn}
              className="w-full md:w-auto px-6 py-3.5 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-500 fill-cyan-500/20" />
              Đăng nhập qua Google
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 flex gap-4 items-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#080808] border border-cyan-500/30 flex items-center justify-center font-serif italic font-bold text-cyan-400 text-xl shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono">Cloud Synced</p>
              <h3 className="text-base font-bold text-white font-serif">{profile.displayName}</h3>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động trực tuyến
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div id="stat-card-streak" className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-500/30 transition-all duration-300">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/25">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Chuỗi STREAK</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">{profile ? `${profile.streak} ngày` : '0 ngày'}</p>
          </div>
        </div>

        <div id="stat-card-xp" className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-500/30 transition-all duration-300">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/25">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Kinh Nghiệm</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">{profile ? `${profile.xp} XP` : '0 XP'}</p>
          </div>
        </div>

        <div id="stat-card-saved" className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-500/30 transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Đã tiết kiệm</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">{profile ? `${profile.timeSavedMinutes} Phút` : '0 Phút'}</p>
          </div>
        </div>

        <div id="stat-card-level" className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-500/30 transition-all duration-300">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/25">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Cấp độ LEVEL</p>
            <p className="text-lg font-black text-white mt-1 uppercase tracking-wide">{profile ? profile.level : 'Bronze'}</p>
          </div>
        </div>
      </div>

      {/* 3. Live stock market visual + Daily Missions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Market Visual */}
        <div className="md:col-span-7 glass-panel rounded-3xl p-6 flex flex-col justify-between border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif italic">
                <Activity className="w-4 h-4 text-cyan-400" />
                Thị Trường Kỹ Năng
              </h2>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 tracking-wider uppercase font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                LIVE <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Nhu cầu tuyển dụng của doanh nghiệp so với tuần trước. Thay vì lãng phí thời gian vào mạng xã hội, hãy học những kỹ năng này để tạo dựng lợi thế tương lai vượt trội.
            </p>
          </div>

          <div className="space-y-3.5 mb-6">
            {marketTrends.map((trend, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 hover:bg-white/2 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-600 font-bold">0{i+1}</span>
                  <p className="text-sm font-semibold text-white tracking-tight">{trend.skill}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline">{trend.value}</span>
                  <div className="flex items-center gap-1 font-mono text-cyan-400 font-black text-xs bg-cyan-400/5 px-2.5 py-1 rounded border border-cyan-500/10">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                    {trend.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl text-xs leading-relaxed text-zinc-400">
            <strong className="text-white font-mono text-[10px] uppercase tracking-wider block mb-1">Động lực phát triển:</strong>
            Mỗi lần bạn từ chối bấm mở mạng xã hội vô bổ và hoàn thành bài tập rèn luyện ngắn, hệ thống sẽ ghi nhận tức thì và đồng bộ dòng kinh nghiệm giúp bạn có tương lai vững chắc!
          </div>
        </div>

        {/* Daily Missions */}
        <div className="md:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-serif italic">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/35" />
              Nhiệm Vụ Mỗi Ngày
            </h2>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Hoàn thành các hoạt động bên app đồng hành di động để tích lũy XP. Hoặc tự theo dõi đánh dấu hoàn thành nhanh tại đây:
            </p>

            <div className="space-y-3">
              {activeMissions.map((m) => (
                <label 
                  key={m.id} 
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    m.isChecked 
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-white' 
                    : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={m.isChecked} 
                      onChange={(e) => handleToggleMission(m.id, e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 border-white/10 cursor-pointer"
                    />
                    <span className={`text-xs font-medium ${m.isChecked ? 'line-through text-zinc-500' : ''}`}>
                      {m.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                    +{m.xpReward} XP
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center px-1">
            <span className="text-xs uppercase tracking-wider font-mono text-zinc-500">TỔNG CHỈ TIÊU:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono tracking-wider">+250 XP BONUS</span>
          </div>
        </div>
      </div>

      {/* 4. Groups Study, Competitive Leaderboards & Recent Badges */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* real-time groups */}
        <div className="md:col-span-7 glass-panel rounded-3xl p-6 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif italic">
              <Users className="w-4 h-4 text-cyan-400" />
              Nhóm Học Cộng Đồng
            </h2>
            <button 
              onClick={() => setIsCreatingGroup(!isCreatingGroup)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider font-mono bg-cyan-400/5 hover:bg-cyan-400/10 border border-cyan-400/15 rounded-lg px-2.5 py-1 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Tạo nhóm
            </button>
          </div>

          {isCreatingGroup && (
            <form onSubmit={handleCreateGroupSubmit} className="mb-4 bg-zinc-900 border border-white/10 p-4 rounded-xl space-y-3">
              <input 
                type="text" 
                placeholder="Nhập tên nhóm, vd: Nhóm IT HUST, CLB Tiếng Anh..." 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-[#080808] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <div className="flex justify-end gap-2 text-xs font-bold uppercase tracking-wider font-mono">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded font-bold transition-all shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                >
                  Tạo ngay
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-xs text-zinc-500 text-center py-4 font-mono uppercase tracking-wider">Đang đồng bộ danh sách nhóm...</p>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-zinc-900/10">
                <p className="text-xs text-zinc-500 mb-3">Chưa có nhóm học nào hoạt động.</p>
                <button 
                  onClick={() => setIsCreatingGroup(true)}
                  className="text-xs font-bold uppercase tracking-wider font-mono px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg border border-white/10 transition-colors"
                >
                  Tạo Nhóm Đầu Tiên
                </button>
              </div>
            ) : (
              groups.map((g) => {
                const isJoined = profile && g.memberUids.includes(profile.uid);
                return (
                  <div key={g.groupId} className="flex justify-between items-center p-3.5 bg-zinc-900/55 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {g.name}
                        {isJoined && <span className="text-[9px] font-sans font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">Thành viên</span>}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono uppercase tracking-tight">
                        {g.memberUids.length} thành viên • Tổng {g.totalXp} XP Nhóm
                      </p>
                    </div>
                    {!isJoined ? (
                      <button 
                        onClick={() => onJoinGroup(g.groupId)}
                        disabled={!profile}
                        className="text-[10px] font-bold uppercase tracking-wider font-mono px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded transition-all disabled:opacity-30 disabled:hover:bg-cyan-400"
                      >
                        Vào nhóm
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã tham gia
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Global Competitors Leaderboard */}
        <div className="md:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-serif italic">
              <Users className="w-4 h-4 text-purple-400" />
              Bảng Xếp Hạng Tuần
            </h2>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Cạnh tranh lành mạnh cùng cộng đồng học tập, xa rời các cột mốc tương tác ảo:
            </p>

            <div className="space-y-3">
              {mockLeaderboard.map((user, index) => {
                const isMe = profile && user.name === (profile.displayName || 'Bạn');
                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isMe 
                      ? 'bg-gradient-to-r from-cyan-900/10 to-emerald-900/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                      : 'bg-zinc-900/50 border border-transparent hover:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center text-xs font-mono font-black ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-amber-600' : 'text-zinc-550'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className={`text-xs font-bold ${isMe ? 'text-cyan-400' : 'text-white'}`}>
                          {user.name} {isMe && '(Bạn)'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-tight">Trình độ: {user.level}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-cyan-400 shrink-0 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-500/10">
                      {user.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block font-mono">
              Cập nhật lại sau mỗi 7 ngày hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* 5. Achievements Badge system */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-serif italic">
          <Award className="w-4 h-4 text-cyan-400" />
          Huy Chương Danh Dự
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className={`p-4 rounded-2xl border text-center transition-all ${profile && profile.skillsLearnedCount >= 1 ? 'bg-amber-500/5 border-amber-500/25 text-amber-300' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <Award className="w-8 h-8 mx-auto mb-2 text-amber-400" />
            <p className="text-xs font-bold font-serif">First Step</p>
            <p className="text-[10px] text-zinc-500 mt-1">Lần đầu học thành công</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center transition-all ${profile && profile.streak >= 7 ? 'bg-orange-500/5 border-orange-500/25 text-orange-400' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-xs font-bold font-serif">7-Day Glory</p>
            <p className="text-[10px] text-zinc-500 mt-1">Giữ chuỗi 7 ngày liên tục</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center transition-all ${completedChallenges.some(c => c.type === 'learn' || c.type === 'quiz') ? 'bg-cyan-500/5 border-cyan-500/25 text-cyan-300' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <p className="text-xs font-bold font-serif">English Pro</p>
            <p className="text-[10px] text-zinc-500 mt-1">Làm chủ câu hỏi từ vựng</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center transition-all ${completedChallenges.some(c => c.type === 'article' || c.type === 'podcast') ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-300' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <Award className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-xs font-bold font-serif">Reading Master</p>
            <p className="text-[10px] text-zinc-500 mt-1">Đọc bài học bổ ích</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center transition-all ${completedChallenges.some(c => c.type === 'workout') ? 'bg-rose-500/5 border-rose-500/25 text-rose-300' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <Award className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="text-xs font-bold font-serif">Workout Hero</p>
            <p className="text-[10px] text-zinc-500 mt-1">Khỏe mạnh 5 phút thể dục</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center transition-all ${profile && profile.xp >= 1000 ? 'bg-purple-500/5 border-purple-500/25 text-purple-300' : 'bg-black/20 border-white/5 text-zinc-650 opacity-30 shadow-inner'}`}>
            <Star className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="text-xs font-bold font-serif">XP Millionaire</p>
            <p className="text-[10px] text-zinc-500 mt-1">Đạt tích lũy 1,000 XP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
