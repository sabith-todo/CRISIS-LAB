# 💡 CRISIS LAB — Guided Indirect Hints Manual (1 - 65)

> **Subtle, conceptual, and guidance-oriented hints for all 65 debugging challenges.**  
> - **💡 Hint 1 (Conceptual Clue)**: Identifies the underlying programming concept and error type.  
> - **🔍 Hint 2 (Guiding Direction)**: Points your problem-solving focus toward the required adjustment without giving away the exact solution.

---

## 🐍 Python Indirect Hints (1 - 17)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **01** | Missing Colon in Def | Pay close attention to how Python marks the beginning of an indented block or function scope. | Check the trailing punctuation at the end of the function definition header. |
| **02** | List Index Out of Range | Python lists use zero-based indexing; a collection with N items has valid indices from 0 to N-1. | Examine the upper bound expression passed to the range function in the loop header. |
| **03** | String Type Mismatch | In Python, the `+` operator cannot implicitly combine text and numerical types without conversion. | Look at how the numerical variable can be converted to match the surrounding string operands. |
| **04** | Missing Dictionary Key | Direct square-bracket lookup on a dictionary raises a KeyError if the requested key does not exist. | Consider using a dictionary retrieval method that allows specifying a safe default fallback value. |
| **05** | Indentation Block Error | Python relies strictly on consistent whitespace indentation levels to define statement grouping. | Inspect the indentation alignment of statements immediately following the loop declaration. |
| **06** | Unbound Local Variable | Assigning to a variable inside a function causes Python to treat it as local to that scope by default. | Look into scope declaration keywords that allow modifying module-level variables from within a function. |
| **07** | Missing Self Parameter | In Python OOP, instance methods automatically receive the invoking instance as their initial parameter. | Check the parameter list in the class method definition header. |
| **08** | Division by Zero | Arithmetic operations must defend against conditions where the divisor evaluates to zero. | Implement a defensive guard check on the denominator before performing the division step. |
| **09** | Mutable Default Argument | Default argument expressions in Python are evaluated once at function definition time, not on each call. | Use an immutable sentinel value as the default parameter and initialize the container inside the body. |
| **10** | Modifying List in Iteration | Mutating the length of a collection while iterating over it alters internal loop index tracking. | Consider iterating over a shallow copy or slice of the sequence instead of the live mutating instance. |
| **11** | Missing Return in Recursion | When a recursive branch computes an answer, that result must be propagated back up the call stack. | Check whether the recursive invocation passes its evaluated result back to the caller. |
| **12** | AttributeError NoneType | Calling methods on an object that evaluates to `None` causes a runtime attribute failure. | Add a guard condition to verify the object reference is valid before invoking member functions. |
| **13** | JSON Single Quotes Error | The standard JSON specification has strict requirements for string literal quotation delimiters. | Differentiate between Python string literal flexibility and JSON specification delimiter rules. |
| **14** | Infinite Recursion Depth | Recursive algorithms require a terminating base condition to halt further recursive invocations. | Ensure the algorithm provides a terminating check for small input values before recursing. |
| **15** | Tuple Item Assignment | Tuples are immutable data structures in Python; their elements cannot be reassigned in place. | Construct and return a new tuple with the updated values instead of modifying the existing instance. |
| **16** | Multi-Line String Syntax | Standard single or double quoted strings in Python cannot span across multiple lines without escaping. | Look into Python multi-line string delimiter syntax for spanning raw blocks of text. |
| **17** | Overwriting Built-in list | Naming a variable after a standard Python built-in shadows that constructor in the current scope. | Choose an alternative variable name that does not collide with standard built-in type identifiers. |

---

