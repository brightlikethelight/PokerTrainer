/**
 * ConceptsLibrary Component
 * Interactive library of poker concepts for learning
 */

import { useState } from 'react';
import './ConceptsLibrary.css';

/**
 * Poker concept definitions organized by category
 */
const CONCEPTS = {
  fundamentals: {
    title: 'Fundamentals',
    description: 'Core concepts every poker player must know',
    concepts: [
      {
        id: 'position',
        title: 'Position',
        level: 'beginner',
        content: `Position refers to where you sit relative to the dealer button. Acting last (being "in position") gives you a significant advantage because you have more information about what your opponents have done.

**Position Types:**
- **Early Position (EP/UTG)**: First to act. Play tight, strongest hands only.
- **Middle Position (MP)**: Moderate position. Can open slightly wider.
- **Cutoff (CO)**: One seat before button. Excellent steal position.
- **Button (BTN)**: Best position. Acts last postflop. Play widest range.
- **Small Blind (SB)**: Posts forced bet. Out of position postflop.
- **Big Blind (BB)**: Posts full forced bet. Defends against steals.

**Why Position Matters:**
1. Information advantage - see what opponents do first
2. Pot control - can check behind for free cards
3. Bluffing opportunities - can steal pots when checked to
4. Value extraction - can size bets optimally`,
        keyPoints: [
          'Later position = wider opening range',
          'Button is the most profitable seat',
          'Being out of position makes hands harder to play',
          'Position advantage increases as streets progress',
        ],
      },
      {
        id: 'pot_odds',
        title: 'Pot Odds',
        level: 'beginner',
        content: `Pot odds represent the ratio between the current pot size and the cost of a contemplated call. They help you determine if calling a bet is mathematically profitable.

**Calculating Pot Odds:**
Pot Odds = Call Amount / (Pot + Call Amount)

**Example:**
- Pot is $100, opponent bets $50
- You need to call $50 to win $150 (pot + bet)
- Pot odds = 50 / 150 = 33% = about 2:1

**Using Pot Odds:**
Compare your pot odds to your equity (chance of winning):
- If equity > pot odds required, CALL is profitable
- If equity < pot odds required, FOLD is correct

**Quick Reference:**
| Bet Size | Pot Odds |
|----------|----------|
| 1/3 pot  | 25%      |
| 1/2 pot  | 33%      |
| 2/3 pot  | 40%      |
| Full pot | 50%      |`,
        keyPoints: [
          'Always calculate pot odds before calling',
          'Compare pot odds to your winning probability',
          'Implied odds consider future betting',
          'Smaller bets give better pot odds',
        ],
      },
      {
        id: 'hand_rankings',
        title: 'Hand Rankings',
        level: 'beginner',
        content: `Standard poker hand rankings from highest to lowest:

1. **Royal Flush** - A, K, Q, J, T of same suit
2. **Straight Flush** - Five consecutive cards of same suit
3. **Four of a Kind** - Four cards of same rank
4. **Full House** - Three of a kind plus a pair
5. **Flush** - Five cards of same suit
6. **Straight** - Five consecutive cards
7. **Three of a Kind** - Three cards of same rank
8. **Two Pair** - Two different pairs
9. **One Pair** - Two cards of same rank
10. **High Card** - No made hand

**Important Notes:**
- In Texas Hold'em, you make the best 5-card hand from 7 cards
- Suits have no ranking (all suits are equal)
- A straight can be A-2-3-4-5 (wheel) or T-J-Q-K-A
- Kickers break ties for same hand types`,
        keyPoints: [
          'Memorize hand rankings completely',
          'Full house beats flush',
          'Kicker matters for pairs and trips',
          'Best 5 cards from 7 available',
        ],
      },
      {
        id: 'bet_sizing',
        title: 'Bet Sizing',
        level: 'beginner',
        content: `Proper bet sizing is crucial for maximizing value and making bluffs effective.

**Common Bet Sizes:**
- **1/3 pot**: Small c-bets, probing bets
- **1/2 pot**: Standard continuation bets
- **2/3 pot**: Value bets, protection bets
- **Full pot**: Strong value, polarized ranges
- **Overbet (1.5x+)**: Polarized (nuts or bluff)

**Sizing Principles:**
1. **For Value**: Size to maximize expected value from worse hands
2. **For Bluffs**: Size to give yourself good bluff equity
3. **For Protection**: Size to deny equity to draws

**Board Texture Considerations:**
- Dry boards (K72r): Can bet smaller
- Wet boards (Jh9h8c): Bet larger for protection
- Paired boards: Can use smaller sizes

**Preflop Sizing:**
- Standard open: 2.5-3x BB
- 3-bet: 3x the open (in position), 4x (out of position)
- Add 1 BB per limper`,
        keyPoints: [
          'Size bets relative to the pot',
          'Larger on wet boards, smaller on dry',
          'Value and bluffs should use similar sizes',
          'Consistent sizing prevents exploitation',
        ],
      },
    ],
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Concepts to elevate your game',
    concepts: [
      {
        id: 'hand_ranges',
        title: 'Hand Ranges',
        level: 'intermediate',
        content: `Instead of putting opponents on specific hands, think in terms of ranges - the collection of all hands they could hold.

**Opening Ranges by Position (6-max):**
- UTG: ~12% (AA-77, AKo-ATo, KQo, AKs-A9s, KQs-KTs, QJs-QTs)
- MP: ~18% (Add 66-55, A9o, KJo-KTo, suited connectors)
- CO: ~25% (Add suited gappers, more offsuit broadway)
- BTN: ~40% (Most suited hands, many offsuit)
- SB: ~25% (Can open wide when folded to)

**Range Visualization:**
- Think of a 13x13 grid (rank x rank)
- Pairs on diagonal
- Suited hands above diagonal
- Offsuit hands below diagonal

**Range Construction:**
1. Start with premium hands (AA, KK, QQ, AK)
2. Add strong hands (JJ-99, AQ, AJ)
3. Widen based on position
4. Consider table dynamics`,
        keyPoints: [
          'Think ranges, not specific hands',
          'Ranges narrow as betting increases',
          'Position determines opening range width',
          'Adjust ranges based on opponent tendencies',
        ],
      },
      {
        id: 'equity',
        title: 'Equity & Outs',
        level: 'intermediate',
        content: `Equity is your share of the pot based on your probability of winning. Outs are cards that improve your hand.

**Counting Outs:**
- Flush draw: 9 outs (13 cards in suit - 4 visible)
- Open-ended straight draw: 8 outs
- Gutshot straight draw: 4 outs
- Two overcards: 6 outs
- Set to full house: 7 outs

**Rule of 2 and 4:**
- Multiply outs by 4 on flop (two cards to come)
- Multiply outs by 2 on turn (one card to come)
- Example: Flush draw = 9 outs × 4 = 36% on flop

**Equity Calculation:**
Your equity = Your outs / Unseen cards

**Discount Outs When:**
- Some outs give opponent better hand
- Board could pair (flush loses to full house)
- Opponent could have blockers`,
        keyPoints: [
          'Use Rule of 2 and 4 for quick math',
          'Some outs are cleaner than others',
          'Equity changes on each street',
          'Combine pot odds with equity',
        ],
      },
      {
        id: 'board_texture',
        title: 'Board Texture',
        level: 'intermediate',
        content: `Board texture refers to how the community cards connect with likely hand ranges.

**Dry Boards:**
- Unconnected, rainbow (no flush draws)
- Example: K-7-2 rainbow
- Favors preflop raiser
- Smaller c-bets effective
- Hard for caller to connect

**Wet Boards:**
- Connected, suited (many draws)
- Example: J-T-8 with two hearts
- More action boards
- Larger bets for protection
- Both players can connect

**Coordinated Boards:**
- Many two-pair, straight, flush possibilities
- Example: Q-J-T with two clubs
- Very draw-heavy
- Aggressive betting important
- Ranges connect frequently

**Paired Boards:**
- Less likely to help ranges
- Good for c-betting
- Blocking effects matter
- Sets become full houses`,
        keyPoints: [
          'Dry boards = smaller bets',
          'Wet boards = larger protection bets',
          'Consider who board favors',
          'Adjust strategy to texture',
        ],
      },
      {
        id: 'spr',
        title: 'Stack-to-Pot Ratio (SPR)',
        level: 'intermediate',
        content: `SPR = Effective Stack / Pot Size after preflop

SPR helps determine optimal postflop strategy.

**Low SPR (<4):**
- Commit with top pair+
- All-in decisions common
- Less room for creative play
- Overpairs very strong

**Medium SPR (4-10):**
- Standard play most valuable
- Can make moves with draws
- Sets extremely valuable
- Multiple streets of betting

**High SPR (>10):**
- Position very important
- Speculative hands gain value
- Top pair can be hard to play
- Deep stack poker dynamics

**Planning with SPR:**
1. Calculate SPR preflop
2. Determine commitment threshold
3. Plan bet sizing across streets
4. Adjust hand selection`,
        keyPoints: [
          'Lower SPR = commit more easily',
          'Higher SPR = position matters more',
          'Plan betting across all streets',
          'SPR affects hand playability',
        ],
      },
    ],
  },
  advanced: {
    title: 'Advanced',
    description: 'Expert-level strategic concepts',
    concepts: [
      {
        id: 'gto_basics',
        title: 'GTO Basics',
        level: 'advanced',
        content: `Game Theory Optimal (GTO) is a strategy that cannot be exploited by any opponent strategy.

**Core GTO Principles:**
1. **Balance**: Have value bets and bluffs in correct ratios
2. **Indifference**: Make opponent indifferent to calling
3. **Unexploitable**: No adjustment beats GTO long-term

**Bluff-to-Value Ratio:**
Based on pot odds you give opponent:
- 1/2 pot bet = 33% bluffs in range
- 2/3 pot bet = 40% bluffs in range
- Full pot bet = 50% bluffs in range

**Mixed Strategies:**
GTO often involves mixing actions:
- Sometimes bet, sometimes check
- Random frequencies based on hand class
- Prevents opponents from exploiting patterns

**When to Use GTO:**
- Against unknown opponents
- Against strong, adapting opponents
- When you're unsure of opponent tendencies

**When to Exploit Instead:**
- Against players with obvious leaks
- In recreational player pools
- When you have strong reads`,
        keyPoints: [
          'GTO is unexploitable baseline',
          'Balance value and bluffs correctly',
          'Exploit when you have reads',
          'GTO vs. recreational = leaving money on table',
        ],
      },
      {
        id: 'exploitative_play',
        title: 'Exploitative Play',
        level: 'advanced',
        content: `Exploitative play involves deviating from GTO to maximize profit against specific opponent tendencies.

**Common Exploits:**
1. **Against Calling Stations:**
   - Value bet thinner
   - Bluff less frequently
   - Size bets larger for value

2. **Against Nits/Tight Players:**
   - Bluff more frequently
   - Steal blinds aggressively
   - Give up vs. aggression

3. **Against Maniacs/Loose-Aggressive:**
   - Call down lighter
   - Trap with strong hands
   - Let them bluff off stacks

4. **Against Weak-Tight Players:**
   - Apply maximum pressure
   - Bet all three streets light
   - They fold too much postflop

**Identifying Tendencies:**
- VPIP: How many hands they play
- PFR: Preflop aggression
- 3-bet%: Reraising frequency
- Fold to C-bet: Postflop tendencies

**Adjustment Framework:**
1. Identify the leak
2. Determine counter-strategy
3. Implement without overadjusting
4. Monitor for adaptation`,
        keyPoints: [
          'Exploit clear opponent weaknesses',
          'Adjust in opposite direction of leak',
          'Track stats to identify tendencies',
          'Be ready to re-adjust if they adapt',
        ],
      },
      {
        id: 'icm',
        title: 'ICM (Independent Chip Model)',
        level: 'advanced',
        content: `ICM converts tournament chip stacks into real money equity based on payout structure.

**Why ICM Matters:**
- Chips have diminishing value in tournaments
- Risk of busting affects decision making
- Bigger stacks can apply ICM pressure
- Final table dynamics change significantly

**Key ICM Concepts:**
1. **Bubble Factor**: How much more valuable survival is than accumulation
2. **Risk Premium**: Amount to adjust calling ranges
3. **ICM Pressure**: Using stack size to force folds

**ICM Adjustments:**
- Tighten up near money bubble
- Avoid marginal spots with medium stacks
- Big stacks can attack short stacks
- Short stacks must take more risks

**Calculating ICM:**
Complex simulations consider:
- All stack sizes
- Payout structure
- Position from bubble
- Future equity implications

**When ICM is Critical:**
- Final table of tournaments
- Money bubble situations
- Pay jumps at featured tables
- Satellite tournaments`,
        keyPoints: [
          'Tournament chips ≠ cash game chips',
          'Survival has added value',
          'Big stacks pressure medium stacks',
          'Use ICM calculators for study',
        ],
      },
    ],
  },
};

