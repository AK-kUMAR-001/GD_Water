/**
 * AquaAlert AI Heuristic Vector NLP Classifier
 * Computes logical keyword-similarity scores for water infrastructure complaints.
 */

// Stop words to remove during tokenization
const stopWords = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'if', 'then',
  'in', 'on', 'at', 'near', 'from', 'to', 'by', 'for', 'with', 'about', 'against',
  'of', 'off', 'our', 'my', 'your', 'their', 'his', 'her', 'its', 'we', 'they', 'you',
  'water', 'municipal', 'drinking', 'connection', 'pipe', 'pipeline', 'street', 'road'
]);

// Corpora dictionary for water complaints categories
const categoriesCorpus = {
  'Pipeline Burst': [
    'burst', 'bursting', 'broken', 'ruptured', 'gushing', 'shooting', 'flooded', 
    'flooding', 'main road', 'gushed', 'highway', 'spurt', 'blasted'
  ],
  'Water Leakage': [
    'leak', 'leakage', 'leaking', 'dripping', 'flow', 'constant', 'pavement', 
    'wet', 'puddle', 'seepage', 'trickling', 'waste', 'wasting'
  ],
  'Water Theft': [
    'theft', 'stealing', 'stole', 'sucking', 'pump', 'suction', 'unauthorized', 
    'bypass', 'pumping', 'steals', 'robbery', 'illegal connection', 'direct pump'
  ],
  'Illegal Connection': [
    'illegal', 'unauthorized', 'direct', 'tapping', 'tapped', 'connection', 
    'valve', 'commercial', 'unregistered', 'hooking', 'hooked'
  ],
  'Pump Failure': [
    'pump', 'motor', 'failure', 'burned', 'burnt', 'stopped', 'not working', 
    'generator', 'switch', 'fuse', 'starter', 'no power'
  ],
  'No Water Supply': [
    'no water', 'dry', 'supply', 'taps dry', 'no supply', 'three days', 
    'not receiving', 'suffering', 'days without', 'empty tap'
  ],
  'Low Water Pressure': [
    'pressure', 'low', 'slow', 'trickle', 'weak', 'low pressure', 'not filling', 
    'thin line', 'very slow'
  ],
  'Contaminated Water': [
    'contaminated', 'contamination', 'dirty', 'smell', 'yellow', 'brown', 
    'stinky', 'foul', 'bad quality', 'muddy', 'smelly', 'insects'
  ],
  'Overflowing Tank': [
    'overflow', 'overflowing', 'tank full', 'wasting', 'spilling', 'spill', 
    'overhead tank', 'tank overflow', 'sensor failed', 'running over'
  ],
  'Broken Public Tap': [
    'tap', 'public tap', 'broken tap', 'damaged tap', 'faucet', 'public standpost',
    'street tap', 'valve broken'
  ],
  'Sewer Mixing': [
    'sewer', 'sewage', 'drainage', 'mixing', 'mix', 'foul smell', 'drain water', 
    'contamination', 'sewer smell', 'gutter', 'drain mixing'
  ],
  'Water Meter Damage': [
    'meter', 'damaged meter', 'broken meter', 'reading', 'glass broken', 
    'leaking meter', 'dial not turning', 'tempered'
  ]
};

/**
 * Tokenizes and cleans raw text
 * @param {string} text 
 * @returns {Array<string>} list of tokens
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .split(/\s+/)
    .filter(token => token.length > 1 && !stopWords.has(token));
}

/**
 * Classifies query text using Jaccard Similarity and keyword density
 * @param {string} queryText 
 * @returns {object} { category, confidence, matches: { [catName]: score } }
 */
function classifyComplaint(queryText) {
  const tokens = tokenize(queryText);
  if (tokens.length === 0) {
    return {
      predictedCategory: 'Others',
      confidence: 100,
      matchLogs: { 'Others': 1.0 },
      matchedTokens: []
    };
  }

  const scores = {};
  const matchedTokensMap = {};

  Object.entries(categoriesCorpus).forEach(([catName, keywords]) => {
    // Find intersection of query tokens and category keywords
    const matches = tokens.filter(token => 
      keywords.some(keyword => keyword.includes(token) || token.includes(keyword))
    );

    if (matches.length > 0) {
      // Calculate Jaccard similarity index: Intersection / Union
      // Union size: query tokens size + keywords size - matches size
      const intersectionSize = new Set(matches).size;
      const unionSize = new Set([...tokens, ...keywords]).size;
      const jaccardScore = intersectionSize / unionSize;

      // Also calculate a simpler keyword frequency density for short text boost
      const keywordDensity = matches.length / tokens.length;
      
      // Combine scores (weighted average)
      scores[catName] = (jaccardScore * 0.4) + (keywordDensity * 0.6);
      matchedTokensMap[catName] = Array.from(new Set(matches));
    } else {
      scores[catName] = 0;
      matchedTokensMap[catName] = [];
    }
  });

  // Find category with highest score
  let bestCategory = 'Others';
  let bestScore = 0;

  Object.entries(scores).forEach(([catName, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = catName;
    }
  });

  // Normalize confidence (cap at 100%, set a baseline mapping)
  // If no category had any matches, default to "Others"
  let confidence = 0;
  if (bestScore > 0) {
    confidence = Math.min(100, Math.round(bestScore * 140)); // scale factor to make it readable in percentages
  } else {
    bestCategory = 'Others';
    confidence = 100;
  }

  // Generate audit details for verification log
  const auditLogs = {};
  Object.entries(scores).forEach(([catName, score]) => {
    if (score > 0) {
      auditLogs[catName] = {
        score: Math.round(score * 100),
        matchedWords: matchedTokensMap[catName]
      };
    }
  });

  return {
    predictedCategory: bestCategory,
    confidence: confidence,
    matchLogs: auditLogs,
    matchedTokens: matchedTokensMap[bestCategory] || []
  };
}

module.exports = {
  classifyComplaint,
  tokenize
};
