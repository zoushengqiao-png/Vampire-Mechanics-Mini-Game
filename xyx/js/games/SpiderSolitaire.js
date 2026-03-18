/**
 * 蜘蛛纸牌游戏
 * 核心机制：牌堆管理、顺序排列
 */

import { CardGame } from '../core/BaseGame';

export default class SpiderSolitaire extends CardGame {
  constructor() {
    super();
    this.name = '蜘蛛纸牌';
    this.description = '整理牌堆，完成序列！';

    // 游戏配置
    this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    this.deckSize = 104; // 两副牌
    this.tableauCount = 10; // 10列牌堆
    this.stockCount = 5; // 发牌堆数量

    // 游戏状态
    this.tableau = []; // 主牌堆（10列）
    this.stock = []; // 发牌堆
    this.completedPiles = 0; // 完成的牌组数（目标8组）

    // 卡牌布局
    this.cardWidth = 50;
    this.cardHeight = 70;
    this.verticalSpacing = 20;
  }

  /**
   * 初始化游戏
   */
  init() {
    super.init();
    this.setupBoard();
  }

  /**
   * 设置牌桌
   */
  setupBoard() {
    // 创建两副牌（简化为一种花色）
    this.createDeck();

    // 初始化主牌堆
    this.tableau = [];
    for (let i = 0; i < this.tableauCount; i++) {
      this.tableau.push({
        cards: [],
        x: 15 + i * (this.cardWidth + 8),
        y: 80
      });
    }

    // 发牌到主牌堆
    // 前4列6张，后6列5张
    let cardIndex = 0;
    for (let i = 0; i < this.tableauCount; i++) {
      const cardCount = i < 4 ? 6 : 5;
      for (let j = 0; j < cardCount; j++) {
        const card = this.stock.pop();
        card.faceUp = (j === cardCount - 1); // 最后一张正面朝上
        this.tableau[i].cards.push(card);
        this.updateCardPosition(this.tableau[i], j);
      }
    }

    // 剩余牌放入发牌堆
    this.stockPiles = [];
    for (let i = 0; i < this.stockCount; i++) {
      this.stockPiles.push({
        cards: this.stock.splice(0, 10),
        x: 15 + i * 30,
        y: this.cardHeight + 100
      });
    }

    this.completedPiles = 0;
  }

  /**
   * 创建牌组
   */
  createDeck() {
    this.stock = [];
    // 简化版本：使用一种花色，8组完整的A-K
    for (let group = 0; group < 8; group++) {
      for (let rank = 1; rank <= 13; rank++) {
        const card = this.createCard('spades', rank, false);
        card.width = this.cardWidth;
        card.height = this.cardHeight;
        this.stock.push(card);
      }
    }
    // 洗牌
    this.shuffle(this.stock);
  }

  /**
   * 洗牌
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * 更新卡牌位置
   */
  updateCardPosition(pile, cardIndex) {
    const card = pile.cards[cardIndex];
    card.targetX = pile.x;
    card.targetY = pile.y + cardIndex * this.verticalSpacing;
    card.x = card.targetX;
    card.y = card.targetY;
  }

  /**
   * 设置触摸事件
   */
  setupTouchEvents() {
    this.addTouchHandler('start', (event) => {
      if (this.gameState !== 'playing') return;

      const { clientX, clientY } = event.touches[0];

      // 检查是否点击了发牌堆
      for (let i = this.stockPiles.length - 1; i >= 0; i--) {
        const stockPile = this.stockPiles[i];
        if (stockPile.cards.length > 0 &&
            clientX >= stockPile.x && clientX <= stockPile.x + this.cardWidth &&
            clientY >= stockPile.y && clientY <= stockPile.y + this.cardHeight) {
          this.dealFromStock(i);
          return;
        }
      }

      // 检查是否点击了主牌堆
      for (let i = 0; i < this.tableauCount; i++) {
        const pile = this.tableau[i];
        if (pile.cards.length > 0) {
          const clickedCard = this.getClickedCard(clientX, clientY, pile);
          if (clickedCard) {
            this.handleCardClick(pile, clickedCard.card, clickedCard.index);
            return;
          }
        }
      }
    });

    this.addTouchHandler('move', (event) => {
      if (this.draggedCard) {
        const { clientX, clientY } = event.touches[0];
        this.draggedCard.x = clientX - this.draggedCard.offsetX;
        this.draggedCard.y = clientY - this.draggedCard.offsetY;
      }
    });

    this.addTouchHandler('end', (event) => {
      if (this.draggedCard) {
        this.handleCardDrop();
      }
    });
  }

