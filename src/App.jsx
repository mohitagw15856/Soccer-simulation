import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, TrendingUp, Zap, Clock } from 'lucide-react';

const SoccerSimulation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Game state
  const [gameState, setGameState] = useState({
    minute: 0,
    score: { home: 0, away: 0 },
    possession: { home: 50, away: 50 },
    stats: {
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    },
    events: [],
    isPlaying: false,
    speed: 5,
    momentum: { home: 50, away: 50 }
  });

  // Team configuration
  const [teams, setTeams] = useState({
    home: { name: 'FC Odds-Based', color: '#3B82F6', formation: '4-4-2' },
    away: { name: 'United Implied', color: '#EF4444', formation: '4-3-3' }
  });

  // Odds configuration
  const [odds, setOdds] = useState({
    homeWin: 1.65,
    draw: 3.50,
    awayWin: 5.00,
    xgHome: 1.8,
    xgAway: 1.2,
    foulsHome: 12,
    foulsAway: 14,
    yellowsHome: 2.2,
    yellowsAway: 2.8,
    redsHome: 0.12,
    redsAway: 0.18,
    possessionHome: 55
  });

  // Ball and player positions
  const [ball, setBall] = useState({ x: 400, y: 200, vx: 0, vy: 0 });
  const [players, setPlayers] = useState([]);
  const [varCheck, setVarCheck] = useState(null);
  const [showVarPopup, setShowVarPopup] = useState(false);

  // Initialize players based on formations
  useEffect(() => {
    const initPlayers = () => {
      const homePlayers = generateFormation('4-4-2', teams.home.color, 'home');
      const awayPlayers = generateFormation('4-3-3', teams.away.color, 'away');
      setPlayers([...homePlayers, ...awayPlayers]);
    };
    initPlayers();
  }, []);

  const generateFormation = (formation, color, team) => {
    const formations = {
      '4-4-2': [
        { x: 100, y: 200 },
        { x: 180, y: 100 }, { x: 180, y: 160 }, { x: 180, y: 240 }, { x: 180, y: 300 },
        { x: 280, y: 100 }, { x: 280, y: 160 }, { x: 280, y: 240 }, { x: 280, y: 300 },
        { x: 360, y: 150 }, { x: 360, y: 250 }
      ],
      '4-3-3': [
        { x: 700, y: 200 },
        { x: 620, y: 100 }, { x: 620, y: 160 }, { x: 620, y: 240 }, { x: 620, y: 300 },
        { x: 520, y: 130 }, { x: 520, y: 200 }, { x: 520, y: 270 },
        { x: 440, y: 100 }, { x: 440, y: 200 }, { x: 440, y: 300 }
      ]
    };

    return formations[formation].map((pos, i) => ({
      id: `${team}-${i}`,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      team,
      color,
      role: i === 0 ? 'GK' : i < 5 ? 'DEF' : i < 9 ? 'MID' : 'ATT'
    }));
  };

  // Simulation engine
  useEffect(() => {
    if (!gameState.isPlaying || gameState.minute >= 90) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const newMinute = prev.minute + (prev.speed / 60);
        if (newMinute >= 90) {
          return { ...prev, minute: 90, isPlaying: false };
        }

        const events = generateEvents(prev, newMinute);
        
        return {
          ...prev,
          minute: newMinute,
          events: [...prev.events, ...events],
          ...processEvents(prev, events)
        };
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.speed]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      drawField(ctx);
      drawPlayers(ctx);
      drawBall(ctx);
      updatePhysics();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [players, ball]);

  const drawField = (ctx) => {
    ctx.fillStyle = '#1a4d2e';
    ctx.fillRect(0, 0, 800, 400);

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1a5c36' : '#1a4d2e';
      ctx.fillRect(i * 40, 0, 40, 400);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    ctx.strokeRect(10, 10, 780, 380);

    ctx.beginPath();
    ctx.moveTo(400, 10);
    ctx.lineTo(400, 390);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(400, 200, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeRect(10, 120, 80, 160);
    ctx.strokeRect(710, 120, 80, 160);

    ctx.strokeRect(10, 160, 30, 80);
    ctx.strokeRect(760, 160, 30, 80);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 170, 10, 60);
    ctx.fillRect(790, 170, 10, 60);
  };

  const drawPlayers = (ctx) => {
    players.forEach(player => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(player.x + 2, player.y + 2, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };

  const drawBall = (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 1, ball.y + 1, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, 5);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#d0d0d0');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const updatePhysics = () => {
    setBall(prev => ({
      x: Math.max(15, Math.min(785, prev.x + prev.vx)),
      y: Math.max(15, Math.min(385, prev.y + prev.vy)),
      vx: prev.vx * 0.98,
      vy: prev.vy * 0.98
    }));

    setPlayers(prev => prev.map(player => {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 50) {
        const speed = 0.5;
        return {
          ...player,
          x: player.x + (dx / dist) * speed,
          y: player.y + (dy / dist) * speed
        };
      }
      return player;
    }));
  };

  const generateEvents = (state, minute) => {
    const events = [];
    const probPerSecond = 1 / 60;

    const homeMomentum = state.momentum.home / 100;
    const awayMomentum = state.momentum.away / 100;

    const homeGoalProb = (odds.xgHome / 90) * probPerSecond * homeMomentum;
    const awayGoalProb = (odds.xgAway / 90) * probPerSecond * awayMomentum;

    if (Math.random() < homeGoalProb) {
      events.push(createEvent('goal', 'home', minute));
    }
    if (Math.random() < awayGoalProb) {
      events.push(createEvent('goal', 'away', minute));
    }

    const homeFoulProb = (odds.foulsHome / 90) * probPerSecond;
    const awayFoulProb = (odds.foulsAway / 90) * probPerSecond;

    if (Math.random() < homeFoulProb) {
      events.push(createEvent('foul', 'home', minute));
    }
    if (Math.random() < awayFoulProb) {
      events.push(createEvent('foul', 'away', minute));
    }

    const homeYellowProb = (odds.yellowsHome / 90) * probPerSecond;
    const awayYellowProb = (odds.yellowsAway / 90) * probPerSecond;

    if (Math.random() < homeYellowProb && state.stats.fouls.home > 3) {
      events.push(createEvent('yellow', 'home', minute));
    }
    if (Math.random() < awayYellowProb && state.stats.fouls.away > 3) {
      events.push(createEvent('yellow', 'away', minute));
    }

    const homeRedProb = (odds.redsHome / 90) * probPerSecond;
    const awayRedProb = (odds.redsAway / 90) * probPerSecond;

    if (Math.random() < homeRedProb && state.stats.yellowCards.home > 0) {
      events.push(createEvent('red', 'home', minute));
    }
    if (Math.random() < awayRedProb && state.stats.yellowCards.away > 0) {
      events.push(createEvent('red', 'away', minute));
    }

    if (Math.random() < 0.02) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('shot', team, minute));
    }

    return events;
  };

  const createEvent = (type, team, minute) => {
    const playerNames = ['Silva', 'Martinez', 'Johnson', 'Rodriguez', 'Chen', 'Müller', 'Kowalski', 'Okafor'];
    const player = playerNames[Math.floor(Math.random() * playerNames.length)];
    
    const commentary = {
      goal: `⚽ GOAL! ${player} scores for ${team === 'home' ? teams.home.name : teams.away.name}!`,
      foul: `Foul by ${player} (${team === 'home' ? teams.home.name : teams.away.name})`,
      yellow: `🟨 Yellow card for ${player} (${team === 'home' ? teams.home.name : teams.away.name})`,
      red: `🟥 RED CARD! ${player} is sent off!`,
      shot: `Shot by ${player} (${team === 'home' ? teams.home.name : teams.away.name})`
    };

    return {
      type,
      team,
      minute: Math.floor(minute),
      player,
      commentary: commentary[type],
      timestamp: Date.now()
    };
  };

  const processEvents = (state, events) => {
    let newState = { ...state };

    events.forEach(event => {
      switch (event.type) {
        case 'goal':
          if (Math.random() < 0.15) {
            const varDecision = Math.random() < 0.6;
            const varReasons = varDecision 
              ? ['No offside', 'Fair challenge', 'No handball', 'Goal stands!']
              : ['Offside!', 'Handball in buildup', 'Foul before goal', 'Goal disallowed!'];
            const reason = varReasons[Math.floor(Math.random() * varReasons.length)];
            
            setVarCheck({
              decision: varDecision ? 'GOAL ALLOWED' : 'GOAL DISALLOWED',
              reason: reason,
              team: event.team,
              player: event.player,
              color: varDecision ? '#10b981' : '#ef4444'
            });
            setShowVarPopup(true);
            
            setTimeout(() => setShowVarPopup(false), 4000);
            
            if (varDecision) {
              newState.score[event.team]++;
              newState.stats.shots[event.team]++;
              newState.stats.shotsOnTarget[event.team]++;
              newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + 15);
              newState.momentum[event.team === 'home' ? 'away' : 'home'] = Math.max(0, newState.momentum[event.team === 'home' ? 'away' : 'home'] - 15);
              newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + 5);
            } else {
              newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - 20);
              newState.momentum[event.team === 'home' ? 'away' : 'home'] = Math.min(100, newState.momentum[event.team === 'home' ? 'away' : 'home'] + 20);
              
              if (event.team === 'home') {
                setOdds(prev => ({
                  ...prev,
                  xgHome: Math.max(0.5, prev.xgHome * 0.9)
                }));
              } else {
                setOdds(prev => ({
                  ...prev,
                  xgAway: Math.max(0.5, prev.xgAway * 0.9)
                }));
              }
              
              newState.events.push({
                type: 'var',
                team: event.team,
                minute: Math.floor(state.minute),
                player: event.player,
                commentary: `🖥️ VAR REVIEW: Goal by ${event.player} DISALLOWED! ${reason}`,
                timestamp: Date.now()
              });
            }
          } else {
            newState.score[event.team]++;
            newState.stats.shots[event.team]++;
            newState.stats.shotsOnTarget[event.team]++;
            newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + 15);
            newState.momentum[event.team === 'home' ? 'away' : 'home'] = Math.max(0, newState.momentum[event.team === 'home' ? 'away' : 'home'] - 15);
          }
          
          setBall({ x: 400, y: 200, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 });
          break;
        case 'foul':
          newState.stats.fouls[event.team]++;
          break;
        case 'yellow':
          newState.stats.yellowCards[event.team]++;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - 5);
          break;
        case 'red':
          newState.stats.redCards[event.team]++;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - 25);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = Math.min(100, newState.momentum[event.team === 'home' ? 'away' : 'home'] + 25);
          break;
        case 'shot':
          newState.stats.shots[event.team]++;
          if (Math.random() < 0.4) {
            newState.stats.shotsOnTarget[event.team]++;
          }
          break;
      }
    });

    const totalMomentum = newState.momentum.home + newState.momentum.away;
    newState.possession.home = Math.round((newState.momentum.home / totalMomentum) * 100);
    newState.possession.away = 100 - newState.possession.home;

    return newState;
  };

  const togglePlay = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const resetSimulation = () => {
    setGameState({
      minute: 0,
      score: { home: 0, away: 0 },
      possession: { home: 50, away: 50 },
      stats: {
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 }
      },
      events: [],
      isPlaying: false,
      speed: 5,
      momentum: { home: 50, away: 50 }
    });
    setBall({ x: 400, y: 200, vx: 0, vy: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      {showVarPopup && varCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl animate-scaleIn" style={{ borderColor: varCheck.color }}>
            <div className="text-center">
              <div className="text-8xl mb-6 animate-pulse">🖥️</div>
              <div className="text-6xl font-black mb-4 animate-pulse" style={{ color: varCheck.color }}>
                VAR REVIEW
              </div>
              <div className="text-4xl font-bold mb-6" style={{ color: varCheck.color }}>
                {varCheck.decision}
              </div>
              <div className="text-2xl text-gray-300 mb-4">
                {varCheck.player} ({varCheck.team === 'home' ? teams.home.name : teams.away.name})
              </div>
              <div className="text-xl text-gray-400 bg-white/5 rounded-lg p-4">
                {varCheck.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ⚽ Ultimate Soccer Simulation
          </h1>
          <p className="text-gray-400 text-lg">Advanced AI-Powered Match Engine</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold mb-2">{teams.home.name}</div>
              <div className="text-6xl font-black">{gameState.score.home}</div>
            </div>
            
            <div className="text-center px-8">
              <div className="text-4xl font-bold mb-2">
                {Math.floor(gameState.minute)}'
              </div>
              <div className="text-sm text-gray-400">
                {gameState.minute >= 90 ? 'FULL TIME' : 'LIVE'}
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="text-2xl font-bold mb-2">{teams.away.name}</div>
              <div className="text-6xl font-black">{gameState.score.away}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Controls
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={togglePlay}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    gameState.isPlaying
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {gameState.isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" /> Start Match
                    </>
                  )}
                </button>

                <button
                  onClick={resetSimulation}
                  className="w-full py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5" /> Reset
                </button>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Simulation Speed: {gameState.speed}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={gameState.speed}
                    onChange={(e) => setGameState(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Match Momentum
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{teams.home.name}</span>
                    <span className="font-bold">{Math.round(gameState.momentum.home)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${gameState.momentum.home}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{teams.away.name}</span>
                    <span className="font-bold">{Math.round(gameState.momentum.away)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                      style={{ width: `${gameState.momentum.away}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Match Odds & xG
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-400 block mb-1">Home Team Name</label>
                  <input
                    type="text"
                    value={teams.home.name}
                    onChange={(e) => setTeams(prev => ({ ...prev, home: { ...prev.home, name: e.target.value } }))}
                    disabled={gameState.minute > 0}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Away Team Name</label>
                  <input
                    type="text"
                    value={teams.away.name}
                    onChange={(e) => setTeams(prev => ({ ...prev, away: { ...prev.away, name: e.target.value } }))}
                    disabled={gameState.minute > 0}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="border-t border-white/10 pt-3 mt-3">
                  <label className="text-gray-400 block mb-1">Home xG</label>
                  <input
                    type="number"
                    step="0.1"
                    value={odds.xgHome}
                    onChange={(e) => setOdds(prev => ({ ...prev, xgHome: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Away xG</label>
                  <input
                    type="number"
                    step="0.1"
                    value={odds.xgAway}
                    onChange={(e) => setOdds(prev => ({ ...prev, xgAway: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Home Fouls/Match</label>
                  <input
                    type="number"
                    value={odds.foulsHome}
                    onChange={(e) => setOdds(prev => ({ ...prev, foulsHome: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Away Fouls/Match</label>
                  <input
                    type="number"
                    value={odds.foulsAway}
                    onChange={(e) => setOdds(prev => ({ ...prev, foulsAway: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Home Possession %</label>
                  <input
                    type="number"
                    value={odds.possessionHome}
                    onChange={(e) => setOdds(prev => ({ ...prev, possessionHome: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full rounded-lg shadow-2xl"
              />
            </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold mb-3 text-center text-gray-400">POSSESSION</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold w-12">{gameState.possession.home}%</span>
                <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${gameState.possession.home}%` }}
                  />
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                    style={{ width: `${gameState.possession.away}%` }}
                  />
                </div>
                <span className="text-lg font-bold w-12 text-right">{gameState.possession.away}%</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-bold mb-4 text-center">Match Statistics</h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Shots', key: 'shots' },
                  { label: 'Shots on Target', key: 'shotsOnTarget' },
                  { label: 'Fouls', key: 'fouls' },
                  { label: 'Yellow Cards', key: 'yellowCards' },
                  { label: 'Red Cards', key: 'redCards' }
                ].map(stat => (
                  <div key={stat.key} className="flex items-center justify-between text-sm">
                    <span className="font-bold w-16 text-right">{gameState.stats[stat.key].home}</span>
                    <span className="flex-1 text-center text-gray-400">{stat.label}</span>
                    <span className="font-bold w-16">{gameState.stats[stat.key].away}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 sticky top-0 bg-inherit pb-2">
              <Clock className="w-5 h-5" />
              Match Events
            </h3>
            
            <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2">
              {gameState.events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Waiting for match to start...</p>
                </div>
              ) : (
                [...gameState.events].reverse().map((event, idx) => (
                  <div
                    key={event.timestamp}
                    className={`p-3 rounded-lg backdrop-blur-sm border transition-all ${
                      event.type === 'goal'
                        ? 'bg-green-500/20 border-green-500/50'
                        : event.type === 'var'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : event.type === 'red'
                        ? 'bg-red-500/20 border-red-500/50'
                        : event.type === 'yellow'
                        ? 'bg-yellow-500/20 border-yellow-500/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{event.minute}'</span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">{event.type.toUpperCase()}</span>
                    </div>
                    <p className="text-sm">{event.commentary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoccerSimulation;
