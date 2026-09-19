import { CourseType, DifficultyLevel, QuizType, QuizQuestion, AssignmentContent } from '@/types'

// Topic lists by course
export const COURSE_TOPICS: Record<CourseType, string[]> = {
  python: [
    'Python Basics & Syntax',
    'Object-Oriented Programming (OOP)',
    'Data Structures (Lists, Dicts, Sets)',
    'File Handling & Exception Handling',
    'APIs & Requests',
    'Decorators & Generators',
  ],
  machine_learning: [
    'Supervised Learning & Regression',
    'Classification & Decision Trees',
    'Random Forest & Ensemble Methods',
    'Model Evaluation & Confusion Matrix',
    'Feature Engineering & Normalization',
    'Unsupervised Clustering & PCA',
  ],
  deep_learning: [
    'Perceptrons & Backpropagation',
    'Convolutional Neural Networks (CNNs)',
    'Recurrent Neural Networks & LSTMs',
    'Transformers & Self-Attention',
    'Transfer Learning & Pretrained Models',
    'Activation & Loss Functions',
  ],
  ai_automation: [
    'Pandas Data Cleaning & Aggregation',
    'Data Visualization with Matplotlib & Seaborn',
    'AI Agents & Function Calling',
    'Automated Workflow Pipelines (n8n / Make)',
    'RAG Systems & Vector Embeddings',
    'Prompt Engineering & Structured Outputs',
  ],
}