  /**
   * 从发牌堆发牌
   */
  dealFromStock(pileIndex) {
    // 检查是否所有列都有牌
    const allColumnsHaveCards = this.tableau.every(pile => pile.cards.length > 0);
    if (!allColumnsHaveCards) {
      this.framework.sharedResources.ui.showToast('所有列都必须有牌才能发牌');
      return;
    }

    const stockPile = this.stockPiles[pileIndex];
    if (stockPile.cards.length === 0) return;

    // 给每列发一张牌
    for (let i = 0; i < this.tableauCount; i++) {
      if (stockPile.cards.length > 0) {
        const card = stockPile.cards.pop();
        card.faceUp = true;
        this.tableau[i].cards.push(card);
        this.updateCardPosition(this.tableau[i], this.tableau[i].cards.length - 1);
      }
    }

    // 移除空的发牌堆
    if (stockPile.cards.length === 0) {
      this.stockPiles.splice(pileIndex, 1);
    }

    this.checkCompletedSequences();
  }

  /**
   * 处理卡牌点击
   */
  handleCardClick(pile, card, cardIndex) {
    if (!card.faceUp) return;

    // 检查是否可以选择这组卡牌
    if (this.isValidSelection(pile, cardIndex)) {
      this.selectedCard = {
        pile,
        card,
        cardIndex
      };
      this.draggedCard = card;
      this.draggedCard.offsetX = 0;
      this.draggedCard.offsetY = 0;
    }
  }

