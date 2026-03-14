export interface Question {
  id: number;
  category: 'Math' | 'Portuguese';
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUESTIONS: Question[] = [
  // Math
  { id: 1, category: 'Math', question: '7 × 8 = ?', options: ['54', '56', '64'], correctIndex: 1 },
  { id: 2, category: 'Math', question: '125 + 37 = ?', options: ['162', '152', '172'], correctIndex: 0 },
  { id: 3, category: 'Math', question: '81 ÷ 9 = ?', options: ['7', '8', '9'], correctIndex: 2 },
  { id: 4, category: 'Math', question: '15 × 3 = ?', options: ['45', '35', '55'], correctIndex: 0 },
  { id: 5, category: 'Math', question: '200 - 45 = ?', options: ['155', '145', '165'], correctIndex: 0 },
  // Portuguese
  { id: 6, category: 'Portuguese', question: 'Qual o plural de "Cidadão"?', options: ['Cidadões', 'Cidadãos', 'Cidadães'], correctIndex: 1 },
  { id: 7, category: 'Portuguese', question: 'Qual palavra está escrita corretamente?', options: ['Excessão', 'Exceção', 'Exseção'], correctIndex: 1 },
  { id: 8, category: 'Portuguese', question: 'Antônimo de "Efêmero":', options: ['Passageiro', 'Duradouro', 'Curto'], correctIndex: 1 },
  { id: 9, category: 'Portuguese', question: 'Qual o coletivo de "Peixes"?', options: ['Cardume', 'Enxame', 'Alcateia'], correctIndex: 0 },
  { id: 10, category: 'Portuguese', question: 'Sinônimo de "Alegre":', options: ['Triste', 'Contente', 'Bravo'], correctIndex: 1 },
];

// Generate more questions to reach a good amount
for (let i = 11; i <= 100; i++) {
  if (i % 2 === 0) {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    QUESTIONS.push({
      id: i,
      category: 'Math',
      question: `${a} × ${b} = ?`,
      options: [(a * b).toString(), (a * b + 2).toString(), (a * b - 2).toString()].sort(() => Math.random() - 0.5),
      correctIndex: 0 // Will be recalculated below
    });
    const correctVal = (a * b).toString();
    QUESTIONS[QUESTIONS.length - 1].correctIndex = QUESTIONS[QUESTIONS.length - 1].options.indexOf(correctVal);
  } else {
    QUESTIONS.push({
      id: i,
      category: 'Portuguese',
      question: `Complete: "Eles ____ felizes."`,
      options: ['estão', 'estam', 'estão-se'],
      correctIndex: 0
    });
  }
}