// Question database categorized by course
const QUESTION_BANK: Record<CourseType, QuizQuestion[]> = {
  python: [
    {
      id: 'py-1',
      question: 'Which of the following data structures in Python is immutable?',
      options: ['List', 'Dictionary', 'Tuple', 'Set'],
      correct_answer: 'Tuple',
      explanation: 'Tuples are immutable sequence types in Python; once created, their elements cannot be changed, added, or removed.',
      type: 'mcq',
    },
    {
      id: 'py-2',
      question: 'In Python, what is the purpose of the `__init__` method in a class?',
      options: [
        'To initialize an object instance and its attributes',
        'To destroy an object when no longer needed',
        'To import class definitions from other modules',
        'To convert class instances to JSON strings',
      ],
      correct_answer: 'To initialize an object instance and its attributes',
      explanation: 'The `__init__` constructor method runs automatically when a new instance of a class is created, allowing attributes to be bound.',
      type: 'mcq',
    },
    {
      id: 'py-3',
      question: 'In Python list slicing, what does `my_list[::-1]` return?',
      options: [
        'A copy of the list reversed',
        'Every second element of the list',
        'The first and last elements only',
        'An empty list',
      ],
      correct_answer: 'A copy of the list reversed',
      explanation: 'Specifying a negative step size of -1 in slicing traverses the list backwards from the end to the start.',
      type: 'mcq',
    },
    {
      id: 'py-4',
      question: 'Python sets allow duplicate elements to be stored.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Sets are unordered collections of unique elements. Any duplicates added are automatically discarded.',
      type: 'true_false',
    },
    {
      id: 'py-5',
      question: 'Which keyword in Python is used to create a generator function?',
      options: ['yield', 'return', 'generate', 'async'],
      correct_answer: 'yield',
      explanation: 'The `yield` statement suspends function execution and returns a value to the caller, turning the function into a generator.',
      type: 'mcq',
    },
    {
      id: 'py-6',
      question: 'What is the time complexity of looking up a key in a standard Python dictionary on average?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
      correct_answer: 'O(1)',
      explanation: 'Python dictionaries are implemented using hash tables, which provide average O(1) constant time lookup.',
      type: 'mcq',
    },
  ],
  machine_learning: [
    {
      id: 'ml-1',
      question: 'What metric is best suited for evaluating a classification model on a heavily imbalanced dataset?',
      options: ['Accuracy', 'F1-Score / PR-AUC', 'Mean Squared Error', 'R-squared'],
      correct_answer: 'F1-Score / PR-AUC',
      explanation: 'Accuracy can be misleading when classes are imbalanced (e.g. 99% majority class). F1-Score balances precision and recall.',
      type: 'mcq',
    },
    {
      id: 'ml-2',
      question: 'In Ridge regression (L2 regularization), weights are pushed to exactly zero.',
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'Lasso (L1) regularization forces coefficients to zero for feature selection. Ridge (L2) shrinks coefficients towards zero without setting them strictly to zero.',
      type: 'true_false',
    },
    {
      id: 'ml-3',
      question: 'Which algorithm builds an ensemble of decision trees sequentially, with each tree correcting errors of the previous ones?',
      options: ['Random Forest', 'Gradient Boosting (XGBoost)', 'K-Means', 'Support Vector Machine'],
      correct_answer: 'Gradient Boosting (XGBoost)',
      explanation: 'Boosting algorithms fit new base models iteratively to the pseudo-residuals of the previous models.',
      type: 'mcq',
    },
    {
      id: 'ml-4',
      question: 'What is the primary purpose of cross-validation in machine learning?',
      options: [
        'To assess how well the model generalizes to an independent dataset',
        'To speed up model training time',
        'To eliminate the need for feature scaling',
        'To increase the size of the training dataset',
      ],
      correct_answer: 'To assess how well the model generalizes to an independent dataset',
      explanation: 'K-fold cross-validation evaluates model performance across multiple splits to prevent overfitting to a single train-test split.',
      type: 'mcq',
    },
    {
      id: 'ml-5',
      question: 'Overfitting occurs when a model performs well on training data but poorly on unseen test data.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'Overfitting happens when a model learns noise and specific details of the training set rather than the underlying pattern.',
      type: 'true_false',
    },
  ],
  deep_learning: [
    {
      id: 'dl-1',
      question: 'Which activation function is most widely used in hidden layers of modern deep neural networks to mitigate vanishing gradients?',
      options: ['Sigmoid', 'ReLU (Rectified Linear Unit)', 'Tanh', 'Softmax'],
      correct_answer: 'ReLU (Rectified Linear Unit)',
      explanation: 'ReLU outputs x for x > 0 and 0 otherwise. Its constant derivative of 1 for positive inputs prevents gradients from vanishing during backprop.',
      type: 'mcq',
    },
    {
      id: 'dl-2',
      question: 'In Convolutional Neural Networks (CNNs), what is the main function of Pooling layers?',
      options: [
        'Reduce spatial dimensions (width & height) and computation',
        'Increase the number of color channels',
        'Apply non-linear activations to pixels',
        'Calculate loss against ground truth labels',
      ],
      correct_answer: 'Reduce spatial dimensions (width & height) and computation',
      explanation: 'Max pooling downsamples spatial feature maps, providing translation invariance and reducing parameters.',
      type: 'mcq',
    },
    {
      id: 'dl-3',
      question: 'The Self-Attention mechanism in Transformers scales with O(n^2) computational complexity relative to sequence length n.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'Standard multi-head attention computes a dot product between all pairs of tokens in the sequence, resulting in quadratic complexity.',
      type: 'true_false',
    },
    {
      id: 'dl-4',
      question: 'Which optimization algorithm adapts individual learning rates for each parameter using first and second moments of gradients?',
      options: ['Adam', 'Standard SGD', 'Batch Gradient Descent', 'Perceptron Learning Rule'],
      correct_answer: 'Adam',
      explanation: 'Adam (Adaptive Moment Estimation) combines the benefits of AdaGrad and RMSProp with exponentially decaying moving averages.',
      type: 'mcq',
    },
  ],
  ai_automation: [
    {
      id: 'ai-1',
      question: 'What technique allows Large Language Models to query external documentation before generating an answer?',
      options: [
        'RAG (Retrieval-Augmented Generation)',
        'RLHF (Reinforcement Learning from Human Feedback)',
        'Quantization',
        'LoRA (Low-Rank Adaptation)',
      ],
      correct_answer: 'RAG (Retrieval-Augmented Generation)',
      explanation: 'RAG retrieves relevant document chunks from a vector database using embeddings and injects them into the prompt context for grounded answers.',
      type: 'mcq',
    },
    {
      id: 'ai-2',
      question: 'In Pandas, which method is typically used to fill missing (NaN) values in a DataFrame?',
      options: ['fillna()', 'dropna()', 'replace_null()', 'clean()'],
      correct_answer: 'fillna()',
      explanation: '`df.fillna(value)` fills NA/NaN values using the specified method or constant value.',
      type: 'mcq',
    },
    {
      id: 'ai-3',
      question: 'Vector embeddings convert text into high-dimensional numerical vectors that capture semantic meaning.',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'Embedding models map semantic relationships into vector space such that semantically similar texts have high cosine similarity.',
      type: 'true_false',
    },
    {
      id: 'ai-4',
      question: 'When configuring an autonomous AI Agent, what component allows it to execute external API calls or database lookups?',
      options: ['Tools / Function Calling', 'Temperature parameter', 'Context Window', 'Token Tokenizer'],
      correct_answer: 'Tools / Function Calling',
      explanation: 'Tools and function calling enable an LLM to generate structured invocation arguments that execute code and return real-world actions.',
      type: 'mcq',
    },
  ],
}

