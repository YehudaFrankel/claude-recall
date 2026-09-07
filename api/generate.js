// Template-based generator — no AI API needed, instant results
// Generates a full Clankbrain setup: CLAUDE.md, rules, skills, memory, workflows

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;
  if (!body || !body.projectName || !body.language || !body.projectType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    var files = generateFiles(body);
    return res.status(200).json({ files: files });
  } catch (err) {
    console.error('Generation error:', err.message);
    return res.status(500).json({ error: 'Generation failed: ' + err.message });
  }
};

// --- Language Data ---

var LANG = {
  javascript: {
    name: 'JavaScript', ext: '.js', comment: '//',
    varStyle: 'camelCase', fnStyle: 'camelCase', fileStyle: 'kebab-case or camelCase',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'eslint', format: 'prettier', test: 'jest',
    testCmd: 'npm test', buildCmd: 'npm run build', devCmd: 'npm run dev',
    installCmd: 'npm install', lockFile: 'package-lock.json', envFile: '.env',
    conventions: [
      'Use `const` for values that do not change, `let` for values that do. Never `var`.',
      'Prefer arrow functions for callbacks.',
      'Use template literals for string interpolation.',
      'Use async/await over .then() chains.',
      'Destructure objects and arrays when accessing multiple properties.',
      'Use optional chaining (?.) and nullish coalescing (??) for safe access.',
      'Export named exports over default exports.',
      'Handle errors with try/catch in async functions.'
    ],
    securityChecks: [
      'No eval(), new Function(), or innerHTML with user input',
      'Sanitize all user input before rendering or database queries',
      'Use parameterized queries for SQL',
      'Validate file uploads (type, size, extension)',
      'Never commit .env or API keys',
      'Use helmet for HTTP security headers (Express)',
      'Set CORS to specific origins in production'
    ],
    reviewChecks: [
      'No console.log left in production code',
      'All promises have error handling',
      'No floating promises (missing await)',
      'Event listeners cleaned up in component unmount',
      'No memory leaks from closures or timers',
      'Array methods used correctly (map returns, forEach does not)',
      'Strict equality (===) used, not loose (==)'
    ],
    starterLessons: [
      { title: 'Floating promises cause silent failures', problem: 'Calling an async function without await means errors are swallowed silently.', solution: 'Always await async calls, or attach .catch() if fire-and-forget is intentional.' },
      { title: '== vs === causes type coercion bugs', problem: '0 == "" is true, null == undefined is true. Loose equality hides bugs.', solution: 'Always use === and !== for comparison.' },
      { title: 'Array.forEach cannot be broken out of', problem: 'return inside forEach does not exit the loop or the outer function.', solution: 'Use for...of or for loop when you need early exit.' },
      { title: 'Object spread is shallow', problem: 'Nested objects are shared by reference after spread: {...obj} does not deep clone.', solution: 'Use structuredClone() for deep copies, or explicitly spread nested objects.' },
      { title: 'import order matters for circular dependencies', problem: 'Circular imports can cause undefined values at import time.', solution: 'Restructure to break the cycle, or use lazy imports inside functions.' }
    ],
    starterDecisions: [
      { title: 'async/await over callbacks', detail: 'All async code uses async/await. No raw callbacks except event handlers.' },
      { title: 'Named exports over default exports', detail: 'Named exports enable better refactoring, auto-import, and grep-ability.' },
      { title: 'Error boundaries at API layer', detail: 'Validate and sanitize at the API boundary. Internal code trusts validated input.' }
    ],
    starterRegrets: [
      ['moment.js for dates', 'Massive bundle size. Use date-fns or Temporal API.'],
      ['Nested ternary expressions', 'Unreadable after 2 levels. Use if/else or early returns.'],
      ['index.js barrel files that re-export everything', 'Breaks tree-shaking and makes imports slow. Import directly from source.'],
      ['Storing derived state in useState', 'Causes sync bugs. Compute derived values during render instead.']
    ]
  },
  python: {
    name: 'Python', ext: '.py', comment: '#',
    varStyle: 'snake_case', fnStyle: 'snake_case', fileStyle: 'snake_case',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'ruff or flake8', format: 'black', test: 'pytest',
    testCmd: 'pytest', buildCmd: 'python -m build', devCmd: 'python manage.py runserver',
    installCmd: 'pip install -r requirements.txt', lockFile: 'requirements.txt', envFile: '.env',
    conventions: [
      'Follow PEP 8 style guide.',
      'Use type hints for function parameters and return values.',
      'Use f-strings for string formatting.',
      'Use pathlib.Path over os.path.',
      'Use dataclasses or Pydantic for structured data.',
      'Use context managers (with) for resources.',
      'Prefer comprehensions over map/filter for simple transforms.',
      'Use logging module over print().'
    ],
    securityChecks: [
      'Use parameterized queries, never f-string for SQL',
      'Validate all user input',
      'Use secrets module for tokens, not random',
      'Never pickle untrusted data',
      'Pin dependency versions',
      'Set DEBUG=False in production',
      'Use CSRF protection on forms'
    ],
    reviewChecks: [
      'No bare except clauses — always specify exception type',
      'No mutable default arguments (def f(x=[]))',
      'Context managers used for file/db operations',
      'Type hints on all public functions',
      'No circular imports',
      'f-strings used consistently (not % or .format)',
      'Docstrings on public classes and functions'
    ],
    starterLessons: [
      { title: 'Mutable default arguments persist across calls', problem: 'def f(items=[]): items shared across all calls without explicit arg.', solution: 'Use None as default: def f(items=None): items = items or []' },
      { title: 'bare except catches SystemExit and KeyboardInterrupt', problem: 'except: catches everything including Ctrl+C and sys.exit().', solution: 'Always except Exception or a specific type.' },
      { title: 'String concatenation in loops is O(n^2)', problem: 'Building strings with += in a loop creates a new string each iteration.', solution: 'Use list append + "".join() or io.StringIO.' },
      { title: 'datetime.now() without timezone is naive', problem: 'Naive datetimes cause bugs when comparing across timezones.', solution: 'Always use datetime.now(timezone.utc) or pass tz explicitly.' },
      { title: 'requirements.txt without pinned versions causes drift', problem: 'package>=1.0 can install 2.0 which breaks your code.', solution: 'Pin exact versions: package==1.2.3. Use pip freeze.' }
    ],
    starterDecisions: [
      { title: 'Type hints on all public functions', detail: 'Every public function has parameter and return type hints.' },
      { title: 'f-strings for formatting', detail: 'No % formatting, no .format(). f-strings only.' },
      { title: 'pathlib over os.path', detail: 'All file path operations use pathlib.Path.' }
    ],
    starterRegrets: [
      ['os.path for file operations', 'Verbose and error-prone. pathlib.Path is cleaner and cross-platform.'],
      ['print() for logging', 'No levels, no formatting, no file output. Use logging module.'],
      ['requests library for async code', 'Blocks the event loop. Use httpx or aiohttp for async HTTP.'],
      ['Global variables for configuration', 'Hard to test, hard to trace. Use dataclass config or env vars with pydantic.']
    ]
  },
  java: {
    name: 'Java', ext: '.java', comment: '//',
    varStyle: 'camelCase', fnStyle: 'camelCase', fileStyle: 'PascalCase',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'checkstyle', format: 'google-java-format', test: 'JUnit 5',
    testCmd: 'mvn test', buildCmd: 'mvn package', devCmd: 'mvn spring-boot:run',
    installCmd: 'mvn install', lockFile: 'pom.xml', envFile: 'application.properties',
    conventions: [
      'One class per file, filename matches class name.',
      'Use meaningful names — no single-letter variables except loop counters.',
      'Prefer composition over inheritance.',
      'Use Optional<T> instead of returning null.',
      'Use final for variables that should not change.',
      'Use try-with-resources for AutoCloseable.',
      'Keep methods under 30 lines.',
      'Use @Override on all overridden methods.'
    ],
    securityChecks: [
      'Use PreparedStatement, never string concat for SQL',
      'Validate input at controller boundaries',
      'Use BCrypt or Argon2 for passwords',
      'Sanitize HTML output',
      'Configure CORS explicitly',
      'Use HTTPS, redirect HTTP',
      'Never log passwords, tokens, or PII'
    ],
    reviewChecks: [
      'No raw types — always parameterize generics',
      'Resources closed in finally or try-with-resources',
      'Null checks on all external data',
      'Immutable objects where possible',
      'No public fields — use getters',
      'Exception messages are descriptive',
      'Thread safety considered for shared state'
    ],
    starterLessons: [
      { title: 'NullPointerException is the #1 runtime error', problem: 'Returning null from methods causes NPE at the caller.', solution: 'Return Optional<T> instead of null. Use @Nullable annotations.' },
      { title: 'String concatenation in loops creates garbage', problem: 's += "text" creates a new String object each iteration.', solution: 'Use StringBuilder for loops. String concat is fine for single expressions.' },
      { title: 'Checked exceptions force callers to handle errors', problem: 'Declaring throws on every method pushes error handling up the stack.', solution: 'Use unchecked (Runtime) exceptions for programming errors. Checked for recoverable.' },
      { title: 'equals() and hashCode() must be consistent', problem: 'Overriding equals without hashCode breaks HashMap/HashSet.', solution: 'Always override both together. Use IDE generation or Objects.hash().' },
      { title: 'SimpleDateFormat is not thread-safe', problem: 'Shared SimpleDateFormat instances corrupt dates under concurrency.', solution: 'Use DateTimeFormatter (immutable, thread-safe) from java.time.' }
    ],
    starterDecisions: [
      { title: 'Optional over null returns', detail: 'Public methods return Optional<T>, never null.' },
      { title: 'java.time over java.util.Date', detail: 'All date/time code uses java.time (LocalDate, Instant, ZonedDateTime).' },
      { title: 'Constructor injection over field injection', detail: 'Dependencies injected via constructor, not @Autowired on fields.' }
    ],
    starterRegrets: [
      ['java.util.Date and Calendar', 'Mutable, thread-unsafe, bad API. Use java.time.'],
      ['Checked exceptions for business logic', 'Forces try/catch everywhere. Use RuntimeException subclasses.'],
      ['Singleton pattern via static getInstance()', 'Untestable. Use DI framework (Spring) instead.'],
      ['Raw JDBC without a connection pool', 'Connection leak risk. Use HikariCP or framework-managed pools.']
    ]
  },
  go: {
    name: 'Go', ext: '.go', comment: '//',
    varStyle: 'camelCase/PascalCase', fnStyle: 'camelCase/PascalCase', fileStyle: 'snake_case',
    classStyle: 'PascalCase', constStyle: 'PascalCase',
    lint: 'golangci-lint', format: 'gofmt', test: 'go test',
    testCmd: 'go test ./...', buildCmd: 'go build', devCmd: 'go run .',
    installCmd: 'go mod download', lockFile: 'go.sum', envFile: '.env',
    conventions: ['Accept interfaces, return structs.', 'Handle errors explicitly.', 'Short names in small scopes, descriptive in larger.', 'One function, one job.', 'Table-driven tests.', 'Group imports: stdlib, external, internal.', 'Use context.Context for cancellation.', 'Channels over shared memory for concurrency.'],
    securityChecks: ['Parameterized queries with database/sql', 'Validate input at handlers', 'crypto/rand not math/rand', 'Timeouts on HTTP clients/servers', 'html/template over text/template', 'Pin module versions', 'Never log secrets'],
    reviewChecks: ['All errors checked — no _ for error returns', 'defer used for cleanup', 'No goroutine leaks', 'Mutex used for shared state', 'Context passed through call chain', 'Exported types documented', 'Race detector clean (go test -race)'],
    starterLessons: [
      { title: 'Ignoring errors with _ causes silent failures', problem: 'result, _ := doSomething() — the error is discarded.', solution: 'Always check errors. If truly ignorable, add a comment explaining why.' },
      { title: 'Goroutine leaks from unbuffered channels', problem: 'A goroutine blocked on a channel send with no receiver leaks forever.', solution: 'Use buffered channels or context cancellation to prevent goroutine leaks.' },
      { title: 'nil slice vs empty slice behave differently in JSON', problem: 'nil marshals to null, []Type{} marshals to []. API consumers see different shapes.', solution: 'Initialize slices as []Type{} when they will be marshaled to JSON.' }
    ],
    starterDecisions: [
      { title: 'Accept interfaces, return structs', detail: 'Function parameters use interfaces for flexibility. Return concrete types.' },
      { title: 'Table-driven tests', detail: 'All unit tests use table-driven pattern with subtests.' }
    ],
    starterRegrets: [
      ['init() functions for setup', 'Hard to test, implicit ordering. Use explicit initialization.'],
      ['Global variables for config', 'Untestable. Pass config as a struct parameter.'],
      ['panic() for error handling', 'Crashes the program. Return errors instead.']
    ]
  },
  rust: {
    name: 'Rust', ext: '.rs', comment: '//',
    varStyle: 'snake_case', fnStyle: 'snake_case', fileStyle: 'snake_case',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'clippy', format: 'rustfmt', test: 'cargo test',
    testCmd: 'cargo test', buildCmd: 'cargo build --release', devCmd: 'cargo run',
    installCmd: 'cargo build', lockFile: 'Cargo.lock', envFile: '.env',
    conventions: ['Use Result<T, E> for fallible ops.', 'Prefer &str over String for params.', 'Derive macros generously.', 'Minimize unsafe.', 'Use iterators over manual loops.', 'Make invalid states unrepresentable.', 'Doc comments on public items.', 'thiserror for libs, anyhow for apps.'],
    securityChecks: ['Minimize unsafe blocks', 'Parameterized queries', 'Validate input', 'Pin dependencies', 'Constant-time comparison for secrets', 'Handle integer overflow', 'Never log secrets'],
    reviewChecks: ['No unwrap() in library code', 'Clippy warnings resolved', 'No unnecessary clones', 'Lifetimes explicit where needed', 'Error types implement std::error::Error', 'Unsafe blocks documented with safety comment', 'Tests cover error paths'],
    starterLessons: [
      { title: 'unwrap() in production code panics on None/Err', problem: 'option.unwrap() crashes when None. result.unwrap() crashes on Err.', solution: 'Use ? operator, match, or unwrap_or_default(). Reserve unwrap() for tests.' },
      { title: 'String vs &str — ownership matters', problem: 'Functions taking String force callers to clone.', solution: 'Accept &str for read-only, return String when ownership transfers.' }
    ],
    starterDecisions: [
      { title: 'thiserror for library errors, anyhow for apps', detail: 'Libraries define typed errors with thiserror. Applications use anyhow for convenience.' }
    ],
    starterRegrets: [
      ['unwrap() in library code', 'Panics the caller. Use Result and ? operator.'],
      ['Clone derive on large structs', 'Hidden expensive copies. Use references or Arc.']
    ]
  },
  csharp: {
    name: 'C#', ext: '.cs', comment: '//',
    varStyle: 'camelCase/_camelCase', fnStyle: 'PascalCase', fileStyle: 'PascalCase',
    classStyle: 'PascalCase', constStyle: 'PascalCase',
    lint: 'dotnet format', format: 'dotnet format', test: 'xUnit',
    testCmd: 'dotnet test', buildCmd: 'dotnet build', devCmd: 'dotnet run',
    installCmd: 'dotnet restore', lockFile: '*.csproj', envFile: 'appsettings.json',
    conventions: ['PascalCase public, _camelCase private.', 'var for obvious types.', 'LINQ over manual loops.', 'async/await for I/O.', 'Nullable reference types enabled.', 'Records for immutable data.', 'ILogger<T> for logging.', 'Dependency injection everywhere.'],
    securityChecks: ['Parameterized queries with EF Core', 'Data Annotations or FluentValidation', 'ASP.NET Identity for auth', 'HTTPS + HSTS', 'Anti-forgery tokens', 'User Secrets for dev secrets', 'Sanitize output'],
    reviewChecks: ['Async methods return Task', 'IDisposable implemented correctly', 'Null checks with pattern matching', 'No string concatenation in loops', 'ConfigureAwait(false) in libraries', 'Record types for DTOs', 'No magic strings'],
    starterLessons: [
      { title: 'async void is fire-and-forget with no error handling', problem: 'Exceptions in async void crash the process — no way to catch them.', solution: 'Always return Task. async void only for event handlers.' },
      { title: 'IDisposable not disposed leaks resources', problem: 'DB connections, file handles, HTTP clients leak without Dispose.', solution: 'Use using statement or using declaration for all IDisposable.' }
    ],
    starterDecisions: [
      { title: 'Nullable reference types enabled', detail: 'Project-wide nullable enabled in .csproj. No null without ?.' }
    ],
    starterRegrets: [
      ['HttpClient created per request', 'Socket exhaustion. Use IHttpClientFactory or singleton.'],
      ['string concatenation in loops', 'O(n^2). Use StringBuilder or string.Join.']
    ]
  },
  ruby: {
    name: 'Ruby', ext: '.rb', comment: '#',
    varStyle: 'snake_case', fnStyle: 'snake_case', fileStyle: 'snake_case',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'rubocop', format: 'rubocop', test: 'RSpec',
    testCmd: 'bundle exec rspec', buildCmd: 'rake build', devCmd: 'rails server',
    installCmd: 'bundle install', lockFile: 'Gemfile.lock', envFile: '.env',
    conventions: ['Follow Ruby Style Guide.', 'frozen_string_literal comment.', 'Symbols for hash keys.', 'Guard clauses for early returns.', 'Methods under 15 lines.', 'Meaningful names.', 'each/map/select over for.', 'Bundler for deps.'],
    securityChecks: ['Parameterized queries', 'Strong parameters', 'CSRF protection', 'No raw HTML rendering', 'Pin gem versions', 'Rails credentials', 'Validate uploads'],
    reviewChecks: ['No rescue without exception type', 'Frozen string literals', 'No N+1 queries', 'Scopes over class methods for queries', 'Service objects for business logic', 'No callbacks for complex logic', 'Rubocop clean'],
    starterLessons: [
      { title: 'N+1 queries are the #1 Rails performance killer', problem: 'posts.each { |p| p.comments } fires a query per post.', solution: 'Use .includes(:comments) for eager loading.' }
    ],
    starterDecisions: [{ title: 'Service objects for business logic', detail: 'Controllers call service objects. No business logic in models or controllers.' }],
    starterRegrets: [['Fat models with callbacks', 'Hard to test, surprising side effects. Use service objects.'], ['rescue => e (bare rescue)', 'Catches everything. Always specify the exception class.']]
  },
  php: {
    name: 'PHP', ext: '.php', comment: '//',
    varStyle: 'camelCase', fnStyle: 'camelCase', fileStyle: 'PascalCase',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'phpstan', format: 'php-cs-fixer', test: 'PHPUnit',
    testCmd: 'vendor/bin/phpunit', buildCmd: 'composer build', devCmd: 'php artisan serve',
    installCmd: 'composer install', lockFile: 'composer.lock', envFile: '.env',
    conventions: ['PSR-12 standard.', 'Type declarations everywhere.', 'Null coalescing over isset().', 'Named arguments for clarity.', 'Enums over class constants.', 'Thin controllers.', 'Constructor injection.', 'match() over switch().'],
    securityChecks: ['Prepared statements with PDO', 'Validate input', 'password_hash/verify', 'CSRF protection', 'No eval() or include with user input', 'display_errors=Off in prod', 'HTTPS + secure cookies'],
    reviewChecks: ['Strict types declared', 'No mixed return types', 'Dependency injection used', 'No static methods for testable code', 'Query builder over raw SQL', 'Middleware for cross-cutting concerns', 'PHPStan at level 6+'],
    starterLessons: [
      { title: 'SQL injection via string interpolation', problem: '"SELECT * FROM users WHERE id = $id" — unescaped user input.', solution: 'Always use prepared statements with PDO or query builder.' }
    ],
    starterDecisions: [{ title: 'Strict types in every file', detail: 'declare(strict_types=1) at the top of every PHP file.' }],
    starterRegrets: [['mysql_* functions', 'Deprecated and insecure. Use PDO.'], ['Global functions for business logic', 'Untestable. Use classes with dependency injection.']]
  },
  swift: {
    name: 'Swift', ext: '.swift', comment: '//',
    varStyle: 'camelCase', fnStyle: 'camelCase', fileStyle: 'PascalCase',
    classStyle: 'PascalCase', constStyle: 'camelCase',
    lint: 'swiftlint', format: 'swift-format', test: 'XCTest',
    testCmd: 'swift test', buildCmd: 'swift build', devCmd: 'swift run',
    installCmd: 'swift package resolve', lockFile: 'Package.resolved', envFile: '.env',
    conventions: ['let over var.', 'guard for early exits.', 'Structs over classes.', 'Protocols for abstraction.', 'No abbreviations.', 'if let or guard let for optionals.', 'Result type for errors.', 'Swift API Design Guidelines.'],
    securityChecks: ['Keychain for secrets', 'Validate server certs', 'App Transport Security', 'Sanitize input', 'Parameterized Core Data queries', 'No hardcoded keys', 'Data protection on files'],
    reviewChecks: ['No force unwraps (!)', 'Codable for serialization', 'Combine/async-await for async', 'Access control (private/internal/public)', 'Protocol conformance tested', 'No retain cycles (weak/unowned)', 'SwiftLint clean'],
    starterLessons: [
      { title: 'Force unwrap (!) crashes on nil', problem: 'value! panics at runtime if value is nil.', solution: 'Use guard let, if let, or ?? for safe unwrapping.' }
    ],
    starterDecisions: [{ title: 'Structs over classes by default', detail: 'Use structs for data. Classes only when reference semantics are needed.' }],
    starterRegrets: [['Force unwrapping optionals', 'Runtime crash. Use guard let or if let.'], ['Massive view controllers', 'Untestable. Use MVVM or coordinator pattern.']]
  },
  kotlin: {
    name: 'Kotlin', ext: '.kt', comment: '//',
    varStyle: 'camelCase', fnStyle: 'camelCase', fileStyle: 'PascalCase',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'ktlint', format: 'ktlint', test: 'JUnit 5',
    testCmd: './gradlew test', buildCmd: './gradlew build', devCmd: './gradlew bootRun',
    installCmd: './gradlew build', lockFile: 'gradle.lockfile', envFile: 'application.yml',
    conventions: ['val over var.', 'Data classes for DTOs.', 'Sealed classes for hierarchies.', 'Extension functions over utils.', 'Scope functions appropriately.', 'Coroutines for async.', 'Null safety — avoid !!.', 'Expression bodies when clear.'],
    securityChecks: ['Parameterized queries', 'Validate at controllers', 'BCrypt for passwords', 'CORS explicit', 'Spring Security', 'Never log secrets', 'Pin versions'],
    reviewChecks: ['No !! operator', 'Coroutine scope managed', 'Data classes for value objects', 'Sealed classes for state', 'No Java-style getters/setters', 'Extension functions not overused', 'Detekt clean'],
    starterLessons: [
      { title: '!! operator is a NullPointerException waiting to happen', problem: 'value!! crashes if value is null. Same as Java NPE.', solution: 'Use safe calls (?.), elvis (?:), or let/also scope functions.' }
    ],
    starterDecisions: [{ title: 'Coroutines over callbacks', detail: 'All async code uses coroutines. No callback-based async.' }],
    starterRegrets: [['!! for null assertions', 'Runtime NPE. Use ?. and ?: operators.'], ['Java-style static utility classes', 'Use extension functions or top-level functions.']]
  },
  other: {
    name: 'Custom', ext: '', comment: '#',
    varStyle: 'project-specific', fnStyle: 'project-specific', fileStyle: 'project-specific',
    classStyle: 'PascalCase', constStyle: 'UPPER_SNAKE_CASE',
    lint: 'project-specific', format: 'project-specific', test: 'project-specific',
    testCmd: '# test command', buildCmd: '# build command', devCmd: '# dev command',
    installCmd: '# install', lockFile: '', envFile: '.env',
    conventions: ['Define naming conventions.', 'Small focused functions.', 'Meaningful names.', 'Handle errors explicitly.', 'Test critical paths.', 'Document public APIs.', 'Review before merge.', 'Update dependencies.'],
    securityChecks: ['Validate input', 'Parameterized queries', 'No hardcoded secrets', 'HTTPS everywhere', 'Sanitize output', 'Review dependencies', 'Least privilege'],
    reviewChecks: ['Error handling complete', 'No dead code', 'No hardcoded values', 'Tests cover happy + error paths', 'Documentation current', 'No duplicated logic', 'Performance considered'],
    starterLessons: [],
    starterDecisions: [],
    starterRegrets: []
  }
};

