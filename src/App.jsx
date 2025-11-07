import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, TrendingUp, Zap, Clock } from 'lucide-react';

const SoccerSimulation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
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
    momentum: { home: 50, away: 50 },
    halfTimeScore: { home: 0, away: 0 },
    firstHalfStats: null
  });

  const [teams, setTeams] = useState({
    home: { name: 'FC Odds-Based', color: '#3B82F6', formation: '4-4-2' },
    away: { name: 'United Implied', color: '#EF4444', formation: '4-3-3' }
  });

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

  const [ball, setBall] = useState({ x: 400, y: 200, vx: 0, vy: 0 });
  const [players, setPlayers] = useState([]);
  const [varCheck, setVarCheck] = useState(null);
  const [showVarPopup, setShowVarPopup] = useState(false);
  const [pausedForPopup, setPausedForPopup] = useState(false);
  const [wasPlayingBeforePopup, setWasPlayingBeforePopup] = useState(false);

  // Player squads with positions and scoring probabilities
  const [playerSquads, setPlayerSquads] = useState({
    home: [
      { name: 'Martinez', position: 'GK', scoringProb: 0.1 },
      { name: 'Silva', position: 'DEF', scoringProb: 2 },
      { name: 'Rodriguez', position: 'DEF', scoringProb: 3 },
      { name: 'Johnson', position: 'DEF', scoringProb: 2.5 },
      { name: 'Chen', position: 'DEF', scoringProb: 2 },
      { name: 'Müller', position: 'MID', scoringProb: 8 },
      { name: 'Kowalski', position: 'MID', scoringProb: 7 },
      { name: 'Santos', position: 'MID', scoringProb: 9 },
      { name: 'Ibrahim', position: 'MID', scoringProb: 6 },
      { name: 'Okafor', position: 'FWD', scoringProb: 25 },
      { name: 'Williams', position: 'FWD', scoringProb: 28 }
    ],
    away: [
      { name: 'Anderson', position: 'GK', scoringProb: 0.1 },
      { name: 'Garcia', position: 'DEF', scoringProb: 2 },
      { name: 'Patel', position: 'DEF', scoringProb: 2.5 },
      { name: 'Kim', position: 'DEF', scoringProb: 3 },
      { name: 'Lopez', position: 'DEF', scoringProb: 2 },
      { name: 'Nguyen', position: 'MID', scoringProb: 7 },
      { name: 'Brown', position: 'MID', scoringProb: 8 },
      { name: 'Fernandez', position: 'MID', scoringProb: 6 },
      { name: 'Hassan', position: 'FWD', scoringProb: 22 },
      { name: 'Ivanov', position: 'FWD', scoringProb: 26 },
      { name: 'Taylor', position: 'FWD', scoringProb: 20 }
    ]
  });

  const [playerStats, setPlayerStats] = useState({
    home: {},
    away: {}
  });

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

  useEffect(() => {
    if ((!gameState.isPlaying || gameState.minute >= 90) && !pausedForPopup) return;
    if (pausedForPopup) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const newMinute = prev.minute + (prev.speed / 60);
        
        // Check for half-time
        if (prev.minute < 45 && newMinute >= 45 && !prev.firstHalfStats) {
          return {
            ...prev,
            minute: newMinute,
            halfTimeScore: { ...prev.score },
            firstHalfStats: { ...prev.stats }
          };
        }
        
        if (newMinute >= 90) {
          return { ...prev, minute: 90, isPlaying: false };
        }

        const events = generateEvents(prev, newMinute);
        const processedState = processEvents(prev, events);
        
        return {
          ...prev,
          ...processedState,
          minute: newMinute,
          events: [...prev.events, ...events]
        };
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.speed, odds, pausedForPopup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      drawField(ctx);
      drawPlayers(ctx);
      drawBall(ctx);
      if (gameState.isPlaying && !pausedForPopup) {
        updatePhysics();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [players, ball, gameState.isPlaying, pausedForPopup]);

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

  const showPopupWithPause = (popupData, duration) => {
    setWasPlayingBeforePopup(gameState.isPlaying);
    setPausedForPopup(true);
    setVarCheck(popupData);
    setShowVarPopup(true);
    
    setTimeout(() => {
      setShowVarPopup(false);
      setPausedForPopup(false);
    }, duration);
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

    const homeFoulProb = (odds.foulsHome / 90) * probPerSecond * 2;
    const awayFoulProb = (odds.foulsAway / 90) * probPerSecond * 2;

    if (Math.random() < homeFoulProb) {
      events.push(createEvent('foul', 'home', minute));
    }
    if (Math.random() < awayFoulProb) {
      events.push(createEvent('foul', 'away', minute));
    }

    const homeYellowProb = (odds.yellowsHome / 90) * probPerSecond * 1.5;
    const awayYellowProb = (odds.yellowsAway / 90) * probPerSecond * 1.5;

    if (Math.random() < homeYellowProb && state.stats.fouls.home > 2) {
      events.push(createEvent('yellow', 'home', minute));
    }
    if (Math.random() < awayYellowProb && state.stats.fouls.away > 2) {
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

    if (Math.random() < 0.04) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('shot', team, minute));
    }

    if (Math.random() < 0.03) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('corner', team, minute));
    }

    if (Math.random() < 0.0008 && (state.stats.fouls.home > 5 || state.stats.fouls.away > 5)) {
      const team = state.stats.fouls.home > state.stats.fouls.away ? 'home' : 'away';
      events.push(createEvent('manager_card', team, minute));
    }

    if (Math.random() < 0.002) {
      const team = Math.random() < 0.5 ? 'home' : 'away';
      events.push(createEvent('injury', team, minute));
    }

    if (Math.random() < 0.0015) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('penalty', team, minute));
    }

    return events;
  };

  const createEvent = (type, team, minute) => {
    const managerNames = ['Guardiola', 'Mourinho', 'Klopp', 'Ancelotti', 'Zidane'];
    const manager = managerNames[Math.floor(Math.random() * managerNames.length)];
    
    // Select player based on position and scoring probability
    let player;
    const squad = playerSquads[team];
    
    if (type === 'goal' || type === 'shot' || type === 'penalty') {
      // Weight selection by scoring probability
      const totalProb = squad.reduce((sum, p) => sum + p.scoringProb, 0);
      let random = Math.random() * totalProb;
      
      for (const p of squad) {
        random -= p.scoringProb;
        if (random <= 0) {
          player = p.name;
          
          // Track player stats
          if (type === 'goal') {
            setPlayerStats(prev => ({
              ...prev,
              [team]: {
                ...prev[team],
                [player]: {
                  goals: (prev[team]?.[player]?.goals || 0) + 1,
                  shots: (prev[team]?.[player]?.shots || 0) + 1
                }
              }
            }));
          } else if (type === 'shot') {
            setPlayerStats(prev => ({
              ...prev,
              [team]: {
                ...prev[team],
                [player]: {
                  goals: prev[team]?.[player]?.goals || 0,
                  shots: (prev[team]?.[player]?.shots || 0) + 1
                }
              }
            }));
          }
          break;
        }
      }
    } else {
      // Random player for other events
      player = squad[Math.floor(Math.random() * squad.length)].name;
    }
    
    const currentMinute = Math.floor(minute);
    const timeRemaining = 90 - currentMinute;
    const momentumFactor = team === 'home' ? gameState.momentum.home / 100 : gameState.momentum.away / 100;
    const baseXg = team === 'home' ? odds.xgHome : odds.xgAway;
    
    const scoringChancePerMinute = (baseXg / 90) * momentumFactor;
    const oddsToScoreNext = (scoringChancePerMinute * timeRemaining * 100).toFixed(1);
    
    const commentary = {
      goal: `⚽ GOAL! ${player} scores for ${team === 'home' ? teams.home.name : teams.away.name}!`,
      foul: `⚠️ Foul by ${player} (${team === 'home' ? teams.home.name : teams.away.name})`,
      yellow: `🟨 Yellow card for ${player} (${team === 'home' ? teams.home.name : teams.away.name})`,
      red: `🟥 RED CARD! ${player} is sent off! (${team === 'home' ? teams.home.name : teams.away.name})`,
      shot: `🎯 Shot by ${player} (${team === 'home' ? teams.home.name : teams.away.name})`,
      corner: `🚩 Corner kick for ${team === 'home' ? teams.home.name : teams.away.name}`,
      manager_card: `👔 MANAGER SENT OFF! ${manager} of ${team === 'home' ? teams.home.name : teams.away.name} shown RED CARD for dissent!`,
      injury: `🚑 Injury stoppage - ${player} (${team === 'home' ? teams.home.name : teams.away.name}) needs medical attention`,
      penalty: `⚡ PENALTY AWARDED to ${team === 'home' ? teams.home.name : teams.away.name}! Huge moment!`
    };

    return {
      type,
      team,
      minute: Math.floor(minute),
      player,
      commentary: commentary[type],
      timestamp: Date.now() + Math.random(),
      inPlayOdds: oddsToScoreNext
    };
  };

  const processEvents = (state, events) => {
    let newState = { ...state };

    events.forEach(event => {
      switch (event.type) {
        case 'goal':
          if (Math.random() < 0.35) {
            const varDecision = Math.random() < 0.55;
            const varReasons = varDecision 
              ? ['No offside', 'Fair challenge', 'No handball', 'Goal stands!', 'Clean play', 'VAR confirms goal']
              : ['Offside!', 'Handball in buildup', 'Foul before goal', 'Goal disallowed!', 'Player interfered with keeper', 'Ball out of play'];
            const reason = varReasons[Math.floor(Math.random() * varReasons.length)];
            
            showPopupWithPause({
              decision: varDecision ? 'GOAL ALLOWED' : 'GOAL DISALLOWED',
              reason: reason,
              team: event.team,
              player: event.player,
              color: varDecision ? '#10b981' : '#ef4444'
            }, 4000);
            
            if (varDecision) {
              newState.score[event.team]++;
              newState.stats.shots[event.team]++;
              newState.stats.shotsOnTarget[event.team]++;
              
              const momentumChange = 15;
              newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + momentumChange);
              newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
            } else {
              const momentumChange = 20;
              newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - momentumChange);
              newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
              
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
                timestamp: Date.now() + Math.random()
              });
            }
          } else {
            newState.score[event.team]++;
            newState.stats.shots[event.team]++;
            newState.stats.shotsOnTarget[event.team]++;
            
            const momentumChange = 15;
            newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + momentumChange);
            newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          }
          
          setBall({ x: 400, y: 200, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 });
          break;
        case 'foul':
          newState.stats.fouls[event.team]++;
          break;
        case 'yellow':
          newState.stats.yellowCards[event.team]++;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - 5);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          break;
        case 'red':
          newState.stats.redCards[event.team]++;
          const redMomentumChange = 25;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - redMomentumChange);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          break;
        case 'shot':
          newState.stats.shots[event.team]++;
          if (Math.random() < 0.4) {
            newState.stats.shotsOnTarget[event.team]++;
          }
          break;
        case 'corner':
          newState.stats.corners[event.team]++;
          break;
        case 'manager_card':
          const cardMomentumChange = 10;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - cardMomentumChange);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          
          showPopupWithPause({
            title: 'MANAGER SENT OFF!',
            decision: 'RED CARD TO MANAGER',
            reason: 'Excessive dissent and confrontational behavior',
            player: 'Manager',
            team: event.team,
            color: '#ef4444',
            type: 'manager_card'
          }, 5000);
          break;
        case 'injury':
          const injuryMomentumChange = 8;
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - injuryMomentumChange);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          
          showPopupWithPause({
            title: 'INJURY STOPPAGE',
            decision: 'MEDICAL ATTENTION NEEDED',
            reason: 'Player down and receiving treatment',
            player: event.player,
            team: event.team,
            color: '#f59e0b',
            type: 'injury'
          }, 3000);
          break;
        case 'penalty':
          const penaltyMomentumChange = 12;
          newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + penaltyMomentumChange);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          
          showPopupWithPause({
            title: 'PENALTY KICK!',
            decision: 'PENALTY AWARDED',
            reason: 'Foul in the penalty area - spot kick!',
            player: event.player,
            team: event.team,
            color: '#8b5cf6',
            type: 'penalty'
          }, 4000);
          
          if (Math.random() < 0.7) {
            setTimeout(() => {
              setGameState(prev => {
                const newScore = { ...prev.score };
                newScore[event.team]++;
                return {
                  ...prev,
                  score: newScore,
                  events: [...prev.events, {
                    type: 'goal',
                    team: event.team,
                    minute: Math.floor(prev.minute),
                    player: event.player,
                    commentary: `⚽ PENALTY SCORED! ${event.player} converts from the spot!`,
                    timestamp: Date.now() + Math.random()
                  }]
                };
              });
            }, 4500);
          } else {
            setTimeout(() => {
              setGameState(prev => ({
                ...prev,
                events: [...prev.events, {
                  type: 'shot',
                  team: event.team,
                  minute: Math.floor(prev.minute),
                  player: event.player,
                  commentary: `❌ PENALTY MISSED! ${event.player} hits the post!`,
                  timestamp: Date.now() + Math.random()
                }]
              }));
            }, 4500);
          }
          break;
      }
    });

    newState.possession.home = Math.round(newState.momentum.home);
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
      momentum: { home: 50, away: 50 },
      halfTimeScore: { home: 0, away: 0 },
      firstHalfStats: null
    });
    setPlayerStats({ home: {}, away: {} });
    setBall({ x: 400, y: 200, vx: 0, vy: 0 });
  };

  // Calculate half-specific odds
  const calculateHalfOdds = () => {
    const currentMinute = gameState.minute;
    const isFirstHalf = currentMinute < 45;
    const isSecondHalf = currentMinute >= 45;
    
    if (isFirstHalf) {
      // First half odds (0-45 min)
      const timeInHalf = currentMinute;
      const timeRemaining = 45 - timeInHalf;
      const homeProb = (odds.xgHome / 2) * (gameState.momentum.home / 100) * (timeRemaining / 45);
      const awayProb = (odds.xgAway / 2) * (gameState.momentum.away / 100) * (timeRemaining / 45);
      
      return {
        half: 'First Half',
        homeWin: Math.min(95, Math.max(5, homeProb * 100)).toFixed(1),
        draw: Math.min(95, Math.max(5, (1 - homeProb - awayProb) * 100)).toFixed(1),
        awayWin: Math.min(95, Math.max(5, awayProb * 100)).toFixed(1)
      };
    } else if (isSecondHalf && currentMinute < 90) {
      // Second half odds (45-90 min)
      const timeInSecondHalf = currentMinute - 45;
      const timeRemaining = 90 - currentMinute;
      
      // Adjust for fatigue - more goals in second half
      const fatigueMultiplier = 1.2;
      const homeProb = (odds.xgHome / 2) * fatigueMultiplier * (gameState.momentum.home / 100) * (timeRemaining / 45);
      const awayProb = (odds.xgAway / 2) * fatigueMultiplier * (gameState.momentum.away / 100) * (timeRemaining / 45);
      
      return {
        half: 'Second Half',
        homeWin: Math.min(95, Math.max(5, homeProb * 100)).toFixed(1),
        draw: Math.min(95, Math.max(5, (1 - homeProb - awayProb) * 100)).toFixed(1),
        awayWin: Math.min(95, Math.max(5, awayProb * 100)).toFixed(1)
      };
    }
    
    return null;
  };

  const halfOdds = calculateHalfOdds();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      {showVarPopup && varCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl animate-scaleIn" style={{ borderColor: varCheck.color }}>
            <div className="text-center">
              <div className="text-8xl mb-6 animate-pulse">{varCheck.type === 'manager_card' ? '👔' : varCheck.type === 'penalty' ? '⚡' : varCheck.type === 'injury' ? '🚑' : '🖥️'}</div>
              <div className="text-6xl font-black mb-4 animate-pulse" style={{ color: varCheck.color }}>
                {varCheck.title || 'VAR REVIEW'}
              </div>
              <div className="text-4xl font-bold mb-6" style={{ color: varCheck.color }}>
                {varCheck.decision}
              </div>
              <div className="text-2xl text-gray-300 mb-4">
                {varCheck.player} {varCheck.team && `(${varCheck.team === 'home' ? teams.home.name : teams.away.name})`}
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
                {gameState.minute >= 90 ? 'FULL TIME' : pausedForPopup ? 'PAUSED' : 'LIVE'}
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
                Live Odds & Markets
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-xs text-gray-400 mb-2 font-bold">🔴 FULL TIME RESULT</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{teams.home.name} Win:</span>
                      <span className="text-green-400 font-bold">
                        {gameState.score.home > gameState.score.away 
                          ? '85%' 
                          : gameState.score.home === gameState.score.away 
                          ? `${Math.round(45 + (gameState.momentum.home - 50) * 0.3)}%`
                          : '15%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Draw:</span>
                      <span className="text-yellow-400 font-bold">
                        {gameState.score.home === gameState.score.away ? '30%' : '5%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">{teams.away.name} Win:</span>
                      <span className="text-red-400 font-bold">
                        {gameState.score.away > gameState.score.home 
                          ? '85%' 
                          : gameState.score.home === gameState.score.away 
                          ? `${Math.round(45 + (gameState.momentum.away - 50) * 0.3)}%`
                          : '15%'}
                      </span>
                    </div>
                  </div>
                </div>

                {halfOdds && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="text-xs text-gray-400 mb-2 font-bold">⏱️ {halfOdds.half.toUpperCase()} WINNER</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{teams.home.name}:</span>
                        <span className="text-green-400 font-bold">{halfOdds.homeWin}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Draw:</span>
                        <span className="text-yellow-400 font-bold">{halfOdds.draw}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{teams.away.name}:</span>
                        <span className="text-red-400 font-bold">{halfOdds.awayWin}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {gameState.minute >= 45 && gameState.firstHalfStats && (
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="text-xs text-gray-400 mb-2 font-bold">📊 HALF-TIME SCORE</div>
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>{gameState.halfTimeScore.home}</span>
                      <span className="text-xs text-gray-400">HT</span>
                      <span>{gameState.halfTimeScore.away}</span>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-3 border border-orange-500/20">
                  <div className="text-xs text-gray-400 mb-2 font-bold">⚽ NEXT GOALSCORER</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    <div className="text-xs font-bold text-blue-400 mb-1">{teams.home.name}</div>
                    {playerSquads.home.filter(p => p.position !== 'GK').map(player => {
                      const adjustedProb = (player.scoringProb * (gameState.momentum.home / 100) * ((90 - gameState.minute) / 90)).toFixed(1);
                      return (
                        <div key={player.name} className="flex justify-between items-center text-xs">
                          <span>{player.name} ({player.position})</span>
                          <span className="font-bold text-green-400">{adjustedProb}%</span>
                        </div>
                      );
                    })}
                    <div className="text-xs font-bold text-red-400 mt-2 mb-1">{teams.away.name}</div>
                    {playerSquads.away.filter(p => p.position !== 'GK').map(player => {
                      const adjustedProb = (player.scoringProb * (gameState.momentum.away / 100) * ((90 - gameState.minute) / 90)).toFixed(1);
                      return (
                        <div key={player.name} className="flex justify-between items-center text-xs">
                          <span>{player.name} ({player.position})</span>
                          <span className="font-bold text-red-400">{adjustedProb}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="text-xs text-gray-400 mb-2 font-bold">⚙️ PRE-MATCH SETTINGS</div>
                </div>

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
                  { label: 'Corners', key: 'corners' },
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
              Match Events & Player Stats
            </h3>
            
            {/* Player Stats Section */}
            {(Object.keys(playerStats.home).length > 0 || Object.keys(playerStats.away).length > 0) && (
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm font-bold mb-2 text-purple-400">⭐ Top Scorers</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-bold text-blue-400 mb-1">{teams.home.name}</div>
                    {Object.entries(playerStats.home)
                      .sort((a, b) => b[1].goals - a[1].goals)
                      .slice(0, 3)
                      .map(([name, stats]) => (
                        <div key={name} className="flex justify-between">
                          <span>{name}</span>
                          <span className="text-green-400">{stats.goals}⚽ ({stats.shots} shots)</span>
                        </div>
                      ))}
                  </div>
                  <div>
                    <div className="font-bold text-red-400 mb-1">{teams.away.name}</div>
                    {Object.entries(playerStats.away)
                      .sort((a, b) => b[1].goals - a[1].goals)
                      .slice(0, 3)
                      .map(([name, stats]) => (
                        <div key={name} className="flex justify-between">
                          <span>{name}</span>
                          <span className="text-green-400">{stats.goals}⚽ ({stats.shots} shots)</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-2">
              {gameState.events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-bold mb-2">Press "Start Match" to begin...</p>
                  <p className="text-xs">All match events will appear here:</p>
                  <div className="text-xs mt-2 space-y-1">
                    <div>⚽ Goals</div>
                    <div>🟨 Yellow Cards</div>
                    <div>🟥 Red Cards</div>
                    <div>⚠️ Fouls</div>
                    <div>🎯 Shots</div>
                    <div>🚩 Corners</div>
                    <div>🖥️ VAR Reviews</div>
                    <div>👔 Manager Cards</div>
                    <div>🚑 Injuries</div>
                    <div>⚡ Penalties</div>
                  </div>
                </div>
              ) : (
                [...gameState.events].reverse().map((event) => (
                  <div
                    key={`${event.timestamp}-${event.minute}`}
                    className={`p-3 rounded-lg backdrop-blur-sm border transition-all ${
                      event.type === 'goal'
                        ? 'bg-green-500/20 border-green-500/50'
                        : event.type === 'var'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : event.type === 'red'
                        ? 'bg-red-500/20 border-red-500/50'
                        : event.type === 'yellow'
                        ? 'bg-yellow-500/20 border-yellow-500/50'
                        : event.type === 'corner'
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : event.type === 'manager_card'
                        ? 'bg-orange-500/20 border-orange-500/50'
                        : event.type === 'injury'
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : event.type === 'penalty'
                        ? 'bg-purple-600/20 border-purple-600/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{event.minute}'</span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded uppercase">{event.type}</span>
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
