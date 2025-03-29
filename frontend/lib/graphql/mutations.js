/**
 * Collection of GraphQL mutations
 */

// ----- Auth mutations ----- //
export const REGISTER = /* GraphQL */ `
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      id
      username
    }
  }
`;

export const LOGIN = /* GraphQL */ `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
    }
  }
`;

export const LOGOUT = /* GraphQL */ `
  mutation Logout {
    logout
  }
`;

// ----- Calculator mutations ----- //
export const CREATE_CALCULATOR = /* GraphQL */ `
  mutation CreateCalculator($name: String!, $min_desired_grade: Float) {
    createCalculator(name: $name, min_desired_grade: $min_desired_grade) {
      id
      name
      min_desired_grade
      created_at
      assessments {
        id
        name
        weight
        grade
      }
    }
  }
`;

export const UPDATE_CALCULATOR = /* GraphQL */ `
  mutation UpdateCalculator($id: ID!, $name: String, $min_desired_grade: Float, $assessments: [AssessmentInput!]) {
    updateCalculator(id: $id, name: $name, min_desired_grade: $min_desired_grade, assessments: $assessments) {
      id
      name
      min_desired_grade
      assessments {
        id
        name
        weight
        grade
      }
    }
  }
`;

export const DELETE_CALCULATOR = /* GraphQL */ `
  mutation DeleteCalculator($id: ID!) {
    deleteCalculator(id: $id)
  }
`;

// ----- Template mutations ----- //
export const CREATE_TEMPLATE = /* GraphQL */ `
  mutation CreateTemplate($name: String!, $term: String!, $year: Int!, $institution: String!, $assessments: [TemplateAssessmentInput!]!) {
    createTemplate(name: $name, term: $term, year: $year, institution: $institution, assessments: $assessments) {
      id
      name
      term
      year
      institution
      vote_count
      created_at
      assessments {
        id
        name
        weight
      }
    }
  }
`;

export const DELETE_TEMPLATE = /* GraphQL */ `
  mutation DeleteTemplate($id: ID!) {
    deleteTemplate(id: $id)
  }
`;

export const USE_TEMPLATE = /* GraphQL */ `
  mutation UseTemplate($templateId: ID!) {
    useTemplate(templateId: $templateId) {
      id
      name
      template_id
      assessments {
        id
        name
        weight
        grade
      }
    }
  }
`;

export const VOTE_TEMPLATE = /* GraphQL */ `
  mutation VoteTemplate($templateId: ID!, $vote: Int!) {
    voteTemplate(templateId: $templateId, vote: $vote) {
      id
      vote_count
      user_vote
    }
  }
`;

export const REMOVE_TEMPLATE_VOTE = /* GraphQL */ `
  mutation RemoveTemplateVote($templateId: ID!) {
    removeTemplateVote(templateId: $templateId) {
      id
      vote_count
      user_vote
    }
  }
`;

// ----- Course mutations ----- //
export const CREATE_COURSE = /* GraphQL */ `
  mutation CreateCourse($name: String!, $prerequisiteIds: [ID!]) {
    createCourse(name: $name, prerequisiteIds: $prerequisiteIds) {
      id
      name
      completed
      created_at
      prerequisites {
        id
        name
        completed
      }
    }
  }
`;

export const UPDATE_COURSE = /* GraphQL */ `
  mutation UpdateCourse($id: ID!, $name: String, $completed: Boolean, $prerequisiteIds: [ID!]) {
    updateCourse(id: $id, name: $name, completed: $completed, prerequisiteIds: $prerequisiteIds) {
      id
      name
      completed
      prerequisites {
        id
        name
        completed
      }
    }
  }
`;

export const DELETE_COURSE = /* GraphQL */ `
  mutation DeleteCourse($id: ID!) {
    deleteCourse(id: $id)
  }
`;

// ----- Template comment mutations ----- //
export const ADD_TEMPLATE_COMMENT = /* GraphQL */ `
  mutation AddTemplateComment($templateId: ID!, $content: String!) {
    addTemplateComment(templateId: $templateId, content: $content) {
      id
      content
      created_at
      updated_at
      author {
        id
        username
      }
    }
  }
`;

export const UPDATE_TEMPLATE_COMMENT = /* GraphQL */ `
  mutation UpdateTemplateComment($commentId: ID!, $content: String!) {
    updateTemplateComment(commentId: $commentId, content: $content) {
      id
      content
      created_at
      updated_at
      author {
        id
        username
      }
    }
  }
`;

export const DELETE_TEMPLATE_COMMENT = /* GraphQL */ `
  mutation DeleteTemplateComment($commentId: ID!) {
    deleteTemplateComment(commentId: $commentId)
  }
`;
