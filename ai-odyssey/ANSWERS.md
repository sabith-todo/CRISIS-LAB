# 🏆 CRISIS LAB — Master Answers Key (Normal View)

Comprehensive debugging guide and answer key for all 76 competitive engineering challenges.
- **Easy Challenges**: 3 code errors.
- **Medium Challenges**: 7 architectural errors.
- **Hard Challenges**: Advanced High-Difficulty Systems Hazards.
- **Boss Challenge**: Master multi-language dynamic flag.

---

## 📂 Section: Python (Python)

### Challenge 01: Asyncio Event Loop Blocking
- **Difficulty**: `HARD` (200 pts)
- **File**: `async_worker.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A high-throughput WebSocket worker processes telemetry events asynchronously. However, during high load, heartbeats timeout and all concurrent connections freeze because synchronous I/O blocks the single-threaded asyncio event loop.
- **Exact Solution / Fix**: `await asyncio.sleep(0.5)`
- **Accepted Formats**: `await asyncio.sleep(0.5)`, `await asyncio.sleep`, `asyncio.sleep(0.5)`, `await asyncio.sleep(delay)`, `AIODYSSEY{asyncio_await_sleep_nonblocking}`

---

### Challenge 02: Closure Late-Binding in Lambdas
- **Difficulty**: `EASY` (50 pts)
- **File**: `pipeline_filters.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Fix the lambda parameter binding so each closure captures the loop variable at definition time by value.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `lambda x, i=i: x * i`
- **Accepted Formats**: `lambda x, i=i: x * i`, `lambda x, i=i: x*i`, `i=i`, `x, i=i`, `AIODYSSEY{python_lambda_default_arg_binding}`

---

### Challenge 03: Mutable Default Cross-Session Contamination
- **Difficulty**: `EASY` (50 pts)
- **File**: `session_state.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Refactor the function signature and default handling to prevent shared mutable state across independent invocations.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `def create_user_session(username: str, permissions=None):`
- **Accepted Formats**: `def create_user_session(username: str, permissions=None):`, `def create_user_session(username: str, permissions: list = None):`, `permissions=None`, `permissions = None`, `AIODYSSEY{python_mutable_default_none_idiom}`

---

### Challenge 04: Generator Pipeline Exhaustion
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `stream_processor.py`
- **Language**: Python
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Fix the data pipeline so multi-pass analytics receive a repeatable collection or materialize the generator stream safely.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `latencies = list(parse_log_latencies(stream))`
- **Accepted Formats**: `latencies = list(parse_log_latencies(stream))`, `list(parse_log_latencies(stream))`, `list(latencies)`, `latencies = list(latencies)`, `AIODYSSEY{python_materialize_generator_list}`

---

### Challenge 05: Dictionary Mutation During Iteration
- **Difficulty**: `EASY` (50 pts)
- **File**: `registry_cleanup.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Modify the iteration mechanism to iterate over a snapshot copy of the dictionary keys.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `for node_id, data in list(registry.items()):`
- **Accepted Formats**: `for node_id, data in list(registry.items()):`, `list(registry.items())`, `list(registry.keys())`, `for node_id, data in registry.copy().items():`, `registry.copy().items()`, `AIODYSSEY{python_dict_snapshot_keys_iteration}`

---

### Challenge 06: Thread-Safe Critical Section Missing Lock
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `bank_ledger.py`
- **Language**: Python
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Wrap the critical section using the instance's threading.Lock context manager.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `with self._lock:`
- **Accepted Formats**: `with self._lock:`, `with self._lock`, `self._lock.acquire()`, `AIODYSSEY{python_threading_lock_context_manager}`

---

### Challenge 07: IEEE 754 Floating-Point Precision Loss
- **Difficulty**: `EASY` (50 pts)
- **File**: `crypto_settlement.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Import and utilize the Decimal class from the decimal module for exact fixed-point financial arithmetic.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `math.isclose(actual_total, expected_total)`
- **Accepted Formats**: `math.isclose(actual_total, expected_total)`, `isclose(actual_total, expected_total)`, `Decimal(str(tx1)) + Decimal(str(tx2)) == Decimal(str(expected_total))`, `Decimal('0.1') + Decimal('0.2') == Decimal('0.3')`, `round(actual_total, 10) == round(expected_total, 10)`, `AIODYSSEY{python_decimal_exact_arithmetic}`

---

### Challenge 08: Shallow vs Deep Copy Tenant Isolation
- **Difficulty**: `EASY` (50 pts)
- **File**: `tenant_config.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Replace the shallow copy operation with copy.deepcopy() to ensure complete object hierarchy isolation.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `cfg = copy.deepcopy(DEFAULT_CONFIG)`
- **Accepted Formats**: `cfg = copy.deepcopy(DEFAULT_CONFIG)`, `copy.deepcopy(DEFAULT_CONFIG)`, `copy.deepcopy`, `AIODYSSEY{python_copy_deepcopy_nested_isolation}`

---

### Challenge 09: LRU Cache Unhashable Type Key Error
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `query_cache.py`
- **Language**: Python
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Transform the mutable dictionary parameters into an immutable, hashable tuple of sorted key-value pairs before cache lookup.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `tuple(sorted(filters.items()))`
- **Accepted Formats**: `tuple(sorted(filters.items()))`, `_cached_query(tuple(sorted(filters.items())))`, `tuple(filters.items())`, `frozenset(filters.items())`, `AIODYSSEY{python_cache_hashable_tuple_conversion}`

---

