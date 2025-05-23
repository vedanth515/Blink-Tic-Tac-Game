import React, { createContext, useContext, useState } from 'react';
import { emojiCategories } from '../Data/emojiCategories'
const GameContext = createContext({});

export const useGame = () => useContext(GameContext);

const GameContextProvider = ({ children }) => {
  const [phase, setPhase] = useState('category-selection');
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', score: 0, placedEmojis: [] },
    { id: 2, name: 'Player 2', score: 0, placedEmojis: [] },
  ]);
  const [currentPlayerId, setCurrentPlayerId] = useState(1);
  const [board, setBoard] = useState(Array(9).fill({ emoji: null, playerId: null }));
  const [availableEmoji, setAvailableEmoji] = useState('');
  const [winningCombination, setWinningCombination] = useState(null);

  const currentPlayer = players[currentPlayerId - 1];
  const scores = [players[0].score, players[1].score];

  const getRandomEmoji = (playerId) => {
    const player = players[playerId - 1];
    if (!player.category) return '';
    
    const randomIndex = Math.floor(Math.random() * player.category.emojis.length);
    return player.category.emojis[randomIndex];
  };

  const selectCategory = (playerId, categoryId) => {
    const category = emojiCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[playerId - 1] = {
        ...newPlayers[playerId - 1],
        category,
      };
      return newPlayers;
    });

    if (
      (playerId === 1 && players[1].category) ||
      (playerId === 2 && players[0].category)
    ) {
      setPhase('playing');
      setAvailableEmoji(getRandomEmoji(1));
    }
  };

  const placeEmoji = (index) => {
    if (phase !== 'playing' || board[index].emoji !== null) return;

    let newBoard = [...board];
    const playerEmojis = [...currentPlayer.placedEmojis];

    if (playerEmojis.length >= 3) {
      const oldestEmoji = playerEmojis.shift();
      if (oldestEmoji && index !== oldestEmoji.index) {
        newBoard[oldestEmoji.index] = { emoji: null, playerId: null };
      } else {
        return;
      }
    }

    newBoard[index] = {
      emoji: availableEmoji,
      playerId: currentPlayerId,
    };

    setBoard(newBoard);

    setPlayers(prev => {
      const newPlayers = [...prev];
      const currentPlayerIndex = currentPlayerId - 1;
      
      newPlayers[currentPlayerIndex] = {
        ...newPlayers[currentPlayerIndex],
        placedEmojis: [
          ...playerEmojis,
          { index, emoji: availableEmoji },
        ],
      };
      
      return newPlayers;
    });

    const gameOver = checkWinCondition(newBoard, currentPlayerId);
    
    if (gameOver) {
      setPlayers(prev => {
        const newPlayers = [...prev];
        newPlayers[currentPlayerId - 1].score += 1;
        return newPlayers;
      });
      
      setPhase('game-over');
    } else {
      const nextPlayerId = currentPlayerId === 1 ? 2 : 1;
      setCurrentPlayerId(nextPlayerId);
      setAvailableEmoji(getRandomEmoji(nextPlayerId));
    }
  };

  const checkWinCondition = (boardState, playerId) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
      if (
        boardState[pattern[0]].playerId === playerId &&
        boardState[pattern[1]].playerId === playerId &&
        boardState[pattern[2]].playerId === playerId
      ) {
        setWinningCombination(pattern);
        return true;
      }
    }

    return false;
  };

  const checkGameOver = () => phase === 'game-over';

  const resetGame = (keepCategories = false) => {
    setBoard(Array(9).fill({ emoji: null, playerId: null }));
    setWinningCombination(null);
    setCurrentPlayerId(1);

    if (keepCategories && players[0].category && players[1].category) {
      setPhase('playing');
      setAvailableEmoji(getRandomEmoji(1));
      
      setPlayers(prev => {
        const newPlayers = [...prev];
        newPlayers[0] = { ...newPlayers[0], placedEmojis: [] };
        newPlayers[1] = { ...newPlayers[1], placedEmojis: [] };
        return newPlayers;
      });
    } else {
      setPhase('category-selection');
      setPlayers([
        { id: 1, name: 'Player 1', score: players[0].score, placedEmojis: [] },
        { id: 2, name: 'Player 2', score: players[1].score, placedEmojis: [] },
      ]);
    }
  };

  const resetScores = () => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[0].score = 0;
      newPlayers[1].score = 0;
      return newPlayers;
    });
  };

  const value = {
    phase,
    setPhase,
    players,
    currentPlayer,
    board,
    availableEmoji,
    winningCombination,
    scores,
    selectCategory,
    placeEmoji,
    resetGame,
    resetScores,
    getRandomEmoji,
    checkGameOver,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContextProvider;