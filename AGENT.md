# AGENTS.md — FinSight AI

## 1. Project Mission

FinSight AI is an AI-powered financial and technology spending intelligence platform being developed for the FNB App of the Year Hackathon 2026.

The goal is to improve the existing application safely and incrementally.

Do not rebuild the application unnecessarily.

---

## 2. Current Technology

### Backend
- Python
- FastAPI
- Uvicorn

### Frontend
- React
- TypeScript
- Vite

### Database
- PostgreSQL
- Supabase

### AI
- Gemini

### Banking Integration
- Investec sandbox/mock environment

### Authentication
- JWT authentication

### Development Environment
- Windows
- PowerShell
- Python virtual environment

Backend:
`127.0.0.1:8000`

Frontend:
`localhost:5173`

---

# 3. NON-NEGOTIABLE RULES

## Rule 1 — Never Guess

Never assume that a file, function, route, table, environment variable, dependency, or feature exists.

Inspect the actual project first.

If something cannot be verified, explicitly say:

> UNVERIFIED — this has not been confirmed from the project.

Never present an assumption as a fact.

---

## Rule 2 — Inspect Before Editing

Before changing code:

1. Locate the relevant files.
2. Read the existing implementation.
3. Understand how it connects to the rest of the application.
4. Identify potential security, database, API, and frontend impact.
5. Make the smallest appropriate change.

Do not edit blindly.

---

## Rule 3 — Protect Working Code

Do not unnecessarily rewrite:

- Authentication
- JWT handling
- Authorization
- Database models
- API routes
- Investec integration
- Gemini integration
- Usage tracking
- Billing logic
- Existing frontend functionality

If the existing implementation works, preserve it.

---

# 4. SECURITY

Never weaken security to make a feature work.

Protected endpoints must remain protected.

Preserve:

- JWT authentication
- User authorization
- Tenant isolation
- Ownership checks
- Input validation
- Usage limits
- API protection
- Password-reset protections
- Webhook signature verification

Never remove authentication because an endpoint is inconvenient to test.

Never expose one user's financial data to another user.

---

# 5. FINANCIAL DATA SAFETY

FinSight deals with financial information.

Never fabricate:

- Account balances
- Transactions
- Transaction amounts
- Usage values
- Billing amounts
- Financial insights
- Bank responses
- Customer information

If data comes from the Investec sandbox/mock environment, identify it as sandbox/mock data.

Do not present mock or sandbox data as real customer banking data.

AI-generated financial explanations must be based on actual data available to the application.

---

# 6. SECRETS

Never expose or hardcode:

- API keys
- JWT secrets
- Database passwords
- SMTP passwords
- Gemini keys
- Investec credentials
- Access tokens
- `.env` values

Never print secrets in logs or test output.

Never commit `.env` files containing secrets.

---

# 7. DATABASE SAFETY

Never perform destructive database operations without explicit approval.

Do NOT:

- Drop tables
- Truncate tables
- Delete production data
- Reset the database
- Replace the database
- Rewrite migrations blindly

Before database changes:

1. Inspect the existing models.
2. Inspect the existing schema/migrations.
3. Understand the relationships.
4. Make the smallest required change.

---

# 8. API SAFETY

Preserve existing API contracts unless a change is explicitly required.

Important existing functionality includes:

- Authentication
- Accounts
- Transactions
- Financial analytics
- Usage
- Billing
- AI insights
- AI assistant
- Investec integration
- Password reset
- Generate functionality
- Webhooks

Before changing an endpoint, inspect both the backend implementation and frontend usage.

Do not change an endpoint just to hide a frontend problem.

---

# 9. FRONTEND RULES

Improve the existing UI instead of rebuilding it.

Prioritize:

- Dashboard
- Accounts
- Transactions
- Usage & Cost
- AI insights
- AI assistant
- Loading states
- Error states
- Empty states
- Responsive design
- Clear financial information
- Consistent ZAR formatting

Do not invent financial figures when real backend data is available.

---

# 10. TESTING

After meaningful code changes:

1. Run targeted tests.
2. Check the affected functionality.
3. Run the broader test suite when appropriate.
4. Inspect the result.

The latest known baseline is:

**28 tests passing**

Do not claim tests pass unless they were actually run.

Do not delete or weaken tests simply to obtain a passing result.

---

# 11. SECURITY VERIFICATION

Distinguish between:

### Source-code protection
The code appears to contain authentication/authorization.

### Runtime verification
The endpoint was actually tested.

### Security testing
Specific security behaviour was tested.

Do not call something "penetration tested" unless penetration testing actually occurred.

Do not claim an endpoint is secure merely because a route contains an authentication dependency.

---

# 12. ANTI-HALLUCINATION POLICY

Every important claim must have evidence.

Preferred evidence:

1. Actual test result
2. Actual API response
3. Actual database result
4. Actual command output
5. Actual source code
6. Project documentation
7. Agent memory
8. General knowledge
9. Guess

Never use a guess as evidence.

For example:

If source code contains:

`POST /investec/sync`

you may say:

> The `/investec/sync` route exists in the source code.

You may NOT automatically say:

> Investec synchronization works.

The second claim requires an actual successful runtime test.

---

# 13. ERROR HANDLING

When something fails:

1. Read the actual error.
2. Identify the affected component.
3. Inspect the relevant code.
4. Determine the likely root cause.
5. Make the smallest fix.
6. Test the fix.

Do not repeatedly make random changes.

Do not hide errors just to make the UI appear successful.

---

# 14. GIT AND BACKUPS

Before risky changes:

- Check the current Git status.
- Review important changes.
- Create a checkpoint/commit when appropriate.

Never use destructive commands such as:

`git reset --hard`

or mass deletion without explicit approval.

Never overwrite large parts of the project when a focused change is sufficient.

---

# 15. CHANGE SIZE

Prefer:

**One problem → one focused change → one verification cycle**

Avoid unrelated refactoring while fixing a specific issue.

Do not "clean up" unrelated files unless requested.

---

# 16. REQUIRED AGENT WORKFLOW

For meaningful tasks, follow this flow:

```text
USER REQUEST
     ↓
INSPECT
     ↓
UNDERSTAND
     ↓
CHECK SECURITY / DATABASE / API IMPACT
     ↓
PLAN
     ↓
MAKE MINIMAL CHANGE
     ↓
TEST
     ↓
VERIFY ACTUAL BEHAVIOUR
     ↓
INSPECT DIFF
     ↓
REPORT RESULTS
```

Never skip directly from the request to large-scale editing.

---

# 17. REPORTING

After completing a task, report:

### Changed
What was actually changed.

### Verified
What was actually tested or observed.

### Not Verified
Anything that still requires testing.

### Risks
Any remaining known risks.

Do not claim success beyond the evidence.

---

# 18. DEFINITION OF DONE

A task is complete only when:

- The requested functionality has been implemented.
- Existing functionality has not been unnecessarily broken.
- Security has not been weakened.
- Relevant tests/checks have been performed.
- Actual behaviour has been verified where possible.
- Remaining limitations are clearly stated.

---

# 19. PRIORITY ORDER

When deciding what to work on, use this order:

1. Security
2. Data integrity
3. Existing functionality
4. Critical bugs
5. Hackathon/demo functionality
6. UI/UX improvements
7. Performance
8. Refactoring
9. Nice-to-have features

Do not prioritize cosmetic improvements over a broken core feature.

---

# 20. FINsight AI PRINCIPLE

The most important principle is:

> BUILD WITH EVIDENCE, NOT ASSUMPTIONS.

Inspect first.

Change carefully.

Test honestly.

Verify before claiming.

Protect the application.