import React, { useState, useEffect } from 'react';
import { 
  Flame, Zap, Clock, Shield, Sparkles, LogOut, 
  RefreshCw, Smartphone, Star, Trophy, Users, HelpCircle, 
  Moon, CheckCircle2, Award, BookOpen, AlertCircle
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  arrayUnion,
  addDoc
} from 'firebase/firestore';
import { UserProfile, CompletedChallenge, Group, LevelName, ChallengeType } from './types';
import DesktopDashboard from './components/DesktopDashboard';
import PhoneSimulator from './components/PhoneSimulator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSyncIntro, setShowSyncIntro] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Initial connection check on startup as required by Firebase skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase Connection verified successfully.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network access. Firestore client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Fetch or initialize UserProfile & subcollections in Firestore
  const setupUserSync = async (uid: string, email: string, displayName: string, isGuest: boolean = false) => {
    const userDocRef = doc(db, 'users', uid);
    const pathForGet = `users/${uid}`;
    
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        // Create initial default profile in real-time Firestore database
        const newProfile: UserProfile = {
          uid,
          email,
          displayName,
          dailyLimitMinutes: 60,
          currentUsageMinutes: 15,
          xp: 120,
          level: LevelName.Bronze,
          streak: 3,
          timeSavedMinutes: 30,
          skillsLearnedCount: 2,
          lastActiveAt: new Date().toISOString()
        };
        
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, pathForGet);
    }
  };

  // 3. Setup persistent Guest ID to allow frictionless Firestore syncing inside the preview frame
  useEffect(() => {
    let unsubscribeUser: () => void = () => {};
    let unsubscribeChallenges: () => void = () => {};
    let unsubscribeGroups: () => void = () => {};

    // Listen to real-time auth changes
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        
        // Setup Firestore document sync for Google User
        await setupUserSync(
          firebaseUser.uid, 
          firebaseUser.email || 'user@prostop.app', 
          firebaseUser.displayName || 'Học viên Pro'
        );

        // Bind real-time snapshot listeners for the profile
        const pathProfile = `users/${firebaseUser.uid}`;
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, pathProfile);
        });

        // Bind real-time snapshot listeners for the challenges completed
        const pathChallenges = `users/${firebaseUser.uid}/completedChallenges`;
        unsubscribeChallenges = onSnapshot(collection(db, 'users', firebaseUser.uid, 'completedChallenges'), (snapshot) => {
          const list: CompletedChallenge[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as CompletedChallenge);
          });
          setCompletedChallenges(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, pathChallenges);
        });

      } else {
        // FALLBACK: Load a guest profile stored in local storage to keep 100% active Firestore synchronization!
        let guestId = localStorage.getItem('prostop_guest_uid');
        if (!guestId) {
          guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('prostop_guest_uid', guestId);
        }

        setCurrentUser(null);
        await setupUserSync(guestId, `${guestId}@prostop.app`, 'Học Viên Tập Sự', true);

        // Bind real-time snapshot listeners for guest profile
        const pathProfile = `users/${guestId}`;
        unsubscribeUser = onSnapshot(doc(db, 'users', guestId), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, pathProfile);
        });

        // Bind real-time snapshot listeners for guest challenges
        const pathChallenges = `users/${guestId}/completedChallenges`;
        unsubscribeChallenges = onSnapshot(collection(db, 'users', guestId, 'completedChallenges'), (snapshot) => {
          const list: CompletedChallenge[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as CompletedChallenge);
          });
          setCompletedChallenges(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, pathChallenges);
        });
      }
      setIsLoading(false);
    });

    // 4. Live community groups global snapshot listener
    const pathGroups = 'groups';
    unsubscribeGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const list: Group[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Group);
      });
      setGroups(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathGroups);
    });

    return () => {
      unsubAuth();
      unsubscribeUser();
      unsubscribeChallenges();
      unsubscribeGroups();
    };
  }, []);

  // Action: Add completed learn/workout challenge & add XP with dynamic Level calculation
  const handleAddChallenge = async (type: ChallengeType, title: string, xpEarned: number) => {
    if (!profile) return;
    const uid = profile.uid;
    const challengeId = 'ch_' + Date.now();
    const pathCreate = `users/${uid}/completedChallenges/${challengeId}`;
    const pathProfile = `users/${uid}`;

    try {
      // 1. Write the completed challenge document
      const newChallenge: CompletedChallenge = {
        id: challengeId,
        userId: uid,
        type,
        title,
        xpEarned,
        completedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid, 'completedChallenges', challengeId), newChallenge);

      // 2. Compute level updates
      const totalXp = profile.xp + xpEarned;
      let calculatedLevel = LevelName.Bronze;
      if (totalXp >= 1500) calculatedLevel = LevelName.Legend;
      else if (totalXp >= 1000) calculatedLevel = LevelName.Master;
      else if (totalXp >= 600) calculatedLevel = LevelName.Diamond;
      else if (totalXp >= 350) calculatedLevel = LevelName.Gold;
      else if (totalXp >= 200) calculatedLevel = LevelName.Silver;

      const incrementedUsage = Math.max(profile.currentUsageMinutes - 5, 0); // completing a challenge substracts addictive screen temptation/credits!

      // 3. Mutate profile counters in Firestore
      await updateDoc(doc(db, 'users', uid), {
        xp: totalXp,
        level: calculatedLevel,
        skillsLearnedCount: profile.skillsLearnedCount + 1,
        timeSavedMinutes: profile.timeSavedMinutes + 15, // each healthy action saves 15m lướt MXH vô bổ
        currentUsageMinutes: incrementedUsage
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathCreate);
    }
  };

  // Action: Increment social media screen usage simulation
  const handleIncrementUsage = async (minutesDelta: number) => {
    if (!profile) return;
    const uid = profile.uid;
    const pathProfile = `users/${uid}`;

    try {
      const currentUsage = profile.currentUsageMinutes + minutesDelta;
      await updateDoc(doc(db, 'users', uid), {
        currentUsageMinutes: Math.min(currentUsage, 1440)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathProfile);
    }
  };

  // Action: Modify daily screen time limit minutes
  const handleUpdateLimit = async (minutes: number) => {
    if (!profile) return;
    const uid = profile.uid;
    const pathProfile = `users/${uid}`;

    try {
      await updateDoc(doc(db, 'users', uid), {
        dailyLimitMinutes: minutes
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathProfile);
    }
  };

  // Action: Manually gain XP from finishing daily tasks or smart pause choices
  const handleSyncXpAndStreak = async (xpAdded: number, streakDelta: number, timeSavedAdded: number, taskFinished: boolean) => {
    if (!profile) return;
    const uid = profile.uid;
    const pathProfile = `users/${uid}`;

    try {
      const totalXp = profile.xp + xpAdded;
      let calculatedLevel = LevelName.Bronze;
      if (totalXp >= 1500) calculatedLevel = LevelName.Legend;
      else if (totalXp >= 1000) calculatedLevel = LevelName.Master;
      else if (totalXp >= 600) calculatedLevel = LevelName.Diamond;
      else if (totalXp >= 350) calculatedLevel = LevelName.Gold;
      else if (totalXp >= 200) calculatedLevel = LevelName.Silver;

      await updateDoc(doc(db, 'users', uid), {
        xp: totalXp,
        level: calculatedLevel,
        streak: profile.streak + streakDelta,
        timeSavedMinutes: profile.timeSavedMinutes + timeSavedAdded,
        skillsLearnedCount: profile.skillsLearnedCount + (taskFinished ? 1 : 0)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathProfile);
    }
  };

  // Action: Create community group and write directly to global `/groups` collection
  const handleCreateGroup = async (name: string) => {
    if (!profile) return;
    const groupId = 'group_' + Math.random().toString(36).substring(2, 9);
    const pathCreate = `groups/${groupId}`;

    try {
      const newGroup: Group = {
        groupId,
        name,
        creatorId: profile.uid,
        memberUids: [profile.uid],
        totalXp: profile.xp,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'groups', groupId), newGroup);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathCreate);
    }
  };

  // Action: Join existing community group
  const handleJoinGroup = async (groupId: string) => {
    if (!profile) return;
    const pathUpdate = `groups/${groupId}`;

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberUids: arrayUnion(profile.uid)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathUpdate);
    }
  };

  // Google Provider Sing In authentication
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth failed inside this context:", error);
      if (error?.code === "auth/cancelled-popup-request" || error?.code === "auth/popup-closed-by-user" || error?.message?.includes("closed") || error?.message?.includes("cancel")) {
        setAuthError("Đăng nhập bằng Google bị đóng hoặc bị chặn. Mẹo: Hãy mở rộng preview (nút Mở trang mới bên cạnh thanh địa chỉ) để đăng nhập Google Auth dễ dàng hơn.");
      } else {
        setAuthError("Không thể hoàn tất đăng nhập Google: " + (error?.message || "Lỗi chưa rõ"));
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clean guest profile storage if needed
      localStorage.removeItem('prostop_guest_uid');
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white">
      
      {/* 1. Header Toolbar */}
      <header className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/10 py-5 px-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-zinc-900 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-serif italic">
              ProStop
              <span className="text-[9px] font-sans bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-400/20 font-bold tracking-widest uppercase">Companion</span>
            </h1>
            <p className="text-[10px] tracking-wide text-zinc-400 font-mono hidden sm:block uppercase">STOP SCROLLING, START GROWING • REAL-TIME COLUDBASE SYNC</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-300 hidden md:inline truncate max-w-[150px] font-medium font-mono bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-full">
                {currentUser.displayName}
              </span>
              <button 
                onClick={handleSignOut}
                className="p-2 border border-white/10 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              id="header_login_btn"
              onClick={handleGoogleSignIn}
              className="text-xs px-4 py-2 border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold shadow-md hover:border-cyan-400/40 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
              Kết nối Google
            </button>
          )}
        </div>
      </header>

      {/* 2. Sync notification intro */}
      {showSyncIntro && (
        <div className="bg-zinc-950 border-b border-cyan-500/20 py-3 px-6 flex justify-between items-center text-xs text-cyan-200 font-mono tracking-tight">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>
              💡 <strong>REAL-TIME SYNC:</strong> Dữ liệu giữa <strong>điện thoại companion (bên phải)</strong> và <strong>bảng hiển thị (bên trái)</strong> đồng bộ tức thì qua Firestore. Hãy tăng hạn mức hoặc hoàn thành thử thách!
            </span>
          </div>
          <button 
            onClick={() => setShowSyncIntro(false)}
            className="text-zinc-500 hover:text-white font-bold px-2 py-0.5 ml-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Auth Failure warning notice */}
      {authError && (
        <div className="bg-amber-950/40 border-b border-amber-500/20 py-3 px-6 flex justify-between items-center text-xs text-amber-200 font-mono tracking-tight animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button 
            onClick={() => setAuthError(null)}
            className="text-amber-500 hover:text-white font-bold px-2 py-0.5 ml-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Side: Web App platform */}
        <DesktopDashboard 
          profile={profile}
          completedChallenges={completedChallenges}
          groups={groups}
          isLoading={isLoading}
          onUpdateWeeklyMission={(title, xpDelta) => {
            handleSyncXpAndStreak(xpDelta, 0, 0, xpDelta > 0);
          }}
          onJoinGroup={handleJoinGroup}
          onCreateGroup={handleCreateGroup}
          onGoogleSignIn={handleGoogleSignIn}
        />

        {/* Right Side: Smartphone companion client */}
        <PhoneSimulator 
          profile={profile}
          onAddChallenge={handleAddChallenge}
          onUpdateLimit={handleUpdateLimit}
          onIncrementUsage={handleIncrementUsage}
          onSyncXpAndStreak={handleSyncXpAndStreak}
        />

      </main>

      {/* 4. Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-[11px] text-gray-500 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 ProStop Platform Inc. Stop scrolling for dopamine, start growing for your future.</p>
        <div className="flex gap-4">
          <span className="text-emerald-400 font-semibold">● Cloud Persistent database Enabled</span>
          <span className="text-blue-400 font-semibold">● Server-side AI habits analyzer active</span>
        </div>
      </footer>

    </div>
  );
}
