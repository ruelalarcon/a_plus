# Grade Calculator App (A+Plus)

A web application for students to track course grades, share grade calculation templates, and manage course prerequisites.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with:
   ```
   NODE_ENV=development # options: production, development, test
   # Note: don't use production unless deploying on a site with valid SSL certificates, etc.

   PORT=3000
   SESSION_SECRET=your-secret-key-here
   ```
   An example .env file is given (env.example)

3. Start development server:
   ```bash
   npm run dev
   ```
   This will build the frontend and start the server.

4. Access the app at http://localhost:3000

5. See self-documented API sandbox at http://localhost:3000/graphql

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
    users.test.js         # User endpoint tests
    test-helpers.js       # Helper functions for tests
    setup.js              # Setup for individual test files
frontend/
  __tests__/              # Frontend test files
    utils/
      gradeCalculations.test.js  # Tests for grade calculation utilities
      courseSorting.test.js      # Tests for course sorting utilities
jest.config.js            # Jest configuration
jest.setup.js             # Global test setup and teardown
babel.config.js           # Babel configuration for testing
```

The test suite covers both backend API endpoints and frontend utility functions.

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
- Track credit hours for each course
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
- courses: id, user_id, name, credits, completed, created_at
- course_prerequisites: course_id, prerequisite_id

#### API Architecture

The application uses GraphQL for its API, providing a single endpoint for all operations:

- `POST /graphql`
  - All data operations are performed through this endpoint
  - Accepts GraphQL queries and mutations in the request body
  - Authentication is managed through sessions

GraphQL Schema includes:

**Queries:**
- `me`: Get the current logged-in user's ID and username
- `user(id: ID!)`: Get a specific user by ID, returns user details
- `calculator(id: ID!)`: Get a specific calculator with its assessments, min_desired_grade, and associated template
- `template(id: ID!)`: Get a specific template with assessments, creator details, and voting information
- `allTemplates(query: String, term: String, year: Int, institution: String, page: Int, limit: Int)`: Search and filter templates with pagination
- `course(id: ID!)`: Get a specific course with its name, credits, completion status, and prerequisites
- `templateComments(templateId: ID!)`: Get all comments for a specific template with author information
- `health`: Simple health check endpoint

**Mutations:**
- **Authentication:**
  - `register(username: String!, password: String!)`: Register a new user, returns user details
  - `login(username: String!, password: String!)`: Log in a user, returns user details
  - `logout`: Log out the current user, returns success boolean
- **Calculators:**
  - `createCalculator(name: String!, min_desired_grade: Float)`: Create a calculator with optional minimum grade
  - `updateCalculator(id: ID!, name: String, min_desired_grade: Float, assessments: [AssessmentInput!])`: Update calculator details and assessments
  - `deleteCalculator(id: ID!)`: Delete a calculator, returns success boolean
- **Templates:**
  - `createTemplate(name: String!, term: String!, year: Int!, institution: String!, assessments: [TemplateAssessmentInput!]!)`: Create a shareable calculator template
  - `deleteTemplate(id: ID!)`: Soft delete a template (only owner can delete)
  - `useTemplate(templateId: ID!)`: Create a personal calculator from a template
  - `voteTemplate(templateId: ID!, vote: Int!)`: Vote on a template (1 for upvote, -1 for downvote)
  - `removeTemplateVote(templateId: ID!)`: Remove vote from a template
- **Courses:**
  - `createCourse(name: String!, credits: Float!, prerequisiteIds: [ID!])`: Create a course with optional prerequisites
  - `updateCourse(id: ID!, name: String, credits: Float, completed: Boolean, prerequisiteIds: [ID!])`: Update course details and prerequisites
  - `deleteCourse(id: ID!)`: Delete a course, returns success boolean
- **Comments:**
  - `addTemplateComment(templateId: ID!, content: String!)`: Add a comment to a template
  - `updateTemplateComment(commentId: ID!, content: String!)`: Update a comment (only author can update)
  - `deleteTemplateComment(commentId: ID!)`: Delete a comment (only author can delete)

## External Modules

This project relies on several external dependencies:

### Production Dependencies
- **@apollo/client**: GraphQL client for frontend
- **@apollo/server**: GraphQL server implementation
- **bcrypt**: Password hashing and verification
- **better-sqlite3**: SQLite database driver
- **dotenv**: Environment variable management
- **express**: Web application framework
- **express-session**: Session middleware for authentication
- **graphql**: GraphQL implementation
- **lodash**: Utility library
- **svelte-routing**: Client-side routing
- **winston**: Logging library

### Development Dependencies
- **@sveltejs/vite-plugin-svelte**: Vite plugin for Svelte
- **tailwindcss** and plugins: CSS framework
- **jest**: Testing framework
- **supertest**: HTTP assertion library
- **svelte**: Component framework
- **svelte-sonner**: Toast notifications
- **vite**: Build tool and development server
- Additional utilities: bits-ui, clsx, tailwind-merge, tailwind-variants

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
- Credit hours are tracked for each course