# A+Plus

A social network for students to track course grades, share grade calculation templates, and manage course prerequisites, created by our group for CMPT 370 at the University of Saskatchewan. Built using Svelte, complete with a GraphQL API and Grafana Dashboard.

---

<p align="center">
  <a href="https://www.youtube.com/watch?v=g3X9ubPIK2M" target="_blank">
    <img src="https://i3.ytimg.com/vi/g3X9ubPIK2M/maxresdefault.jpg" alt="A+Plus Overview" width="560"/>
    <br>
    <b>Watch the Overview</b>
  </a>
  <br>
  <br>
  Check out our video overview - one of the deliverables required for the class. In it, we discuss project architecture and design decisions as well as core features.
</p>

## Team Members
- **Ruel Nathaniel Alarcon**
- **Nina Sproule**
- **Parsa Djavaheri**
- **Miguel Espino**
- **Sydney Williamson**

## Table of Contents
- [A+Plus](#aplus)
  - [Table of Contents](#table-of-contents)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Development Setup](#development-setup)
  - [Monitoring with Prometheus and Grafana](#monitoring-with-prometheus-and-grafana)
    - [Metrics Exposed](#metrics-exposed)
    - [Dashboard Features](#dashboard-features)
    - [Custom Metrics](#custom-metrics)
  - [Testing](#testing)
    - [Running Tests](#running-tests)
    - [Test Structure](#test-structure)
  - [Core Features](#core-features)
    - [Grade Calculators](#grade-calculators)
    - [Calculator Templates](#calculator-templates)
    - [Course Tracking](#course-tracking)
  - [Technical Architecture](#technical-architecture)
    - [Frontend (Svelte)](#frontend-svelte)
      - [Key Components](#key-components)
      - [Routes](#routes)
      - [Authentication Flow](#authentication-flow)
    - [Backend (Express + SQLite + GraphQL)](#backend-express--sqlite--graphql)
      - [Database Schema](#database-schema)
      - [API Architecture](#api-architecture)
  - [External Modules](#external-modules)
    - [Production Dependencies](#production-dependencies)
    - [Development Dependencies](#development-dependencies)
  - [Specific Behaviors](#specific-behaviors)
    - [Template Voting](#template-voting)
    - [Template Search Ranking](#template-search-ranking)
    - [Course Prerequisites](#course-prerequisites)

## Quick Start with Docker

The easiest way to run the application is with [Docker Compose](https://docs.docker.com/compose/):

1. Make sure you have Docker and Docker Compose installed on your system.

2. Create a `.env` file with the required environment variables:
   ```
   NODE_ENV=development # options: production, development, test
   # Note: don't use NODE_ENV=production unless deploying on a site with valid SSL certificates, etc.
   PORT=3000
   SESSION_SECRET=your-secret-key-here
   GRAFANA_ADMIN_USER=admin
   GRAFANA_ADMIN_PASSWORD=your-grafana-password-here
   ```
   An example .env file is given (env.example)

   > Note: The NODE_ENV variable determines which database file is used:
   > - development: Uses dev.db
   > - production: Uses prod.db
   > - test: Uses test.db

3. Build and start the complete stack (app, Prometheus, and Grafana):
   ```bash
   docker-compose up
   ```
   or in detached mode:
   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

5. Access Prometheus at http://localhost:9090

6. Access Grafana at http://localhost:3456
   - Default credentials are set in your `.env` file

7. Shut down docker containers using:
   ```bash
   docker-compose down
   ```

To run only the monitoring tools (Prometheus and Grafana) without the app:
```bash
docker-compose -f docker-compose.metrics.yml up -d
```

## Development Setup

If you want to work on the code directly without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the same variables as in the Docker setup.

3. Start development server:
   ```bash
   npm run dev
   ```
   This will build the frontend and start the server.

4. Access the app at http://localhost:3000

5. See self-documented API sandbox at http://localhost:3000/graphql

6. For monitoring, you can start just the monitoring stack:
   ```bash
   docker-compose -f docker-compose.metrics.yml up -d
   ```

## Monitoring with Prometheus and Grafana

The application is set up to export Prometheus metrics that can be visualized in Grafana. The metrics cover HTTP requests, GraphQL operations, active sessions, and system resources.

### Metrics Exposed

- **HTTP Request Metrics**: Request counts, durations, and status codes
- **GraphQL Operation Metrics**: Operation counts by type and name
- **Active User Metrics**: Users who have been active in the last 5 minutes
- **System Metrics**: CPU and memory usage

> Note: The `/metrics` endpoint does not require authentication. The standard for securing this endpoint in production is via [adding authentication](https://betterstack.com/community/questions/set-up-and-secure-prometheus-metrics-endpoints/) to it through your reverse proxy of choice.

### Dashboard Features

The preconfigured Grafana dashboard includes panels for:
- HTTP request rates and latencies
- GraphQL operation counts
- Active users (based on activity within the last 5 minutes)
- Node.js CPU and memory usage

### Custom Metrics

You can add custom metrics to the application by creating new metrics in `server/server.js` using the prom-client library.

## Testing

> Note: Running development tests requires building through the [development setup](#development-setup), not just through the Docker quickstart.

The application includes a comprehensive test suite utilizing Jest unit tests and Cypress E2E integration tests. The tests operate a separate test database to avoid affecting production data.

### Running Tests

1. Run the Jest tests:
   ```bash
   npm test
   ```

2. Run the Cypress tests:
   ```bash
   npm run cypress:run
   ```

3. Optionally, you can view the Cypress tests run yourself:
   ```bash
   npm run cypress:open
   ```
   Then, open E2E test specs, letting you watch each test spec run

4. You're also able to run the project locally but using the test database:
   ```bash
   npm run dev:test
   ```
   The test database clears all data each run so it's easy to test scenarios. Additionally, when on the test database you can go to `/reset` to reset the database, and `/seed` to seed the database with some dummy data.

### Test Structure

```
server/
  __tests__/              # Backend test files
    auth.test.js          # Authentication endpoint tests
    calculators.test.js   # Calculator endpoint tests
    courses.test.js       # Course endpoint tests
    templates.test.js     # Template endpoint tests
    users.test.js         # User endpoint tests
    testHelpers.js       # Helper functions for tests
    setup.js              # Setup for individual test files
frontend/
  __tests__/              # Frontend test files
    utils/
      gradeCalculations.test.js  # Tests for grade calculation utilities
      courseSorting.test.js      # Tests for course sorting utilities
cypress/
  e2e/                    # Cypress E2E integration test specs
    auth.cy.js            # Tests the authentication flow
    calculators.cy.js     # Tests all user stories related to calculators
    commandPalette.cy.js  # Tests all user stories related to the command palette
    courses.cy.js         # Tests all user stories related to the course tracker
    templates.cy.js       # Tests all user stories related to shared templates
jest.config.js            # Jest configuration
jest.setup.js             # Global test setup and teardown
cypress.config.js         # Cypress configuration
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

> It's important that course tracking is a separate feature from grade calculators as users may join the platform partially through university and it would be tedious to retroactively create grade calculators for classes you have already completed just to get accurate credit tracking

## Technical Architecture

### Frontend (Svelte)

#### Key Components
- `App.svelte`: Main router and authentication flow
- `AppShell.svelte`: Main layout component that wraps the application
- `CalculatorCard.svelte`: Calculator item display component
- `CourseCard.svelte`: Course card display component
- `TemplateCard.svelte`: Template display component
- `VoteButtons.svelte`: Template voting interface
- `Comments.svelte`: Template comment system
- `CommentCard.svelte`: Individual comment display component
- `CommentsSheet.svelte`: Slide-out comment panel component
- `CommandPalette.svelte`: Command interface for quick navigation and actions

#### Routes
- `Index.svelte`: Landing page component
- `Login.svelte`: User login page
- `Register.svelte`: User registration page
- `Calculator.svelte`: Calculator editing/viewing page
- `Calculators.svelte`: List of user's calculators
- `Courses.svelte`: Course management and visualization
- `Search.svelte`: Template search interface
- `TemplatePreview.svelte`: Template details view
- `User.svelte`: User profile page

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
- **prom-client**: Prometheus client for Node.js
- **express-prom-bundle**: Express middleware for Prometheus metrics

### Development Dependencies
- **@sveltejs/vite-plugin-svelte**: Vite plugin for Svelte
- **tailwindcss** and plugins: CSS framework
- **jest**: Testing framework
- **cypress**: End-to-end testing framework for integration tests
- **supertest**: HTTP assertion library
- **start-server-and-test**: Allows the server to start before running tests
- **svelte**: Component framework
- **svelte-sonner**: Toast notifications
- **lucide-svelte**: UI icons
- **vite**: Build tool and development server
- Additional utilities: bits-ui, clsx, cmdx-sk, tailwind-merge, tailwind-variants (used for shadcn-svelte)

## Specific Behaviors

### Template Voting
- Users can't vote on their own templates
- Creator's templates start with automatic upvote
- Vote changes update template's total vote count
- Votes can be removed (except creator's upvote)

### Template Search Ranking

Templates on the search page are not simply filtered (meaning, once you create a template you should never have an empty search), they always "show" all the templates paginated, it's just that they are ordered according to the search parameters via the following classifications:

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
