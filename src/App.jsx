import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, TrendingUp, Zap, Clock, Activity, AlertCircle, DollarSign, Target, BarChart3, Sparkles } from 'lucide-react';

const EnhancedSoccerSimulation = () => {
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
      redCards: { home: 0, away: 0 },
      offsides: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 85, away: 82 },
      tackles: { home: 0, away: 0 }
    },
    events: [],
    isPlaying: false,
    speed: 5,
    momentum: { home: 50, away: 50 },
    halfTimeScore: { home: 0, away: 0 },
    firstHalfStats: null,
    xgTimeline: { home: [{ minute: 0, xg: 0 }], away: [{ minute: 0, xg: 0 }] },
    shotMap: [],
    heatmapData: { home: [], away: [] },
    unexpectedEventChance: 15 // New: percentage chance for unexpected events
  });

  const [teams, setTeams] = useState({
    home: { name: 'FC Analytics', color: '#3B82F6' },
    away: { name: 'Data United', color: '#EF4444' }
  });

  const [odds, setOdds] = useState({
    xgHome: 1.8,
    xgAway: 1.2,
    foulsHome: 12,
    foulsAway: 14,
    yellowsHome: 2.2,
    yellowsAway: 2.8,
    redsHome: 0.12,
    redsAway: 0.18,
    possessionHome: 55,
    varChance: 35,
    cornersHome: 5.5,
    cornersAway: 4.5
  });

  // Live odds tracking
  const [liveOdds, setLiveOdds] = useState({
    home: 2.10,
    draw: 3.40,
    away: 3.50,
    over25: 1.85,
    under25: 1.95,
    bttsYes: 1.80,
    bttsNo: 2.00,
    history: []
  });

  // Value bets tracking
  const [valueBets, setValueBets] = useState([]);

  // Bet builder selections
  const [betBuilder, setBetBuilder] = useState({
    selections: [],
    totalOdds: 1.00,
    stake: 10
  });

  const [selectedView, setSelectedView] = useState('field');
  const [ball, setBall] = useState({ x: 400, y: 200, vx: 0, vy: 0 });
  const [players, setPlayers] = useState([]);
  const [varCheck, setVarCheck] = useState(null);
  const [showVarPopup, setShowVarPopup] = useState(false);

  const [playerSquads] = useState({
    home: [
      { name: 'Martinez', position: 'GK', scoringProb: 0.1, number: 1 },
      { name: 'Silva', position: 'DEF', scoringProb: 2, number: 2 },
      { name: 'Rodriguez', position: 'DEF', scoringProb: 3, number: 4 },
      { name: 'Johnson', position: 'DEF', scoringProb: 2.5, number: 5 },
      { name: 'Chen', position: 'DEF', scoringProb: 2, number: 3 },
      { name: 'Müller', position: 'MID', scoringProb: 8, number: 8 },
      { name: 'Kowalski', position: 'MID', scoringProb: 7, number: 6 },
      { name: 'Santos', position: 'MID', scoringProb: 9, number: 10 },
      { name: 'Ibrahim', position: 'MID', scoringProb: 6, number: 7 },
      { name: 'Okafor', position: 'FWD', scoringProb: 25, number: 9 },
      { name: 'Williams', position: 'FWD', scoringProb: 28, number: 11 }
    ],
    away: [
      { name: 'Anderson', position: 'GK', scoringProb: 0.1, number: 1 },
      { name: 'Garcia', position: 'DEF', scoringProb: 2, number: 2 },
      { name: 'Patel', position: 'DEF', scoringProb: 2.5, number: 3 },
      { name: 'Kim', position: 'DEF', scoringProb: 3, number: 4 },
      { name: 'Lopez', position: 'DEF', scoringProb: 2, number: 5 },
      { name: 'Nguyen', position: 'MID', scoringProb: 7, number: 6 },
      { name: 'Brown', position: 'MID', scoringProb: 8, number: 8 },
      { name: 'Fernandez', position: 'MID', scoringProb: 6, number: 10 },
      { name: 'Hassan', position: 'FWD', scoringProb: 22, number: 7 },
      { name: 'Ivanov', position: 'FWD', scoringProb: 26, number: 9 },
      { name: 'Taylor', position: 'FWD', scoringProb: 20, number: 11 }
    ]
  });

  const [playerStats, setPlayerStats] = useState({ home: {}, away: {} });

  // Initialize players
  useEffect(() => {
    const formations = {
      home: [
        { x: 100, y: 200 }, { x: 180, y: 100 }, { x: 180, y: 160 }, { x: 180, y: 240 }, { x: 180, y: 300 },
        { x: 280, y: 100 }, { x: 280, y: 160 }, { x: 280, y: 240 }, { x: 280, y: 300 },
        { x: 360, y: 150 }, { x: 360, y: 250 }
      ],
      away: [
        { x: 700, y: 200 }, { x: 620, y: 100 }, { x: 620, y: 160 }, { x: 620, y: 240 }, { x: 620, y: 300 },
        { x: 520, y: 130 }, { x: 520, y: 200 }, { x: 520, y: 270 },
        { x: 440, y: 100 }, { x: 440, y: 200 }, { x: 440, y: 300 }
      ]
    };

    const homePlayers = formations.home.map((pos, i) => ({
      id: `home-${i}`, x: pos.x, y: pos.y, team: 'home', color: teams.home.color
    }));
    const awayPlayers = formations.away.map((pos, i) => ({
      id: `away-${i}`, x: pos.x, y: pos.y, team: 'away', color: teams.away.color
    }));
    setPlayers([...homePlayers, ...awayPlayers]);
  }, []);

  // Update live odds based on game state
  useEffect(() => {
    if (gameState.minute > 0) {
      updateLiveOdds();
      checkValueBets();
    }
  }, [gameState.score, gameState.minute]);

  const updateLiveOdds = () => {
    const timeRatio = (90 - gameState.minute) / 90;
    const scoreDiff = gameState.score.home - gameState.score.away;
    
    let homeOdds, drawOdds, awayOdds;
    
    if (scoreDiff > 0) {
      homeOdds = 1.10 + (0.5 * timeRatio);
      drawOdds = 5.00 + (3.00 * (1 - timeRatio));
      awayOdds = 8.00 + (5.00 * (1 - timeRatio));
    } else if (scoreDiff < 0) {
      homeOdds = 8.00 + (5.00 * (1 - timeRatio));
      drawOdds = 5.00 + (3.00 * (1 - timeRatio));
      awayOdds = 1.10 + (0.5 * timeRatio);
    } else {
      homeOdds = 2.10 + (1.00 * (1 - timeRatio));
      drawOdds = 2.20 + (1.20 * timeRatio);
      awayOdds = 3.50 - (1.00 * (1 - timeRatio));
    }
    
    const totalGoals = gameState.score.home + gameState.score.away;
    const projectedTotal = totalGoals + ((odds.xgHome + odds.xgAway) * timeRatio);
    
    const over25Odds = projectedTotal > 2.5 ? 1.20 : 
                       projectedTotal > 2.0 ? 1.60 : 
                       projectedTotal > 1.5 ? 2.20 : 3.50;
    
    setLiveOdds(prev => ({
      home: parseFloat(homeOdds.toFixed(2)),
      draw: parseFloat(drawOdds.toFixed(2)),
      away: parseFloat(awayOdds.toFixed(2)),
      over25: parseFloat(over25Odds.toFixed(2)),
      under25: parseFloat((4.00 - over25Odds + 1.20).toFixed(2)),
      bttsYes: (gameState.score.home > 0 && gameState.score.away > 0) ? 1.05 :
               (gameState.score.home > 0 || gameState.score.away > 0) ? 1.80 : 2.20,
      bttsNo: (gameState.score.home > 0 && gameState.score.away > 0) ? 12.00 :
              (gameState.score.home > 0 || gameState.score.away > 0) ? 2.20 : 1.65,
      history: [...prev.history, {
        minute: gameState.minute,
        home: homeOdds,
        draw: drawOdds,
        away: awayOdds
      }].slice(-50)
    }));
  };

  const checkValueBets = () => {
    const newValueBets = [];
    const impliedProbHome = 1 / liveOdds.home;
    const impliedProbDraw = 1 / liveOdds.draw;
    const impliedProbAway = 1 / liveOdds.away;
    
    const actualProbHome = calculateActualProbability('home');
    const actualProbDraw = calculateActualProbability('draw');
    const actualProbAway = calculateActualProbability('away');
    
    if (actualProbHome > impliedProbHome * 1.1) {
      newValueBets.push({
        market: teams.home.name + ' Win',
        odds: liveOdds.home,
        value: ((actualProbHome / impliedProbHome - 1) * 100).toFixed(1) + '%',
        confidence: getConfidenceRating(actualProbHome - impliedProbHome)
      });
    }
    
    if (actualProbDraw > impliedProbDraw * 1.1) {
      newValueBets.push({
        market: 'Draw',
        odds: liveOdds.draw,
        value: ((actualProbDraw / impliedProbDraw - 1) * 100).toFixed(1) + '%',
        confidence: getConfidenceRating(actualProbDraw - impliedProbDraw)
      });
    }
    
    setValueBets(newValueBets.slice(0, 3));
  };

  const calculateActualProbability = (outcome) => {
    const timeLeft = (90 - gameState.minute) / 90;
    const momentum = gameState.momentum.home / 100;
    
    if (outcome === 'home') {
      return 0.35 + (momentum * 0.2) + (gameState.score.home > gameState.score.away ? 0.3 : 0);
    } else if (outcome === 'draw') {
      return 0.30 + (gameState.score.home === gameState.score.away ? 0.2 * timeLeft : 0);
    } else {
      return 0.35 + ((1 - momentum) * 0.2) + (gameState.score.away > gameState.score.home ? 0.3 : 0);
    }
  };

  const getConfidenceRating = (valueDiff) => {
    if (valueDiff > 0.2) return '⭐⭐⭐⭐⭐';
    if (valueDiff > 0.15) return '⭐⭐⭐⭐';
    if (valueDiff > 0.1) return '⭐⭐⭐';
    if (valueDiff > 0.05) return '⭐⭐';
    return '⭐';
  };

  // Calculate correct score probabilities
  const calculateCorrectScoreMatrix = () => {
    const matrix = [];
    const baseHomeGoals = odds.xgHome;
    const baseAwayGoals = odds.xgAway;
    const timeRatio = gameState.minute / 90;
    
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        // Poisson distribution approximation
        const homeProb = Math.exp(-baseHomeGoals) * Math.pow(baseHomeGoals, h) / factorial(h);
        const awayProb = Math.exp(-baseAwayGoals) * Math.pow(baseAwayGoals, a) / factorial(a);
        let prob = homeProb * awayProb * 100;
        
        // Adjust for current score
        if (h === gameState.score.home && a === gameState.score.away) {
          prob *= (1 + timeRatio * 2);
        }
        
        matrix.push({
          home: h,
          away: a,
          probability: prob,
          odds: prob > 0 ? (100 / prob).toFixed(2) : '999',
          isCurrent: h === gameState.score.home && a === gameState.score.away
        });
      }
    }
    
    return matrix;
  };

  const factorial = (n) => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Main game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.minute >= 90) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const newMinute = prev.minute + (prev.speed / 60);
        
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
        
        // Update heatmap data
        if (Math.random() < 0.1) {
          const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
          const x = team === 'home' ? 
            Math.random() * 400 + 200 : 
            Math.random() * 400 + 200;
          const y = Math.random() * 380 + 10;
          
          processedState.heatmapData = {
            ...processedState.heatmapData,
            [team]: [...(processedState.heatmapData[team] || []), { x, y }].slice(-100)
          };
        }
        
        return {
          ...prev,
          ...processedState,
          minute: newMinute,
          events: [...prev.events, ...events]
        };
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.speed, odds, gameState.unexpectedEventChance]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      if (selectedView === 'field') {
        drawField(ctx);
        drawPlayers(ctx);
        drawBall(ctx);
      } else if (selectedView === 'shotmap') {
        drawShotMap(ctx);
      } else if (selectedView === 'xg') {
        drawXGTimeline(ctx);
      } else if (selectedView === 'heatmap') {
        drawHeatmap(ctx);
      } else if (selectedView === 'oddsHistory') {
        drawOddsHistory(ctx);
      }
      
      if (gameState.isPlaying) {
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
  }, [players, ball, gameState, selectedView, liveOdds]);

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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 170, 10, 60);
    ctx.fillRect(790, 170, 10, 60);
  };

  const drawHeatmap = (ctx) => {
    drawField(ctx);
    
    // Draw heatmap for both teams
    ['home', 'away'].forEach(team => {
      const heatData = gameState.heatmapData[team] || [];
      
      heatData.forEach((point, index) => {
        const opacity = (index / heatData.length) * 0.5;
        const radius = 20;
        
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        gradient.addColorStop(0, team === 'home' ? 
          `rgba(59, 130, 246, ${opacity})` : 
          `rgba(239, 68, 68, ${opacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      });
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Player Activity Heatmap', 20, 30);
  };

  const drawOddsHistory = (ctx) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 800, 400);
    
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    
    // Draw grid
    for (let i = 0; i <= 10; i++) {
      const y = 50 + (i * 30);
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(760, y);
      ctx.stroke();
    }
    
    // Draw odds lines
    if (liveOdds.history.length > 1) {
      const markets = ['home', 'draw', 'away'];
      const colors = ['#3B82F6', '#10B981', '#EF4444'];
      
      markets.forEach((market, idx) => {
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        liveOdds.history.forEach((point, i) => {
          const x = 60 + (i / liveOdds.history.length) * 700;
          const y = 350 - (1 / point[market]) * 250;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
      });
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Live Odds Movement', 320, 30);
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#3B82F6';
    ctx.fillText(`● Home: ${liveOdds.home}`, 60, 380);
    ctx.fillStyle = '#10B981';
    ctx.fillText(`● Draw: ${liveOdds.draw}`, 350, 380);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`● Away: ${liveOdds.away}`, 640, 380);
  };

  const drawShotMap = (ctx) => {
    drawField(ctx);
    
    gameState.shotMap.forEach(shot => {
      const radius = shot.xg * 15;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = shot.isGoal 
        ? (shot.team === 'home' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)')
        : (shot.team === 'home' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)');
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Shot Map - Size = xG, Filled = Goal', 20, 30);
  };

  const drawXGTimeline = (ctx) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = 50 + (i * 60);
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(760, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    for (let i = 0; i <= 5; i++) {
      const xg = (5 - i) * 0.5;
      ctx.fillText(xg.toFixed(1), 20, 54 + (i * 60));
    }

    if (gameState.xgTimeline.home.length > 1) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      gameState.xgTimeline.home.forEach((point, i) => {
        const x = 60 + (point.minute / 90) * 700;
        const y = 350 - (point.xg * 120);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    if (gameState.xgTimeline.away.length > 1) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      gameState.xgTimeline.away.forEach((point, i) => {
        const x = 60 + (point.minute / 90) * 700;
        const y = 350 - (point.xg * 120);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('xG Timeline', 350, 30);
    ctx.fillStyle = '#3B82F6';
    ctx.fillText(`● ${teams.home.name}: ${(gameState.xgTimeline.home[gameState.xgTimeline.home.length - 1]?.xg || 0).toFixed(2)}`, 60, 380);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`● ${teams.away.name}: ${(gameState.xgTimeline.away[gameState.xgTimeline.away.length - 1]?.xg || 0).toFixed(2)}`, 400, 380);
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

  const showPopup = (popupData, duration) => {
    setVarCheck(popupData);
    setShowVarPopup(true);
    setTimeout(() => setShowVarPopup(false), duration);
  };

  const generateEvents = (state, minute) => {
    const events = [];
    const probPerSecond = 1 / 60;
    const homeMomentum = state.momentum.home / 100;
    const awayMomentum = state.momentum.away / 100;
    
    // Check for unexpected events
    if (Math.random() < (state.unexpectedEventChance / 100) * probPerSecond) {
      const unexpectedEvents = ['redCard', 'injury', 'wonderGoal', 'ownGoal', 'missedPenalty'];
      const eventType = unexpectedEvents[Math.floor(Math.random() * unexpectedEvents.length)];
      const team = Math.random() < 0.5 ? 'home' : 'away';
      
      switch(eventType) {
        case 'redCard':
          events.push(createEvent('red', team, minute));
          break;
        case 'wonderGoal':
          events.push(createEvent('wonderGoal', team, minute));
          break;
        case 'ownGoal':
          events.push(createEvent('ownGoal', team === 'home' ? 'away' : 'home', minute));
          break;
        case 'missedPenalty':
          events.push(createEvent('missedPenalty', team, minute));
          break;
      }
    }

    // Regular events
    if (Math.random() < (odds.xgHome / 90) * probPerSecond * homeMomentum) {
      events.push(createEvent('goal', 'home', minute));
    }
    if (Math.random() < (odds.xgAway / 90) * probPerSecond * awayMomentum) {
      events.push(createEvent('goal', 'away', minute));
    }
    if (Math.random() < (odds.foulsHome / 90) * probPerSecond * 2) {
      events.push(createEvent('foul', 'home', minute));
    }
    if (Math.random() < (odds.foulsAway / 90) * probPerSecond * 2) {
      events.push(createEvent('foul', 'away', minute));
    }
    if (Math.random() < (odds.yellowsHome / 90) * probPerSecond * 1.5 && state.stats.fouls.home > 2) {
      events.push(createEvent('yellow', 'home', minute));
    }
    if (Math.random() < (odds.yellowsAway / 90) * probPerSecond * 1.5 && state.stats.fouls.away > 2) {
      events.push(createEvent('yellow', 'away', minute));
    }
    if (Math.random() < 0.04) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('shot', team, minute));
    }
    if (Math.random() < 0.03) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('corner', team, minute));
    }
    if (Math.random() < 0.0015) {
      const team = Math.random() < (odds.possessionHome / 100) ? 'home' : 'away';
      events.push(createEvent('penalty', team, minute));
    }

    return events;
  };

  const createEvent = (type, team, minute) => {
    let player;
    const squad = playerSquads[team];
    
    if (type === 'goal' || type === 'shot' || type === 'penalty' || type === 'wonderGoal' || type === 'missedPenalty') {
      const totalProb = squad.reduce((sum, p) => sum + p.scoringProb, 0);
      let random = Math.random() * totalProb;
      
      for (const p of squad) {
        random -= p.scoringProb;
        if (random <= 0) {
          player = p.name;
          break;
        }
      }
    } else if (type === 'ownGoal') {
      const defenders = squad.filter(p => p.position === 'DEF');
      player = defenders[Math.floor(Math.random() * defenders.length)].name;
    } else {
      player = squad[Math.floor(Math.random() * squad.length)].name;
    }
    
    const commentary = {
      goal: `⚽ GOAL! ${player} scores for ${team === 'home' ? teams.home.name : teams.away.name}!`,
      wonderGoal: `🚀 WONDER GOAL! ${player} scores a spectacular goal!`,
      ownGoal: `😱 OWN GOAL! ${player} scores an own goal!`,
      foul: `⚠️ Foul by ${player}`,
      yellow: `🟨 Yellow card for ${player}`,
      red: `🟥 RED CARD! ${player} is sent off!`,
      shot: `🎯 Shot by ${player}`,
      corner: `🚩 Corner for ${team === 'home' ? teams.home.name : teams.away.name}`,
      penalty: `⚡ PENALTY to ${team === 'home' ? teams.home.name : teams.away.name}!`,
      missedPenalty: `❌ PENALTY MISSED by ${player}!`
    };

    return {
      type,
      team,
      minute: Math.floor(minute),
      player,
      commentary: commentary[type],
      timestamp: Date.now() + Math.random()
    };
  };

  const processEvents = (state, events) => {
    let newState = { ...state };

    events.forEach(event => {
      switch (event.type) {
        case 'goal':
        case 'wonderGoal':
        case 'ownGoal':
          const varChanceDecimal = odds.varChance / 100;
          if (event.type === 'goal' && Math.random() < varChanceDecimal) {
            const varDecision = Math.random() < 0.55;
            const reason = varDecision ? 'Goal stands!' : 'Offside!';
            
            showPopup({
              decision: varDecision ? 'GOAL ALLOWED' : 'DISALLOWED',
              reason: reason,
              player: event.player,
              color: varDecision ? '#10b981' : '#ef4444'
            }, 3000);
            
            if (varDecision) {
              processGoal();
            }
          } else {
            processGoal();
          }
          
          function processGoal() {
            newState.score[event.team]++;
            const xgValue = event.type === 'wonderGoal' ? 0.8 : Math.random() * 0.5 + 0.3;
            newState.xgTimeline = {
              ...newState.xgTimeline,
              [event.team]: [...newState.xgTimeline[event.team], {
                minute: state.minute,
                xg: (newState.xgTimeline[event.team][newState.xgTimeline[event.team].length - 1]?.xg || 0) + xgValue
              }]
            };
            
            const shotX = event.team === 'home' ? Math.random() * 150 + 50 : Math.random() * 150 + 600;
            const shotY = Math.random() * 160 + 120;
            newState.shotMap = [...newState.shotMap, {
              x: shotX, y: shotY, team: event.team, xg: xgValue, isGoal: true
            }];
            
            setPlayerStats(prev => ({
              ...prev,
              [event.team]: {
                ...prev[event.team],
                [event.player]: {
                  goals: (prev[event.team]?.[event.player]?.goals || 0) + 1,
                  shots: (prev[event.team]?.[event.player]?.shots || 0) + 1
                }
              }
            }));
            
            newState.stats.shots[event.team]++;
            newState.stats.shotsOnTarget[event.team]++;
            newState.momentum[event.team] = Math.min(100, newState.momentum[event.team] + 15);
            newState.momentum[event.team === 'home' ? 'away' : 'home'] = 100 - newState.momentum[event.team];
          }
          
          setBall({ x: 400, y: 200, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 });
          break;
          
        case 'shot':
          const xgValue = Math.random() * 0.3 + 0.1;
          const shotX = event.team === 'home' ? Math.random() * 200 + 50 : Math.random() * 200 + 550;
          const shotY = Math.random() * 200 + 100;
          newState.shotMap = [...newState.shotMap, {
            x: shotX, y: shotY, team: event.team, xg: xgValue, isGoal: false
          }];
          
          newState.xgTimeline = {
            ...newState.xgTimeline,
            [event.team]: [...newState.xgTimeline[event.team], {
              minute: state.minute,
              xg: (newState.xgTimeline[event.team][newState.xgTimeline[event.team].length - 1]?.xg || 0) + xgValue
            }]
          };
          
          setPlayerStats(prev => ({
            ...prev,
            [event.team]: {
              ...prev[event.team],
              [event.player]: {
                goals: prev[event.team]?.[event.player]?.goals || 0,
                shots: (prev[event.team]?.[event.player]?.shots || 0) + 1
              }
            }
          }));
          
          newState.stats.shots[event.team]++;
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
          newState.momentum[event.team] = Math.max(0, newState.momentum[event.team] - 20);
          newState.momentum[event.team === 'home' ? 'away' : 'home'] = Math.min(100, 100 - newState.momentum[event.team] + 20);
          
          showPopup({
            decision: 'RED CARD!',
            reason: 'Serious foul play',
            player: event.player,
            color: '#dc2626'
          }, 3000);
          break;
          
        case 'corner':
          newState.stats.corners[event.team]++;
          break;
          
        case 'penalty':
          showPopup({
            decision: 'PENALTY KICK!',
            reason: 'Foul in the box',
            player: event.player,
            color: '#8b5cf6'
          }, 3000);
          
          if (Math.random() < 0.75) {
            setTimeout(() => {
              setGameState(prev => {
                const newScore = { ...prev.score };
                newScore[event.team]++;
                
                setPlayerStats(prevStats => ({
                  ...prevStats,
                  [event.team]: {
                    ...prevStats[event.team],
                    [event.player]: {
                      goals: (prevStats[event.team]?.[event.player]?.goals || 0) + 1,
                      shots: (prevStats[event.team]?.[event.player]?.shots || 0) + 1
                    }
                  }
                }));
                
                return {
                  ...prev,
                  score: newScore,
                  events: [...prev.events, {
                    type: 'goal',
                    team: event.team,
                    minute: Math.floor(prev.minute),
                    player: event.player,
                    commentary: `⚽ PENALTY SCORED! ${event.player}`,
                    timestamp: Date.now() + Math.random()
                  }]
                };
              });
            }, 3500);
          }
          break;
          
        case 'missedPenalty':
          showPopup({
            decision: 'PENALTY MISSED!',
            reason: event.player + ' misses!',
            color: '#dc2626'
          }, 3000);
          newState.stats.shots[event.team]++;
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
        redCards: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
        passes: { home: 0, away: 0 },
        passAccuracy: { home: 85, away: 82 },
        tackles: { home: 0, away: 0 }
      },
      events: [],
      isPlaying: false,
      speed: 5,
      momentum: { home: 50, away: 50 },
      halfTimeScore: { home: 0, away: 0 },
      firstHalfStats: null,
      xgTimeline: { home: [{ minute: 0, xg: 0 }], away: [{ minute: 0, xg: 0 }] },
      shotMap: [],
      heatmapData: { home: [], away: [] },
      unexpectedEventChance: 15
    });
    setPlayerStats({ home: {}, away: {} });
    setBall({ x: 400, y: 200, vx: 0, vy: 0 });
    setLiveOdds({
      home: 2.10,
      draw: 3.40,
      away: 3.50,
      over25: 1.85,
      under25: 1.95,
      bttsYes: 1.80,
      bttsNo: 2.00,
      history: []
    });
    setValueBets([]);
  };

  const addToBetBuilder = (market, odds) => {
    setBetBuilder(prev => {
      const exists = prev.selections.find(s => s.market === market);
      if (exists) {
        const newSelections = prev.selections.filter(s => s.market !== market);
        const newOdds = newSelections.reduce((acc, s) => acc * s.odds, 1);
        return { ...prev, selections: newSelections, totalOdds: newOdds };
      } else {
        const newSelections = [...prev.selections, { market, odds }];
        const newOdds = newSelections.reduce((acc, s) => acc * s.odds, 1);
        return { ...prev, selections: newSelections, totalOdds: newOdds };
      }
    });
  };

  const correctScoreMatrix = calculateCorrectScoreMatrix();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* VAR Popup */}
      {showVarPopup && varCheck && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 rounded-xl p-4 shadow-2xl w-80" style={{ borderColor: varCheck.color }}>
            <div className="text-center">
              <div className="text-4xl mb-2">🖥️</div>
              <div className="text-2xl font-black mb-2" style={{ color: varCheck.color }}>
                {varCheck.decision}
              </div>
              <div className="text-sm text-gray-300 mb-1">{varCheck.player}</div>
              <div className="text-xs text-gray-400">{varCheck.reason}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ⚽ Professional Betting Analytics Engine
          </h1>
          <p className="text-gray-400 text-sm">Advanced AI Match Simulation with Live Odds & Value Detection</p>
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-blue-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-4 mb-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="text-xl font-bold mb-1">{teams.home.name}</div>
              <div className="text-5xl font-black">{gameState.score.home}</div>
            </div>
            
            <div className="text-center px-6">
              <div className="text-3xl font-bold mb-1">{Math.floor(gameState.minute)}'</div>
              <div className="text-sm text-gray-400">{gameState.minute >= 90 ? 'FULL TIME' : 'LIVE'}</div>
              {gameState.minute > 0 && gameState.minute < 90 && (
                <div className="mt-2">
                  <div className="flex gap-1 justify-center">
                    <div className={`w-2 h-2 rounded-full ${gameState.isPlaying ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <div className={`w-2 h-2 rounded-full ${gameState.isPlaying ? 'bg-green-500' : 'bg-red-500'} animate-pulse animation-delay-200`}></div>
                    <div className={`w-2 h-2 rounded-full ${gameState.isPlaying ? 'bg-green-500' : 'bg-red-500'} animate-pulse animation-delay-400`}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              <div className="text-xl font-bold mb-1">{teams.away.name}</div>
              <div className="text-5xl font-black">{gameState.score.away}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Left Panel - Settings & Controls */}
          <div className="space-y-4">
            {/* Controls First */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Match Controls
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={togglePlay}
                  className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    gameState.isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {gameState.isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
                </button>

                <button onClick={resetSimulation} className="w-full py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Speed: {gameState.speed}x</label>
                  <input type="range" min="1" max="20" value={gameState.speed} onChange={(e) => setGameState(prev => ({ ...prev, speed: parseInt(e.target.value) }))} className="w-full" />
                </div>
                
                {/* New: Unexpected Events Slider */}
                <div className="border-t border-white/10 pt-2">
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Chaos Factor: {gameState.unexpectedEventChance}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={gameState.unexpectedEventChance} 
                    onChange={(e) => setGameState(prev => ({ ...prev, unexpectedEventChance: parseInt(e.target.value) }))} 
                    className="w-full"
                    disabled={gameState.minute > 0}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {gameState.unexpectedEventChance === 0 && "No surprises"}
                    {gameState.unexpectedEventChance > 0 && gameState.unexpectedEventChance <= 10 && "Realistic"}
                    {gameState.unexpectedEventChance > 10 && gameState.unexpectedEventChance <= 25 && "Unpredictable"}
                    {gameState.unexpectedEventChance > 25 && gameState.unexpectedEventChance <= 40 && "Chaotic"}
                    {gameState.unexpectedEventChance > 40 && "Total Mayhem!"}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Odds Settings
              </h3>
              
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">VAR Chance: {odds.varChance}%</label>
                  <input type="range" min="0" max="100" value={odds.varChance} onChange={(e) => setOdds(prev => ({ ...prev, varChance: parseInt(e.target.value) }))} className="w-full" disabled={gameState.minute > 0} />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Home xG: {odds.xgHome}</label>
                  <input type="range" min="0.5" max="4" step="0.1" value={odds.xgHome} onChange={(e) => setOdds(prev => ({ ...prev, xgHome: parseFloat(e.target.value) }))} className="w-full" disabled={gameState.minute > 0} />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Away xG: {odds.xgAway}</label>
                  <input type="range" min="0.5" max="4" step="0.1" value={odds.xgAway} onChange={(e) => setOdds(prev => ({ ...prev, xgAway: parseFloat(e.target.value) }))} className="w-full" disabled={gameState.minute > 0} />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Home Possession: {odds.possessionHome}%</label>
                  <input type="range" min="20" max="80" value={odds.possessionHome} onChange={(e) => setOdds(prev => ({ ...prev, possessionHome: parseInt(e.target.value) }))} className="w-full" disabled={gameState.minute > 0} />
                </div>
              </div>
            </div>

            {/* Value Bets Alert */}
            {valueBets.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl p-3 border border-yellow-500/50">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-yellow-400">
                  <DollarSign className="w-4 h-4" />
                  Value Bets Detected!
                </h3>
                <div className="space-y-2">
                  {valueBets.map((bet, idx) => (
                    <div key={idx} className="bg-black/30 rounded p-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{bet.market}</span>
                        <span className="text-green-400">@{bet.odds}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-400">Value: {bet.value}</span>
                        <span className="text-yellow-400">{bet.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Momentum */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Momentum
              </h3>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{teams.home.name}</span>
                    <span className="font-bold">{Math.round(gameState.momentum.home)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${gameState.momentum.home}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{teams.away.name}</span>
                    <span className="font-bold">{Math.round(gameState.momentum.away)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500" style={{ width: `${gameState.momentum.away}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Visualization */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10">
              <div className="flex gap-2 mb-3 flex-wrap">
                <button onClick={() => setSelectedView('field')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'field' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  Field
                </button>
                <button onClick={() => setSelectedView('shotmap')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'shotmap' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  Shot Map
                </button>
                <button onClick={() => setSelectedView('xg')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'xg' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  xG Timeline
                </button>
                <button onClick={() => setSelectedView('heatmap')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'heatmap' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  Heatmap
                </button>
                <button onClick={() => setSelectedView('oddsHistory')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'oddsHistory' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  Odds History
                </button>
                <button onClick={() => setSelectedView('correctScore')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'correctScore' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  Correct Score
                </button>
                <button onClick={() => setSelectedView('markets')} className={`px-3 py-1 rounded text-xs font-bold ${selectedView === 'markets' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  All Markets
                </button>
              </div>
              
              {(selectedView !== 'correctScore' && selectedView !== 'markets') ? (
                <canvas ref={canvasRef} width={800} height={400} className="w-full rounded-lg shadow-2xl" />
              ) : selectedView === 'correctScore' ? (
                <div className="bg-slate-800 rounded-lg p-4 h-[400px] overflow-y-auto">
                  <h3 className="text-center text-lg font-bold mb-4 text-purple-400">Correct Score Matrix</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {correctScoreMatrix.map((score, idx) => (
                      <div 
                        key={idx} 
                        className={`bg-gradient-to-br p-2 rounded border text-center text-xs ${
                          score.isCurrent 
                            ? 'from-green-500/30 to-green-600/30 border-green-500' 
                            : 'from-gray-700/30 to-gray-800/30 border-gray-600'
                        }`}
                      >
                        <div className="font-bold text-lg">{score.home}-{score.away}</div>
                        <div className="text-yellow-400">{score.odds}</div>
                        <div className="text-gray-400">{score.probability.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-lg p-4 h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Live Odds */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-xs font-bold mb-2 text-purple-400 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        LIVE ODDS
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>{teams.home.name}</span>
                          <span className="font-bold text-blue-400">{liveOdds.home}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Draw</span>
                          <span className="font-bold text-green-400">{liveOdds.draw}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{teams.away.name}</span>
                          <span className="font-bold text-red-400">{liveOdds.away}</span>
                        </div>
                      </div>
                    </div>

                    {/* Over/Under Goals */}
                    <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="text-xs font-bold mb-2 text-green-400">TOTAL GOALS</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Over 2.5</span>
                          <span className="font-bold text-green-400">{liveOdds.over25}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Under 2.5</span>
                          <span className="font-bold text-blue-400">{liveOdds.under25}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Over 3.5</span>
                          <span className="font-bold text-gray-400">{(liveOdds.over25 * 1.8).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Under 1.5</span>
                          <span className="font-bold text-gray-400">{(liveOdds.under25 * 1.5).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Both Teams to Score */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/20">
                      <div className="text-xs font-bold mb-2 text-yellow-400">BOTH TEAMS TO SCORE</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Yes</span>
                          <span className="font-bold text-green-400">{liveOdds.bttsYes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No</span>
                          <span className="font-bold text-red-400">{liveOdds.bttsNo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Current xG */}
                    <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg p-3 border border-pink-500/20">
                      <div className="text-xs font-bold mb-2 text-pink-400">EXPECTED GOALS (xG)</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>{teams.home.name}</span>
                          <span className="font-bold text-blue-400">{(gameState.xgTimeline.home[gameState.xgTimeline.home.length - 1]?.xg || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{teams.away.name}</span>
                          <span className="font-bold text-red-400">{(gameState.xgTimeline.away[gameState.xgTimeline.away.length - 1]?.xg || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bet Builder */}
                    <div className="col-span-2 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg p-3 border border-indigo-500/20">
                      <div className="text-xs font-bold mb-2 text-indigo-400 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        BET BUILDER
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button 
                          onClick={() => addToBetBuilder(`${teams.home.name} Win`, liveOdds.home)}
                          className={`p-1 rounded text-xs ${betBuilder.selections.find(s => s.market === `${teams.home.name} Win`) ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                          Home Win
                        </button>
                        <button 
                          onClick={() => addToBetBuilder('Over 2.5', liveOdds.over25)}
                          className={`p-1 rounded text-xs ${betBuilder.selections.find(s => s.market === 'Over 2.5') ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                          Over 2.5
                        </button>
                        <button 
                          onClick={() => addToBetBuilder('BTTS Yes', liveOdds.bttsYes)}
                          className={`p-1 rounded text-xs ${betBuilder.selections.find(s => s.market === 'BTTS Yes') ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                          BTTS Yes
                        </button>
                      </div>
                      {betBuilder.selections.length > 0 && (
                        <div className="bg-black/30 rounded p-2 text-xs">
                          <div className="space-y-1">
                            {betBuilder.selections.map((sel, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{sel.market}</span>
                                <span>@{sel.odds}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-white/10 mt-2 pt-2">
                            <div className="flex justify-between font-bold">
                              <span>Total Odds:</span>
                              <span className="text-green-400">{betBuilder.totalOdds.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stake: ${betBuilder.stake}</span>
                              <span className="text-yellow-400">Returns: ${(betBuilder.stake * betBuilder.totalOdds).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10">
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[
                  { label: 'Shots', key: 'shots' },
                  { label: 'On Target', key: 'shotsOnTarget' },
                  { label: 'Corners', key: 'corners' },
                  { label: 'Fouls', key: 'fouls' },
                  { label: 'Cards', key: 'yellowCards' }
                ].map(stat => (
                  <div key={stat.key} className="text-center">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{gameState.stats[stat.key].home}</span>
                      <span className="font-bold">{gameState.stats[stat.key].away}</span>
                    </div>
                    <div className="text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Events & Player Stats */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 border border-white/10">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Commentary
            </h3>
            
            {(Object.keys(playerStats.home).length > 0 || Object.keys(playerStats.away).length > 0) && (
              <div className="mb-3 pb-3 border-b border-white/10">
                <div className="text-xs font-bold mb-2 text-purple-400">⭐ Top Performers</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-bold text-blue-400 mb-1">{teams.home.name}</div>
                    {Object.entries(playerStats.home)
                      .sort((a, b) => b[1].goals - a[1].goals)
                      .slice(0, 3)
                      .map(([name, stats]) => (
                        <div key={name} className="flex justify-between text-xs">
                          <span>{name}</span>
                          <span className="text-green-400">{stats.goals}⚽ {stats.shots}🎯</span>
                        </div>
                      ))}
                  </div>
                  <div>
                    <div className="font-bold text-red-400 mb-1">{teams.away.name}</div>
                    {Object.entries(playerStats.away)
                      .sort((a, b) => b[1].goals - a[1].goals)
                      .slice(0, 3)
                      .map(([name, stats]) => (
                        <div key={name} className="flex justify-between text-xs">
                          <span>{name}</span>
                          <span className="text-green-400">{stats.goals}⚽ {stats.shots}🎯</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {gameState.events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Press "Start" to begin simulation</p>
                </div>
              ) : (
                [...gameState.events].reverse().map((event) => (
                  <div
                    key={`${event.timestamp}-${event.minute}`}
                    className={`p-2 rounded-lg text-xs border transition-all ${
                      event.type === 'goal' || event.type === 'wonderGoal' ? 'bg-green-500/20 border-green-500/50' :
                      event.type === 'ownGoal' ? 'bg-orange-500/20 border-orange-500/50' :
                      event.type === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/50' :
                      event.type === 'red' ? 'bg-red-500/20 border-red-500/50' :
                      event.type === 'penalty' || event.type === 'missedPenalty' ? 'bg-purple-600/20 border-purple-600/50' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{event.minute}'</span>
                      <span className="text-xs px-1 py-0.5 bg-white/10 rounded uppercase">{event.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <p className="text-xs">{event.commentary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};

export default EnhancedSoccerSimulation;