### Challenge 10: Metaclass Cooperative super() MRO Conflict
- **Difficulty**: `HARD` (200 pts)
- **File**: `plugin_framework.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A modular plugin system implements multiple inheritance across mixins and abstract base classes. In one mixin, an explicit hardcoded base class call bypasses Python's C3 Linearization Method Resolution Order (MRO), causing cooperative initialization methods to be skipped.
- **Exact Solution / Fix**: `super().__init__(**kwargs)`
- **Accepted Formats**: `super().__init__(**kwargs)`, `super().__init__()`, `super(LoggingMixin, self).__init__(**kwargs)`, `AIODYSSEY{python_cooperative_super_mro_linearization}`

---

### Challenge 11: Context Manager Exception Suppression Bug
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `transaction_scope.py`
- **Language**: Python
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Correct the __exit__ return value so exceptions are rolled back properly and re-raised to the caller.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `return False`
- **Accepted Formats**: `return False`, `return False if exc_type else False`, `return None`, `AIODYSSEY{python_context_manager_suppress_false}`

---

### Challenge 12: Dataclass Mutable Default Factory Violation
- **Difficulty**: `EASY` (50 pts)
- **File**: `telemetry_packet.py`
- **Language**: Python
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Use dataclasses.field(default_factory=list) to provide unique list instances per dataclass object.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `readings: list = field(default_factory=list)`
- **Accepted Formats**: `readings: list = field(default_factory=list)`, `field(default_factory=list)`, `= field(default_factory=list)`, `readings: list = field(default_factory=list)`, `AIODYSSEY{python_dataclass_field_default_factory}`

---

### Challenge 13: Subprocess Pipe Buffer Deadlock
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `subprocess_runner.py`
- **Language**: Python
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Replace the sequential stdout.read() and wait() calls with proc.communicate().
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `output, errors = proc.communicate()`
- **Accepted Formats**: `output, errors = proc.communicate()`, `proc.communicate()`, `stdout, stderr = proc.communicate()`, `AIODYSSEY{python_subprocess_communicate_deadlock_fix}`

---

### Challenge 14: Python Descriptor Binding Resolution
- **Difficulty**: `HARD` (200 pts)
- **File**: `orm_descriptor.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A custom ORM framework implements typed model fields via Python's descriptor protocol. Accessing the field directly on the class (e.g. User.age) causes an AttributeError because __get__ fails to handle instance=None.
- **Exact Solution / Fix**: `if instance is None: return self`
- **Accepted Formats**: `if instance is None: return self`, `if instance is None: return self;`, `if not instance: return self`, `AIODYSSEY{python_descriptor_class_access_none_guard}`

---

### Challenge 15: ReDoS Catastrophic Backtracking
- **Difficulty**: `HARD` (200 pts)
- **File**: `input_sanitizer.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A security gateway validates incoming email headers using a nested quantifier regular expression. An adversarial payload triggers catastrophic exponential backtracking (O(2^N) steps), freezing the worker process in a CPU denial-of-service condition.
- **Exact Solution / Fix**: `r'^[a-zA-Z0-9]+$'`
- **Accepted Formats**: `r'^[a-zA-Z0-9]+$'`, `^[a-zA-Z0-9]+$`, `re.compile(r'^[a-zA-Z0-9]+$')`, `r"^[a-zA-Z0-9]+$"`, `AIODYSSEY{python_regex_linear_unambiguous_quantifier}`

---

### Challenge 16: Asyncio TaskGroup Exception Group Handling
- **Difficulty**: `HARD` (200 pts)
- **File**: `task_orchestrator.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] An orchestration engine coordinates distributed microservices using Python 3.11 TaskGroups. When a subtask fails, catching standard Exception instead of ExceptionGroup fails to catch the aggregated composite exception hierarchy.
- **Exact Solution / Fix**: `except* ConnectionResetError:`
- **Accepted Formats**: `except* ConnectionResetError:`, `except ExceptionGroup:`, `except* ConnectionResetError`, `except ExceptionGroup`, `AIODYSSEY{python_taskgroup_exceptiongroup_catch}`

---

### Challenge 17: WeakRef Cache Garbage Collection Cycle
- **Difficulty**: `HARD` (200 pts)
- **File**: `weak_cache.py`
- **Language**: Python
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] An in-memory entity cache registers cleanup finalizer callbacks using weakref. However, passing a bound instance method (self._cleanup) creates a strong reference back to the instance, permanently blocking garbage collection and leaking memory.
- **Exact Solution / Fix**: `weakref.finalize(self, self._cleanup_static, self.key)`
- **Accepted Formats**: `weakref.finalize(self, self._cleanup_static, self.key)`, `self._cleanup_static`, `weakref.ref`, `AIODYSSEY{python_weakref_finalize_unbound_function}`

---


## 📂 Section: C (C)

### Challenge 18: Use-After-Free in Linked List Deletion
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `linked_list.c`
- **Language**: C
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Preserve the next pointer in a temporary variable before calling free(current).
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `Node* next = current->next; free(current); current = next;`
- **Accepted Formats**: `Node* next = current->next; free(current); current = next;`, `Node* next = current->next;`, `Node* next_node = current->next; free(current); current = next_node;`, `Node *next = current->next; free(current); current = next;`, `AIODYSSEY{c_preserve_next_pointer_before_free}`

---

