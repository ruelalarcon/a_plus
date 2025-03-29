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
  __tests__/              # Backend test files
    auth.test.js          # Authentication endpoint tests
    calculators.test.js   # Calculator endpoint tests
    courses.test.js       # Course endpoint tests
    templates.test.js     # Template endpoint tests
    test-helpers.js       # Helper functions for tests
    setup.js              # Setup for individual test files
frontend/
  __tests__/              # Frontend test files
    utils/
      gradeCalculations.test.js  # Tests for grade calculation utilities
jest.config.js            # Jest configuration
jest.setup.js             # Global test setup and teardown
babel.config.js           # Babel configuration for testing
```

The test suite covers both backend API endpoints and frontend utility functions:

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

### Backend (Express + SQLite + GraphQL)

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

The application uses GraphQL instead of REST for its API, providing a single endpoint for all operations:

- `POST /graphql`
  - All data operations are performed through this endpoint
  - Accepts GraphQL queries and mutations in the request body
  - Authentication is managed through sessions

GraphQL Schema includes:

**Queries:**
- `me`: Get the current logged-in user
- `user(id: ID!)`: Get a specific user by ID
- `calculator(id: ID!)`: Get a specific calculator
- `myCalculators`: Get all calculators for the current user
- `course(id: ID!)`: Get a specific course
- `myCourses`: Get all courses for the current user
- `health`: Health check endpoint returning "OK"

**Mutations:**
- **Authentication:**
  - `register(username: String!, password: String!)`: Register a new user
  - `login(username: String!, password: String!)`: Log in a user
  - `logout`: Log out the current user

- **Calculators:**
  - `createCalculator(name: String!, min_desired_grade: Float)`: Create a new calculator
  - `updateCalculator(id: ID!, name: String, min_desired_grade: Float, assessments: [AssessmentInput])`: Update calculator
  - `deleteCalculator(id: ID!)`: Delete calculator

- **Courses:**
  - `createCourse(name: String!, prerequisiteIds: [ID])`: Create a new course
  - `updateCourse(id: ID!, name: String, completed: Boolean, prerequisiteIds: [ID])`: Update course
  - `deleteCourse(id: ID!)`: Delete course

- **Templates:**
  - Additional template-related mutations

Schema types are provided in `server/graphql/schema.graphql`

## External Modules

This project relies on several external dependencies to provide core functionality:

### Production Dependencies
- **@apollo/client**: GraphQL client for frontend components
- **@apollo/server**: GraphQL server implementation
- **bcrypt**: Used for password hashing and verification to securely store user credentials
- **better-sqlite3**: SQLite database driver providing a simple, fast interface for database operations
- **dotenv**: Loads environment variables from .env files to manage configuration
- **express**: Web application framework for building the API and server-side routes
- **express-session**: Session middleware for Express to manage user authentication state
- **graphql**: GraphQL implementation for JavaScript
- **lodash**: Utility library providing helper functions for common programming tasks
- **svelte-routing**: Client-side routing library for Svelte applications
- **winston**: Logging library for server logs

### Development Dependencies
- **@babel/preset-env**: Babel preset for transpiling modern JavaScript to compatible versions
- **@sveltejs/vite-plugin-svelte**: Vite plugin for Svelte components integration
- **@tailwindcss**: CSS framework and its plugins
  - **@tailwindcss/container-queries**
  - **@tailwindcss/forms**
  - **@tailwindcss/typography**
- **autoprefixer**: PostCSS plugin to parse CSS and add vendor prefixes
- **bits-ui**: UI component primitives for Svelte
- **clsx**: Utility for constructing className strings
- **jest**: Testing framework for writing and running unit and integration tests
- **lucide-svelte**: Icon library for Svelte
- **mode-watcher**: Library for watching color mode changes
- **supertest**: HTTP assertion library for testing API endpoints
- **svelte**: Component framework for building the user interface
- **svelte-sonner**: Toast notifications for Svelte
- **tailwind-merge**: Utility for merging Tailwind CSS classes
- **tailwind-variants**: Library for creating variants with Tailwind CSS
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