var FRAMEWORKS = {
  'next.js': { devCmd: 'npm run dev', buildCmd: 'npm run build', protectedFiles: ['next.config.js', 'middleware.ts'], structure: 'app/ or pages/, components/, lib/, public/' },
  'react': { devCmd: 'npm start', buildCmd: 'npm run build', protectedFiles: ['vite.config.ts'], structure: 'src/components/, src/hooks/, src/pages/, src/utils/' },
  'express': { devCmd: 'node server.js', buildCmd: 'npm run build', protectedFiles: ['server.js'], structure: 'routes/, controllers/, middleware/, models/' },
  'django': { devCmd: 'python manage.py runserver', buildCmd: 'collectstatic', protectedFiles: ['manage.py', 'settings.py', 'urls.py'], structure: 'apps/, templates/, static/' },
  'flask': { devCmd: 'flask run', buildCmd: 'pip install -e .', protectedFiles: ['app.py', 'config.py'], structure: 'app/, templates/, static/, models/' },
  'fastapi': { devCmd: 'uvicorn main:app --reload', buildCmd: 'pip install -e .', protectedFiles: ['main.py'], structure: 'app/routers/, app/models/, app/schemas/' },
  'spring boot': { devCmd: 'mvn spring-boot:run', buildCmd: 'mvn package', protectedFiles: ['pom.xml', 'application.properties'], structure: 'src/main/java/.../controllers,services,repositories/' },
  'rails': { devCmd: 'rails server', buildCmd: 'rake assets:precompile', protectedFiles: ['config/routes.rb', 'db/schema.rb'], structure: 'app/models,views,controllers/, config/, db/' },
  'laravel': { devCmd: 'php artisan serve', buildCmd: 'composer install --optimize-autoloader', protectedFiles: ['routes/web.php', 'routes/api.php'], structure: 'app/Models,Http/Controllers/, resources/, routes/' },
  'vue': { devCmd: 'npm run dev', buildCmd: 'npm run build', protectedFiles: ['vite.config.ts'], structure: 'src/components/, src/views/, src/stores/' },
  'angular': { devCmd: 'ng serve', buildCmd: 'ng build', protectedFiles: ['angular.json'], structure: 'src/app/components,services,guards/' },
  'svelte': { devCmd: 'npm run dev', buildCmd: 'npm run build', protectedFiles: ['svelte.config.js'], structure: 'src/routes/, src/lib/, src/components/' },
  'nuxt': { devCmd: 'npm run dev', buildCmd: 'npm run build', protectedFiles: ['nuxt.config.ts'], structure: 'pages/, components/, composables/, server/' }
};