### Challenge 19: strncpy Null-Termination Omission
- **Difficulty**: `EASY` (50 pts)
- **File**: `string_sanitizer.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Ensure the destination buffer is explicitly null-terminated at buffer[size - 1].
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `dest[max_len - 1] = '\0';`
- **Accepted Formats**: `dest[max_len - 1] = '\0';`, `dest[max_len - 1] = '\0'`, `dest[sizeof(buffer) - 1] = '\0';`, `buffer[sizeof(buffer) - 1] = '\0';`, `AIODYSSEY{c_strncpy_explicit_null_termination}`

---

### Challenge 20: Integer Overflow in Memory Allocation
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `packet_buffer.c`
- **Language**: C
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Implement a multiplication overflow check before invoking malloc.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `if (count > SIZE_MAX / sizeof(Packet)) return NULL;`
- **Accepted Formats**: `if (count > SIZE_MAX / sizeof(Packet)) return NULL;`, `calloc(count, sizeof(Packet))`, `return (Packet*)calloc(count, sizeof(Packet));`, `if (count != 0 && total_bytes / count != sizeof(Packet)) return NULL;`, `AIODYSSEY{c_calloc_or_multiplication_overflow_guard}`

---

### Challenge 21: Double-Free on Error Handling Cleanup
- **Difficulty**: `EASY` (50 pts)
- **File**: `crypto_context.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Set freed pointers to NULL or refactor the unified error handling to prevent double free.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `key = NULL;`
- **Accepted Formats**: `key = NULL;`, `key = NULL`, `key = 0;`, `AIODYSSEY{c_nullify_pointer_prevent_double_free}`

---

### Challenge 22: Structure Memory Alignment & Padding Corruption
- **Difficulty**: `HARD` (200 pts)
- **File**: `binary_protocol.c`
- **Language**: C
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A network driver reads a binary header struct directly from raw byte sockets. Due to default compiler struct member padding and alignment, sizeof(Header) is 8 bytes instead of the packed 5-byte wire protocol, misaligning all payload offsets.
- **Exact Solution / Fix**: `struct __attribute__((packed)) Header`
- **Accepted Formats**: `struct __attribute__((packed)) Header`, `__attribute__((packed))`, `#pragma pack(1)`, `#pragma pack(push, 1)`, `AIODYSSEY{c_attribute_packed_struct_alignment}`

---

### Challenge 23: Dangling Pointer to Stack Memory
- **Difficulty**: `EASY` (50 pts)
- **File**: `uuid_generator.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Dynamically allocate the buffer on the heap using malloc or pass a caller-owned destination buffer.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `char* uuid_buf = (char*)malloc(32);`
- **Accepted Formats**: `char* uuid_buf = (char*)malloc(32);`, `char* uuid_buf = malloc(32);`, `malloc(32)`, `AIODYSSEY{c_heap_allocation_stack_dangling_fix}`

---

### Challenge 24: Sign Extension in Bitwise Shifting
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `byte_deserializer.c`
- **Language**: C
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Cast the signed char to uint8_t before bitwise left-shifting.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `const uint8_t* b = (const uint8_t*)bytes;`
- **Accepted Formats**: `const uint8_t* b = (const uint8_t*)bytes;`, `(uint8_t)bytes[0]`, `(uint32_t)(uint8_t)bytes[0]`, `const unsigned char* b = (const unsigned char*)bytes;`, `AIODYSSEY{c_unsigned_char_cast_bitwise_shift}`

---

### Challenge 25: Async-Signal-Unsafe Function in Handler
- **Difficulty**: `HARD` (200 pts)
- **File**: `signal_logger.c`
- **Language**: C
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A daemon registers a signal handler for SIGINT. Inside the handler, it calls printf() and malloc(), which acquire internal I/O locks and heap mutexes. If interrupted while holding an I/O lock, the application deadlocks permanently.
- **Exact Solution / Fix**: `shutdown_requested = 1;`
- **Accepted Formats**: `shutdown_requested = 1;`, `write(STDOUT_FILENO, "Caught signal\n", 14);`, `shutdown_requested = 1`, `AIODYSSEY{c_async_signal_safe_write_or_flag}`

---

### Challenge 26: Memory Leak in Recursive Tree Deallocation
- **Difficulty**: `EASY` (50 pts)
- **File**: `binary_tree.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Perform a post-order traversal: recursively free left and right children before freeing the current node.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `destroy_tree(root->left); destroy_tree(root->right); free(root);`
- **Accepted Formats**: `destroy_tree(root->left); destroy_tree(root->right); free(root);`, `destroy_tree(root->left);`, `destroy_tree(root->right);`, `AIODYSSEY{c_postorder_tree_deallocation_order}`

---

### Challenge 27: Format String Vulnerability in Logger
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `syslog_proxy.c`
- **Language**: C
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Pass a static format specifier string ("%s") as the first argument to printf.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `printf("%s", username);`
- **Accepted Formats**: `printf("%s", username);`, `printf("%s", username)`, `printf("%s\n", username);`, `AIODYSSEY{c_format_string_static_specifier_fix}`

---

### Challenge 28: Uninitialized Padding in memcmp Struct Comparison
- **Difficulty**: `EASY` (50 pts)
- **File**: `auth_token.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Zero-initialize the entire struct using memset(&key, 0, sizeof(key)) before populating members.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `return (a.id == b.id && a.timestamp == b.timestamp);`
- **Accepted Formats**: `return (a.id == b.id && a.timestamp == b.timestamp);`, `a.id == b.id && a.timestamp == b.timestamp`, `memset(&a, 0, sizeof(a));`, `AIODYSSEY{c_memset_zero_struct_padding_memcmp}`

---

### Challenge 29: Data Race on Shared Buffer Without Mutex
- **Difficulty**: `HARD` (200 pts)
- **File**: `ring_buffer.c`
- **Language**: C
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A multi-threaded metrics aggregator pushes data into a shared global ring buffer. Because the tail index increment is not protected by a pthread_mutex lock, concurrent threads overwrite the same index slot, losing telemetry samples.
- **Exact Solution / Fix**: `pthread_mutex_lock(&buf_lock); ring_buffer[tail_idx % BUF_SIZE] = value; tail_idx++; pthread_mutex_unlock(&buf_lock);`
- **Accepted Formats**: `pthread_mutex_lock(&buf_lock); ring_buffer[tail_idx % BUF_SIZE] = value; tail_idx++; pthread_mutex_unlock(&buf_lock);`, `pthread_mutex_lock(&buf_lock);`, `pthread_mutex_lock(&buf_lock)`, `AIODYSSEY{c_pthread_mutex_lock_critical_section}`

---

### Challenge 30: Negative char Array Indexing Vulnerability
- **Difficulty**: `EASY` (50 pts)
- **File**: `char_frequency.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Cast the input character to (unsigned char) before using it as an array subscript index.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `char_table[(unsigned char)c]++;`
- **Accepted Formats**: `char_table[(unsigned char)c]++;`, `(unsigned char)c`, `char_table[(unsigned char)c]`, `AIODYSSEY{c_unsigned_char_array_indexing}`