## ⚡ C Indirect Hints (18 - 34)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **18** | Missing Semicolon | C syntax requires explicit statement termination markers on all executable statements. | Check the end of the executable statement immediately preceding the return statement. |
| **19** | Missing Ampersand in scanf | The `scanf` function requires a memory address location where the parsed input should be stored. | Consider the address-of operator needed when passing scalar variables to `scanf`. |
| **20** | Off-by-One Array Loop | A C array of size N has valid index positions spanning strictly from 0 to N-1. | Review the relational comparison operator used in the loop continuation condition. |
| **21** | Format Specifier Mismatch | Printf format specifiers must accurately reflect the binary data type of their corresponding arguments. | Verify whether the format specifier matches floating-point / double precision numbers. |
| **22** | Assignment in if Condition | In C, a single `=` performs assignment, whereas comparison checks require a distinct relational operator. | Look closely at the expression inside the `if` conditional statement. |
| **23** | Missing stdlib.h Header | Dynamic memory allocation routines require the appropriate standard library header prototype. | Check the preprocessor `#include` directives at the beginning of the source file. |
| **24** | Uninitialized Pointer | Dereferencing an uninitialized pointer causes undefined behavior and segmentation faults. | Ensure the pointer is assigned a valid variable address before writing data through it. |
| **25** | Integer Division Truncation | Dividing two integer operands in C performs integer division and truncates fractional portions. | Look into explicit type casting to promote at least one operand to a floating-point type. |
| **26** | Missing Null Terminator | Standard C string buffers require space for an implicit null terminator character at the end. | Check whether the character array capacity accommodates the full string length plus its terminator. |
| **27** | Dangling Pointer | Stack-allocated local variables are deallocated when their enclosing function scope returns. | Consider storage duration specifiers that preserve variable lifetime across function calls. |
| **28** | Switch Missing Break | C switch statements will fall through into subsequent cases unless explicitly terminated. | Look at the control flow statement needed at the end of each case block. |
| **29** | Struct Pointer Arrow (->) | Accessing members through a pointer to a struct requires different syntax than direct struct instances. | Check the member access operator used on pointer references. |
| **30** | Double Free Memory | Attempting to release dynamically allocated memory that has already been freed corrupts the heap. | Set freed pointers to a sentinel null value to guard against subsequent deallocation. |
| **31** | Malloc Missing sizeof | The `malloc` function takes a raw byte count rather than an element count. | Calculate the total byte requirement by scaling the element count by the type memory footprint. |
| **32** | Infinite Loop Counter | While traversing a linked structure, the traversal pointer must advance on each iteration. | Check whether the traversal pointer is updated inside the loop body. |
| **33** | Conflicting Declaration | A function forward declaration and its actual definition signature must agree in parameter types. | Compare the parameter types between the prototype header and the implementation body. |
| **34** | Pointer Comparison with == | Using `==` on string pointers compares memory addresses rather than string contents. | Use standard library string comparison functions to check for textual equivalence. |

---

## ☕ Java Indirect Hints (35 - 50)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **35** | NullPointerException | Invoking instance methods on an unassigned or null reference causes an immediate runtime exception. | Ensure reference validity before calling member methods. |
| **36** | Non-Static in Static Context | Static methods belong to the class and cannot directly invoke instance methods without an object reference. | Review method modifier keywords to allow direct invocation from static context. |
| **37** | String Equality with == | The `==` operator on Java objects tests reference identity, not value equality. | Look into standard Java object comparison methods for semantic value equivalence. |
| **38** | Array Bounds Exceeded | Java arrays of length L have valid index positions ranging from 0 to L-1. | Check the relational boundary in the loop termination expression. |
| **39** | Missing Return Statement | Non-void methods must guarantee a valid return value across all execution paths. | Ensure the method body provides a return statement reachable under all conditions. |
| **40** | Lossy Double to Int | Java prohibits implicit narrowing conversions that may lose numeric precision. | Use explicit type casting syntax to convert floating-point values to integers. |
| **41** | Unhandled Checked Exception | Java enforces compile-time handling for checked I/O exceptions. | Update the method signature or enclose the operation in exception handling constructs. |
| **42** | Concurrent Modification | Removing elements from a collection while traversing it with an enhanced for-loop invalidates the iterator. | Explore predicate-based removal methods or iterator-safe mechanisms. |
| **43** | Abstract Class Instantiation | Abstract classes define templates and cannot be directly constructed with `new`. | Instantiate a concrete subclass that implements the abstract specification. |
| **44** | Reassigning Final Variable | Variables marked with immutable modifiers can only be assigned once upon initialization. | Review the variable declaration modifiers if its value needs to change during execution. |
| **45** | Method Does Not Override | The `@Override` annotation requires matching the exact parameter signature of the parent method. | Verify that parameter types in the overriding method match the base class declaration. |
| **46** | Infinite Recursion | Recursive steps must make progress toward the base termination condition. | Inspect the parameter argument passed to the subsequent recursive call. |
| **47** | NumberFormatException | `Integer.parseInt` expects a string containing solely valid numeric digits. | Strip any trailing units or non-numeric suffixes before parsing. |
| **48** | Lock Ordering Deadlock | Threads acquiring multiple shared locks in differing sequences can result in circular wait conditions. | Ensure all concurrent execution paths acquire synchronization monitors in a consistent order. |
| **49** | ClassCastException | Incompatible object types in Java cannot be forced across class hierarchies using casting. | Use proper type conversion or string serialization utilities. |
| **50** | Bank Race Condition | Concurrent access to shared mutable state without mutual exclusion leads to race conditions. | Apply thread synchronization mechanisms to protect critical sections during state modification. |