var PROJECT_TYPES = {
  'web-app': 'A web application with a user interface.',
  'api': 'A backend API service.',
  'cli': 'A command-line tool.',
  'mobile': 'A mobile application.',
  'library': 'A reusable library or package.',
  'monorepo': 'A monorepo containing multiple packages or services.',
  'fullstack': 'A full-stack application with frontend and backend.'
};

// --- File Generators ---

function generateFiles(body) {
  var lang = LANG[body.language] || LANG.other;
  var fw = body.framework ? FRAMEWORKS[body.framework.toLowerCase()] : null;
  var conventions = body.conventions || [];
  var files = {};

  files['CLAUDE.md'] = generateClaudeMd(body, lang, fw, conventions);

  for (var i = 0; i < conventions.length; i++) {
    var c = conventions[i];
    if (c === 'plan-before-edit') { files['rules/plan-before-edit.md'] = generatePlanBeforeEdit(body, lang); }
    if (c === 'protected-files') { files['rules/protected-files.md'] = generateProtectedFiles(body, lang, fw); }
    if (c === 'naming-conventions') { files['rules/naming-conventions.md'] = generateNamingConventions(body, lang); }
    if (c === 'testing') { files['rules/testing.md'] = generateTesting(body, lang); }
    if (c === 'commit-style') { files['rules/commit-style.md'] = generateCommitStyle(body); }
    if (c === 'code-review') { files['skills/code-review/SKILL.md'] = generateCodeReviewSkill(body, lang); }
    if (c === 'security') { files['skills/security-review/SKILL.md'] = generateSecuritySkill(body, lang); }
    if (c === 'memory-system') {
      files['memory/MEMORY.md'] = generateMemoryIndex(body);
      files['memory/STATUS.md'] = generateStatus(body, lang);
      files['memory/lessons.md'] = generateLessonsFile(lang);
      files['memory/decisions.md'] = generateDecisionsFile(lang);
      files['memory/tasks/regret.md'] = generateRegretFile(lang);
      files['memory/tasks/skill_scores.md'] = generateSkillScoresFile();
      files['memory/tasks/skill_usage.md'] = generateSkillUsageFile();
      files['memory/tasks/velocity.md'] = generateVelocityFile();
      files['memory/tasks/draft-lessons.md'] = '# Draft Lessons (auto-tracked edits)\n_Run /learn to extract patterns from these._\n';
    }
  }

  // Always generate these core skills
  files['skills/learn/SKILL.md'] = generateLearnSkill();
  files['skills/start-session/SKILL.md'] = generateStartSessionSkill(body);
  files['skills/end-session/SKILL.md'] = generateEndSessionSkill(body);
  files['skills/evolve-check/SKILL.md'] = generateEvolveCheckSkill();
  files['skills/evolve/SKILL.md'] = generateEvolveSkill();
  files['skills/fix-bug/SKILL.md'] = generateFixBugSkill(lang);
  files['skills/plan/SKILL.md'] = generatePlanSkill();
  files['skills/smoke-test/SKILL.md'] = generateSmokeTestSkill(lang);
  files['skills/ui-design-first/SKILL.md'] = generateUiDesignFirstSkill();
  files['skills/scan-codebase/SKILL.md'] = generateScanCodebaseSkill(lang);
  files['rules/karpathy-principles.md'] = generateKarpathyPrinciples();
  files['rules/feedback-update-codemap.md'] = generateFeedbackUpdateCodemap();

  // Agents
  files['agents/bug-fix.md'] = generateBugFixAgent(lang);
  files['agents/feature-build.md'] = generateFeatureBuildAgent(lang);

  // Modes
  files['modes/develop.json'] = JSON.stringify({ name: 'develop', description: 'Default mode for development work', tools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'] }, null, 2);
  files['modes/review.json'] = JSON.stringify({ name: 'review', description: 'Read-only mode for code review - no edits allowed', tools: ['Read', 'Glob', 'Grep'] }, null, 2);
  files['modes/deploy.json'] = JSON.stringify({ name: 'deploy', description: 'Deployment mode - confirms before every action', tools: ['Read', 'Bash', 'Glob', 'Grep'] }, null, 2);
  files['modes/safe.json'] = JSON.stringify({ name: 'safe', description: 'Safe mode - read-only, no file changes, no commands', tools: ['Read', 'Glob', 'Grep'] }, null, 2);

  // Settings — no external dependencies
  files['settings.json'] = JSON.stringify({ permissions: { allow: [], deny: [] } }, null, 2);

  // Sync instructions
  files['SYNC.md'] = generateSyncGuide(body);

  // Memory push/pull script
  files['memory.ps1'] = generateMemoryScript(body);

  // One-time setup script (only if GitHub user provided)
  if (body.githubUser) {
    files['setup.ps1'] = generateSetupScript(body);
  }

  return files;
}

// --- CLAUDE.md ---

function generateClaudeMd(body, lang, fw, conventions) {
  var s = '';
  s += '# ' + body.projectName + '\n\n';
  s += '## What This Project Is\n';
  s += (PROJECT_TYPES[body.projectType] || 'A software project.') + '\n\n';

  s += '## Tech Stack\n';
  s += '- **Language:** ' + lang.name + '\n';
  if (body.framework) { s += '- **Framework:** ' + body.framework + '\n'; }
  if (body.database) { s += '- **Database:** ' + body.database + '\n'; }
  s += '- **Testing:** ' + lang.test + '\n';
  s += '- **Linting:** ' + lang.lint + '\n';
  s += '- **Formatting:** ' + lang.format + '\n\n';

  s += '## Commands\n```\n';
  s += 'Install:  ' + lang.installCmd + '\n';
  s += 'Dev:      ' + (fw ? fw.devCmd : lang.devCmd) + '\n';
  s += 'Build:    ' + (fw ? fw.buildCmd : lang.buildCmd) + '\n';
  s += 'Test:     ' + lang.testCmd + '\n';
  s += 'Lint:     ' + lang.lint + ' .\n';
  s += '```\n\n';

  if (fw && fw.structure) {
    s += '## File Structure\n```\n' + fw.structure + '\n```\n\n';
  }

  s += '## Coding Conventions\n';
  for (var i = 0; i < lang.conventions.length; i++) { s += '- ' + lang.conventions[i] + '\n'; }
  s += '\n';

  // Model Selection
  s += '## Model Selection\n';
  s += '**Default: Sonnet.** Use Sonnet for routine work.\n\n';
  s += '**Switch to Opus ONLY when:**\n';
  s += '1. Multi-file cross-cutting (3+ files with dependencies)\n';
  s += '2. Unknown root cause (competing hypotheses)\n';
  s += '3. Architecture decision (new feature design, approach tradeoffs)\n\n';
  s += '**After the hard part is done, drop back to Sonnet.**\n\n';

  // Session Commands
  s += '## Session Workflow\n\n';
  s += '### `Start Session`\n';
  s += 'Read `memory/STATUS.md` and report: "Ready. Last change: [summary]. What are we working on?"\n\n';
  s += '### `End Session`\n';
  s += '1. Run `/learn` - extract patterns from this session\n';
  s += '2. Update `memory/STATUS.md` - increment session, one-line summary\n';
  s += '3. Update `memory/MEMORY.md` currentDate\n';
  s += '4. Commit all changes\n';
  s += '5. Report: "Session complete."\n\n';

  // Middle Path
  s += '## Scoped Pushback\n\n';
  s += 'Claude operates as executor by default. Three bounded permissions:\n\n';
  s += '### 1. Pre-Plan Challenge\n';
  s += 'If the proposed approach contradicts a settled decision in `decisions.md` or a regret entry in `tasks/regret.md`, surface it before the plan.\n\n';
  s += '### 2. Start Session Observation\n';
  s += 'After reporting last change, add one line maximum:\n';
  s += '> Noticed: [one concrete observation about recent changes worth attention]\n\n';
  s += '### 3. Architecture Flag\n';
  s += 'If a proposed feature would create a duplicate pattern where 2+ already exist, flag it.\n\n';

  if (body.additionalContext) {
    s += '## Additional Context\n' + body.additionalContext + '\n\n';
  }

  // Merge imported existing setup — extract user sections, skip Clankbrain-generated boilerplate
  if (body.importExisting) {
    var existing = body.importExisting;
    // Strip file path headers added by folder upload
    existing = existing.replace(/^# --- .+? ---\n\n/gm, '');

    // Extract only user-written sections from the existing CLAUDE.md
    var userSections = extractUserSections(existing);

    if (userSections.trim()) {
      var generated = s;
      s = '# ' + body.projectName + '\n\n';
      s += '_This setup was generated by Clankbrain with your existing configuration preserved._\n\n';
      s += '---\n\n';
      s += '## Your Existing Configuration\n\n';
      s += userSections.trim() + '\n\n';
      s += '---\n\n';
      s += '## Added by Clankbrain\n\n';
      s += '_The following sections were added to complement your existing setup. Remove any that duplicate what you already have._\n\n';
      generated = generated.replace(/^# .+?\n\n/, '');
      s += generated;
    }
  }

  // Rule references
  s += '---\n\n';
  if (conventions.indexOf('plan-before-edit') >= 0) { s += '@rules/plan-before-edit.md\n'; }
  s += '@rules/karpathy-principles.md\n';
  if (conventions.indexOf('protected-files') >= 0) { s += '@rules/protected-files.md\n'; }
  if (conventions.indexOf('naming-conventions') >= 0) { s += '@rules/naming-conventions.md\n'; }
  if (conventions.indexOf('testing') >= 0) { s += '@rules/testing.md\n'; }
  if (conventions.indexOf('commit-style') >= 0) { s += '@rules/commit-style.md\n'; }

  return s;
}

// --- Extract user-written sections from an existing CLAUDE.md ---
// Keeps: project description, commands, tech stack, memory/GitHub config, custom conventions, custom sections
// Strips: Clankbrain-generated boilerplate, skill definitions, agent definitions, rule content, code maps

function extractUserSections(content) {
  // Split into H2 sections (## heading)
  var parts = content.split(/^(?=## )/m);
  var kept = [];

  // Headings that Clankbrain regenerates — skip these
  var skipHeadings = [
    'added by clankbrain',
    'your existing configuration', // prevent nested wrappers on re-import
    'coding conventions',        // regenerated from language selection
    'coding principles',         // karpathy-principles.md
    'model selection',           // generated by wizard
    'scoped pushback',           // generated by wizard
    'commands',                  // regenerated (Start/End Session)
    'plan before edit',          // rules/plan-before-edit.md
    'anti-patterns',             // generated skill content
    'refactor patterns',         // generated skill content
    'test strategy',             // generated skill content
    'environment matrix',        // generated skill content
    'auth rules',                // generated skill content
    'secrets policy',            // generated skill content
  ];

  // Patterns that indicate embedded skill/agent/rule content (not user config)
  var skipPatterns = [
    /^---\s*\nname:\s/m,         // skill/agent frontmatter
    /^\*\*Trigger:\*\*/m,        // skill trigger line
    /^## Steps\s*$/m,            // skill steps section
    /^## Auto-Chain\s*$/m,       // skill auto-chain
    /^allowed-tools:/m,          // skill metadata
  ];

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i].trim();
    if (!part) { continue; }

    // Get the heading text
    var headingMatch = part.match(/^## (.+)/);
    var heading = headingMatch ? headingMatch[1].trim().toLowerCase() : '';

    // Skip the top-level # heading line (project name) — Clankbrain generates its own
    if (!headingMatch && part.match(/^# /)) {
      // Keep content after the H1 that isn't a heading — could be user intro text
      var afterH1 = part.replace(/^# .+\n+/, '').trim();
      if (afterH1 && afterH1.length > 20 && !afterH1.match(/^_This setup was generated by Clankbrain/)) {
        kept.push(afterH1);
      }
      continue;
    }

    // Skip known Clankbrain-generated headings
    var shouldSkip = false;
    for (var si = 0; si < skipHeadings.length; si++) {
      if (heading.indexOf(skipHeadings[si]) >= 0) {
        shouldSkip = true;
        break;
      }
    }
    if (shouldSkip) { continue; }

    // Skip sections that contain skill/agent/rule frontmatter
    var hasSkipPattern = false;
    for (var pi = 0; pi < skipPatterns.length; pi++) {
      if (skipPatterns[pi].test(part)) {
        hasSkipPattern = true;
        break;
      }
    }
    if (hasSkipPattern) { continue; }

    // Skip very large sections (>5000 chars) — likely embedded code maps, full conventions, etc.
    if (part.length > 5000) { continue; }

    // Skip @rules/ references — Clankbrain regenerates those
    if (part.match(/^@rules\//m) && part.length < 200) { continue; }

    kept.push(part);
  }

  return kept.join('\n\n');
}

// --- Plan Before Edit (full 8-section version) ---

function generatePlanBeforeEdit(body, lang) {
  var s = '';
  s += '# Plan Before Edit - Required for All Code Changes\n\n';
  s += '**HARD RULE - NO EXCEPTIONS:**\n';
  s += 'Before making ANY edit to ANY code file, present the full plan and wait for explicit approval.\n\n';
  s += '**Does NOT apply to:** memory files, .claude/ config files.\n\n';
  s += '---\n\n';

  s += '## Step 0 - Regret Check (silent)\n\n';
  s += 'Before showing any plan, grep `tasks/regret.md` for keywords matching the proposed approach.\n';
  s += '- No match: proceed silently.\n';
  s += '- Match found: surface it before the plan.\n\n';

  s += '## Step 1 - Validate Before Showing\n\n';
  s += 'Verify every function reference with Grep or Read. Never show a plan with unverified references.\n\n';

  s += '## Required Plan Format\n\n';
  s += '### Problem / Feature\nOne clear sentence.\n\n';
  s += '### All Related Functions\nList every function touched with file path and line number.\n\n';
  s += '### Before (relevant lines only)\n```' + body.language + '\n// current code\n```\n\n';
  s += '### After\n```' + body.language + '\n// replacement code\n```\n\n';
  s += '### Why this will work\nOne sentence explaining the mechanism.\n\n';
  s += '### Scope / Blast Radius\n';
  s += '- **Files touched:** every file that will change\n';
  s += '- **Lines changed:** exact count\n';
  s += '- **Type:** Logic change | Refactor | Config/data only\n';
  s += '- **Affected at runtime:** what breaks if this goes wrong\n\n';
  s += '### Evaluation\n';
  s += '- **Risks:** concrete risks with mitigations\n';
  s += '- **Confidence:** High | Medium | Low\n';
  s += '- **Verdict:** Proceed | Hold | Redesign\n\n';
  s += '### Challenge (devil\'s advocate)\n';
  s += 'The strongest argument AGAINST this approach.\n\n';
  s += '### Rollback\n```\ngit restore path/to/file\n```\n\n';

  s += '---\n\n';
  s += '## Step 2 - Wait for Approval\n\n';
  s += 'Show the plan. Wait for "yes" / "go" / "do it". Only then edit.\n\n';
  s += '**Approval must be the user\'s NEXT message.** If their reply contains corrections, re-show the updated plan and wait again.\n\n';
  s += '**Show the full plan after every adjustment** - never delta-only.\n\n';

  s += '## Step 3 - Verify After Every Edit\n\n';
  s += '1. Read back the changed lines\n';
  s += '2. Show the user the actual lines (quote, don\'t summarize)\n';
  s += '3. Confirm: "Verified [file]:[lines]"\n\n';

  s += '## Step 4 - Confirm Actual Scope\n\n';
  s += '```\ngit diff --stat\n```\nReport actual lines changed vs plan.\n';

  return s;
}

// --- Karpathy Principles ---

function generateKarpathyPrinciples() {
  var s = '';
  s += '# Coding Principles\n\n';
  s += '## 1. Think Before Coding\n';
  s += '- State assumptions explicitly. If uncertain, ask.\n';
  s += '- If multiple interpretations exist, present them.\n';
  s += '- If a simpler approach exists, say so.\n\n';
  s += '## 2. Simplicity First\n';
  s += 'Minimum code that solves the problem. Nothing speculative.\n';
  s += '- No features beyond what was asked.\n';
  s += '- No abstractions for single-use code.\n';
  s += '- No error handling for impossible scenarios.\n';
  s += '- If 200 lines could be 50, rewrite it.\n\n';
  s += '## 3. Surgical Changes\n';
  s += 'Touch only what you must. Clean up only your own mess.\n';
  s += '- Don\'t "improve" adjacent code.\n';
  s += '- Match existing style.\n';
  s += '- Remove only what YOUR changes made unused.\n\n';
  s += '## 4. Goal-Driven Execution\n';
  s += 'Define success criteria. Loop until verified.\n';
  return s;
}

// --- Protected Files ---

function generateProtectedFiles(body, lang, fw) {
  var s = '# Protected Files\n\n';
  s += 'Never restructure these files. Read first. Change minimum lines.\n\n';
  s += '| File | Why |\n|------|-----|\n';
  if (fw && fw.protectedFiles) {
    for (var i = 0; i < fw.protectedFiles.length; i++) {
      s += '| `' + fw.protectedFiles[i] + '` | Framework config |\n';
    }
  }
  if (lang.lockFile) { s += '| `' + lang.lockFile + '` | Lock file - never edit manually |\n'; }
  if (lang.envFile) { s += '| `' + lang.envFile + '` | Secrets |\n'; }
  s += '| `.github/workflows/*` | CI/CD |\n';
  s += '| `migrations/*` | Order-sensitive |\n';
  if (body.protectedFiles) {
    var uf = body.protectedFiles.split('\n');
    for (var j = 0; j < uf.length; j++) {
      var f = uf[j].trim();
      if (f) { s += '| `' + f + '` | User-specified |\n'; }
    }
  }
  return s;
}

// --- Naming Conventions ---

function generateNamingConventions(body, lang) {
  var s = '# Naming Conventions - ' + lang.name + '\n\n';
  s += '| Element | Convention |\n|---------|----------|\n';
  s += '| Variables | `' + lang.varStyle + '` |\n';
  s += '| Functions | `' + lang.fnStyle + '` |\n';
  s += '| Files | `' + lang.fileStyle + '` |\n';
  s += '| Classes | `' + lang.classStyle + '` |\n';
  s += '| Constants | `' + lang.constStyle + '` |\n\n';
  s += '## Rules\n';
  s += '- Descriptive names: `remainingAttempts` not `ra`\n';
  s += '- Booleans: `is`, `has`, `should`, `can` prefix\n';
  s += '- No abbreviations unless universal (`id`, `url`, `api`)\n';
  s += '- Collections use plural names\n';
  s += '- Match domain terminology\n';
  return s;
}

// --- Testing ---

function generateTesting(body, lang) {
  var s = '# Testing Requirements\n\n';
  s += '**Framework:** ' + lang.test + ' | **Run:** `' + lang.testCmd + '`\n\n';
  s += '## Needs Tests\n';
  s += '- All public functions\n- Business logic\n- API endpoints (happy + error)\n- Data validation\n- Edge cases\n\n';
  s += '## Does NOT Need Tests\n';
  s += '- Simple getters/setters\n- Framework boilerplate\n- Third-party internals\n- One-time scripts\n\n';
  s += '## Structure\n';
  s += '- Test files: `*.test' + lang.ext + '` or `*_test' + lang.ext + '`\n';
  s += '- Descriptive names: "should return 404 when user not found"\n';
  s += '- One assertion per concept\n- No test interdependencies\n';
  return s;
}

// --- Commit Style ---

function generateCommitStyle() {
  var s = '# Commit Style\n\n```\n<type>: <description>\n\n<optional body - explain WHY>\n```\n\n';
  s += '| Type | When |\n|------|------|\n';
  s += '| `feat` | New feature |\n| `fix` | Bug fix |\n| `refactor` | Restructure |\n';
  s += '| `docs` | Documentation |\n| `test` | Tests |\n| `chore` | Build/config |\n\n';
  s += '- Under 72 chars\n- Imperative: "add" not "added"\n- No period at end\n- Body = WHY not WHAT\n';
  return s;
}

// --- Code Review Skill (deep) ---

function generateCodeReviewSkill(body, lang) {
  var s = '# Skill: code-review\n\n';
  s += '**Trigger:** "review", "check for issues", "audit", "before I ship"\n\n';
  s += '**Allowed Tools:** Read, Grep, Glob\n\n---\n\n';
  s += '## Checklist\n\n';
  s += '### Correctness\n';
  s += '- [ ] Does the code do what it claims?\n- [ ] Edge cases handled?\n- [ ] Error paths handled?\n- [ ] Concurrent access safe?\n\n';
  s += '### ' + lang.name + ' Conventions\n';
  for (var i = 0; i < lang.conventions.length; i++) { s += '- [ ] ' + lang.conventions[i] + '\n'; }
  s += '\n### ' + lang.name + ' Deep Checks\n';
  for (var j = 0; j < lang.reviewChecks.length; j++) { s += '- [ ] ' + lang.reviewChecks[j] + '\n'; }
  s += '\n### Security\n';
  for (var k = 0; k < Math.min(lang.securityChecks.length, 5); k++) { s += '- [ ] ' + lang.securityChecks[k] + '\n'; }
  s += '\n### Simplicity\n';
  s += '- [ ] Simplest approach?\n- [ ] Functions could be split?\n- [ ] Unnecessary abstractions?\n- [ ] New team member understands in 5 min?\n\n';
  s += '## Report\n`[file:line] - issue. Fix: specific fix.`\n';
  return s;
}

// --- Security Skill ---

function generateSecuritySkill(body, lang) {
  var s = '# Skill: security-review\n\n';
  s += '**Trigger:** "security review", "audit for vulnerabilities"\n\n';
  s += '**Allowed Tools:** Read, Grep, Glob\n\n---\n\n## Checklist\n\n';
  for (var i = 0; i < lang.securityChecks.length; i++) { s += '- [ ] ' + lang.securityChecks[i] + '\n'; }
  s += '\n### General\n';
  s += '- [ ] No hardcoded secrets in source\n- [ ] Sensitive data not logged\n';
  s += '- [ ] Auth on all non-public endpoints\n- [ ] Users access only their own data\n';
  s += '- [ ] Rate limiting on auth endpoints\n- [ ] Dependencies checked for CVEs\n';
  s += '- [ ] Error messages don\'t expose internals\n\n';
  s += '## Report\n`[SEVERITY] [file:line] - description. Fix: recommendation.`\n';
  s += 'Severity: CRITICAL | HIGH | MEDIUM | LOW\n';
  return s;
}

// --- Learn Skill ---

function generateLearnSkill() {
  var s = '# Skill: learn\n\n';
  s += '**Trigger:** `/learn` or "extract patterns" or "learn from this session"\n\n';
  s += '**Description:** Extracts reusable patterns, lessons, and decisions from the current session.\n\n';
  s += '**Allowed Tools:** Read, Edit, Write, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Review the conversation for:**\n';
  s += '   - Bugs fixed and root causes\n';
  s += '   - Patterns that worked well\n';
  s += '   - Mistakes made and corrections\n';
  s += '   - Decisions made\n';
  s += '   - Gotchas discovered\n\n';
  s += '2. **Check for conflicts** with existing entries in `memory/lessons.md` and `memory/decisions.md`\n\n';
  s += '3. **Categorize:**\n';
  s += '   - Bugs/errors -> append to `memory/lessons.md`\n';
  s += '   - Decisions -> append to `memory/decisions.md`\n';
  s += '   - Rejected approaches -> append to `memory/tasks/regret.md`\n\n';
  s += '4. **Format each entry:**\n';
  s += '```\n## [YYYY-MM-DD] - [short title]\n';
  s += '**Context:** what you were doing\n';
  s += '**Problem:** what went wrong or was learned\n';
  s += '**Solution:** what works\n';
  s += '**Apply when:** trigger conditions\n```\n\n';
  s += '5. **Skill scoring:** For each skill used this session, log to `memory/tasks/skill_scores.md`:\n';
  s += '   - Worked first time: `N` (no correction needed)\n';
  s += '   - Needed correction: `Y` with severity (minor/major/silent) and what failed\n\n';
  s += '6. **Report:** "Extracted N lessons: [titles]"\n';
  return s;
}

// --- Start Session Skill ---

function generateStartSessionSkill(body) {
  var s = '# Skill: start-session\n\n';
  s += '**Trigger:** "Start Session"\n\n';
  s += '**Description:** Initialize a working session with full project context.\n\n';
  s += '**Allowed Tools:** Read, Glob, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. Read `memory/STATUS.md` - get last session summary\n';
  s += '2. Read `memory/MEMORY.md` - get current context\n';
  s += '3. **First-session auto-scan:** If `rules/code-map.md` does not exist, run `/scan-codebase` automatically to generate project-specific rules from the actual code.\n';
  s += '4. Report: "Ready. Last change: [summary]. What are we working on?"\n';
  s += '5. Add one observation if worth noting (optional, max one line)\n';
  return s;
}

// --- End Session Skill ---

function generateEndSessionSkill(body) {
  var s = '# Skill: end-session\n\n';
  s += '**Trigger:** "End Session"\n\n';
  s += '**Description:** Close out a session: learn, update status, commit.\n\n';
  s += '**Allowed Tools:** Read, Edit, Write, Grep, Bash\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Run `/learn`** - extract patterns from this session\n';
  s += '2. **Update `memory/tasks/skill_usage.md`** - log which skills fired\n';
  s += '3. **Update memory files** for anything changed this session\n';
  s += '4. **Update `memory/MEMORY.md`** - currentDate\n';
  s += '5. **Update `memory/STATUS.md`** - increment session, one-line summary\n';
  s += '6. **Commit changes:**\n';
  s += '   ```\n   git add -A\n   git commit -m "Session NNN: [summary]"\n   ```\n';
  s += '7. **Report:** "Session complete."\n';
  return s;
}

// --- Memory Files ---

function generateMemoryIndex(body) {
  var s = '# Memory Index\n\n';
  s += '_Persistent context across sessions._\n\n';
  s += '- [Project Status](STATUS.md) - Current phase, last session\n';
  s += '- [Lessons Learned](lessons.md) - Patterns and solutions\n';
  s += '- [Settled Decisions](decisions.md) - Locked architectural choices\n';
  s += '- [Regret Log](tasks/regret.md) - Rejected approaches\n';
  s += '- [Skill Scores](tasks/skill_scores.md) - Skill effectiveness tracking\n';
  s += '- [Skill Usage](tasks/skill_usage.md) - Last-used date per skill\n';
  s += '- [Velocity](tasks/velocity.md) - Estimate calibration\n\n';
  s += '# currentDate\n';
  s += 'Today is ' + new Date().toISOString().split('T')[0] + '. (Session 1)\n';
  return s;
}

function generateStatus(body, lang) {
  var s = '# ' + body.projectName + ' - Status\n\n';
  s += '## Current Phase\n';
  s += '> **Session 1 complete.** Initial setup generated by Clankbrain wizard.\n';
  s += '> Stack: ' + lang.name;
  if (body.framework) { s += ' + ' + body.framework; }
  if (body.database) { s += ' + ' + body.database; }
  s += '\n';
  return s;
}

function generateLessonsFile(lang) {
  var s = '# Lessons Learned\n\n';
  s += '_Extracted patterns, mistakes, and solutions. Append after each session via `/learn`._\n\n';
  s += '_Format:_\n```\n## [YYYY-MM-DD] - [title]\n**Context:** what you were doing\n**Problem:** what went wrong\n**Solution:** what works\n**Apply when:** trigger conditions\n```\n\n';
  s += '## [' + new Date().toISOString().split('T')[0] + '] - Starter lessons for ' + lang.name + '\n\n';
  if (lang.starterLessons) {
    for (var i = 0; i < lang.starterLessons.length; i++) {
      s += '### ' + lang.starterLessons[i].title + '\n';
      s += '**Problem:** ' + lang.starterLessons[i].problem + '\n';
      s += '**Solution:** ' + lang.starterLessons[i].solution + '\n\n';
    }
  }
  return s;
}

function generateDecisionsFile(lang) {
  var s = '# Settled Decisions\n\n';
  s += '_Architectural choices that are locked. Read before proposing changes._\n\n';
  if (lang.starterDecisions) {
    for (var i = 0; i < lang.starterDecisions.length; i++) {
      s += '## ' + lang.starterDecisions[i].title + '\n';
      s += lang.starterDecisions[i].detail + '\n\n';
    }
  }
  return s;
}

function generateRegretFile(lang) {
  var s = '# Rejected Approaches\n\n';
  s += '_Read before suggesting a solution. These were tried, evaluated, and discarded._\n\n';
  s += '| Approach | Why Rejected |\n|----------|-------------|\n';
  if (lang.starterRegrets) {
    for (var i = 0; i < lang.starterRegrets.length; i++) {
      s += '| ' + lang.starterRegrets[i][0] + ' | ' + lang.starterRegrets[i][1] + ' |\n';
    }
  }
  s += '\n_Add entries as approaches are tried and rejected._\n';
  return s;
}

function generateSkillScoresFile() {
  var s = '# Skill Effectiveness Scores\n\n';
  s += '_Binary log: did the skill output need correction? Y = needed fix, N = worked first time._\n\n';
  s += '| Date | Skill | Scope | Notes | Correction Needed | Severity | What Failed | Code Fixed | Skill Patched |\n';
  s += '|------|-------|-------|-------|-------------------|----------|-------------|------------|---------------|\n';
  s += '| ' + new Date().toISOString().split('T')[0] + ' | start-session | all | Session 1 - initial setup | N | - | - | - | - |\n';
  return s;
}

function generateSkillUsageFile() {
  var s = '# Skill Usage Tracker\n\n';
  s += '_Update at End Session: log which skills fired._\n';
  s += '_Flag any skill not used in 10+ sessions as stale._\n\n';
  s += '| ' + new Date().toISOString().split('T')[0] + ' | start-session | Session 1 - initial setup |\n';
  return s;
}

function generateVelocityFile() {
  var s = '# Velocity Tracker\n\n';
  s += '_Estimated vs actual sessions per task. Read before estimating._\n\n';
  s += '| Task | Estimated | Actual | Notes |\n';
  s += '|------|-----------|--------|-------|\n';
  s += '| _(none yet)_ | - | - | - |\n';
  return s;
}

// --- Evolve-Check Skill ---

function generateEvolveCheckSkill() {
  var s = '# Skill: evolve-check\n\n';
  s += '**Trigger:** `/evolve-check` or at End Session\n\n';
  s += '**Description:** Scan skill scores and flag skills that need attention.\n\n';
  s += '**Allowed Tools:** Read, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. Read `memory/tasks/skill_scores.md`\n';
  s += '2. For each skill, count recent Y vs N entries\n';
  s += '3. Flag status:\n';
  s += '   - **URGENT** - 2+ consecutive Y or 50%+ Y in last 5 uses\n';
  s += '   - **WATCH** - 1 Y in last 5 uses\n';
  s += '   - **STABLE** - all N in last 5 uses\n';
  s += '   - **DATA MISSING** - fewer than 3 entries\n';
  s += '4. Report each skill with status\n';
  s += '5. If any URGENT: recommend running `/evolve`\n';
  return s;
}

// --- Evolve Skill ---

function generateEvolveSkill() {
  var s = '# Skill: evolve\n\n';
  s += '**Trigger:** `/evolve` or when evolve-check flags URGENT/WATCH\n\n';
  s += '**Description:** Improve skills based on accumulated failure data.\n\n';
  s += '**Allowed Tools:** Read, Edit, Write, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. Read `memory/tasks/skill_scores.md` - find all Y entries\n';
  s += '2. Read `memory/lessons.md` - find related lessons\n';
  s += '3. For each skill with unpatched failures:\n';
  s += '   a. Read the SKILL.md\n';
  s += '   b. Identify what step failed (from "What Failed" column)\n';
  s += '   c. Add a check or warning to prevent recurrence\n';
  s += '   d. Set "Skill Patched" to today\'s date in skill_scores\n';
  s += '4. Check lessons.md for patterns appearing 3+ times - flag as new skill candidates\n';
  s += '5. Report: "Patched N skills. Candidates: [list]"\n\n';
  s += '## Rules\n\n';
  s += '- Never delete skill content - only add guards\n';
  s += '- Every patch references the specific failure\n';
  s += '- Run every 5 sessions, or when evolve-check flags URGENT\n';
  return s;
}

// --- Sync Guide ---

function generateSyncGuide(body) {
  var s = '# Cross-Machine Sync\n\n';
  s += 'Your `.claude/` folder is part of your project. Sync = sync your code.\n\n';
  s += '## Option 1: Commit with your project (recommended)\n\n';
  s += '```\ngit add .claude/\ngit commit -m "Update Claude Code setup"\ngit push\n```\n';
  s += 'On another machine: `git pull` and everything is there.\n\n';
  s += '## Option 2: Separate memory repo (advanced)\n\n';
  s += 'For private memory on a public repo:\n';
  s += '1. `gh repo create claude-memory --private`\n';
  s += '2. Move `.claude/memory/` to the private repo\n';
  s += '3. Symlink it back: `ln -s ~/claude-memory/' + body.projectName + ' .claude/memory`\n';
  s += '4. Add pull/push to Start/End Session skills\n\n';
  s += '## What gets synced\n\n';
  s += '| Folder | Purpose |\n|--------|--------|\n';
  s += '| `CLAUDE.md` | Project context |\n';
  s += '| `rules/` | Convention enforcement |\n';
  s += '| `skills/` | Workflows |\n';
  s += '| `memory/` | Lessons, decisions, status |\n';
  s += '| `memory/tasks/` | Scores, velocity, regrets |\n';
  return s;
}

// --- Fix Bug Skill ---

function generateFixBugSkill(lang) {
  var s = '# Skill: fix-bug\n\n';
  s += '**Trigger:** "fix the bug", "it\'s broken", "not working", "wrong result"\n\n';
  s += '**Description:** Structured bug fix workflow: reproduce, isolate, fix, verify.\n\n';
  s += '**Allowed Tools:** Read, Edit, Write, Grep, Glob, Bash\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Reproduce** - Confirm the bug exists. Get exact steps, input, and expected vs actual output.\n';
  s += '2. **Isolate** - Find the root cause. Read the relevant code, trace the data flow, add debug output if needed.\n';
  s += '3. **Fix** - Present a plan (Before/After) following plan-before-edit rules. Wait for approval.\n';
  s += '4. **Verify** - Confirm the fix works. Check for regressions in related code paths.\n';
  s += '5. **Log** - If the bug reveals a pattern, add it to `memory/lessons.md` via `/learn`.\n\n';
  s += '## Before fixing, check:\n';
  s += '- Is this actually a bug, or expected behavior?\n';
  s += '- Has this been fixed before? Check `memory/lessons.md` and `memory/tasks/regret.md`\n';
  s += '- Is the fix in the right place, or should it be fixed upstream?\n';
  return s;
}

// --- Plan Skill ---

function generatePlanSkill() {
  var s = '# Skill: plan\n\n';
  s += '**Trigger:** "plan", "I want to build", "design", "thinking about"\n\n';
  s += '**Description:** Structured planning session for a new feature or change.\n\n';
  s += '**Allowed Tools:** Read, Grep, Glob\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Clarify the goal** - What does "done" look like? Who is it for?\n';
  s += '2. **Research what exists** - Search the codebase for related code, patterns, similar features.\n';
  s += '3. **Present options** - At least 2 approaches with tradeoffs:\n';
  s += '   - Build cost (Low/Medium/High)\n';
  s += '   - Risk (what could go wrong)\n';
  s += '   - Payoff (what you get)\n';
  s += '4. **Wait for decision** - User picks an option.\n';
  s += '5. **Write the plan** - Break into steps with success criteria for each.\n';
  s += '6. **Save** - Write plan to `memory/plans/[name].md` with status: Draft.\n\n';
  s += '## Plan statuses\n';
  s += '- **Draft** - Options being discussed\n';
  s += '- **Ready to Code** - Approved, waiting for implementation\n';
  s += '- **In Progress** - Being built\n';
  s += '- **Shipped** - Complete\n';
  s += '- **On Hold** - Paused, revisit later\n';
  return s;
}

// --- Smoke Test Skill ---

function generateSmokeTestSkill(lang) {
  var s = '# Skill: smoke-test\n\n';
  s += '**Trigger:** "smoke test", "quick test", "did I break anything"\n\n';
  s += '**Description:** Quick verification that key endpoints/functions still work after a change.\n\n';
  s += '**Allowed Tools:** Read, Bash, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Identify what changed** - `git diff --stat` to see affected files.\n';
  s += '2. **Run tests** - `' + lang.testCmd + '`\n';
  s += '3. **Check build** - `' + lang.buildCmd + '`\n';
  s += '4. **Manual check** - If it\'s a web app, hit the main endpoint and verify it responds.\n';
  s += '5. **Report** - "Smoke test passed" or list what failed.\n\n';
  s += '## Not a full test suite\n';
  s += 'This is a 30-second confidence check, not comprehensive testing. Use it after every change to catch obvious breakage.\n';
  return s;
}

// --- UI Design First Skill ---

function generateUiDesignFirstSkill() {
  var s = '# Skill: ui-design-first\n\n';
  s += '**Trigger:** "make it nicer", "it looks off", "redesign", "UI change"\n\n';
  s += '**Description:** Pin down the visual intent before touching any CSS or HTML.\n\n';
  s += '**Allowed Tools:** Read, Grep\n\n---\n\n';
  s += '## Steps\n\n';
  s += '1. **Ask what\'s wrong** - "What specifically looks off? Layout, spacing, colors, typography?"\n';
  s += '2. **Ask for the goal** - "What should it look like? Describe or reference."\n';
  s += '3. **Sketch first** - Describe the layout top-to-bottom in plain text before writing any code.\n';
  s += '4. **Confirm** - "Does this match what you want?" Wait for yes.\n';
  s += '5. **Then code** - Follow plan-before-edit with the agreed layout.\n\n';
  s += '## Why this exists\n';
  s += 'Vague UI requests ("make it nicer") without pinned intent cause 10+ iteration loops. This skill eliminates that by getting agreement on the design before any code runs.\n';
  return s;
}

// --- Feedback Update Codemap Rule ---

function generateFeedbackUpdateCodemap() {
  var s = '# Update Code Map After Every Change\n\n';
  s += 'After EVERY code change, check whether this file needs updating and update it immediately.\n\n';
  s += '## What to update\n\n';
  s += '- New function/method added -> add to the code map with file path and line\n';
  s += '- Function moved or renamed -> update the reference\n';
  s += '- New endpoint added -> add the route, handler, and what it does\n';
  s += '- New page or URL -> add to the URL/routing section\n';
  s += '- DB schema change -> update the schema section\n\n';
  s += '## Why\n';
  s += 'An outdated code map causes the same slowdown as no code map at all. Keep it current.\n';
  return s;
}

// --- Bug Fix Agent ---

function generateBugFixAgent(lang) {
  var s = '---\n';
  s += 'name: bug-fix\n';
  s += 'description: Bug fix orchestrator - reproduce, isolate, fix, verify, log\n';
  s += 'tools: [Read, Edit, Write, Grep, Glob, Bash]\n';
  s += '---\n\n';
  s += '# Bug Fix Agent\n\n';
  s += 'Follow this sequence for every bug fix:\n\n';
  s += '## 1. Reproduce\n';
  s += '- Confirm the bug exists with specific steps\n';
  s += '- Get expected vs actual behavior\n';
  s += '- Check if it\'s a regression (was it working before?)\n\n';
  s += '## 2. Isolate\n';
  s += '- Search the codebase for the relevant code path\n';
  s += '- Trace data flow from input to output\n';
  s += '- Check `memory/tasks/regret.md` - has this approach been tried before?\n\n';
  s += '## 3. Fix\n';
  s += '- Present a plan following plan-before-edit rules\n';
  s += '- Wait for approval before any edit\n';
  s += '- Make the minimal change that fixes the root cause\n\n';
  s += '## 4. Verify\n';
  s += '- Run: `' + lang.testCmd + '`\n';
  s += '- Check for regressions in related code\n';
  s += '- Read back changed lines and confirm\n\n';
  s += '## 5. Log\n';
  s += '- If the bug reveals a pattern, add to `memory/lessons.md`\n';
  s += '- If a bad approach was tried, add to `memory/tasks/regret.md`\n';
  return s;
}

// --- Feature Build Agent ---

function generateFeatureBuildAgent(lang) {
  var s = '---\n';
  s += 'name: feature-build\n';
  s += 'description: Full feature build - search, plan, implement, review, test, learn\n';
  s += 'tools: [Read, Edit, Write, Grep, Glob, Bash]\n';
  s += '---\n\n';
  s += '# Feature Build Agent\n\n';
  s += 'Follow this sequence for new features:\n\n';
  s += '## 1. Search\n';
  s += '- Search the codebase for related existing code\n';
  s += '- Check `memory/decisions.md` for relevant settled decisions\n';
  s += '- Check `memory/tasks/regret.md` for approaches to avoid\n\n';
  s += '## 2. Plan\n';
  s += '- Present options with tradeoffs\n';
  s += '- Wait for the user to pick an approach\n';
  s += '- Write a detailed plan with Before/After for each file\n\n';
  s += '## 3. Implement\n';
  s += '- Follow plan-before-edit for every edit\n';
  s += '- Verify after each file change\n';
  s += '- Keep changes surgical - don\'t touch unrelated code\n\n';
  s += '## 4. Review\n';
  s += '- Run `/code-review` on changed files\n';
  s += '- Fix any issues found\n\n';
  s += '## 5. Test\n';
  s += '- Run: `' + lang.testCmd + '`\n';
  s += '- Manual smoke test if applicable\n\n';
  s += '## 6. Learn\n';
  s += '- Run `/learn` to extract patterns from this feature build\n';
  return s;
}

// --- Scan Codebase Skill ---

function generateScanCodebaseSkill(lang) {
  var s = '# Skill: scan-codebase\n\n';
  s += '**Trigger:** `/scan-codebase` or "scan the codebase" or "analyze the project" or "generate rules from code"\n\n';
  s += '**Description:** Scans the current project and generates project-specific rules by reading actual code patterns, file structure, and conventions. Run automatically on first Start Session if no code-map exists.\n\n';
  s += '**Allowed Tools:** Read, Glob, Grep, Write, Bash\n\n---\n\n';
  s += '## Steps\n\n';

  s += '### 1. Discover Project Structure\n';
  s += '- Glob for all source files: `**/*' + lang.ext + '`, `**/*.html`, `**/*.css`, `**/*.sql`, config files\n';
  s += '- Read package/build config (`' + lang.lockFile + '`, etc.) for dependencies\n';
  s += '- Identify entry points, main directories, test directories\n';
  s += '- Count files per directory to understand project shape\n\n';

  s += '### 2. Sample Code Patterns (read 5-10 representative files)\n';
  s += '- Pick the largest files (likely core logic)\n';
  s += '- Pick files from different directories (coverage)\n';
  s += '- For each file, extract:\n';
  s += '  - Naming conventions (variables, functions, classes, files)\n';
  s += '  - Import/require patterns\n';
  s += '  - Error handling patterns\n';
  s += '  - Comment style and density\n';
  s += '  - Indentation (tabs vs spaces, width)\n';
  s += '  - String quote style (single vs double)\n';
  s += '  - Function length patterns\n';
  s += '  - Any project-specific patterns that repeat across files\n\n';

  s += '### 3. Generate `rules/code-map.md`\n';
  s += '- List all major directories with purpose\n';
  s += '- List key files with one-line descriptions\n';
  s += '- Map entry points (API routes, main functions, page components)\n';
  s += '- Document the data flow (request path from entry to database)\n';
  s += '- Format:\n';
  s += '  ```\n';
  s += '  # Code Map\n';
  s += '  ## Directory Structure\n';
  s += '  | Directory | Purpose |\n';
  s += '  | src/api/ | API route handlers |\n';
  s += '  ## Key Files\n';
  s += '  | File | Purpose |\n';
  s += '  | src/api/users.js | User CRUD endpoints |\n';
  s += '  ## Entry Points\n';
  s += '  | Entry | What it does |\n';
  s += '  ```\n\n';

  s += '### 4. Generate `rules/coding-conventions.md`\n';
  s += '- Document ONLY patterns observed in the actual code — do not invent conventions\n';
  s += '- Include copy-paste examples from real files (with file path references)\n';
  s += '- Organize by category: naming, structure, error handling, imports, etc.\n';
  s += '- If a pattern appears in 3+ files, it is a convention\n';
  s += '- If two conflicting patterns exist, note both and ask which to standardize on\n';
  s += '- Format:\n';
  s += '  ```\n';
  s += '  ## Naming\n';
  s += '  - Functions: camelCase (observed in src/api/*.js)\n';
  s += '  - Components: PascalCase (observed in src/components/*.jsx)\n';
  s += '  ## Error Handling\n';
  s += '  - Pattern: try/catch with custom AppError class (src/utils/errors.js)\n';
  s += '  ```\n\n';

  s += '### 5. Generate `rules/file-paths.md`\n';
  s += '- Map canonical locations for each file type\n';
  s += '- Note any files that live in unexpected places\n';
  s += '- Document URL-to-file mapping if applicable (routes, pages)\n\n';

  s += '### 6. Update `rules/protected-files.md`\n';
  s += '- Identify files that should never be restructured:\n';
  s += '  - Config files (env, build config, CI)\n';
  s += '  - Migration files\n';
  s += '  - Lock files\n';
  s += '  - Generated/minified files\n';
  s += '  - Files over 1000 lines (likely core, fragile)\n';
  s += '- Add them to the existing protected-files list\n\n';

  s += '### 7. Seed `memory/decisions.md`\n';
  s += '- If the project has clear architectural decisions visible in the code:\n';
  s += '  - Framework choice and why (from README or config)\n';
  s += '  - Database choice\n';
  s += '  - Auth pattern\n';
  s += '  - API style (REST, GraphQL, RPC)\n';
  s += '  - State management approach\n';
  s += '- Only record what is clearly settled — do not guess\n\n';

  s += '### 8. Report\n';
  s += '- Output: "Scan complete. Generated:\n';
  s += '  - rules/code-map.md ([N] directories, [N] key files)\n';
  s += '  - rules/coding-conventions.md ([N] conventions observed)\n';
  s += '  - rules/file-paths.md ([N] paths mapped)\n';
  s += '  - rules/protected-files.md ([N] files protected)\n';
  s += '  - memory/decisions.md ([N] decisions seeded)"\n';
  s += '- If conflicting patterns were found, list them and ask which to standardize\n\n';

  s += '## Notes\n\n';
  s += '- This skill is READ-HEAVY — it reads many files but only writes rule files\n';
  s += '- Never invent conventions — only document what the code actually does\n';
  s += '- If the project is too small (< 5 source files), say so and skip convention extraction\n';
  s += '- Re-run anytime with `/scan-codebase` to refresh after major refactors\n';
  return s;
}

// --- Memory Push/Pull Script ---

function generateMemoryScript(body) {
  var ghUser = body.githubUser || 'YOUR_GITHUB_USER';
  var projName = body.projectName || 'my-project';
  var memRepo = 'https://github.com/' + ghUser + '/' + projName + '-memory.git';

  var s = "param([string]$action = 'pull')\n\n";
  s += "$repo    = '" + memRepo + "'\n";
  s += "$projectRoot = $PSScriptRoot\n";
  s += "$projectFolder = $PSScriptRoot -replace '\\\\','-' -replace ':','-' -replace '\\.','-'\n";
  s += "$system  = \"$env:USERPROFILE\\.claude\\projects\\$projectFolder\\memory\"\n";
  s += "$claude  = \"$PSScriptRoot\\.claude\"\n\n";
  s += "# Resolve real git.exe (avoids broken App Execution Alias on some machines)\n";
  s += "$gitExe = 'git'\n";
  s += "foreach ($candidate in @(\"$env:ProgramFiles\\Git\\cmd\\git.exe\", \"${env:ProgramFiles(x86)}\\Git\\cmd\\git.exe\")) {\n";
  s += "    if (Test-Path $candidate) { $gitExe = $candidate; break }\n";
  s += "}\n\n";
  s += "function Invoke-Git {\n";
  s += "    $output = & $gitExe @args 2>&1\n";
  s += "    $output | Where-Object { $_ -notmatch 'Failed to write item to store|Not enough memory resources' } | ForEach-Object { Write-Host $_ }\n";
  s += "}\n\n";

  // PULL
  s += "if ($action -eq 'pull') {\n";
  s += "    if (Test-Path \"$system\\.git\") {\n";
  s += "        Push-Location $system\n";
  s += "        $null = (& $gitExe fetch origin 2>&1)\n";
  s += "        $localHead  = & $gitExe rev-parse HEAD 2>&1\n";
  s += "        $remoteHead = & $gitExe rev-parse origin/main 2>&1\n";
  s += "        if ($localHead -eq $remoteHead) {\n";
  s += "            Write-Host 'Memory already up to date.'\n";
  s += "            Pop-Location\n";
  s += "        } else {\n";
  s += "            Write-Host 'Pulling from GitHub...'\n";
  s += "            $stashOut = & $gitExe stash 2>&1\n";
  s += "            $didStash = $stashOut -notmatch 'No local changes'\n";
  s += "            Invoke-Git pull\n";
  s += "            # Auto-resolve conflicts in append-only files\n";
  s += "            $logFiles = @('lessons.md','decisions.md','tasks/skill_scores.md','tasks/skill_usage.md')\n";
  s += "            foreach ($f in $logFiles) {\n";
  s += "                $s = & $gitExe status $f 2>&1\n";
  s += "                if ($s -match 'both modified') {\n";
  s += "                    & $gitExe checkout --theirs $f 2>&1 | Out-Null\n";
  s += "                    & $gitExe add $f 2>&1 | Out-Null\n";
  s += "                }\n";
  s += "            }\n";
  s += "            if (Test-Path '.git/MERGE_HEAD') {\n";
  s += "                & $gitExe commit -m 'Auto-resolve append-only log conflicts' 2>&1 | Out-Null\n";
  s += "            }\n";
  s += "            if ($didStash) { Invoke-Git stash pop }\n";
  s += "            Pop-Location\n";
  s += "        }\n";
  s += "    } else {\n";
  s += "        Write-Host 'Cloning from GitHub...'\n";
  s += "        if (Test-Path $system) { Remove-Item $system -Recurse -Force }\n";
  s += "        Invoke-Git clone $repo $system\n";
  s += "    }\n";
  s += "    # Restore .claude/ folder from repo\n";
  s += "    if (Test-Path \"$system\\claude\") {\n";
  s += "        robocopy \"$system\\claude\" \"$claude\" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null\n";
  s += "    }\n";
  s += "    # Write current [MEM] path\n";
  s += "    [System.IO.File]::WriteAllText(\"$PSScriptRoot\\_mem_path.txt\", $system)\n";
  s += "    Write-Host 'Done - memory, settings and skills ready. Type Start Session.'\n";
  s += "}\n";

  // PUSH
  s += "elseif ($action -eq 'push') {\n";
  s += "    if (-not (Test-Path \"$system\\.git\")) {\n";
  s += "        Write-Host \"ERROR: memory repo not found at $system - run 'memory.ps1 pull' first.\"\n";
  s += "        exit 1\n";
  s += "    }\n";
  s += "    # Copy .claude/ into git repo before pushing\n";
  s += "    New-Item -ItemType Directory -Path \"$system\\claude\" -Force | Out-Null\n";
  s += "    robocopy \"$claude\" \"$system\\claude\" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null\n";
  s += "    Copy-Item \"$PSScriptRoot\\memory.ps1\" \"$system\\memory.ps1\" -Force\n";
  s += "    Push-Location $system -ErrorAction Stop\n";
  s += "    try {\n";
  s += "        Invoke-Git add .\n";
  s += "        $changes = & $gitExe status --short 2>&1\n";
  s += "        if ($changes) {\n";
  s += "            Invoke-Git commit -m \"Memory update $(Get-Date -Format 'yyyy-MM-dd')\"\n";
  s += "            Invoke-Git pull --no-rebase origin main\n";
  s += "            Invoke-Git push\n";
  s += "        } else {\n";
  s += "            Write-Host 'Nothing to commit - memory already up to date.'\n";
  s += "        }\n";
  s += "    } finally {\n";
  s += "        Pop-Location\n";
  s += "    }\n";
  s += "    Write-Host 'Done - memory, settings and skills pushed to GitHub.'\n";
  s += "}\n";
  s += "else {\n";
  s += "    Write-Host 'Usage: .\\memory.ps1 pull   or   .\\memory.ps1 push'\n";
  s += "}\n";

  return s;
}

// --- One-Time Setup Script ---

function generateSetupScript(body) {
  var ghUser = body.githubUser || 'YOUR_GITHUB_USER';
  var projName = body.projectName || 'my-project';

  var s = "# " + projName + " - One-time setup\n";
  s += "# Run this once after downloading the Clankbrain zip.\n";
  s += "# Requires: git, gh (GitHub CLI) authenticated\n\n";
  s += "$ProjectName = '" + projName + "'\n";
  s += "$GitHubUser  = '" + ghUser + "'\n";
  s += "$ProjectRoot = $PSScriptRoot  # folder where this script + .claude/ live\n\n";

  s += "Write-Host 'Setting up $ProjectName...' -ForegroundColor Cyan\n\n";

  s += "# 1. Init code repo (if not already a git repo)\n";
  s += "if (-not (Test-Path \"$ProjectRoot\\.git\")) {\n";
  s += "    git -C $ProjectRoot init\n";
  s += "    Write-Host 'Initialized git repo.'\n";
  s += "}\n\n";

  s += "# 2. Create GitHub code repo (skip if exists)\n";
  s += "$repoCheck = gh repo view \"$GitHubUser/$ProjectName\" 2>&1\n";
  s += "if ($LASTEXITCODE -ne 0) {\n";
  s += "    gh repo create \"$GitHubUser/$ProjectName\" --private --source $ProjectRoot --push\n";
  s += "    Write-Host 'Created GitHub repo: $GitHubUser/$ProjectName'\n";
  s += "} else {\n";
  s += "    Write-Host 'GitHub repo already exists: $GitHubUser/$ProjectName'\n";
  s += "    git -C $ProjectRoot remote add origin \"https://github.com/$GitHubUser/$ProjectName.git\" 2>$null\n";
  s += "}\n\n";

  s += "# 3. Create GitHub memory repo (skip if exists)\n";
  s += "$memRepoCheck = gh repo view \"$GitHubUser/$ProjectName-memory\" 2>&1\n";
  s += "if ($LASTEXITCODE -ne 0) {\n";
  s += "    gh repo create \"$GitHubUser/$ProjectName-memory\" --private\n";
  s += "    Write-Host 'Created GitHub memory repo: $GitHubUser/$ProjectName-memory'\n";
  s += "} else {\n";
  s += "    Write-Host 'Memory repo already exists: $GitHubUser/$ProjectName-memory'\n";
  s += "}\n\n";

  s += "# 4. Pull memory (clones on first run, sets up local memory folder)\n";
  s += "powershell -NoProfile -ExecutionPolicy Bypass -File \"$ProjectRoot\\memory.ps1\" pull\n\n";

  s += "# 5. Initial commit of .claude/ folder\n";
  s += "git -C $ProjectRoot add .claude/ memory.ps1\n";
  s += "git -C $ProjectRoot commit -m 'Initial Clankbrain setup'\n";
  s += "git -C $ProjectRoot push -u origin main 2>$null\n";
  s += "if ($LASTEXITCODE -ne 0) {\n";
  s += "    git -C $ProjectRoot push -u origin master 2>$null\n";
  s += "}\n\n";

  s += "# 6. Push initial memory\n";
  s += "powershell -NoProfile -ExecutionPolicy Bypass -File \"$ProjectRoot\\memory.ps1\" push\n\n";

  s += "Write-Host ''\n";
  s += "Write-Host 'Setup complete!' -ForegroundColor Green\n";
  s += "Write-Host 'Next: cd to your project folder, run claude, and say Start Session.'\n";
  s += "Write-Host 'On first Start Session, scan-codebase will auto-generate project-specific rules.'\n";

  return s;
}