---

### Challenge 31: Volatile Pointer Semantics in Hardware Polling
- **Difficulty**: `HARD` (200 pts)
- **File**: `mmio_device.c`
- **Language**: C
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A device driver polls a memory-mapped I/O (MMIO) hardware status register in a busy-wait loop. Because the pointer was declared as int* volatile reg instead of volatile int* reg, compiler -O3 optimizations cache the register value in a CPU register, resulting in an infinite loop.
- **Exact Solution / Fix**: `volatile uint32_t* status_reg = (volatile uint32_t*)(mmio_base + 0x10);`
- **Accepted Formats**: `volatile uint32_t* status_reg = (volatile uint32_t*)(mmio_base + 0x10);`, `volatile uint32_t*`, `volatile uint32_t* status_reg`, `AIODYSSEY{c_volatile_qualifier_pointed_data_type}`

---

### Challenge 32: File Descriptor Leak on Error Return Branch
- **Difficulty**: `EASY` (50 pts)
- **File**: `socket_client.c`
- **Language**: C
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Ensure close(fd) is called on all error exit paths before returning.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `close(sock); return -1;`
- **Accepted Formats**: `close(sock); return -1;`, `close(sock);`, `close(sock)`, `AIODYSSEY{c_close_file_descriptor_error_path}`

---

### Challenge 33: Off-by-One Pointer Arithmetic in Struct Array
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `record_table.c`
- **Language**: C
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Perform direct array indexing or cast the base pointer to char* before adding byte offsets.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `return &array[index];`
- **Accepted Formats**: `return &array[index];`, `return array + index;`, `&array[index]`, `array + index`, `AIODYSSEY{c_pointer_arithmetic_type_scale_fix}`

---

### Challenge 34: Bitfield Endianness Ordering Inversion
- **Difficulty**: `HARD` (200 pts)
- **File**: `ip_header_parser.c`
- **Language**: C
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A packet sniffer parses IPv4 header flags using C struct bitfields. Because C bitfield memory ordering depends on CPU endianness, parsing a network big-endian byte stream on little-endian x86 swaps the Version and Internet Header Length (IHL) nibbles.
- **Exact Solution / Fix**: `return (raw_first_byte >> 4) & 0x0F;`
- **Accepted Formats**: `return (raw_first_byte >> 4) & 0x0F;`, `(raw_first_byte >> 4) & 0x0F`, `return raw_first_byte >> 4;`, `raw_first_byte >> 4`, `AIODYSSEY{c_bitshift_upper_nibble_mask_fix}`

---


## 📂 Section: Java (Java)

### Challenge 35: ConcurrentHashMap Check-Then-Act Race Condition
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `SessionRegistry.java`
- **Language**: Java
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Replace the compound check-then-act sequence with computeIfAbsent().
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `channels.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(clientId);`
- **Accepted Formats**: `channels.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(clientId);`, `channels.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>())`, `computeIfAbsent`, `channels.computeIfAbsent`, `AIODYSSEY{java_compute_if_absent_atomic_concurrency}`

---

### Challenge 36: Inverted Lock Ordering Deadlock
- **Difficulty**: `HARD` (200 pts)
- **File**: `AccountTransfer.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A banking system executes fund transfers between accounts using synchronized blocks. When Account A transfers to Account B concurrently with Account B transferring to Account A, inverted lock acquisition order triggers an unrecoverable thread deadlock.
- **Exact Solution / Fix**: `Account first = from.id < to.id ? from : to; Account second = from.id < to.id ? to : from; synchronized (first) { synchronized (second) { ... } }`
- **Accepted Formats**: `Account first = from.id < to.id ? from : to; Account second = from.id < to.id ? to : from;`, `from.id < to.id`, `System.identityHashCode`, `AIODYSSEY{java_consistent_lock_acquisition_ordering}`

---

### Challenge 37: ThreadLocal Memory Leak in Thread Pool
- **Difficulty**: `EASY` (50 pts)
- **File**: `UserContextFilter.java`
- **Language**: Java
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Call threadLocal.remove() inside a finally block to ensure cleanup upon request completion.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `finally { currentUser.remove(); }`
- **Accepted Formats**: `finally { currentUser.remove(); }`, `currentUser.remove();`, `currentUser.remove()`, `AIODYSSEY{java_threadlocal_remove_finally_cleanup}`

---

### Challenge 38: Parallel Stream Unsynchronized Mutation
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `MetricsProcessor.java`
- **Language**: Java
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Refactor the stream to collect elements into an immutable list using collect(Collectors.toList()).
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `return records.parallelStream().filter(Record::isActive).map(Record::getId).collect(Collectors.toList());`
- **Accepted Formats**: `return records.parallelStream().filter(Record::isActive).map(Record::getId).collect(Collectors.toList());`, `collect(Collectors.toList())`, `.collect(Collectors.toList())`, `toList()`, `AIODYSSEY{java_stream_collect_threadsafe_reduction}`

---

### Challenge 39: Volatile Array Element Visibility Flaw
- **Difficulty**: `HARD` (200 pts)
- **File**: `SharedFlags.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A multi-threaded flag register declares private volatile boolean[] readyFlags = new boolean[10]. Because the volatile keyword only guarantees visibility for the array reference itself and NOT for individual array elements, worker threads loop infinitely waiting for state changes.
- **Exact Solution / Fix**: `private final AtomicIntegerArray ready = new AtomicIntegerArray(4);`
- **Accepted Formats**: `private final AtomicIntegerArray ready = new AtomicIntegerArray(4);`, `AtomicIntegerArray`, `AtomicBoolean`, `VarHandle`, `AIODYSSEY{java_atomic_integer_array_visibility_fix}`

