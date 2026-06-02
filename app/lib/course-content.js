export const moduleIds = ["sqli", "xss", "csrf", "xxe"];

export const defaultCourseContents = {
  sqli: {
    moduleId: "sqli",
    title: "SQL Injection",
    shortTitle: "SQLi",
    description: "Database query manipulation through unsafe user input.",
    labPath: "/learn/sqli/lablist",
    quizPath: "/quiz/sqli-module",
    published: true,
    sections: [
      {
        id: "intro",
        label: "What is SQLi?",
        heading: "What is SQL Injection?",
        body: "SQL Injection (SQLi) is a vulnerability that occurs when an attacker can interfere with the queries an application makes to its database. It may allow the attacker to view, modify, or delete data they should not be able to access.",
      },
      {
        id: "impact",
        label: "Impact",
        heading: "Impact",
        body: "A successful SQL injection attack can expose passwords, payment information, personal data, and internal application records. In severe cases, attackers can alter database content or bypass authentication.",
      },
      {
        id: "types",
        label: "Types",
        heading: "Types of SQLi",
        items: [
          {
            title: "In-band SQLi",
            body: "The attacker uses the same channel to launch the attack and receive results.",
          },
          {
            title: "Blind SQLi",
            body: "The attacker infers information from response differences, timing, or errors.",
          },
          {
            title: "Out-of-band SQLi",
            body: "The attacker relies on database network features such as DNS or HTTP callbacks.",
          },
        ],
      },
      {
        id: "example",
        label: "Example",
        heading: "Example Query",
        codeLabel: "-- Injected query",
        code: "SELECT * FROM users WHERE username = 'admin' OR '1'='1';",
      },
      {
        id: "prevention",
        label: "Prevention",
        heading: "Prevention",
        cards: [
          {
            title: "Prepared Statements",
            body: "Parameterized queries keep user input separate from executable SQL.",
            tone: "green",
          },
          {
            title: "Input Validation",
            body: "Allow only expected values, formats, and ranges before querying.",
            tone: "blue",
          },
        ],
      },
      {
        id: "video",
        label: "Video",
        heading: "Video Tutorial",
        videoUrl: "https://www.youtube.com/embed/ciNHn38EyRc",
      },
      {
        id: "quiz",
        label: "Quiz",
        heading: "Quick Check",
        quizQuestion: "What does SQL Injection primarily target?",
        quizOptions: [
          "Frontend UI components",
          "Database queries and structure",
          "Client-side CSS styling",
        ],
      },
    ],
    labs: [
      {
        id: "lab1",
        title: "SQL injection vulnerability in WHERE clause allowing retrieval of hidden data",
        level: "Beginner",
        summary: "Exploit a vulnerable category filter to reveal hidden products.",
        objective: "Modify the category query so the shop displays unreleased products.",
        starterCode: "?category=Football' OR 1=1--",
        solutionSteps: [
          "Open the lab shop page.",
          "Select a product category.",
          "Add the SQL injection payload to the category parameter.",
          "Submit the request and confirm hidden products are visible.",
        ],
        defenseNote: "Use parameterized queries and avoid building SQL with string concatenation.",
      },
      {
        id: "lab2",
        title: "SQL injection vulnerability allowing login bypass",
        level: "Beginner",
        summary: "Practice bypassing a login query with unsafe input.",
        objective: "Use a payload that changes the login query logic.",
        solutionSteps: [
          "Find the login form.",
          "Test how username input affects the query.",
          "Submit a payload that makes the condition always true.",
        ],
        defenseNote: "Parameterized authentication queries prevent input from changing query logic.",
      },
    ],
  },
  xss: {
    moduleId: "xss",
    title: "Cross-Site Scripting",
    shortTitle: "XSS",
    description: "Unsafe browser-side script execution through untrusted content.",
    labPath: "/learn/xss/lablist",
    quizPath: "/quiz/xss",
    published: true,
    sections: [
      {
        id: "intro",
        label: "What is XSS?",
        heading: "What is Cross-Site Scripting?",
        body: "Cross-Site Scripting (XSS) happens when an application includes untrusted data in a web page without proper validation or output encoding. An attacker can use it to run JavaScript in another user's browser.",
      },
      {
        id: "impact",
        label: "Impact",
        heading: "Impact",
        body: "XSS can allow attackers to steal session tokens, perform actions as the victim, rewrite page content, capture keystrokes, or redirect users to malicious sites.",
      },
      {
        id: "types",
        label: "Types",
        heading: "Types of XSS",
        items: [
          {
            title: "Reflected XSS",
            body: "The payload is included in a request and immediately reflected in the response.",
          },
          {
            title: "Stored XSS",
            body: "The payload is saved by the application and served to users later.",
          },
          {
            title: "DOM-based XSS",
            body: "Client-side JavaScript writes unsafe data into the page.",
          },
        ],
      },
      {
        id: "example",
        label: "Example",
        heading: "Example Payload",
        codeLabel: "// Unsafe output",
        code: '<div id="message"><script>alert("XSS")</script></div>',
      },
      {
        id: "prevention",
        label: "Prevention",
        heading: "Prevention",
        cards: [
          {
            title: "Output Encoding",
            body: "Encode data for the exact context where it appears.",
            tone: "green",
          },
          {
            title: "Content Security Policy",
            body: "A strong CSP reduces the damage from injected scripts.",
            tone: "blue",
          },
        ],
      },
      {
        id: "video",
        label: "Video",
        heading: "Video Tutorial",
        body: "Add an XSS walkthrough video URL from the admin editor when one is available.",
      },
      {
        id: "quiz",
        label: "Quiz",
        heading: "Quick Check",
        quizQuestion: "What does XSS primarily allow an attacker to do?",
        quizOptions: [
          "Run script in another user's browser",
          "Delete database tables directly",
          "Change the server operating system",
        ],
      },
    ],
    labs: [
      {
        id: "lab1",
        title: "Reflected XSS in an unescaped search result",
        level: "Beginner",
        summary: "A search term is reflected into the page without proper output encoding.",
        objective: "Make the page execute a JavaScript `alert()` by injecting a payload into the search input.",
        starterCode: "<script>alert(1)</script>",
        solutionSteps: [
          "Find a feature that reflects your search term back into the response.",
          "Confirm reflection by searching for a unique string (for example: test-123).",
          "Try a harmless HTML injection (for example: <b>bold</b>) to understand the context.",
          "Submit a simple script payload that fits the context and confirm it executes.",
        ],
        defenseNote: "Encode untrusted data for the specific output context (HTML, attribute, JS string, URL) and consider CSP as a safety net.",
      },
      {
        id: "lab2",
        title: "Stored XSS in a comment feature",
        level: "Beginner",
        summary: "User comments are stored and later rendered without safe HTML handling.",
        objective: "Post a comment that causes JavaScript to run when the comment is viewed.",
        starterCode: "<img src=x onerror=alert(1)>",
        solutionSteps: [
          "Locate a page that displays user-generated comments.",
          "Post a normal comment to confirm it is stored and rendered later.",
          "Post an HTML payload that can execute in the rendering context (for example using an event handler).",
          "Reload the page (or view the content as another user) and confirm the payload runs.",
        ],
        defenseNote: "Store and render comments safely: prefer plain text, or sanitize on input and encode on output. Avoid allowing inline event handlers.",
      },
    ],
  },
  csrf: {
    moduleId: "csrf",
    title: "Cross-Site Request Forgery",
    shortTitle: "CSRF",
    description: "Forged state-changing requests sent by an authenticated browser.",
    labPath: "/learn/csrf/lablist",
    quizPath: "/quiz/csrf",
    published: true,
    sections: [
      {
        id: "intro",
        label: "What is CSRF?",
        heading: "What is Cross-Site Request Forgery?",
        body: "Cross-Site Request Forgery (CSRF) tricks an authenticated user into sending an unwanted request to a website where they are already signed in.",
      },
      {
        id: "impact",
        label: "Impact",
        heading: "Impact",
        body: "CSRF can let attackers change account details, update email addresses, submit forms, make purchases, or trigger privileged actions.",
      },
      {
        id: "conditions",
        label: "Conditions",
        heading: "Conditions for CSRF",
        items: [
          {
            title: "Relevant action",
            body: "The application has a useful action the attacker wants to trigger.",
          },
          {
            title: "Cookie-based session",
            body: "The browser automatically sends session cookies with the request.",
          },
          {
            title: "Predictable request",
            body: "The request does not require a secret token or unpredictable value.",
          },
        ],
      },
      {
        id: "example",
        label: "Example",
        heading: "Example Attack HTML",
        codeLabel: "<!-- Auto-submit forged form -->",
        code: '<form action="https://target.example/account/email" method="POST">\n  <input type="hidden" name="email" value="attacker@example.com" />\n</form>\n<script>document.forms[0].submit()</script>',
      },
      {
        id: "prevention",
        label: "Prevention",
        heading: "Prevention",
        cards: [
          {
            title: "CSRF Tokens",
            body: "Require a unique, secret token for state-changing requests.",
            tone: "green",
          },
          {
            title: "SameSite Cookies",
            body: "Restrict when cookies are sent with cross-site requests.",
            tone: "blue",
          },
        ],
      },
      {
        id: "video",
        label: "Video",
        heading: "Video Tutorial",
        body: "Add a CSRF walkthrough video URL from the admin editor when one is available.",
      },
      {
        id: "quiz",
        label: "Quiz",
        heading: "Quick Check",
        quizQuestion: "Which defense is designed specifically to stop forged state-changing requests?",
        quizOptions: ["Anti-CSRF tokens", "Long CSS class names", "A larger profile photo"],
      },
    ],
    labs: [
      {
        id: "lab1",
        title: "CSRF vulnerability in an email change feature with no defenses",
        level: "Apprentice",
        summary: "Exploit a missing-token email change request.",
        objective: "Build a hidden form that submits an email change request for a logged-in user.",
        starterCode: '<form method="POST" action="/my-account/change-email">\n  <input type="hidden" name="email" value="attacker@example.com" />\n</form>',
        solutionSteps: [
          "Find the email update request.",
          "Confirm no CSRF token is required.",
          "Build a hidden auto-submit form.",
          "Submit it through the exploit server.",
        ],
        defenseNote: "Use server-validated CSRF tokens on state-changing requests.",
      },
      {
        id: "lab2",
        title: "CSRF where token validation depends on request method",
        level: "Apprentice",
        summary: "Bypass weak token validation by changing the request method.",
        objective: "Find a request variant that skips token validation.",
        solutionSteps: [
          "Capture the protected request.",
          "Try alternate HTTP methods.",
          "Confirm the action still succeeds without a valid token.",
        ],
        defenseNote: "Validate CSRF tokens consistently for all state-changing methods.",
      },
    ],
  },
  xxe: {
    moduleId: "xxe",
    title: "XML External Entity Injection",
    shortTitle: "XXE",
    description: "Unsafe XML parser behavior that resolves attacker-controlled entities.",
    labPath: "/learn/xxe/lablist",
    quizPath: "/quiz/xxe",
    published: true,
    sections: [
      {
        id: "intro",
        label: "What is XXE?",
        heading: "What is XML External Entity Injection?",
        body: "XML External Entity (XXE) injection happens when an application parses XML input with external entity processing enabled.",
      },
      {
        id: "impact",
        label: "Impact",
        heading: "Impact",
        body: "XXE can disclose files, reveal credentials, map internal services, trigger server-side request forgery, or cause denial of service.",
      },
      {
        id: "types",
        label: "Types",
        heading: "Types of XXE",
        items: [
          {
            title: "File disclosure",
            body: "External entities read local files and return them in the response.",
          },
          {
            title: "Blind XXE",
            body: "The attacker uses out-of-band DNS or HTTP callbacks.",
          },
          {
            title: "XXE to SSRF",
            body: "The XML parser sends requests to internal network resources.",
          },
        ],
      },
      {
        id: "example",
        label: "Example",
        heading: "Example Payload",
        codeLabel: "<!-- Reads a local file if the parser allows it -->",
        code: '<?xml version="1.0"?>\n<!DOCTYPE user [\n  <!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<user><name>&xxe;</name></user>',
      },
      {
        id: "prevention",
        label: "Prevention",
        heading: "Prevention",
        cards: [
          {
            title: "Disable DTDs",
            body: "Turn off DTDs and external entity resolution in XML parsers.",
            tone: "green",
          },
          {
            title: "Use Safer Formats",
            body: "Prefer simpler formats such as JSON when XML features are not required.",
            tone: "blue",
          },
        ],
      },
      {
        id: "video",
        label: "Video",
        heading: "Video Tutorial",
        body: "Add an XXE parser walkthrough video URL from the admin editor when one is available.",
      },
      {
        id: "quiz",
        label: "Quiz",
        heading: "Quick Check",
        quizQuestion: "Which XML feature is commonly abused in XXE attacks?",
        quizOptions: ["External entities", "CSS media queries", "Browser zoom settings"],
      },
    ],
    labs: [
      {
        id: "lab1",
        title: "XXE file disclosure via external entity",
        level: "Beginner",
        summary: "An XML parser resolves external entities, allowing you to read a local file from the server.",
        objective: "Extract the contents of a server-side file by defining and referencing an external entity.",
        starterCode: '<?xml version="1.0"?>\n<!DOCTYPE root [\n  <!ENTITY xxe SYSTEM \"file:///etc/hostname\">\n]>\n<root>&xxe;</root>',
        solutionSteps: [
          "Identify where the application accepts XML (API endpoint, upload, or profile import).",
          "Confirm that the server parses the XML (for example, by changing a normal field and seeing a response change).",
          "Add a `DOCTYPE` that defines an external entity pointing to a local file.",
          "Reference the entity in the XML body so the parser expands it into the response or stored data.",
        ],
        defenseNote: "Disable DTDs/external entities, use secure parser defaults, and isolate XML processing in a sandboxed environment.",
      },
      {
        id: "lab2",
        title: "XXE to SSRF via external entity",
        level: "Beginner",
        summary: "Abuse external entity resolution to make the server issue a network request you control (server-side request forgery).",
        objective: "Cause the XML parser to fetch an internal URL (or your listener URL) via an external entity.",
        solutionSteps: [
          "Find an XML parsing feature that runs on the server (upload, import, API).",
          "Define an external entity with a `SYSTEM` identifier that points to a URL (for example: http://127.0.0.1:PORT/ or a collaborator/listener).",
          "Reference the entity so it must be resolved during parsing.",
          "Confirm the outbound request using server logs, timing differences, or your listener receiving a hit.",
        ],
        defenseNote: "Block outbound network access from XML parsers, and disable any feature that can resolve external identifiers (DTD, external entities, XInclude).",
      },
    ],
  },
};

export function getDefaultCourseContent(moduleId) {
  return defaultCourseContents[moduleId] || null;
}