const ConceptsLibrary = () => {
  const [selectedCategory, setSelectedCategory] = useState('fundamentals');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [completedConcepts, setCompletedConcepts] = useState(() => {
    const saved = localStorage.getItem('completedConcepts');
    return saved ? JSON.parse(saved) : [];
  });

  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept);
  };

  const handleMarkComplete = () => {
    if (selectedConcept && !completedConcepts.includes(selectedConcept.id)) {
      const newCompleted = [...completedConcepts, selectedConcept.id];
      setCompletedConcepts(newCompleted);
      localStorage.setItem('completedConcepts', JSON.stringify(newCompleted));
    }
  };

  const handleBackToList = () => {
    setSelectedConcept(null);
  };

  const getLevelBadge = (level) => {
    const colors = {
      beginner: '#27ae60',
      intermediate: '#f39c12',
      advanced: '#e74c3c',
    };
    return (
      <span className="level-badge" style={{ background: colors[level] }}>
        {level}
      </span>
    );
  };

  const getTotalProgress = () => {
    const total = Object.values(CONCEPTS).reduce((acc, cat) => acc + cat.concepts.length, 0);
    return { completed: completedConcepts.length, total };
  };

  const renderConceptList = () => {
    const categoryData = CONCEPTS[selectedCategory];
    const progress = getTotalProgress();

    return (
      <div className="concepts-list-view">
        <div className="progress-overview">
          <h3>Your Progress</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          <p>
            {progress.completed} / {progress.total} concepts completed
          </p>
        </div>

        <div className="category-tabs">
          {Object.entries(CONCEPTS).map(([key, cat]) => (
            <button
              key={key}
              className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {cat.title}
              <span className="category-count">
                {cat.concepts.filter((c) => completedConcepts.includes(c.id)).length}/
                {cat.concepts.length}
              </span>
            </button>
          ))}
        </div>

        <div className="category-header">
          <h2>{categoryData.title}</h2>
          <p>{categoryData.description}</p>
        </div>

        <div className="concepts-grid">
          {categoryData.concepts.map((concept) => (
            <div
              key={concept.id}
              className={`concept-card ${completedConcepts.includes(concept.id) ? 'completed' : ''}`}
              onClick={() => handleConceptSelect(concept)}
              onKeyDown={(e) => e.key === 'Enter' && handleConceptSelect(concept)}
              role="button"
              tabIndex={0}
            >
              <div className="concept-card-header">
                {getLevelBadge(concept.level)}
                {completedConcepts.includes(concept.id) && (
                  <span className="completed-badge">Done</span>
                )}
              </div>
              <h3>{concept.title}</h3>
              <p>{concept.keyPoints[0]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConceptDetail = () => {
    if (!selectedConcept) return null;

    const isCompleted = completedConcepts.includes(selectedConcept.id);

    return (
      <div className="concept-detail-view">
        <button className="back-button" onClick={handleBackToList}>
          Back to Concepts
        </button>

        <div className="concept-header">
          <div className="header-top">
            {getLevelBadge(selectedConcept.level)}
            {isCompleted && <span className="completed-badge">Completed</span>}
          </div>
          <h1>{selectedConcept.title}</h1>
        </div>

        <div className="concept-content">
          {selectedConcept.content.split('\n').map((paragraph, idx) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <h3 key={idx}>{paragraph.replace(/\*\*/g, '')}</h3>;
            }
            if (paragraph.startsWith('- ')) {
              return (
                <li key={idx} className="content-list-item">
                  {paragraph.substring(2)}
                </li>
              );
            }
            if (paragraph.startsWith('|')) {
              return null; // Skip table headers in simple rendering
            }
            if (paragraph.trim() === '') {
              return <br key={idx} />;
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        <div className="key-points">
          <h3>Key Takeaways</h3>
          <ul>
            {selectedConcept.keyPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        {!isCompleted && (
          <button className="complete-button" onClick={handleMarkComplete}>
            Mark as Complete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="concepts-library">
      {selectedConcept ? renderConceptDetail() : renderConceptList()}
    </div>
  );
};

export default ConceptsLibrary;
export { CONCEPTS };
