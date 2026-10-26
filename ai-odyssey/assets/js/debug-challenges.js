/* ============================================================
   CRISIS LAB — Debug Game Challenge Data
   Answer = the ONE wrong word / operator / token in the code
   NO flags. Just the bad word.
   ============================================================ */

const DG_CHALLENGES = [

  // ════════════════════════════════════════════════
  // EASY — keyword typos, simple misspellings
  // ════════════════════════════════════════════════

  {
    id: 'e01', difficulty: 'easy', language: 'Python', langTag: 'python', marks: 50,
    description: 'This Python function prints a greeting. One output keyword is misspelled.',
    code:
`def greet(name):
    primt("Hello, " + name)

greet("Alice")`,
    bugWord: 'primt',
    correctWord: 'print',
    hints: [
      'It is the built-in Python output function.',
      'One letter near the middle is wrong.',
      'The correct spelling is p-r-i-n-t.'
    ],
    explanation: '<strong>primt</strong> is a typo. The correct Python output function is <strong>print</strong>.'
  },

  {
    id: 'e02', difficulty: 'easy', language: 'Python', langTag: 'python', marks: 50,
    description: 'A for loop iterates a list — the loop keyword has a typo.',
    code:
`fruits = ["apple", "banana", "cherry"]

fro fruit in fruits:
    print(fruit)`,
    bugWord: 'fro',
    correctWord: 'for',
    hints: [
      'It is the Python iteration keyword.',
      'Three letters, starts with f.',
      'The correct keyword is used to loop over sequences.'
    ],
    explanation: '<strong>fro</strong> is not a keyword. The correct Python loop keyword is <strong>for</strong>.'
  },

  {
    id: 'e03', difficulty: 'easy', language: 'Python', langTag: 'python', marks: 50,
    description: 'A function should return its result — the return keyword has a typo.',
    code:
`def add(a, b):
    retrun a + b

print(add(3, 4))`,
    bugWord: 'retrun',
    correctWord: 'return',
    hints: [
      'It is the keyword used to send a value back from a function.',
      'The letters are slightly swapped.',
      'The correct keyword is r-e-t-u-r-n.'
    ],
    explanation: '<strong>retrun</strong> is a transposed typo. The correct Python keyword is <strong>return</strong>.'
  },

  {
    id: 'e04', difficulty: 'easy', language: 'C', langTag: 'c', marks: 50,
    description: 'Classic C Hello World — the preprocessor directive is misspelled.',
    code:
`#inclde <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    bugWord: 'inclde',
    correctWord: 'include',
    hints: [
      'It is the C preprocessor directive for including headers.',
      'A vowel is missing from the word.',
      'The correct directive is #include.'
    ],
    explanation: '<strong>inclde</strong> is missing the letter "u". The correct C preprocessor directive is <strong>include</strong>.'
  },

  {
    id: 'e05', difficulty: 'easy', language: 'Java', langTag: 'java', marks: 50,
    description: 'Java program prints a line — the method name is misspelled.',
    code:
`public class Main {
    public static void main(String[] args) {
        System.out.pritln("Welcome to Java!");
    }
}`,
    bugWord: 'pritln',
    correctWord: 'println',
    hints: [
      'It is a Java System.out method for printing a line.',
      'The letters are scrambled inside the word.',
      'The correct method is println.'
    ],
    explanation: '<strong>pritln</strong> is a typo. The correct Java output method is <strong>println</strong>.'
  },

  {
    id: 'e06', difficulty: 'easy', language: 'JavaScript', langTag: 'javascript', marks: 50,
    description: 'JavaScript logs a value — the console object is misspelled.',
    code:
`let score = 100;
consol.log("Score:", score);`,
    bugWord: 'consol',
    correctWord: 'console',
    hints: [
      'It is the global JavaScript output object.',
      'One letter is missing from the end.',
      'The correct spelling is c-o-n-s-o-l-e.'
    ],
    explanation: '<strong>consol</strong> is missing the letter "e". The correct JavaScript object is <strong>console</strong>.'
  },

  {
    id: 'e07', difficulty: 'easy', language: 'Python', langTag: 'python', marks: 50,
    description: 'Python imports a module — the import keyword is wrong.',
    code:
`improt random

num = random.randint(1, 10)
print(num)`,
    bugWord: 'improt',
    correctWord: 'import',
    hints: [
      'It is the Python keyword for including external modules.',
      'Two letters inside are swapped.',
      'The correct keyword is i-m-p-o-r-t.'
    ],
    explanation: '<strong>improt</strong> has transposed letters. The correct Python keyword is <strong>import</strong>.'
  },

  {
    id: 'e08', difficulty: 'easy', language: 'Python', langTag: 'python', marks: 50,
    description: 'This Python function computes the length of a list — the built-in function is wrong.',
    code:
`def count_items(items):
    return lne(items)

data = [1, 2, 3, 4, 5]
print(count_items(data))`,
    bugWord: 'lne',
    correctWord: 'len',
    hints: [
      'It is a Python built-in that returns the number of items.',
      'Three letters, but one is missing.',
      'The correct function is len().'
    ],
    explanation: '<strong>lne</strong> is a typo. The correct Python built-in function is <strong>len</strong>.'
  },

  // ════════════════════════════════════════════════
  // MEDIUM — wrong operators, comparison bugs, wrong function names
  // ════════════════════════════════════════════════

  {
    id: 'm01', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This code checks if a number is even. The comparison operator is wrong — using assignment instead of equality.',
    code:
`def is_even(n):
    if n % 2 = 0:
        return True
    return False

print(is_even(4))`,
    bugWord: '=',
    correctWord: '==',
    hints: [
      'Look at the condition inside the if statement.',
      'Python uses different operators for assignment vs comparison.',
      'Equality comparison uses double equals ==.'
    ],
    explanation: 'A single <strong>=</strong> is the assignment operator. For comparison in conditions you need <strong>==</strong> (double equals).'
  },

  {
    id: 'm02', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This function finds the maximum of two numbers — the comparison is backwards.',
    code:
`def my_max(a, b):
    if a < b:
        return a
    return b

print(my_max(10, 3))`,
    bugWord: '<',
    correctWord: '>',
    hints: [
      'Look at the comparison operator in the if statement.',
      'To return the maximum, which value should be bigger?',
      'The operator points in the wrong direction — it should be >.'
    ],
    explanation: 'Using <strong>&lt;</strong> returns the smaller value, not the larger. The correct operator is <strong>&gt;</strong> to find the maximum.'
  },

  {
    id: 'm03', difficulty: 'medium', language: 'C', langTag: 'c', marks: 100,
    description: 'This C loop counts from 1 to 5 — the loop increments in the wrong direction.',
    code:
`#include <stdio.h>

int main() {
    for (int i = 1; i <= 5; i--) {
        printf("%d\\n", i);
    }
    return 0;
}`,
    bugWord: 'i--',
    correctWord: 'i++',
    hints: [
      'Look at the third part of the for loop.',
      'The loop decrements instead of increments — it will run forever.',
      'To count up, use the increment operator.'
    ],
    explanation: '<strong>i--</strong> decrements the counter, causing an infinite loop. The correct increment is <strong>i++</strong> to count upward.'
  },

  {
    id: 'm04', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This function calculates the total of a list — the wrong built-in function is used.',
    code:
`def total(numbers):
    return max(numbers)

scores = [10, 20, 30, 40]
print(total(scores))`,
    bugWord: 'max',
    correctWord: 'sum',
    hints: [
      'The function is supposed to return the total of all values, not the largest.',
      'There is a Python built-in that adds all elements of a list.',
      'The correct function is sum().'
    ],
    explanation: '<strong>max()</strong> returns the largest element. To get the total of all elements, the correct function is <strong>sum()</strong>.'
  },

  {
    id: 'm05', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This function should print the smaller of two numbers — the comparison is wrong.',
    code:
`def my_min(a, b):
    if a > b:
        return a
    return b

print(my_min(5, 9))`,
    bugWord: '>',
    correctWord: '<',
    hints: [
      'Look at the comparison in the if statement.',
      'To find the minimum, which value should we return when a is smaller?',
      'The operator should be less-than to return the smaller value.'
    ],
    explanation: '<strong>&gt;</strong> returns the larger value. To return the minimum, the correct operator is <strong>&lt;</strong>.'
  },

  {
    id: 'm06', difficulty: 'medium', language: 'C', langTag: 'c', marks: 100,
    description: 'This C code adds two numbers — the operator performs the wrong arithmetic.',
    code:
`#include <stdio.h>

int add(int a, int b) {
    return a - b;
}

int main() {
    printf("Sum: %d\\n", add(5, 3));
    return 0;
}`,
    bugWord: '-',
    correctWord: '+',
    hints: [
      'Look at the return statement inside the add function.',
      'The function is named add but uses the wrong arithmetic operator.',
      'To add two numbers use the + operator.'
    ],
    explanation: '<strong>a - b</strong> subtracts instead of adding. The correct operator for addition is <strong>+</strong>.'
  },

  {
    id: 'm07', difficulty: 'medium', language: 'Java', langTag: 'java', marks: 100,
    description: 'Java while loop — one keyword is wrong, causing a syntax error.',
    code:
`public class Loop {
    public static void main(String[] args) {
        int i = 0;
        wile (i < 5) {
            System.out.println(i);
            i++;
        }
    }
}`,
    bugWord: 'wile',
    correctWord: 'while',
    hints: [
      'It is a Java loop control keyword.',
      'One letter is missing from the word.',
      'The correct keyword is w-h-i-l-e.'
    ],
    explanation: '<strong>wile</strong> is not a Java keyword. The correct loop keyword is <strong>while</strong>.'
  },

  {
    id: 'm08', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This code multiplies a value by 2 — the operator is wrong.',
    code:
`def double(n):
    return n + 2

print(double(5))`,
    bugWord: '+',
    correctWord: '*',
    hints: [
      'The function is named double — it should multiply by 2, not add 2.',
      'Look at the operator between n and 2.',
      'Multiplication uses the * operator in Python.'
    ],
    explanation: '<strong>n + 2</strong> adds 2 instead of doubling. To double a value, the correct operator is <strong>*</strong> (multiplication).'
  },

  {
    id: 'm09', difficulty: 'medium', language: 'Python', langTag: 'python', marks: 100,
    description: 'This function counts characters in a string — the wrong built-in is used.',
    code:
`def char_count(s):
    return type(s)

word = "hello"
print(char_count(word))`,
    bugWord: 'type',
    correctWord: 'len',
    hints: [
      'The function should return the number of characters in a string.',
      'type() returns the data type, not the length.',
      'The correct built-in function to count characters is len().'
    ],
    explanation: '<strong>type()</strong> returns the data type, not the character count. The correct function is <strong>len()</strong>.'
  },

  {
    id: 'm10', difficulty: 'medium', language: 'C', langTag: 'c', marks: 100,
    description: 'C program checks if a number is positive — the comparison operator is wrong.',
    code:
`#include <stdio.h>

int main() {
    int x = 5;
    if (x < 0) {
        printf("Positive\\n");
    } else {
        printf("Not positive\\n");
    }
    return 0;
}`,
    bugWord: '<',
    correctWord: '>',
    hints: [
      'Look at the condition in the if statement.',
      'A positive number is greater than zero, not less than zero.',
      'The comparison operator should check if x is greater than 0.'
    ],
    explanation: '<strong>x &lt; 0</strong> checks for negative numbers. To check if a number is positive, the correct operator is <strong>&gt;</strong>.'
  },

  // ════════════════════════════════════════════════
  // HARD — subtle bugs, wrong function calls, tricky operators
  // ════════════════════════════════════════════════

  {
    id: 'h01', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'Fibonacci function — one keyword is transposed, breaking the entire recursion chain.',
    code:
`def fib(n):
    if n <= 1:
        return n
    retrun fib(n - 1) + fib(n - 2)

print(fib(10))`,
    bugWord: 'retrun',
    correctWord: 'return',
    hints: [
      'The bug is a SyntaxError at runtime.',
      'Look carefully at line 4.',
      'A keyword has its letters swapped — r-e-t-r-u-n.'
    ],
    explanation: '<strong>retrun</strong> is a transposed typo of the Python keyword <strong>return</strong>, breaking the recursive call chain.'
  },

  {
    id: 'h02', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'This function checks if a list is sorted — the comparison logic is inverted.',
    code:
`def is_sorted(lst):
    for i in range(len(lst) - 1):
        if lst[i] > lst[i + 1]:
            return True
    return False

print(is_sorted([1, 2, 3, 4]))`,
    bugWord: 'True',
    correctWord: 'False',
    hints: [
      'If a later element is smaller than an earlier one, the list is NOT sorted.',
      'Look at what the function returns when it finds a violation.',
      'The return value inside the if block is backwards.'
    ],
    explanation: 'When <code>lst[i] &gt; lst[i+1]</code>, the list is out of order. Returning <strong>True</strong> is wrong — it should return <strong>False</strong>.'
  },

  {
    id: 'h03', difficulty: 'hard', language: 'C', langTag: 'c', marks: 200,
    description: 'C code uses the wrong format specifier in printf — integer is printed with a string specifier.',
    code:
`#include <stdio.h>

int main() {
    int count = 42;
    float pi = 3.14;
    printf("PI = %f\\n", pi);
    printf("Count = %s\\n", count);
    return 0;
}`,
    bugWord: '%s',
    correctWord: '%d',
    hints: [
      'Look at the second printf statement.',
      'count is an integer, not a string.',
      'The format specifier for integers in C is %d.'
    ],
    explanation: '<strong>%s</strong> is for strings. For an integer variable, the correct C format specifier is <strong>%d</strong>.'
  },

  {
    id: 'h04', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'This function should return the average — the calculation uses the wrong operator.',
    code:
`def average(nums):
    return sum(nums) * len(nums)

data = [10, 20, 30]
print(average(data))`,
    bugWord: '*',
    correctWord: '/',
    hints: [
      'Average = total divided by count.',
      'Look at the operator between sum() and len().',
      'The correct operator should divide the total by the count.'
    ],
    explanation: '<strong>*</strong> multiplies the sum instead of dividing it. The correct operator for average is <strong>/</strong>.'
  },

  {
    id: 'h05', difficulty: 'hard', language: 'Java', langTag: 'java', marks: 200,
    description: 'Java checks if a number is within range — one comparison is wrong, causing an off-by-one logical error.',
    code:
`public class Range {
    public static boolean inRange(int x, int min, int max) {
        return x >= min && x > max;
    }
    public static void main(String[] args) {
        System.out.println(inRange(5, 1, 10));
    }
}`,
    bugWord: '>',
    correctWord: '<=',
    hints: [
      'To be in range, x must be between min and max inclusive.',
      'Look at the second comparison — what should it check?',
      'x must be less than OR equal to max, not greater.'
    ],
    explanation: '<strong>x &gt; max</strong> checks if x is above the range. The correct check is <strong>x &lt;= max</strong> to confirm x is within the upper bound.'
  },

  {
    id: 'h06', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'This function reverses a string — the wrong built-in is used.',
    code:
`def reverse_str(s):
    return sorted(s)

print(reverse_str("hello"))`,
    bugWord: 'sorted',
    correctWord: 'reversed',
    hints: [
      'The function should reverse the string, not sort it alphabetically.',
      'sorted() returns characters in alphabetical order.',
      'The correct function to reverse a sequence is reversed().'
    ],
    explanation: '<strong>sorted()</strong> returns characters in alphabetical order. To reverse a string, the correct function is <strong>reversed()</strong>.'
  },

  {
    id: 'h07', difficulty: 'hard', language: 'C', langTag: 'c', marks: 200,
    description: 'This C factorial function has the wrong base-case operator — causes infinite recursion.',
    code:
`#include <stdio.h>

int factorial(int n) {
    if (n = 0) return 1;
    return n * factorial(n - 1);
}

int main() {
    printf("%d\\n", factorial(5));
    return 0;
}`,
    bugWord: '=',
    correctWord: '==',
    hints: [
      'Look at the base case condition: if (n = 0)',
      'In C, = is assignment; it assigns 0 to n making the condition always false-ish.',
      'Equality comparison in C uses ==.'
    ],
    explanation: '<strong>n = 0</strong> is an assignment, not a comparison. The base case check must use <strong>==</strong> to compare n with 0.'
  },

  {
    id: 'h08', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'This function should return the minimum value of a list — the wrong built-in is used.',
    code:
`def find_min(data):
    return max(data)

numbers = [5, 2, 9, 1, 7]
print(find_min(numbers))`,
    bugWord: 'max',
    correctWord: 'min',
    hints: [
      'The function is called find_min but uses a different built-in.',
      'max() returns the largest value, not the smallest.',
      'The correct Python built-in for the smallest value is min().'
    ],
    explanation: '<strong>max()</strong> returns the largest element. To find the minimum value, the correct function is <strong>min()</strong>.'
  },

  {
    id: 'h09', difficulty: 'hard', language: 'Python', langTag: 'python', marks: 200,
    description: 'This function checks if a string contains a substring — the wrong operator is used.',
    code:
`def has_word(text, word):
    return word not in text

sentence = "hello world"
print(has_word(sentence, "world"))`,
    bugWord: 'not',
    correctWord: 'in',
    hints: [
      'The function is called has_word — it should return True when the word IS present.',
      'Look at the return statement.',
      '"not in" checks if something is absent. Remove the "not" to check presence.'
    ],
    explanation: '<strong>not in</strong> returns True when the word is absent. The correct check for presence is simply <strong>in</strong>.'
  },

  {
    id: 'h10', difficulty: 'hard', language: 'C', langTag: 'c', marks: 200,
    description: 'C code checks if a number is odd — the modulo result comparison is wrong.',
    code:
`#include <stdio.h>

int is_odd(int n) {
    return n % 2 == 0;
}

int main() {
    printf("%d\\n", is_odd(7));
    return 0;
}`,
    bugWord: '0',
    correctWord: '1',
    hints: [
      'An odd number divided by 2 leaves a remainder of 1, not 0.',
      'Look at what the modulo result is being compared to.',
      'n % 2 == 1 correctly identifies an odd number.'
    ],
    explanation: '<strong>n % 2 == 0</strong> checks for even numbers. To identify odd numbers, the correct comparison is <strong>n % 2 == 1</strong>.'
  }

];

// Group by difficulty
const DG_SETS = {
  easy:   DG_CHALLENGES.filter(c => c.difficulty === 'easy'),
  medium: DG_CHALLENGES.filter(c => c.difficulty === 'medium'),
  hard:   DG_CHALLENGES.filter(c => c.difficulty === 'hard'),
};