---

### Challenge 40: CompletableFuture Exception Loss
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `AsyncBatchService.java`
- **Language**: Java
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Chain exceptionally() or inspect task states using join() to catch and handle subtask failures.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `CompletableFuture.allOf(task1, task2).join();`
- **Accepted Formats**: `CompletableFuture.allOf(task1, task2).join();`, `CompletableFuture.allOf(task1, task2).join()`, `.join()`, `.join();`, `AIODYSSEY{java_completable_future_allof_join}`

---

### Challenge 41: Broken Double-Checked Locking Missing volatile
- **Difficulty**: `EASY` (50 pts)
- **File**: `SingletonFactory.java`
- **Language**: Java
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add the volatile modifier to the singleton instance field to prevent instruction reordering.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `private static volatile SingletonFactory instance;`
- **Accepted Formats**: `private static volatile SingletonFactory instance;`, `private static volatile`, `volatile SingletonFactory instance`, `volatile`, `AIODYSSEY{java_volatile_double_checked_locking}`

---

### Challenge 42: Equals & HashCode Contract Violation
- **Difficulty**: `EASY` (50 pts)
- **File**: `UserAccount.java`
- **Language**: Java
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Override hashCode() using Objects.hash(id) to maintain the equals/hashCode contract.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `@Override public int hashCode() { return Objects.hash(id); }`
- **Accepted Formats**: `@Override public int hashCode() { return Objects.hash(id); }`, `return Objects.hash(id);`, `Objects.hash(id)`, `public int hashCode()`, `AIODYSSEY{java_hashcode_equals_contract_consistency}`

---

### Challenge 43: ReadWriteLock Lock Upgrade Deadlock
- **Difficulty**: `HARD` (200 pts)
- **File**: `CachedConfig.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A caching layer uses ReentrantReadWriteLock. A thread holding a read lock attempts to acquire the write lock directly to update an expired cache entry. In Java's ReentrantReadWriteLock, lock upgrading is forbidden and blocks the calling thread permanently.
- **Exact Solution / Fix**: `rwLock.readLock().unlock(); rwLock.writeLock().lock();`
- **Accepted Formats**: `rwLock.readLock().unlock(); rwLock.writeLock().lock();`, `rwLock.readLock().unlock();`, `rwLock.readLock().unlock()`, `AIODYSSEY{java_readwritelock_release_read_before_write}`

---

### Challenge 44: ForkJoin RecursiveTask Double Fork CPU Starvation
- **Difficulty**: `HARD` (200 pts)
- **File**: `ParallelSumTask.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A divide-and-conquer algorithm sums an array using ForkJoinTask. Calling left.fork() and right.fork() wastes the current thread's CPU core while waiting for both tasks. Standard ForkJoin idiom requires forking one subtask and executing the other in the current thread via compute().
- **Exact Solution / Fix**: `left.fork(); long rightResult = right.compute(); return left.join() + rightResult;`
- **Accepted Formats**: `left.fork(); long rightResult = right.compute(); return left.join() + rightResult;`, `left.fork(); long rightAns = right.compute(); return left.join() + rightAns;`, `left.fork();`, `right.compute()`, `AIODYSSEY{java_forkjoin_fork_one_compute_other}`

---

### Challenge 45: JDBC Resource Leak in Manual Statement Handling
- **Difficulty**: `EASY` (50 pts)
- **File**: `DatabaseAccessor.java`
- **Language**: Java
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Wrap Connection, PreparedStatement, and ResultSet in a try-with-resources statement.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `try (Connection conn = ds.getConnection(); PreparedStatement stmt = conn.prepareStatement(...); ResultSet rs = stmt.executeQuery())`
- **Accepted Formats**: `try (Connection conn = ds.getConnection(); PreparedStatement stmt = conn.prepareStatement(...); ResultSet rs = stmt.executeQuery())`, `try (Connection conn = ds.getConnection()`, `try-with-resources`, `AIODYSSEY{java_jdbc_try_with_resources_leak_fix}`

---

### Challenge 46: Generic Type Erasure Runtime ClassCastException
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `GenericJsonMapper.java`
- **Language**: Java
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Pass an explicit Class<T> token parameter to the method to preserve type information at runtime.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `public static <T> T deserializePayload(String json, Class<T> clazz)`
- **Accepted Formats**: `public static <T> T deserializePayload(String json, Class<T> clazz)`, `Class<T> clazz`, `Class<T> type`, `TypeToken`, `AIODYSSEY{java_class_token_type_erasure_fix}`

---

### Challenge 47: URLClassLoader Resource Leak on Unclosed JAR
- **Difficulty**: `EASY` (50 pts)
- **File**: `PluginLoader.java`
- **Language**: Java
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Close the URLClassLoader instance inside a try-with-resources block or explicit close() call.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `try (URLClassLoader loader = new URLClassLoader(new URL[]{jarUrl}))`
- **Accepted Formats**: `try (URLClassLoader loader = new URLClassLoader(new URL[]{jarUrl}))`, `loader.close();`, `loader.close()`, `AIODYSSEY{java_url_class_loader_close_file_lock}`

---

