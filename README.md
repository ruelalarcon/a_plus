# Grade Calculator App

A web application for students to track course grades, share grade calculation templates, and manage course prerequisites.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with:
   ```
   NODE_ENV=development # options: production, development, test
   PORT=3000
   SESSION_SECRET=your-secret-key-here
   ```
   An example .env file is given (env.example)

3. Start development server:
   ```bash
   npm run dev
   ```

4. Access the app at http://localhost:3000

## Testing

The application includes a comprehensive test suite using Jest. The tests operate a separate test database to avoid affecting production data.

### Running Tests

1. Create a `.env.test` file (if does not already exist) with:
   ```
   NODE_ENV=test
   SESSION_SECRET=test_secret_key
   PORT=3001
   ```

2. Run the tests:
   ```bash
   npm test
   ```

### Test Structure

```
server/
  __tests__/              # Test files
    auth.test.js          # Authentication endpoint tests
    calculators.test.js   # Calculator endpoint tests
    courses.test.js       # Course endpoint tests
    templates.test.js     # Template endpoint tests
    test-helpers.js       # Helper functions for tests
    setup.js              # Setup for individual test files
  db.config.js            # Database configuration for different environments
jest.config.js            # Jest configuration
jest.setup.js             # Global test setup and teardown
```

## Core Features

### Grade Calculators
- Create personal grade calculators with custom assessments
- Calculate weighted grade averages
- Save and update grades as they come in
- Create calculators from shared templates

### Calculator Templates
- Share grade calculation structures with other students
- Include course name, term, year, and institution
- Upvote/downvote system for community curation
- Comment system for discussions
- Search templates by name, term, year, or institution

### Course Tracking
- Track courses and their prerequisites
- Mark courses as completed
- Visualize course dependencies in levels
- Prevent circular prerequisites

## Technical Architecture

### Frontend (Svelte)

#### Key Components
- `App.svelte`: Main router and authentication flow
- `Card.svelte`: Reusable card component for consistent UI
- `VoteButtons.svelte`: Template voting interface
- `Comments.svelte`: Template comment system
- `CourseTracker.svelte`: Course prerequisite visualization
- `CalculatorList.svelte`: Personal calculator management
- `TemplateList.svelte`: Published template management

#### Authentication Flow
- Unauthenticated users can only access /, /login, /register, and /template/:id
- Template preview redirects to register to capture potential new users
- After authentication, users are redirected to their intended destination
- Authenticated users are redirected from auth pages to dashboard

### Backend (Express + SQLite)

#### Database Schema

Users and Authentication:
- users: id, username, password (hashed)

Grade Calculators:
- calculators: id, user_id, name, template_id, min_desired_grade (decimal), created_at
- assessments: id, calculator_id, name, weight, grade

Templates:
- calculator_templates: id, user_id, name, term, year, institution, vote_count, deleted
- template_assessments: id, template_id, name, weight
- template_votes: template_id, user_id, vote (-1 or 1)
- template_comments: id, template_id, user_id, content, created_at, updated_at

Course Tracking:
- courses: id, user_id, name, completed, created_at
- course_prerequisites: course_id, prerequisite_id

#### API Endpoints

Authentication:
- POST /api/register
  - Body: { username, password }
  - Password must be at least 6 characters
  - Returns: { success: true } or error
- POST /api/login
  - Body: { username, password }
  - Creates session cookie
  - Returns: { success: true } or error
- POST /api/logout
  - Destroys session
- GET /api/user
  - Returns: { userId, username } or 401 if not logged in

Calculators:
- GET /api/calculators
  - Returns array of user's calculators with assessments
  - Each calculator includes: id, name, min_desired_grade, assessments[]
- POST /api/calculators
  - Body: { name, min_desired_grade? }
  - min_desired_grade is optional decimal value
  - Returns: { id, name, min_desired_grade }
- GET /api/calculators/:id
  - Returns calculator with assessments and template info if based on template
- PUT /api/calculators/:id
  - Body: { name? } or { min_desired_grade? } or { assessments: [{name, weight, grade}] }
  - Can update name, min_desired_grade, or assessments separately
- DELETE /api/calculators/:id
  - Deletes calculator and its assessments

Templates:
- POST /api/templates
  - Body: { name, term, year, institution, assessments: [{name, weight}] }
  - Creates template and adds creator's upvote
  - Returns: { id }
- GET /api/templates/search
  - Query params: query, term, year, institution, page, limit
  - Returns: { templates[], total, page, limit }
  - Templates include vote status and creator info
- POST /api/templates/:id/use
  - Creates new calculator from template
  - Copies assessment structure without grades
  - Returns: { id } of new calculator
- POST /api/templates/:id/vote
  - Body: { vote: 1 or -1 }
  - Updates vote count atomically
  - Returns: { vote_count, user_vote }
- GET /api/templates/:id/comments
  - Returns array of comments with usernames and timestamps
  - Ordered by creation date descending
  - Each comment includes: id, content, username, created_at, updated_at
- POST /api/templates/:id/comments
  - Body: { content }
  - Content cannot be empty
  - Returns new comment with username and timestamps
  - Automatically associates with current user
- PUT /api/templates/:id/comments/:commentId
  - Body: { content }
  - Can only edit own comments
  - Content cannot be empty
  - Returns updated comment with new updated_at timestamp
- DELETE /api/templates/:id/comments/:commentId
  - Can only delete own comments
  - Returns success message
  - Permanently removes comment

Courses:
- GET /api/courses
  - Returns array of courses with prerequisites
  - Courses include completion status
- POST /api/courses
  - Body: { name, prerequisiteIds: [] }
  - Returns new course with prerequisites
- PUT /api/courses/:id
  - Body: { name?, completed?, prerequisiteIds? }
  - Can update fields independently
  - Returns updated course with prerequisites

## External Modules

This project relies on several external dependencies to provide core functionality:

### Production Dependencies
- **bcrypt**: Used for password hashing and verification to securely store user credentials
- **better-sqlite3**: SQLite database driver providing a simple, fast interface for database operations
- **dotenv**: Loads environment variables from .env files to manage configuration
- **express**: Web application framework for building the API and server-side routes
- **express-session**: Session middleware for Express to manage user authentication state
- **lodash**: Utility library providing helper functions for common programming tasks
- **svelte-routing**: Client-side routing library for Svelte applications

### Development Dependencies
- **@babel/preset-env**: Babel preset for transpiling modern JavaScript to compatible versions
- **@sveltejs/vite-plugin-svelte**: Vite plugin for Svelte components integration
- **jest**: Testing framework for writing and running unit and integration tests
- **supertest**: HTTP assertion library for testing API endpoints
- **svelte**: Component framework for building the user interface
- **vite**: Build tool and development server offering fast development experience

## Specific Behaviors

### Template Voting
- Users can't vote on their own templates
- Creator's templates start with automatic upvote
- Vote changes update template's total vote count
- Votes can be removed (except creator's upvote)

### Template Search Ranking
1. Number of matching fields (name, term, year, institution)
2. Institution match priority
3. Name match priority
4. Term match priority
5. Vote count (descending)
6. Creation date (most recent first)

### Course Prerequisites
- Courses are displayed in levels based on dependencies
- A course appears after all its prerequisites
- Prevents circular dependencies
- Prerequisites must be completed before dependent courses