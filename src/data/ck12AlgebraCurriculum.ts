import { StudyModuleNode } from '../types';

/**
 * Complete 13-Chapter Curriculum for CK-12 Algebra I.
 * Provides rich pedagogical artifacts, KaTeX math notation, formulas tables,
 * golden rules, and step-by-step verified solutions for each chapter.
 */
export function buildCK12AlgebraCurriculum(userChapter1Override?: {
  overview?: string;
  examples?: string;
}): StudyModuleNode[] {
  const timestamp = Date.now();

  // Chapter 1: Foundations of Algebra & Variable Expressions
  const ch1Overview = userChapter1Override?.overview || `# CK-12 Algebra I

### 🎯 Learning Objectives
- Understand and define core principles of CK-12 Algebra I.
- Apply mathematical rules and operations step-by-step.
- Solve foundational exercises with precision and verified solutions.

---

### 📖 Core Definitions & Mathematical Principles

- **Variable**: A letter or symbol (such as $x, y, a, b$) representing unknown or changing numbers.
- **Variable Expression**: A mathematical phrase combining numbers, variables, and operational symbols ($+, -, \\times, \\div$) without an equal sign (e.g., $2l + 2w$ or $3x - 10$).
- **Equation**: A mathematical sentence stating that two expressions are equal, joined by an equal sign ($=$) (e.g., $P = 2l + 2w$).

> **Critical Distinction**: An **expression** is evaluated by plugging in values; an **equation** is solved to find unknown values.

---

### 📐 Geometric & Algebraic Formulas Reference
| Figure / Concept | Formula | Components |
| :--- | :--- | :--- |
| **Rectangle Perimeter** | $P = 2l + 2w$ | $l = \\text{length}, w = \\text{width}$ |
| **Rectangle Area** | $A = l \\cdot w = lw$ | Length multiplied by width |
| **Trapezoid Area** | $A = \\frac{h}{2}(a + b)$ | $h = \\text{height}, a, b = \\text{bases}$ |
| **Repeated Multiplication** | $a^n = a \\cdot a \\dots a$ | $a = \\text{base}, n = \\text{exponent}$ |

---

### 💡 Golden Rule for Evaluating Expressions:
1. **Always Use Parentheses**: When substituting a value (especially negatives), wrap it in parentheses (e.g., write $2(12) - 7$, not $212 - 7$).
2. **Order of Operations (PEMDAS)**: Evaluate Parentheses $\\rightarrow$ Exponents $\\rightarrow$ Multiplication/Division $\\rightarrow$ Addition/Subtraction.`;

  const ch1WorkedExample = userChapter1Override?.examples || `## Worked Examples
### Step-by-Step Verified Example

#### Example: Substitution in Algebraic Formulas
**Problem**: Evaluate $2x - 7$ when $x = 12$.

**Step-by-Step Solution**:
1. Substitute $12$ for the variable $x$ in parentheses:
   $$2(12) - 7$$
2. Follow order of operations (multiply first):
   $$24 - 7$$
3. Perform subtraction:
   **Result: $17$**`;

  const chaptersData = [
    {
      num: 1,
      title: 'Equations & Functions Overview',
      code: 'CK12-ALG1 · Ch 1',
      hours: '3.5 hrs study',
      summary: 'Master foundational algebraic principles: variables, expressions, geometric formulas, and the strict order of operations (PEMDAS).',
      topicName: '1. Variables, Expressions & Formulas',
      objective: 'Evaluate variable expressions and geometric formulas using verified order of operations.',
      overview: ch1Overview,
      workedExample: ch1WorkedExample,
      quiz: {
        question: 'What is the value of 2x - 7 when x = 12, evaluated step-by-step?',
        options: ['17', '212 - 7 = 205', '14', '24'],
        correctIndex: 0,
        explanation: 'Substitute 12 into parentheses: 2(12) - 7 = 24 - 7 = 17.',
      },
    },
    {
      num: 2,
      title: 'Real Numbers & Operations',
      code: 'CK12-ALG1 · Ch 2',
      hours: '3.0 hrs study',
      summary: 'Explore the real number system, opposites, absolute values, rational operations, and distributive properties.',
      topicName: '2. Real Number System & Properties',
      objective: 'Classify numbers into subsets and apply distributive, commutative, and associative properties.',
      overview: `# CK-12 Chapter 2: Real Numbers & Operations

### 🎯 Learning Objectives
- Classify real numbers as integers, rationals, or irrationals.
- Apply absolute value rules and signed number arithmetic.
- Utilize the distributive property to simplify expressions.

---

### 📖 Core Definitions & Mathematical Principles
- **Real Numbers ($\\mathbb{R}$)**: All rational and irrational numbers representing points on the number line.
- **Absolute Value ($|x|$)**: The non-negative distance of a number from zero on the number line.
- **Additive Inverse**: The opposite of a number where $a + (-a) = 0$.
- **Distributive Property**: Multiplying a sum by multiplying each addend separately: $a(b + c) = ab + ac$.

---

### 📐 Real Number Properties Reference
| Property | Addition Rule | Multiplication Rule |
| :--- | :--- | :--- |
| **Commutative** | $a + b = b + a$ | $a \\cdot b = b \\cdot a$ |
| **Associative** | $(a + b) + c = a + (b + c)$ | $(ab)c = a(bc)$ |
| **Identity** | $a + 0 = a$ | $a \\cdot 1 = a$ |
| **Inverse** | $a + (-a) = 0$ | $a \\cdot \\frac{1}{a} = 1 \\quad (a \\neq 0)$ |

---

### 💡 Golden Rule for Negative Signs:
1. Two negative signs combined as subtraction of a negative become positive: $a - (-b) = a + b$.
2. In multiplication/division: Same signs give positive ($(-a)(-b) = ab$); different signs give negative ($(-a)(b) = -ab$).`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Simplifying Nested Bracket Expressions
**Problem**: Simplify $4 - 2[3 - (5 - 8)]$.

**Step-by-Step Solution**:
1. Evaluate the innermost parentheses first:
   $$5 - 8 = -3$$
2. Substitute into brackets and simplify subtraction of negative:
   $$3 - (-3) = 3 + 3 = 6$$
3. Multiply outside the bracket:
   $$2(6) = 12$$
4. Perform final subtraction:
   $$4 - 12 = -8$$
   **Result: $-8$**`,
      quiz: {
        question: 'What is the simplified value of 4 - 2[3 - (5 - 8)]?',
        options: ['-8', '8', '-10', '16'],
        correctIndex: 0,
        explanation: '5-8 = -3; 3 - (-3) = 6; 4 - 2(6) = 4 - 12 = -8.',
      },
    },
    {
      num: 3,
      title: 'Linear Equations & Problem Solving',
      code: 'CK12-ALG1 · Ch 3',
      hours: '4.0 hrs study',
      summary: 'Solve one-step, two-step, and multi-step linear equations, isolating variables with inverse operations.',
      topicName: '3. Multi-Step Equations & Variables on Both Sides',
      objective: 'Solve complex linear equations by combining like terms and clearing fractions.',
      overview: `# CK-12 Chapter 3: Linear Equations

### 🎯 Learning Objectives
- Isolate the unknown variable using inverse operations.
- Collect variables on one side and constants on the other.
- Clear fractions and decimals using the LCD.

---

### 📖 Core Principles
- **Linear Equation**: An algebraic equation in which each term has an exponent of 1.
- **Equivalent Equations**: Equations that share the identical solution set.
- **Inverse Operations**: Pairs of operations that undo each other (addition/subtraction, multiplication/division).

---

### 📐 Equation Solving Roadmap
| Step | Action | Example: $3(2x - 1) = 4x + 7$ |
| :--- | :--- | :--- |
| **1. Distribute** | Clear all parentheses | $6x - 3 = 4x + 7$ |
| **2. Collect Variables** | Subtract smaller variable term | $2x - 3 = 7$ |
| **3. Isolate Constant** | Add/subtract constant to both sides | $2x = 10$ |
| **4. Solve Variable** | Divide by coefficient | $x = 5$ |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Equations with Variables on Both Sides
**Problem**: Solve for $x$: $5(2x - 3) - 3x = 13 + x$.

**Step-by-Step Solution**:
1. Distribute across the parenthesis:
   $$10x - 15 - 3x = 13 + x$$
2. Combine like terms on the left:
   $$7x - 15 = 13 + x$$
3. Subtract $x$ from both sides:
   $$6x - 15 = 13$$
4. Add $15$ to both sides:
   $$6x = 28$$
5. Divide by $6$ and reduce fraction:
   $$x = \\frac{28}{6} = \\frac{14}{3}$$
   **Result: $x = \\frac{14}{3}$**`,
      quiz: {
        question: 'Solve for x: 3(x - 4) = 2x + 5',
        options: ['x = 17', 'x = 9', 'x = 1', 'x = -17'],
        correctIndex: 0,
        explanation: '3x - 12 = 2x + 5 => 3x - 2x = 5 + 12 => x = 17.',
      },
    },
    {
      num: 4,
      title: 'Graphing Linear Equations & Functions',
      code: 'CK12-ALG1 · Ch 4',
      hours: '3.5 hrs study',
      summary: 'Plot coordinates on Cartesian plane, determine slopes, intercepts, and interpret rates of change.',
      topicName: '4. Slope & Coordinate Graphing',
      objective: 'Calculate slope from two coordinates and graph equations using x and y intercepts.',
      overview: `# CK-12 Chapter 4: Graphing Linear Equations

### 🎯 Learning Objectives
- Identify quadrants and plot ordered pairs $(x, y)$.
- Calculate slope ($m$) as the ratio of rise over run.
- Determine $x$-intercepts and $y$-intercepts to sketch lines rapidly.

---

### 📐 Slope & Line Formulas Reference
| Concept | Mathematical Formula | Notes |
| :--- | :--- | :--- |
| **Slope Formula** | $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{\\Delta y}{\\Delta x}$ | $x_2 \\neq x_1$ |
| **Horizontal Line** | $y = c$, with slope $m = 0$ | Zero steepness |
| **Vertical Line** | $x = c$, with slope **undefined** | Division by zero |
| **Rate of Change** | $\\text{Rate} = \\frac{\\text{change in } y}{\\text{change in } x}$ | Real-world slope interpretation |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Finding Slope Between Two Points
**Problem**: Find the slope of the line passing through $(-2, 5)$ and $(4, -7)$.

**Step-by-Step Solution**:
1. Assign coordinates $(x_1, y_1) = (-2, 5)$ and $(x_2, y_2) = (4, -7)$.
2. Apply the slope formula:
   $$m = \\frac{-7 - 5}{4 - (-2)}$$
3. Compute numerator and denominator:
   $$m = \\frac{-12}{4 + 2} = \\frac{-12}{6}$$
4. Simplify:
   **Result: $m = -2$**`,
      quiz: {
        question: 'What is the slope of the line passing through (1, 3) and (5, 11)?',
        options: ['m = 2', 'm = 4', 'm = 1/2', 'm = 8'],
        correctIndex: 0,
        explanation: 'm = (11 - 3)/(5 - 1) = 8/4 = 2.',
      },
    },
    {
      num: 5,
      title: 'Writing Linear Equations',
      code: 'CK12-ALG1 · Ch 5',
      hours: '3.0 hrs study',
      summary: 'Write linear models in slope-intercept, point-slope, and standard forms, including parallel and perpendicular lines.',
      topicName: '5. Linear Forms & Line Relationships',
      objective: 'Convert between slope-intercept and standard form, and construct parallel/perpendicular lines.',
      overview: `# CK-12 Chapter 5: Writing Linear Equations

### 🎯 Learning Objectives
- Write equations in slope-intercept form ($y = mx + b$).
- Construct equations using point-slope form ($y - y_1 = m(x - x_1)$).
- Determine relationships of parallel ($m_1 = m_2$) and perpendicular lines ($m_1 m_2 = -1$).

---

### 📐 Line Forms Reference
| Form | Equation Formula | Best Used When... |
| :--- | :--- | :--- |
| **Slope-Intercept** | $y = mx + b$ | Given slope $m$ and $y$-intercept $(0, b)$ |
| **Point-Slope** | $y - y_1 = m(x - x_1)$ | Given slope $m$ and any point $(x_1, y_1)$ |
| **Standard Form** | $Ax + By = C$ | $A, B, C$ are integers, $A \\geq 0$ |
| **Perpendicular Slope** | $m_{\\perp} = -\\frac{1}{m}$ | Negative reciprocal of original slope |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Equation of a Perpendicular Line
**Problem**: Write the equation of a line perpendicular to $y = 2x - 5$ that passes through $(4, 1)$.

**Step-by-Step Solution**:
1. Identify the given slope: $m_1 = 2$.
2. Determine perpendicular slope (negative reciprocal):
   $$m_{\\perp} = -\\frac{1}{2}$$
3. Use point-slope form with point $(4, 1)$:
   $$y - 1 = -\\frac{1}{2}(x - 4)$$
4. Distribute and solve for $y$:
   $$y - 1 = -\\frac{1}{2}x + 2 \\implies y = -\\frac{1}{2}x + 3$$
   **Result: $y = -\\frac{1}{2}x + 3$**`,
      quiz: {
        question: 'What is the slope of any line perpendicular to y = -3/4 x + 2?',
        options: ['4/3', '-4/3', '3/4', '-3/4'],
        correctIndex: 0,
        explanation: 'Perpendicular slope is negative reciprocal: -1 / (-3/4) = 4/3.',
      },
    },
    {
      num: 6,
      title: 'Linear Inequalities & Absolute Value',
      code: 'CK12-ALG1 · Ch 6',
      hours: '3.5 hrs study',
      summary: 'Solve and graph single-variable and compound inequalities, including absolute value inequalities.',
      topicName: '6. Inequalities & Compound Solution Sets',
      objective: 'Solve compound inequalities and graph intervals on the number line.',
      overview: `# CK-12 Chapter 6: Linear Inequalities

### 🎯 Learning Objectives
- Solve multi-step inequalities and graph solution sets.
- Understand the reversal rule when multiplying/dividing by negatives.
- Solve compound AND/OR inequalities and absolute value statements.

---

### 💡 The Golden Rule of Inequalities:
> When multiplying or dividing both sides by a **negative number**, you **MUST reverse** the direction of the inequality sign ($<$ becomes $>$, $\\geq$ becomes $\\leq$).

---

### 📐 Absolute Value Inequalities Reference
| Statement | Equivalent Compound Form | Solution Type |
| :--- | :--- | :--- |
| $|x| < c$ | $-c < x < c$ | **AND** (Bounded interval between $-c$ and $c$) |
| $|x| > c$ | $x < -c \\quad \\text{or} \\quad x > c$ | **OR** (Two disjoint infinite rays) |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Solving with Negative Sign Reversal
**Problem**: Solve $-3x + 5 \\leq 20$.

**Step-by-Step Solution**:
1. Subtract $5$ from both sides:
   $$-3x \\leq 15$$
2. Divide both sides by $-3$ and **flip the inequality sign**:
   $$x \\geq \\frac{15}{-3}$$
3. Simplify:
   **Result: $x \\geq -5$**`,
      quiz: {
        question: 'Solve: -2x + 7 < 19',
        options: ['x > -6', 'x < -6', 'x > 6', 'x < 6'],
        correctIndex: 0,
        explanation: '-2x < 12 => divide by -2 and flip sign => x > -6.',
      },
    },
    {
      num: 7,
      title: 'Systems of Equations & Inequalities',
      code: 'CK12-ALG1 · Ch 7',
      hours: '4.0 hrs study',
      summary: 'Solve systems of two linear equations using substitution, elimination, and graph intersections.',
      topicName: '7. Substitution & Elimination Methods',
      objective: 'Select optimal methods between substitution and elimination for linear systems.',
      overview: `# CK-12 Chapter 7: Systems of Equations

### 🎯 Learning Objectives
- Solve systems by graphing and finding point of intersection.
- Apply the Substitution method when a coefficient is $1$ or $-1$.
- Apply the Elimination (addition) method to cancel variable terms.

---

### 📐 System Classification Reference
| System Type | Graphs Appearance | Number of Solutions |
| :--- | :--- | :--- |
| **Consistent & Independent** | Two intersecting lines | Exactly **one** unique $(x, y)$ |
| **Consistent & Dependent** | Same coincident line | **Infinitely many** solutions |
| **Inconsistent** | Parallel lines | **No solution** ($\\emptyset$) |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Solving by Elimination
**Problem**: Solve the system:
$$\\begin{cases} 2x + 3y = 12 \\\\ 5x - 3y = 9 \\end{cases}$$

**Step-by-Step Solution**:
1. Notice that the $y$-coefficients are opposites ($+3$ and $-3$).
2. Add the two equations directly:
   $$(2x + 5x) + (3y - 3y) = 12 + 9 \\implies 7x = 21$$
3. Solve for $x$:
   $$x = 3$$
4. Substitute $x = 3$ back into the first equation:
   $$2(3) + 3y = 12 \\implies 6 + 3y = 12 \\implies 3y = 6 \\implies y = 2$$
   **Result: $(x, y) = (3, 2)$**`,
      quiz: {
        question: 'What is the solution to { x + y = 10, x - y = 4 }?',
        options: ['(7, 3)', '(6, 4)', '(8, 2)', '(5, 5)'],
        correctIndex: 0,
        explanation: 'Add equations: 2x = 14 => x = 7; 7 + y = 10 => y = 3.',
      },
    },
    {
      num: 8,
      title: 'Exponential Functions & Exponent Rules',
      code: 'CK12-ALG1 · Ch 8',
      hours: '3.5 hrs study',
      summary: 'Master the laws of exponents, negative powers, scientific notation, and exponential growth/decay models.',
      topicName: '8. Laws of Exponents & Growth Models',
      objective: 'Apply product, quotient, and power rules of exponents to simplify expressions.',
      overview: `# CK-12 Chapter 8: Exponential Functions

### 🎯 Learning Objectives
- Apply product, quotient, and power rules of exponents.
- Simplify negative exponents and understand zero exponents.
- Model real-world exponential growth and decay: $y = a(1 \\pm r)^t$.

---

### 📐 Laws of Exponents Reference
| Rule | Algebraic Formula | Example |
| :--- | :--- | :--- |
| **Product Rule** | $a^m \\cdot a^n = a^{m+n}$ | $x^3 \\cdot x^4 = x^7$ |
| **Quotient Rule** | $\\frac{a^m}{a^n} = a^{m-n}$ | $\\frac{x^7}{x^2} = x^5$ |
| **Power of a Power** | $(a^m)^n = a^{mn}$ | $(x^3)^2 = x^6$ |
| **Negative Exponent** | $a^{-n} = \\frac{1}{a^n}$ | $2^{-3} = \\frac{1}{8}$ |
| **Zero Exponent** | $a^0 = 1 \\quad (a \\neq 0)$ | $99^0 = 1$ |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Simplifying Exponent Expressions
**Problem**: Simplify $\\frac{(2x^3y^2)^3}{4x^5y^8}$.

**Step-by-Step Solution**:
1. Apply the power of a power rule to numerator:
   $$(2x^3y^2)^3 = 2^3 \\cdot (x^3)^3 \\cdot (y^2)^3 = 8x^9y^6$$
2. Place over denominator and simplify coefficients:
   $$\\frac{8}{4} = 2$$
3. Apply quotient rule for $x$ and $y$:
   $$x^{9 - 5} = x^4, \\quad y^{6 - 8} = y^{-2} = \\frac{1}{y^2}$$
4. Combine into final simplified form:
   **Result: $\\frac{2x^4}{y^2}$**`,
      quiz: {
        question: 'Simplify (3x^2 y)^2 * x^3:',
        options: ['9x^7 y^2', '6x^7 y^2', '9x^6 y^2', '3x^7 y^2'],
        correctIndex: 0,
        explanation: '(3^2)(x^4)(y^2) * x^3 = 9 * x^(4+3) * y^2 = 9x^7 y^2.',
      },
    },
    {
      num: 9,
      title: 'Polynomials & Factoring',
      code: 'CK12-ALG1 · Ch 9',
      hours: '4.5 hrs study',
      summary: 'Add, subtract, and multiply polynomials, and factor quadratic expressions and difference of squares.',
      topicName: '9. Polynomial Arithmetic & Trinomial Factoring',
      objective: 'Factor quadratic trinomials and difference of two squares completely.',
      overview: `# CK-12 Chapter 9: Polynomials & Factoring

### 🎯 Learning Objectives
- Classify polynomials by degree and number of terms (monomial, binomial, trinomial).
- Multiply binomials using the FOIL method.
- Factor greatest common factors (GCF) and trinomials $x^2 + bx + c$.

---

### 📐 Factoring Patterns Reference
| Pattern | Algebraic Identity | Example |
| :--- | :--- | :--- |
| **Difference of Squares** | $a^2 - b^2 = (a - b)(a + b)$ | $x^2 - 25 = (x - 5)(x + 5)$ |
| **Perfect Square Trinomial** | $a^2 + 2ab + b^2 = (a + b)^2$ | $x^2 + 6x + 9 = (x + 3)^2$ |
| **Trinomial $x^2 + bx + c$** | $(x + p)(x + q)$ where $p+q=b, pq=c$ | $x^2 + 7x + 10 = (x + 2)(x + 5)$ |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Factoring Completely with GCF
**Problem**: Factor completely: $3x^3 - 12x$.

**Step-by-Step Solution**:
1. Identify and factor out the Greatest Common Factor ($3x$):
   $$3x(x^2 - 4)$$
2. Recognize that $x^2 - 4$ is a difference of two squares ($a^2 - b^2$ where $a = x, b = 2$):
   $$x^2 - 4 = (x - 2)(x + 2)$$
3. Write the complete factored product:
   **Result: $3x(x - 2)(x + 2)$**`,
      quiz: {
        question: 'Factor completely: x^2 - 9x + 20',
        options: ['(x - 4)(x - 5)', '(x + 4)(x + 5)', '(x - 2)(x - 10)', '(x - 1)(x - 20)'],
        correctIndex: 0,
        explanation: 'Find two numbers that multiply to +20 and add to -9: -4 and -5.',
      },
    },
    {
      num: 10,
      title: 'Quadratic Equations & Quadratic Functions',
      code: 'CK12-ALG1 · Ch 10',
      hours: '4.0 hrs study',
      summary: 'Solve quadratic equations via factoring, completing the square, and the Quadratic Formula.',
      topicName: '10. The Quadratic Formula & Parabola Analysis',
      objective: 'Calculate the discriminant and apply the quadratic formula to find exact roots.',
      overview: `# CK-12 Chapter 10: Quadratic Equations

### 🎯 Learning Objectives
- Graph parabolas and locate vertex ($x = -\\frac{b}{2a}$) and axis of symmetry.
- Solve quadratics using the Zero Product Property.
- Apply the Quadratic Formula for any quadratic in standard form $ax^2 + bx + c = 0$.

---

### 📐 Quadratic Formula & Discriminant Reference
| Tool | Formula | Significance |
| :--- | :--- | :--- |
| **Quadratic Formula** | $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ | Works for all quadratic equations |
| **Discriminant ($D$)** | $D = b^2 - 4ac$ | Determines nature of roots |
| **$D > 0$** | Positive | **Two real distinct solutions** |
| **$D = 0$** | Zero | **One repeated real solution** |
| **$D < 0$** | Negative | **No real solutions** (two complex roots) |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Solving with the Quadratic Formula
**Problem**: Solve $2x^2 - 4x - 6 = 0$.

**Step-by-Step Solution**:
1. Identify coefficients: $a = 2, b = -4, c = -6$.
2. Compute the discriminant:
   $$D = (-4)^2 - 4(2)(-6) = 16 + 48 = 64$$
3. Since $D > 0$, apply the formula:
   $$x = \\frac{-(-4) \\pm \\sqrt{64}}{2(2)} = \\frac{4 \\pm 8}{4}$$
4. Calculate both branches:
   $$x_1 = \\frac{4 + 8}{4} = \\frac{12}{4} = 3, \\quad x_2 = \\frac{4 - 8}{4} = \\frac{-4}{4} = -1$$
   **Result: $x = 3$ or $x = -1$**`,
      quiz: {
        question: 'What is the discriminant of x^2 - 6x + 9 = 0 and how many real roots exist?',
        options: ['D = 0, exactly 1 real root', 'D = 36, two real roots', 'D = -18, no real roots', 'D = 9, two real roots'],
        correctIndex: 0,
        explanation: 'D = (-6)^2 - 4(1)(9) = 36 - 36 = 0, so exactly one repeated real root (x = 3).',
      },
    },
    {
      num: 11,
      title: 'Algebra & Geometry Connections',
      code: 'CK12-ALG1 · Ch 11',
      hours: '3.5 hrs study',
      summary: 'Connect algebra and coordinate geometry through radical expressions, distance, midpoint, and the Pythagorean Theorem.',
      topicName: '11. Radical Expressions & Pythagorean Connections',
      objective: 'Simplify radical expressions and compute distances on the Cartesian coordinate plane.',
      overview: `# CK-12 Chapter 11: Algebra & Geometry

### 🎯 Learning Objectives
- Simplify square root expressions and remove perfect square factors.
- Apply the Pythagorean Theorem in right triangles: $a^2 + b^2 = c^2$.
- Calculate the distance and midpoint between two coordinate points.

---

### 📐 Geometric Algebra Reference
| Concept | Formula | Notes |
| :--- | :--- | :--- |
| **Pythagorean Theorem** | $a^2 + b^2 = c^2$ | $c = \\text{hypotenuse}$ of right triangle |
| **Distance Formula** | $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$ | Direct application of Pythagorean theorem |
| **Midpoint Formula** | $M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$ | Average of $x$ and $y$ coordinates |
| **Product Rule for Radicals** | $\\sqrt{ab} = \\sqrt{a} \\cdot \\sqrt{b}$ | For non-negative $a, b$ |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Finding Distance Between Two Points
**Problem**: Find the exact distance between $(1, 2)$ and $(4, 6)$.

**Step-by-Step Solution**:
1. Assign $(x_1, y_1) = (1, 2)$ and $(x_2, y_2) = (4, 6)$.
2. Apply the distance formula:
   $$d = \\sqrt{(4 - 1)^2 + (6 - 2)^2}$$
3. Simplify inner terms:
   $$d = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25}$$
4. Take square root:
   **Result: $d = 5$**`,
      quiz: {
        question: 'Simplify the radical expression sqrt(72):',
        options: ['6 sqrt(2)', '3 sqrt(8)', '2 sqrt(18)', '8 sqrt(3)'],
        correctIndex: 0,
        explanation: 'sqrt(72) = sqrt(36 * 2) = sqrt(36) * sqrt(2) = 6 sqrt(2).',
      },
    },
    {
      num: 12,
      title: 'Rational Equations & Functions',
      code: 'CK12-ALG1 · Ch 12',
      hours: '3.5 hrs study',
      summary: 'Explore inverse variation, simplify rational expressions, perform rational arithmetic, and solve rational equations.',
      topicName: '12. Rational Expressions & Inverse Variation',
      objective: 'Simplify rational fractions by factoring and eliminate denominators using LCD.',
      overview: `# CK-12 Chapter 12: Rational Equations

### 🎯 Learning Objectives
- Model inverse variations with $y = \\frac{k}{x}$ ($xy = k$).
- Determine domain restrictions (excluded values where denominator $= 0$).
- Multiply, divide, and simplify rational algebraic fractions.

---

### 📐 Rational Formulas Reference
| Concept | Mathematical Equation | Key Rule |
| :--- | :--- | :--- |
| **Inverse Variation** | $y = \\frac{k}{x}$ or $xy = k$ | As $x$ increases, $y$ decreases proportionally |
| **Excluded Values** | $\\text{Denominator} = 0$ | Division by zero is undefined! |
| **Rational Multiplication** | $\\frac{A}{B} \\cdot \\frac{C}{D} = \\frac{AC}{BD}$ | Factor all numerators & denominators first |
| **Rational Division** | $\\frac{A}{B} \\div \\frac{C}{D} = \\frac{A}{B} \\cdot \\frac{D}{C}$ | Multiply by reciprocal (flip second fraction) |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Solving a Rational Equation
**Problem**: Solve $\\frac{2}{x} + \\frac{1}{3} = \\frac{5}{x}$.

**Step-by-Step Solution**:
1. Note excluded value: $x \\neq 0$.
2. Find the LCD of the denominators $x, 3, x$, which is $3x$.
3. Multiply every term in the equation by $3x$:
   $$3x \\cdot \\frac{2}{x} + 3x \\cdot \\frac{1}{3} = 3x \\cdot \\frac{5}{x}$$
4. Simplify:
   $$6 + x = 15$$
5. Subtract $6$ from both sides:
   $$x = 9$$
   **Result: $x = 9$**`,
      quiz: {
        question: 'What value is excluded from the domain of (x + 3)/(x - 7)?',
        options: ['x = 7', 'x = -3', 'x = 0', 'x = -7'],
        correctIndex: 0,
        explanation: 'Set denominator to zero: x - 7 = 0 => x = 7 is undefined.',
      },
    },
    {
      num: 13,
      title: 'Probability, Statistics & Review',
      code: 'CK12-ALG1 · Ch 13',
      hours: '3.5 hrs study',
      summary: 'Compute experimental & theoretical probabilities, permutations, combinations, and synthesize complete Algebra I mastery.',
      topicName: '13. Counting Principles & Comprehensive Review',
      objective: 'Calculate probabilities and permutations, and review foundational algebra principles.',
      overview: `# CK-12 Chapter 13: Probability & Algebra Review

### 🎯 Learning Objectives
- Differentiate theoretical vs experimental probability.
- Apply the Fundamental Counting Principle and permutations ($_nP_r$).
- Synthesize all 13 chapters of CK-12 Algebra I for comprehensive examination mastery.

---

### 📐 Probability & Counting Reference
| Rule | Mathematical Formula | Usage |
| :--- | :--- | :--- |
| **Theoretical Probability** | $P(E) = \\frac{\\text{favorable outcomes}}{\\text{total possible outcomes}}$ | $0 \\leq P(E) \\leq 1$ |
| **Complement Rule** | $P(\\text{not } E) = 1 - P(E)$ | Probability of event not occurring |
| **Permutations (Order Matters)** | $_nP_r = \\frac{n!}{(n - r)!}$ | Arranging $r$ items from $n$ |
| **Combinations (Order Unimportant)** | $_nC_r = \\frac{n!}{r!(n - r)!}$ | Choosing groups without arrangement |`,
      workedExample: `## Worked Examples
### Step-by-Step Verified Example

#### Example: Permutations vs Combinations
**Problem**: In a club of $8$ students, how many ways can a President, Vice President, and Secretary be chosen?

**Step-by-Step Solution**:
1. Determine if order matters: Yes, each office is distinct (President $\\neq$ Vice President $\\neq$ Secretary).
2. Therefore, this is a **permutation** of $8$ students taken $3$ at a time:
   $$_8P_3 = \\frac{8!}{(8 - 3)!} = \\frac{8!}{5!}$$
3. Compute the product:
   $$_8P_3 = 8 \\times 7 \\times 6 = 336$$
   **Result: $336$ distinct officer slates**`,
      quiz: {
        question: 'What is the probability of rolling a sum of 7 with two standard 6-sided dice?',
        options: ['6/36 = 1/6', '7/36', '1/12', '2/6 = 1/3'],
        correctIndex: 0,
        explanation: 'Favorable pairs: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 out of 36 pairs = 1/6.',
      },
    },
  ];

  return chaptersData.map((ch, idx) => {
    const prefixNum = String(ch.num).padStart(2, '0');
    const topicSlug = `ch${ch.num}-ck12-alg1`;

    const overviewArtifact = {
      id: `art-ck12-ov-${ch.num}-${timestamp}`,
      type: 'overview' as const,
      path: `ch${prefixNum}-key-overview.md`,
      title: 'Key Concept & Rules',
      tagline: 'Learning objectives, core definitions & formulas reference',
      lines: [{ width: '92%' }, { width: '75%' }, { width: '82%' }],
      overviewMarkdown: ch.overview,
      workedExamplesMarkdown: ch.workedExample,
      quizData: ch.quiz,
    };

    const examplesArtifact = {
      id: `art-ck12-ex-${ch.num}-${timestamp}`,
      type: 'examples' as const,
      path: `ch${prefixNum}-worked-examples.md`,
      title: 'Practical Example & Solution',
      tagline: 'Step-by-step verified algebraic walkthrough',
      lines: [{ width: '88%' }, { width: '65%' }, { width: '75%' }],
      overviewMarkdown: ch.overview,
      workedExamplesMarkdown: ch.workedExample,
      quizData: ch.quiz,
    };

    const quizArtifact = {
      id: `art-ck12-qz-${ch.num}-${timestamp}`,
      type: 'quiz' as const,
      path: `ch${prefixNum}-self-check-quiz.json`,
      title: 'Exam Review & Self-Check',
      tagline: 'High-yield practice quiz challenge',
      lines: [{ width: '94%' }, { width: '80%' }, { width: '60%' }],
      overviewMarkdown: ch.overview,
      workedExamplesMarkdown: ch.workedExample,
      quizData: ch.quiz,
    };

    return {
      id: `mod-ck12-ch${ch.num}-${timestamp}`,
      prefix: `// Chapter ${prefixNum}: ${ch.title}`,
      title: `Chapter ${ch.num}: ${ch.title}`,
      courseCode: ch.code,
      estimatedHours: ch.hours,
      summary: ch.summary,
      lines: [{ width: '90%' }, { width: '65%' }, { width: '80%' }, { width: '45%' }],
      blueRoadmap: {
        filename: `chapter-${prefixNum}-syllabus.md`,
        heading: `Key Topics & Roadmap: Chapter ${ch.num} - ${ch.title}`,
        description: `Master these core topics extracted directly from Chapter ${ch.num} of CK-12 Algebra I.`,
        topics: [
          {
            id: `topic-ck12-${ch.num}-1-${timestamp}`,
            topicName: ch.topicName,
            objective: ch.objective,
            lines: [
              { width: '90%', highlight: true },
              { width: '70%' },
              { width: '82%' },
              { width: '55%' },
            ],
            artifacts: [overviewArtifact, examplesArtifact, quizArtifact],
          },
        ],
      },
    };
  });
}