### Challenge 48: AtomicReference ABA Hazard in Lock-Free Stack
- **Difficulty**: `HARD` (200 pts)
- **File**: `LockFreeStack.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A high-performance lock-free stack uses AtomicReference. In environments where nodes are recycled, the ABA problem causes a compareAndSet to succeed erroneously when a memory address matches even though the underlying list topology was mutated.
- **Exact Solution / Fix**: `private final AtomicStampedReference<Node<T>> head = new AtomicStampedReference<>(null, 0);`
- **Accepted Formats**: `private final AtomicStampedReference<Node<T>> head = new AtomicStampedReference<>(null, 0);`, `AtomicStampedReference`, `AtomicStampedReference<Node<T>>`, `AIODYSSEY{java_atomic_stamped_reference_aba_fix}`

---

### Challenge 49: String Deduplication Backing Array Retention
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `LogIndexer.java`
- **Language**: Java
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Create an explicit new String(id) or copy of the character sequence to discard the large backing buffer.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `return new String(sub.toCharArray());`
- **Accepted Formats**: `return new String(sub.toCharArray());`, `new String(sub.toCharArray())`, `new String(sub)`, `String.valueOf(sub.toCharArray())`, `AIODYSSEY{java_string_copy_char_array_isolation}`

---

### Challenge 50: Deadlock in Inverted ClassLoader Lock Delegation
- **Difficulty**: `HARD` (200 pts)
- **File**: `ParallelClassLoader.java`
- **Language**: Java
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A custom modular class loader defines parallel class loading capabilities. Because ClassLoader.registerAsParallelCapable() was omitted, concurrent classloading across hierarchical class loaders deadlocks on the global ClassLoader object monitor.
- **Exact Solution / Fix**: `ClassLoader.registerAsParallelCapable();`
- **Accepted Formats**: `ClassLoader.registerAsParallelCapable();`, `ClassLoader.registerAsParallelCapable()`, `registerAsParallelCapable()`, `registerAsParallelCapable();`, `AIODYSSEY{java_register_as_parallel_capable_classloader}`

---


## 📂 Section: Web (HTML)

### Challenge 51: Multipart Form File Upload Encoding Omission
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `upload_form.html`
- **Language**: HTML
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Add enctype="multipart/form-data" to the form tag.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `enctype="multipart/form-data"`
- **Accepted Formats**: `enctype="multipart/form-data"`, `enctype='multipart/form-data'`, `<form action="/api/v1/resumes/upload" method="POST" enctype="multipart/form-data">`, `multipart/form-data`, `AIODYSSEY{html_form_enctype_multipart_form_data}`

---

### Challenge 52: Iframe Sandbox PostMessage Cross-Origin Block
- **Difficulty**: `HARD` (200 pts)
- **File**: `widget_embed.html`
- **Language**: HTML
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A payment gateway embeds a secure payment widget inside an iframe. Setting sandbox="allow-scripts" without allow-same-origin causes the iframe to be treated as a unique null origin, blocking postMessage communication and storage access.
- **Exact Solution / Fix**: `sandbox="allow-scripts allow-forms allow-same-origin"`
- **Accepted Formats**: `sandbox="allow-scripts allow-forms allow-same-origin"`, `allow-same-origin`, `sandbox="allow-scripts allow-same-origin"`, `AIODYSSEY{html_iframe_sandbox_allow_same_origin}`

---

### Challenge 53: Meta Viewport Viewport Scale Configuration
- **Difficulty**: `EASY` (50 pts)
- **File**: `responsive_layout.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add the standard meta viewport tag with width=device-width, initial-scale=1.0.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- **Accepted Formats**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0"/>`, `content="width=device-width, initial-scale=1.0"`, `width=device-width, initial-scale=1.0`, `AIODYSSEY{html_meta_viewport_device_width_scale}`

---

### Challenge 54: Form Method Query String Truncation
- **Difficulty**: `EASY` (50 pts)
- **File**: `secure_login.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Change the form method attribute from GET to POST.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `method="POST"`
- **Accepted Formats**: `method="POST"`, `method='POST'`, `method="post"`, `<form action="/api/v1/auth/login" method="POST">`, `AIODYSSEY{html_form_method_post_security}`

---

### Challenge 55: Script Defer vs Async Dependency Race Condition
- **Difficulty**: `HARD` (200 pts)
- **File**: `app_bootstrap.html`
- **Language**: HTML
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A single-page application loads React and its application bundle using async script tags. Because async scripts execute immediately upon downloading in non-deterministic order, app.js often executes before react.js finishes loading, causing ReferenceError: React is not defined.
- **Exact Solution / Fix**: `<script defer src="https://cdn.example.com/react.production.min.js"></script>`
- **Accepted Formats**: `<script defer src="https://cdn.example.com/react.production.min.js"></script>`, `defer`, `script defer`, `<script defer`, `AIODYSSEY{html_script_defer_execution_ordering}`

---


## 📂 Section: Web (CSS)

### Challenge 56: Stacking Context Isolation Trap with Transform
- **Difficulty**: `HARD` (200 pts)
- **File**: `modal_overlay.css`
- **Language**: CSS
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A dropdown modal has z-index: 999999 but appears behind a neighbouring sidebar. Because its parent container has transform: translateZ(0) (or will-change: transform), CSS creates a new isolated stacking context, trapping the high z-index inside the parent.
- **Exact Solution / Fix**: `transform: none;`
- **Accepted Formats**: `transform: none;`, `transform: none`, `remove transform`, `isolation: isolate`, `AIODYSSEY{css_stacking_context_transform_isolation_fix}`

---

### Challenge 57: Flexbox Child Minimum Width Blowout
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `chat_bubble.css`
- **Language**: CSS
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Set min-width: 0 on the flex child element to allow text truncation and wrapping.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `min-width: 0;`
- **Accepted Formats**: `min-width: 0;`, `min-width: 0`, `min-width: 0px;`, `AIODYSSEY{css_flex_child_min_width_zero_fix}`

---

### Challenge 58: CSS Grid Minmax Truncation Blowout
- **Difficulty**: `HARD` (200 pts)
- **File**: `dashboard_grid.css`
- **Language**: CSS
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A responsive dashboard defines column tracks using grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)). When wide table content is placed inside a grid cell, 1fr evaluates to minmax(auto, 1fr), blowing out the grid track width.
- **Exact Solution / Fix**: `min-width: 0;`
- **Accepted Formats**: `min-width: 0;`, `min-width: 0`, `grid-template-columns: repeat(auto-fit, minmax(0, 1fr));`, `minmax(0, 1fr)`, `AIODYSSEY{css_grid_minmax_zero_fractional_track}`

---

### Challenge 59: Box-Sizing Content-Box Overflow
- **Difficulty**: `EASY` (50 pts)
- **File**: `input_fields.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Set box-sizing: border-box on the element or global reset.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `box-sizing: border-box;`
- **Accepted Formats**: `box-sizing: border-box;`, `box-sizing: border-box`, `border-box`, `AIODYSSEY{css_box_sizing_border_box_model}`

