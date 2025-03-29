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

// ----- Course mutations ----- //
export const CREATE_COURSE = /* GraphQL */ `
  mutation CreateCourse(
    $name: String!
    $credits: Float!
    $prerequisiteIds: [ID!]
  ) {
    createCourse(
      name: $name
      credits: $credits
      prerequisiteIds: $prerequisiteIds
    ) {
      id
      name
      credits
      completed
      prerequisites {
        id
        name
        credits
        completed
      }
    }
  }
`;

export const UPDATE_COURSE = /* GraphQL */ `
  mutation UpdateCourse(
    $id: ID!
    $name: String
    $credits: Float
    $completed: Boolean
    $prerequisiteIds: [ID!]
  ) {
    updateCourse(
      id: $id
      name: $name
      credits: $credits
      completed: $completed
      prerequisiteIds: $prerequisiteIds
    ) {
      id
      name
      credits
      completed
      prerequisites {
        id
        name
        credits
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

// ----- Calculator mutations ----- //
export const CREATE_CALCULATOR = /* GraphQL */ `
  mutation CreateCalculator($name: String!, $minDesiredGrade: Float) {
    createCalculator(name: $name, min_desired_grade: $minDesiredGrade) {
      id
      name
      min_desired_grade
    }
  }
`;

export const UPDATE_CALCULATOR = /* GraphQL */ `
  mutation UpdateCalculator(
    $id: ID!
    $name: String
    $minDesiredGrade: Float
    $assessments: [AssessmentInput!]
  ) {
    updateCalculator(
      id: $id
      name: $name
      min_desired_grade: $minDesiredGrade
      assessments: $assessments
    ) {
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
  mutation CreateTemplate(
    $name: String!
    $term: String!
    $year: Int!
    $institution: String!
    $assessments: [TemplateAssessmentInput!]!
  ) {
    createTemplate(
      name: $name
      term: $term
      year: $year
      institution: $institution
      assessments: $assessments
    ) {
      id
      name
      term
      year
      institution
      assessments {
        id
        name
        weight
      }
    }
  }
`;

export const USE_TEMPLATE = /* GraphQL */ `
  mutation UseTemplate($templateId: ID!) {
    useTemplate(templateId: $templateId) {
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

export const DELETE_TEMPLATE = /* GraphQL */ `
  mutation DeleteTemplate($id: ID!) {
    deleteTemplate(id: $id)
  }
`;

// ----- Comment mutations ----- //
export const ADD_TEMPLATE_COMMENT = /* GraphQL */ `
  mutation AddTemplateComment($templateId: ID!, $content: String!) {
    addTemplateComment(templateId: $templateId, content: $content) {
      id
      content
      created_at
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
      updated_at
    }
  }
`;

export const DELETE_TEMPLATE_COMMENT = /* GraphQL */ `
  mutation DeleteTemplateComment($commentId: ID!) {
    deleteTemplateComment(commentId: $commentId)
  }
`;