---

## 🌐 HTML Indirect Hints (51 - 55)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **51** | Unclosed Anchor Tag | Inline markup tags must be properly closed to prevent formatting from bleeding into adjacent elements. | Check for missing closing tags in the navigation markup. |
| **52** | Image Using href | Different HTML elements use specific attributes to locate external resources versus hyperlink destinations. | Look at the standard attribute used to load image source data. |
| **53** | Missing Input Name | Form controls must have an identifying payload attribute to be submitted in the request body. | Inspect which essential attribute is missing from the input element. |
| **54** | Missing DOCTYPE | Without a standard document type preamble, modern browsers switch to legacy Quirks Mode rendering. | Review standard HTML5 document prologue declarations. |
| **55** | Invalid Viewport Meta | Mobile responsive layouts require proper viewport configuration to match the screen physical dimensions. | Check the width directive parameter within the viewport meta tag. |

---

## 🎨 CSS Indirect Hints (56 - 60)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **56** | Missing Semicolon | CSS declaration blocks require delimiters between consecutive property-value pairs. | Check the end of each CSS property line within the style rule. |
| **57** | Misspelled align-items | Flexbox alignment properties have precise standard naming conventions for cross-axis alignment. | Verify the exact spelling of the cross-axis flex alignment property. |
| **58** | Missing Class Dot | CSS differentiates between element type selectors and class name selectors using specific prefixes. | Look at the selector prefix required to target HTML class attributes. |
| **59** | Z-Index Missing Position | The `z-index` property only applies to elements with a non-static positioning context. | Add an appropriate positioning property to enable stacking order control. |
| **60** | Malformed Hex Color | Hexadecimal color representations only allow digits and valid hex characters (A through F). | Inspect the characters used in the hexadecimal color code for invalid non-hex digits. |

---

## ⚡ JavaScript Indirect Hints (61 - 65)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **61** | getElementById Hash Typo | `getElementById` takes the raw element identifier, unlike CSS selector query methods. | Review whether ID selector symbols like `#` belong inside `getElementById` parameter strings. |
| **62** | Const Reassignment | Variables declared with immutable binding keywords cannot have their reference reassigned. | Consider variable declaration keywords that allow reassignment in JavaScript. |
| **63** | Strict Equality Mismatch | Strict equality `===` checks both data type and value without performing type coercion. | Ensure both sides of the comparison share the same data type before evaluating equality. |
| **64** | Missing Event Parameter | Accessing event methods like `preventDefault()` requires capturing the event object in the callback signature. | Check the parameter list in the event listener callback function definition. |
| **65** | Missing Await on Fetch | Asynchronous operations return Promises that must be resolved before accessing their payload methods. | Ensure asynchronous function calls utilize appropriate resolution keywords in async contexts. |

---

## 👑 GRAND BOSS ARENA (66)

| # | Challenge Name | 💡 Hint 1 (Conceptual Clue) | 🔍 Hint 2 (Guiding Direction) |
|---|---|---|---|
| **66** | **⚡ QUANTUMNEXUS DISTRIBUTED ENGINE** | 5 Interconnected Subsystems: Topological DAG, Metaclass MRO, Async Heap Priority Scheduler, Spatial Prefix Trie, and Re-entrancy Rollback Guard. | 1) Copy in_degree dict during traversal. 2) Forward `**kwargs` in `super().__new__`. 3) Add monotonic sequence tie-breaker in heap tuples. 4) Avoid mutable default list argument in recursive queries. 5) Catch `Exception` instead of `BaseException` to preserve cancellation. |