---

### Challenge 60: CSS Specificity ID Collision with Pseudo-Class
- **Difficulty**: `EASY` (50 pts)
- **File**: `theme_buttons.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Refactor the ID rule or use the :is() / :where() pseudo-class to reduce specificity.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `#submitBtn.active`
- **Accepted Formats**: `#submitBtn.active`, `:where(#submitBtn)`, `:is(#submitBtn).active`, `#submitBtn.active { background-color: #00ff88; }`, `AIODYSSEY{css_specificity_where_or_class_override}`

---


## 📂 Section: JavaScript (JavaScript)

### Challenge 61: Microtask vs Macrotask Event Loop Ordering
- **Difficulty**: `HARD` (200 pts)
- **File**: `state_machine.js`
- **Language**: JavaScript
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A financial transaction state machine synchronizes account balances. It schedules balance commits using setTimeout (a Macrotask) while dispatching event listeners via Promise.resolve() (a Microtask). The microtask executes first, reading uncommitted state.
- **Exact Solution / Fix**: `queueMicrotask(() => { balance += amount; });`
- **Accepted Formats**: `queueMicrotask(() => { balance += amount; });`, `queueMicrotask`, `queueMicrotask(() => {`, `await`, `AIODYSSEY{js_queue_microtask_event_loop_ordering}`

---

### Challenge 62: Prototype Pollution in Object Deep Merge
- **Difficulty**: `HARD` (200 pts)
- **File**: `config_merger.js`
- **Language**: JavaScript
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A utility library recursively merges user-supplied JSON configurations into a target object. An attacker payload containing '__proto__' key paths injects properties onto Object.prototype, polluting global application state and bypassing authentication checks.
- **Exact Solution / Fix**: `if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;`
- **Accepted Formats**: `if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;`, `if (key === '__proto__') continue;`, `key === '__proto__'`, `Object.hasOwn(source, key)`, `AIODYSSEY{js_prototype_pollution_key_guard_fix}`

---

### Challenge 63: Var Variable Hoisting in Async Loops
- **Difficulty**: `EASY` (50 pts)
- **File**: `async_polling.js`
- **Language**: JavaScript
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Replace var with block-scoped let in the for loop declaration.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `for (let i = 0; i < 5; i++) {`
- **Accepted Formats**: `for (let i = 0; i < 5; i++) {`, `for (let i = 0; i < 5; i++)`, `let i = 0`, `let`, `AIODYSSEY{js_block_scoped_let_loop_binding}`

---

### Challenge 64: Event Bubbling vs Capturing Phase Mismatch
- **Difficulty**: `HARD` (200 pts)
- **File**: `modal_events.js`
- **Language**: JavaScript
- **Advanced System Hazard**: [ADVANCED HIGH-DIFFICULTY ARCHITECTURE HAZARD] A modal window closes when clicking its outer backdrop. Clicking inside the modal body triggers the parent backdrop listener because event.stopPropagation() was called in the bubble phase while the parent attached in the capturing phase ({ capture: true }).
- **Exact Solution / Fix**: `backdrop.addEventListener('click', () => { closeModal(); }, false);`
- **Accepted Formats**: `backdrop.addEventListener('click', () => { closeModal(); }, false);`, `{ capture: false }`, `capture: false`, `backdrop.addEventListener('click', closeModal, false);`, `AIODYSSEY{js_event_capturing_phase_propagation_fix}`

---

### Challenge 65: Floating-Point Precision in Currency Calculations
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `checkout_total.js`
- **Language**: JavaScript
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Compare floating-point numbers using Number.EPSILON tolerance or integer cents.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `Math.abs(subtotal - expectedSubtotal) < Number.EPSILON`
- **Accepted Formats**: `Math.abs(subtotal - expectedSubtotal) < Number.EPSILON`, `Math.abs((item1Price + item2Price) - expectedSubtotal) < Number.EPSILON`, `Number.EPSILON`, `Math.abs(subtotal - expectedSubtotal) < 0.0001`, `AIODYSSEY{js_number_epsilon_precision_tolerance}`

---


## 📂 Section: Master (Python (DSA + OOP + Concurrency))

### Challenge 66: ⚡ GRAND BOSS: QUANTUMNEXUS DISTRIBUTED ENGINE
- **Difficulty**: `BOSS` (1000 pts)
- **File**: `quantum_nexus_engine.py`
- **Language**: Python (DSA + OOP + Concurrency)
- **Error Architecture**: 5 Distributed Subsystems:
  1. Dynamic DAG Dependency Router (mutation cycle)
  2. Transactional Metaclass MRO (**kwargs omission)
  3. Async Priority Heap Scheduler (tuple tie-breaker collision)
  4. Spatial Prefix Trie Index (mutable default argument contamination)
  5. Re-entrancy Rollback Guard (BaseException cancellation swallowed)
