import React, { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../pages/PhishBlasterGame";
import cyberQuestLogo from "../assets/cyber_logo.jpeg";
import LoadingOverlay from "../components/LoadingOverlay";

import DashboardSkeleton from "../components/DashboardSkeleton";
import {
  getUserDashboard,
  getGlobalLeaderboard,
  getGames,
  getUserProgress,
  updateMyAccount 
} from "../services/api";
import { useNavigate } from "react-router-dom";



const CYBER_TIPS = [
  "Think before you post — once it's online, it can stay forever.",
  "Use strong, unique passwords for every account.",
  "Review your privacy settings regularly on your apps and social media.",
  "Avoid oversharing your birthday, school, or address online.",
  "Limit location sharing — not everyone needs to know where you are.",
  "Be cautious with 'fun' quizzes and random apps that want your data.",
]; // from best-practice section of the module :contentReference[oaicite:1]{index=1}

const SAFETY_CHECKLIST = [
    "Think before you post anything online.",
    "Use strong, unique passwords or passphrases.",
    "Turn on multi-factor authentication (MFA) when possible.",
    "Review your app and social media privacy settings regularly.",
    "Limit location sharing and avoid posting your real-time location.",
    "Never overshare personal details like school, home address, or full birthday.",
  ];  

// inside src/pages/Dashboard.jsx (top of file, after imports)

function TopicProgressCard({ topic }) {
    const { title, emoji, percent } = topic;
  
    return (
      <div className="topic-card">
        <div className="topic-card-header">
          <div className="topic-emoji">{emoji || "📘"}</div>
          <div className="topic-text">
            <h3>{title}</h3>
            <p className="topic-sub">
              {percent >= 100 ? "Completed 🎉" : "Keep going!"}
            </p>
          </div>
        </div>
  
        <div className="topic-card-body">
          <div
            className="topic-ring"
            style={{ "--value": percent }}
          >
            <div className="topic-ring-center">
              <span className="topic-ring-percent">{percent}%</span>
              <span className="topic-ring-label">Mastery</span>
            </div>
          </div>
  
          <div className="topic-details">
            <p className="topic-hint">
              {percent >= 100
                ? "You answered all questions correctly!"
                : "Answer all questions correctly to fill the circle."}
            </p>
          </div>
        </div>
      </div>
    );
  }  

function GameCard({ game, progress, onPlay, locked, prereqTitle }) {
    const percent = progress?.percent ?? 0;
    const bestScore = progress?.best_score ?? 0;
    const maxScore = progress?.max_score ?? 0;
  
    const isComplete = percent >= 100;
  
    return (
      <div className="game-card kids-card">
        {/* header */}
        <div className="game-card-header">
          <span className="game-icon">{game.emoji}</span>
          <div className="game-header-text">
            <h5 className="game-title"> Lesson {game.id} : {game.title}</h5>
            <p className="game-subtitle">CyberQuest.TO Quiz</p>
          </div>
          {locked ? (
            <span className="badge badge-locked">Locked</span>
          ) : isComplete ? (
            <span className="badge badge-complete">Completed</span>
          ) : (
            <span className="badge badge-progress">In progress</span>
          )}
        </div>
  
        {/* progress */}
        <div className="game-card-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="progress-percent">{percent}%</span>
        </div>
  
        {/* footer */}
        <div className="game-card-footer">
          <span className="score-text">
            Best: <strong>{bestScore}</strong> / {maxScore}
          </span>
          <button
            className={`play-btn ${locked ? "play-btn-disabled" : ""}`}
            onClick={locked ? undefined : onPlay}
            disabled={locked}
          >
            {locked ? "Finish previous" : "▶ Start"}
          </button>
        </div>
  
        {locked && prereqTitle && (
          <p className="locked-text">
            Unlock by completing <strong>{prereqTitle}</strong>.
          </p>
        )}
      </div>
    );
  }  
  

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserId = localStorage.getItem("user_id");
        if (!storedUserId) {
          navigate("/");
          return;
        }

        const [userData, leaderboardData, gameData, progressData] =
          await Promise.all([
            getUserDashboard(storedUserId),
            getGlobalLeaderboard(),
            getGames(),
            getUserProgress(storedUserId),
          ]);

        setUser(userData);
        setLeaderboard(leaderboardData);
        setGames(gameData);
        setTopicProgress(progressData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);


const [acctBusy, setAcctBusy] = useState(false);
const [acctForm, setAcctForm] = useState({
  username: "",
  current_password: "",
  new_password: "",
});
const [acctNotice, setAcctNotice] = useState(null); 
// { type: "success"|"error"|"info", title: "", msg: "" }

const openAccount = () => {
  setAcctNotice(null);
  setAcctForm({
    username: user?.username || "",
    current_password: "",
    new_password: "",
  });
  setShowAccount(true);
};

const closeAccount = () => {
  if (acctBusy) return;
  setShowAccount(false);
};

const submitAccount = async (e) => {
  e.preventDefault();
  setAcctNotice(null);

  if (!acctForm.current_password) {
    setAcctNotice({
      type: "error",
      title: "Missing current password",
      msg: "Please type your current password to confirm changes.",
    });
    return;
  }

  setAcctBusy(true);
  try {
    const payload = {
      username: acctForm.username?.trim() || null,
      current_password: acctForm.current_password,
      new_password: acctForm.new_password ? acctForm.new_password : null,
    };

    const res = await updateMyAccount(payload);

    // update UI immediately
    setUser((p) => ({ ...p, username: res.data.username }));
    localStorage.setItem("username", res.data.username);

    setAcctForm((p) => ({ ...p, current_password: "", new_password: "" }));

    setAcctNotice({
      type: "success",
      title: "Saved!",
      msg: "Your account details were updated successfully.",
    });
  } catch (err) {
    const detail = err?.response?.data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((d) => d?.msg).filter(Boolean).join("\n")
        : "Update failed. Please try again.";

    setAcctNotice({
      type: "error",
      title: "Update failed",
      msg,
    });
  } finally {
    setAcctBusy(false);
  }
};
  

const quizGames = games.filter((g) => g.is_quiz);       // only 4 topics
const adventureGames = games.filter((g) => !g.is_quiz); // Anti-Phish etc.

const quizProgress = useMemo(() => {
    if (!topicProgress.length || !quizGames.length) return [];
  
    const quizIds = new Set(quizGames.map((g) => g.id));
  
    // adjust `p.game_id` to `p.gameId` if that’s the field name you use
    return topicProgress.filter((p) => quizIds.has(p.game_id));
  }, [topicProgress, quizGames]);

  const summary = useMemo(() => {
    if (!quizProgress.length) return null;
  
    const completed = quizProgress.filter((p) => p.percent >= 100).length;
    const total = quizProgress.length;
    const overallPercent =
      quizProgress.reduce((sum, p) => sum + p.percent, 0) / total;
  
    const nextTopic = quizProgress.find((p) => p.percent < 100);
  
    return {
      completed,
      total,
      overallPercent: Math.round(overallPercent),
      nextTopic,
    };
  }, [quizProgress]);
  

  const topicsCompleted = summary?.completed ?? 0;
  const totalTopics = summary?.total ?? (topicProgress?.length || 4);

  const levelLabel = summary
  ? summary.overallPercent === 100
    ? "Cyber Quest Pro"
    : summary.overallPercent >= 50
    ? "Cyber Quest Explorer"
    : "Cyber Quest Beginner"
  : "Cyber Quest Beginner";

  const todaysTip = useMemo(() => {
    if (!CYBER_TIPS.length) return "";
    const index = new Date().getDate() % CYBER_TIPS.length;
    return CYBER_TIPS[index];
  }, []);

  const handlePlayGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/");
  };

  const getProgressForGame = (gameId) =>
    topicProgress.find((p) => p.game_id === gameId);

    if (loading) {
        return (
          <div className="dashboard-container">
            <DashboardSkeleton />
          </div>
        );
      }
  if (!user) return <p>Error loading user data.</p>;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header kids-header">
      <div className="header-left">
       <div className="shield-circle"><img
                  src={cyberQuestLogo}
                  alt="CyberQuest logo"
                  className="hero-logo"
                /></div>
       <div>
        <div></div>
         <h1>Hello, {user.username}!</h1>
         <p>
           Age: {user.age} · Global Score: <strong>{user.high_score ?? 0}</strong>
         </p>
         <span className="level-chip">{levelLabel}</span>
       </div>
     </div>

      
        <div className="header-buttons">

        {localStorage.getItem("is_admin") === "1" && (
          <button className="dash-admin-btn" onClick={() => navigate("/admin")}>
            🛠 Admin Panel
          </button>
        )}
          
          <button className="ghost-button" type="button" onClick={() => setShowAccount(true)}>
            ⚙️ Account
          </button>

          <button className="logout-button" onClick={handleLogout}>
            Logout ➜]
          </button>
  
        </div>
      </header>

      {/* <header className="site-branding">
      <div className="brand-left">
        <img
          src={cyberQuestLogo}
          alt="CyberQuest logo"
          className="brand-logo"
        />
        <div className="brand-text">
          <h1>CyberQuest</h1>
          <p>Level up your digital defense</p>
        </div>
      </div>
    </header> */}

      <section className="section-heading">
         <span className="section-label">
           🧭 Your CyberQuest.TO Journey
         </span>
      </section>

      <section className="dashboard-row">
          {/* Progress Summary */}
          <div className="summary-card">
            <div className="card-title-row">
              <span className="card-icon">📊</span>
              <h2>Progress Summary</h2>
            </div>

            {summary ? (
              <>
                <p>
                  Topics completed:{" "}
                  <strong>{summary.completed}</strong> / {summary.total}
                </p>
            
                <div className="summary-progress-bar">
                  <div
                    className="summary-progress-fill"
                    style={{ width: `${summary.overallPercent}%` }}
                  />
                </div>
            
                <p className="overall-text">
                  Overall completion: {summary.overallPercent}%
                </p>
            
                {summary.nextTopic && (
                  <p className="next-topic">
                    Next recommended topic:{" "}
                    <strong>
                      {summary.nextTopic.emoji} {summary.nextTopic.title}
                    </strong>
                  </p>
                )}
              </>
            ) : (
              <p>Play your first quiz to start tracking your progress!</p>
            )}
          </div>

          {/* Cyber Safety Tip */}
          <div className="tip-card">
            <div className="card-title-row">
              <span className="card-icon">💡</span>
              <h2>CyberQuest.TO Tip</h2>
            </div>
            <p>{todaysTip}</p>
          </div>
            
          {/* Your Achievements */}
          <div className="achieve-card">
            <div className="card-title-row">
              <span className="card-icon">🏅</span>
              <h2>Your Achievements</h2>
            </div>
            <ul className="achieve-list">
              <li>⭐ Topics completed: {topicsCompleted} / {totalTopics}</li>
              <li>🎯 Highest score: {user.high_score ?? 0}</li>
            </ul>
          </div>
        </section>

        <section className="topics-progress-section">
           <div className="section-header">
             <h2>Topic Progress</h2>
             <p>
               Each ring fills when you answer <strong>all</strong> questions
               correctly for that topic.
             </p>
           </div>
                     
           <div className="topics-grid">
           {topicProgress
            .filter((topic) => {
              const game = games.find((g) => g.id === topic.game_id);
              return game?.is_quiz;     // only quizzes allowed
            })
            .map((topic) => (
              <TopicProgressCard key={topic.game_id} topic={topic} />
            ))}
           </div>
         </section>

    {/* Smart habits section (checklist + why it matters) */}
    <section className="info-section">
      <div className="info-title">
        <h2>🧠 Smart Online Habits</h2>
        <p>Remember these ideas whenever you learn, play, or chat online.</p>
      </div>

      <div className="info-grid">
        {/* left: checklist */}
        <div className="safety-card">
          <h2>🛡️ CyberQuest.TO Checklist</h2>
          <p className="safety-intro">
            Before you go online, remember these smart habits from your lessons.
          </p>
          {/* keep your existing checklist list here */}
         <ul className="safety-list">
           {SAFETY_CHECKLIST.map((item, idx) => (
             <li key={idx}>
               <span className="safety-bullet">✔</span>
               <span>{item}</span>
             </li>
           ))}
         </ul>
        </div>

        {/* right: why it matters */}
        <div className="why-card">
          <h2>🌍 Why CyberQuest.TO Portal Matters</h2>
          <p>
            The internet is an amazing place to learn, create, play, and connect
            with others. But just like crossing the street, we need to stay smart
            and safe. These topics help you protect your identity, your passwords,
            and your digital footprint — now and in the future.
          </p>
        </div>
      </div>
    </section>


      {/* Topic description heading */}
      <section className="topic-overview">
        <h2>🧙‍♂️ CyberQuest.TO Topics</h2>
        <p className="topic-overview-text">
          These four quizzes match your lesson topics: digital footprints,
          personal information, passwords & passphrases, and social media
          privacy. Each game uses real-life scenarios just like in your module.
        </p>
      </section>

      {/* Game Cards */}
      <section className="game-cards">
          {games
            .slice() // copy to avoid mutating
            .sort((a, b) => a.id - b.id)
            .map((game, index, arr) => {
              const progress = getProgressForGame(game.id);
              let locked = false;
              let prereqTitle = "";
            
              if (index > 0) {
                const prevGame = arr[index - 1];
                const prevProgress = getProgressForGame(prevGame.id);
                if (!prevProgress || prevProgress.percent < 100) {
                  locked = false;
                  prereqTitle = prevGame.title;
                }
              }
          
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  progress={progress}
                  locked={locked}
                  prereqTitle={prereqTitle}
                  onPlay={() => handlePlayGame(game.id)}
                />
              );
            })}
        </section>

        <div className="center-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => navigate("/adventure", { state: { userId: user.id } })}
          >
            Anti-Phish Blaster 🎮
          </button>

          <button
            className="ghost-button"
            type="button"
            onClick={() => navigate("/glossary")}
          >
            Glossary 📚
          </button>
        </div>


      {/* Leaderboard */}
      <section className="leaderboard-section kids-leaderboard">
        <h2>🏆 Global Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>High Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr
                key={item.id}
                className={
                  item.id === user.id ? "leaderboard-row-current" : ""
                }
              >
                <td>{index + 1}</td>
                <td>{item.username}</td>
                <td>{item.high_score}</td>
              </tr> 
            ))}
          </tbody>
        </table>
      </section>

      {showAccount && (
        <div className="acct-backdrop" onClick={closeAccount}>
          <div className="acct-modal" onClick={(e) => e.stopPropagation()}>
            <div className="acct-header">
              <div>
                <h3 className="acct-title">👤 Account Settings</h3>
                <p className="acct-subtitle">Change your username or password.</p>
              </div>

              <button className="acct-close" onClick={closeAccount} disabled={acctBusy}>
                ✖
              </button>
            </div>

            {acctNotice && (
              <div className={`acct-notice ${acctNotice.type}`}>
                <div className="acct-notice-icon">
                  {acctNotice.type === "success" ? "✅" : acctNotice.type === "error" ? "⚠️" : "ℹ️"}
                </div>
            
                <div>
                  <div className="acct-notice-title">{acctNotice.title}</div>
                  <div className="acct-notice-msg" style={{ whiteSpace: "pre-line" }}>
                    {acctNotice.msg}
                  </div>
                </div>
            
                <button className="acct-notice-x" onClick={() => setAcctNotice(null)}>
                  ✕
                </button>
              </div>
            )}

            <form className="acct-form" onSubmit={submitAccount}>
              <div className="acct-field">
                <label>Username</label>
                <input
                  value={acctForm.username}
                  onChange={(e) => setAcctForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Your username"
                  minLength={3}
                  maxLength={30}
                />
                <div className="acct-hint">This will be shown in the leaderboard.</div>
              </div>
            
              <div className="acct-field">
                <label>Current Password (required)</label>
                <input
                  type="password"
                  value={acctForm.current_password}
                  onChange={(e) =>
                    setAcctForm((p) => ({ ...p, current_password: e.target.value }))
                  }
                  placeholder="Enter your current password"
                  required
                />
              </div>
                
              <div className="acct-field">
                <label>New Password (optional)</label>
                <input
                  type="password"
                  value={acctForm.new_password}
                  onChange={(e) => setAcctForm((p) => ({ ...p, new_password: e.target.value }))}
                  placeholder="Leave blank to keep your password"
                />
                <div className="acct-hint">Tip: use at least 6 characters.</div>
              </div>
                
              <div className="acct-actions">
                <button type="button" className="acct-btn ghost" onClick={closeAccount} disabled={acctBusy}>
                  Cancel
                </button>
                
                <button type="submit" className="acct-btn primary" disabled={acctBusy}>
                  {acctBusy ? (
                    <span className="acct-loading">
                      Saving <span className="dot" /> <span className="dot" /> <span className="dot" />
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