  /**
   * 检查选择是否有效
   */
  isValidSelection(pile, startIndex) {
    for (let i = startIndex; i < pile.cards.length - 1; i++) {
      const current = pile.cards[i];
      const next = pile.cards[i + 1];

      if (current.rank !== next.rank + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * 处理卡牌放下
   */
  handleCardDrop() {
    const { pile, card, cardIndex } = this.selectedCard;

    // 找到最近的有效列
    let bestPile = null;
    let minDistance = Infinity;

    for (let i = 0; i < this.tableauCount; i++) {
      if (i === this.tableau.indexOf(pile)) continue;

      const targetPile = this.tableau[i];
      const lastCard = targetPile.cards[targetPile.cards.length - 1];
      const targetX = targetPile.x;
      const targetY = lastCard ? lastCard.y : targetPile.y;

      const distance = Math.sqrt(
        Math.pow(this.draggedCard.x - targetX, 2) +
        Math.pow(this.draggedCard.y - targetY, 2)
      );

      if (distance < 100 && distance < minDistance) {
        // 检查是否可以放置
        if (this.canPlaceOn(pile, cardIndex, targetPile)) {
          bestPile = targetPile;
          minDistance = distance;
        }
      }
    }

    if (bestPile) {
      // 移动卡牌
      const cardsToMove = pile.cards.splice(cardIndex);
      bestPile.cards.push(...cardsToMove);

      // 更新位置
      for (let i = 0; i < bestPile.cards.length; i++) {
        this.updateCardPosition(bestPile, i);
      }

      // 翻开原列最后一张牌
      if (pile.cards.length > 0) {
        const lastCard = pile.cards[pile.cards.length - 1];
        lastCard.faceUp = true;
      }

      this.addScore(5);
      this.checkCompletedSequences();
    } else {
      // 返回原位
      this.updateCardPosition(pile, cardIndex);
    }

    this.selectedCard = null;
    this.draggedCard = null;
  }

  /**
   * 检查是否可以放置
   */
  canPlaceOn(sourcePile, startIndex, targetPile) {
    const movingCard = sourcePile.cards[startIndex];

    if (targetPile.cards.length === 0) {
      return true;
    }

    const targetCard = targetPile.cards[targetPile.cards.length - 1];
    return targetCard.rank === movingCard.rank + 1;
  }

  /**
   * 检查完成的序列
   */
  checkCompletedSequences() {
    for (let i = 0; i < this.tableauCount; i++) {
      const pile = this.tableau[i];

      if (pile.cards.length >= 13) {
        // 检查最后13张是否是K到A的序列
        let isSequence = true;
        const sequenceStart = pile.cards.length - 13;

        for (let j = 0; j < 13; j++) {
          const expectedRank = 13 - j; // K(13)到A(1)
          const card = pile.cards[sequenceStart + j];

          if (card.rank !== expectedRank || !card.faceUp) {
            isSequence = false;
            break;
          }
        }

        if (isSequence) {
          // 移除完成的序列
          pile.cards.splice(sequenceStart, 13);
          this.completedPiles++;
          this.addScore(100);

          // 翻开新的最后一张牌
          if (pile.cards.length > 0) {
            const lastCard = pile.cards[pile.cards.length - 1];
            lastCard.faceUp = true;
          }

          // 检查胜利
          if (this.completedPiles >= 8) {
            this.endGame();
          }
        }
      }
    }
  }

  /**
   * 渲染游戏
   */
  render(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 背景
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 渲染UI
    this.renderCommonUI(ctx);
    this.renderGameInfo(ctx);

    // 渲染发牌堆
    this.renderStockPiles(ctx);

    // 渲染主牌堆
    this.tableau.forEach(pile => {
      pile.cards.forEach(card => {
        this.renderCard(ctx, card);
      });
    });

    // 渲染拖拽中的卡牌
    if (this.draggedCard) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      this.renderCard(ctx, this.draggedCard);
      ctx.restore();
    }
  }

  /**
   * 渲染发牌堆
   */
  renderStockPiles(ctx) {
    this.stockPiles.forEach(pile => {
      if (pile.cards.length > 0) {
        const card = pile.cards[pile.cards.length - 1];
        card.x = pile.x;
        card.y = pile.y;
        this.renderCard(ctx, card);
      }
    });
  }

  /**
   * 渲染游戏信息
   */
  renderGameInfo(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      text: '#ffffff'
    };

    // 完成进度
    ctx.fillStyle = colors.text;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`完成: ${this.completedPiles}/8`, 20, 80);

    // 发牌堆剩余
    const remainingStock = this.stockPiles.reduce((sum, pile) => sum + pile.cards.length, 0);
    ctx.textAlign = 'right';
    ctx.fillText(`剩余牌: ${remainingStock}`, SCREEN_WIDTH - 20, 80);
  }

  /**
   * 检查游戏完成
   */
  checkCompletion() {
    return this.completedPiles >= 8;
  }

  /**
   * 获取游戏信息
   */
  static getGameInfo() {
    return {
      id: 'spider_solitaire',
      name: '蜘蛛纸牌',
      description: '整理牌堆，完成8组完整序列！',
      version: '1.0.0',
      author: '',
      thumbnail: ''
    };
  }

  /**
   * 获取游戏规则
   */
  static getRules() {
    return [
      '将卡牌按从大到小的顺序排列',
      '相同花色的K到A可以同时移动',
      '空列可以放置任意卡牌',
      '完成一组K到A的序列会自动移除',
      '完成8组序列即可获胜'
    ];
  }
}