- **Master Boss Flag**: `BOSS{this_flag_is_contain_five_language_html_css_js_python_java}` *(accepts all 20 language permutations)*

---


## 📂 Section: Web (HTML)

### Challenge 67: Image Source Attribute Broken Path & Typo
- **Difficulty**: `EASY` (50 pts)
- **File**: `product_gallery.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Correct the image source attribute typo to src.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `src="/assets/products/laptop-pro.webp"`
- **Accepted Formats**: `src="/assets/products/laptop-pro.webp"`, `src`, `src=`, `img src`, `<img src="/assets/products/laptop-pro.webp" alt="High Performance Laptop" width="400" height="300">`, `AIODYSSEY{html_img_source_attribute_typo_fix}`

---

### Challenge 68: Anchor Tag Hyperlink Reference Typo
- **Difficulty**: `EASY` (50 pts)
- **File**: `navbar_links.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Fix the anchor tag hyperlink reference attribute to href.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `href="/register.html"`
- **Accepted Formats**: `href="/register.html"`, `href`, `href=`, `a href`, `<a href="/register.html" class="btn-register">Register Account</a>`, `AIODYSSEY{html_anchor_href_attribute_fix}`

---

### Challenge 69: Form Submit Accidental Trigger on Modal Cancel Button
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `profile_modal.html`
- **Language**: HTML
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Explicitly assign type="button" to the cancel button so it does not submit the form.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `type="button"`
- **Accepted Formats**: `type="button"`, `type='button'`, `<button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>`, `button type="button"`, `type=button`, `AIODYSSEY{html_button_type_button_prevent_submit}`

---

### Challenge 70: HTML5 Form Input Required Constraint Validation
- **Difficulty**: `EASY` (50 pts)
- **File**: `tos_checkbox.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add the required attribute to the checkbox input.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `required`
- **Accepted Formats**: `required`, `<input type="checkbox" name="accept_terms" required>`, `<input type="checkbox" name="accept_terms" required/>`, `input required`, `AIODYSSEY{html_input_required_attribute_constraint}`

---

### Challenge 71: Document Character Encoding UTF-8 Declaration
- **Difficulty**: `EASY` (50 pts)
- **File**: `international_roster.html`
- **Language**: HTML
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add <meta charset="UTF-8"> to the document head.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `<meta charset="UTF-8">`
- **Accepted Formats**: `<meta charset="UTF-8">`, `<meta charset="UTF-8"/>`, `<meta charset="utf-8">`, `<meta charset='UTF-8'>`, `charset="UTF-8"`, `AIODYSSEY{html_meta_charset_utf8_declaration}`

---


## 📂 Section: Web (CSS)

### Challenge 72: Flexbox Dual-Axis Dead Center Alignment
- **Difficulty**: `EASY` (50 pts)
- **File**: `spinner_overlay.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Correct align-item to align-items: center.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `align-items: center;`
- **Accepted Formats**: `align-items: center;`, `align-items: center`, `align-items:center;`, `align-items`, `AIODYSSEY{css_flexbox_align_items_centering_fix}`

---

### Challenge 73: Aspect Ratio Squishing & Object-Fit Distortion
- **Difficulty**: `EASY` (50 pts)
- **File**: `avatar_image.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add object-fit: cover; to maintain correct aspect ratio within fixed dimensions.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `object-fit: cover;`
- **Accepted Formats**: `object-fit: cover;`, `object-fit: cover`, `object-fit:cover;`, `object-fit`, `AIODYSSEY{css_object_fit_cover_aspect_ratio}`

---

### Challenge 74: Sticky Header Disabled by Ancestor Overflow
- **Difficulty**: `MEDIUM` (150 pts)
- **File**: `sticky_table.css`
- **Language**: CSS
- **Error Breakdown (7 Errors)**:
  1. *Core Logic / Algorithmic Defect*: Change overflow: hidden on the scroll container to overflow: visible.
  2. *State Validation*: Parameter sanitization missing
  3. *Boundary Checking*: Off-by-one index traversal
  4. *Async / Concurrency*: Incomplete promise / lock synchronization
  5. *Resource Guard*: Leaked file / buffer handle
  6. *Type Safety*: Null reference / unsafe type coercion
  7. *Rollback Guard*: Unhandled exception state cleanup
- **Exact Solution / Fix**: `overflow: visible;`
- **Accepted Formats**: `overflow: visible;`, `overflow: visible`, `overflow:visible;`, `overflow: visible`, `AIODYSSEY{css_sticky_ancestor_overflow_visible_fix}`

---

### Challenge 75: Invisible Overlay Click Hijack via Pointer-Events
- **Difficulty**: `EASY` (50 pts)
- **File**: `particle_overlay.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Add pointer-events: none; to the particle overlay.
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `pointer-events: none;`
- **Accepted Formats**: `pointer-events: none;`, `pointer-events: none`, `pointer-events:none;`, `pointer-events`, `AIODYSSEY{css_pointer_events_none_overlay_pass}`

---

### Challenge 76: CSS Custom Property Variable Name Mismatch
- **Difficulty**: `EASY` (50 pts)
- **File**: `theme_token.css`
- **Language**: CSS
- **Error Breakdown (3 Errors)**:
  1. *Core Syntax / Attribute Defect*: Fix the variable reference to var(--primary-color).
  2. *Status / Return Guard*: Unhandled boundary state
  3. *Delimiter / Formatting*: Missing closing token
- **Exact Solution / Fix**: `var(--primary-color)`
- **Accepted Formats**: `var(--primary-color)`, `var(--primary-color);`, `background-color: var(--primary-color);`, `--primary-color`, `AIODYSSEY{css_custom_property_var_name_fix}`

---

