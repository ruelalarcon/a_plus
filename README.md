# Grade Calculator App

A web application for students to track course grades, share grade calculation templates, and manage course prerequisites.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create .env file with:
   ```
   SESSION_SECRET=your_secret_here
   PORT=3000
   ```
   An example .env file is given (env.example)

3. Initialize database:
   ```bash
   # The database file will be created automatically at server/database.sqlite
   # Tables are created on first server start
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Access app at http://localhost:3000

## Project Structure

```
frontend/
  components/     # Reusable UI components
  routes/         # Page components
  lib/            # Utilities and stores
  App.svelte      # Main app component
  main.js         # Entry point
server/
  server.js       # Express server
  db.js           # Database setup
  database.sqlite # SQLite database
  package.json    # Node dependencies
  vite.config.js  # Vite configuration
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
- calculators: id, user_id, name, template_id, created_at
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
  - Each calculator includes: id, name, assessments[]
- POST /api/calculators
  - Body: { name }
  - Returns: { id, name }
- GET /api/calculators/:id
  - Returns calculator with assessments and template info if based on template
- PUT /api/calculators/:id
  - Body: { name } or { assessments: [{name, weight, grade}] }
  - Can update name or assessments separately
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

## Key Behaviors

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

## Frontend Component Details

### Card.svelte
- Reusable card layout component
- Props:
  - title: string
  - details: string[]
  - showActions: boolean
  - extraContent: any
- Slots:
  - actions: buttons/links
  - extra: expandable content

### VoteButtons.svelte
- Handles template voting UI
- Props:
  - voteCount: number
  - userVote: -1 | 0 | 1
  - creatorId: number
  - onVote: (vote: number) => void
- Disables and visually indicates when user is creator

### Comments.svelte
- Manages template comments
- Features:
  - Add/edit/delete comments
  - Shows username and timestamp
  - Real-time updates
  - Edit/delete only for comment author

### CourseTracker.svelte
- Visualizes course prerequisites
- Features:
  - Add/edit/delete courses
  - Set prerequisites
  - Mark completion status
  - Automatic level calculation
  - Prevents circular dependencies

## State Management

The app uses Svelte stores for global state:
- userId: Current user's ID or null
- username: Current username or null
- checkLoginStatus(): Async function to verify session

## Error Handling

Backend:
- Authentication errors: 401 Unauthorized
- Permission errors: 403 Forbidden
- Not found: 404 Not Found
- Validation errors: 400 Bad Request
- Database errors: 500 Internal Server Error

Frontend:
- Failed requests show alert messages
- Form validation prevents invalid submissions
- Loading states prevent premature interactions
- Error boundaries catch rendering errors

## Database Transactions

The app uses SQLite transactions for operations that require multiple updates:
- Template creation (template + vote + assessments)
- Template voting (vote record + vote count)
- Calculator deletion (assessments + calculator)
- Course updates (course + prerequisites)

## Security Considerations

- Passwords are hashed with bcrypt
- Session cookies for authentication
- SQL injection prevention via prepared statements
- CSRF protection via same-origin policy
- Input validation on all endpoints
- Resource ownership verification