// Generate questions dynamically based on course, topic, and count
export function generateQuizQuestions(
  course: CourseType,
  topic: string,
  difficulty: DifficultyLevel,
  quizType: QuizType,
  count: number
): QuizQuestion[] {
  const bank = QUESTION_BANK[course] || QUESTION_BANK.python
  let pool = [...bank]

  if (quizType !== 'mixed') {
    const filtered = pool.filter((q) => q.type === quizType)
    if (filtered.length > 0) pool = filtered
  }

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random())

  const result: QuizQuestion[] = []
  for (let i = 0; i < count; i++) {
    if (i < shuffled.length) {
      result.push({
        ...shuffled[i],
        id: `q-${Date.now()}-${i}`,
      })
    } else {
      // Dynamic fallback question
      const index = i + 1
      result.push({
        id: `gen-${Date.now()}-${index}`,
        question: `In ${topic} (${difficulty} level), what is the key principle regarding ${topic.toLowerCase()} implementation in real-world systems? (Question ${index})`,
        options: [
          `Ensure robust error handling and validate all inputs`,
          `Avoid modular architecture and keep code in single functions`,
          `Disable logging and profiling to maximize raw speed`,
          `Rely solely on default hyperparameter values without testing`,
        ],
        correct_answer: `Ensure robust error handling and validate all inputs`,
        explanation: `Proper design and input validation are essential standards when working with ${topic}.`,
        type: 'mcq',
      })
    }
  }

  return result
}

// Generate structured assignment for instructors
export function generateAssignmentContent(
  course: CourseType,
  topic: string,
  level: DifficultyLevel,
  type: string
): AssignmentContent {
  const courseTitles: Record<CourseType, string> = {
    python: 'Python Engineering',
    machine_learning: 'Applied Machine Learning',
    deep_learning: 'Deep Neural Architectures',
    ai_automation: 'AI Automation & Analytics',
  }

  return {
    title: `${topic} — Practical Application & Analysis`,
    objective: `Students will develop an end-to-end practical understanding of ${topic} in ${courseTitles[course]} at the ${level} level.`,
    scenario: `You are working as an AI developer at a fast-growing tech startup. The engineering team has assigned you to build, test, and document a robust solution leveraging ${topic} for a production-grade pipeline.`,
    task_requirements: [
      `1. Perform exploratory analysis and setup the development environment.`,
      `2. Implement the core logic and pipeline for ${topic} adhering to clean-code principles.`,
      `3. Conduct benchmarking, unit testing, and validate against edge cases.`,
      `4. Prepare a detailed technical report summarizing trade-offs, metrics, and deployment considerations.`,
    ],
    instructions: `Follow the required steps in the scenario. All source code must be clean, modular, and documented with docstrings. Submit your repository link alongside a PDF report.`,
    deliverables: [
      `Complete Source Code / Jupyter Notebook (.ipynb or .py)`,
      `Executive Summary & Technical Architecture Report (PDF, 2-4 pages)`,
      `Benchmark visualisations, performance metrics, and test outputs`,
    ],
    evaluation_criteria: [
      { name: 'Architecture & Technical Implementation', percentage: 40 },
      { name: 'Correctness, Benchmarks & Validation', percentage: 30 },
      { name: 'Documentation, Code Quality & Clarity', percentage: 20 },
      { name: 'Innovation & Problem Solving', percentage: 10 },
    ],
  }
}
