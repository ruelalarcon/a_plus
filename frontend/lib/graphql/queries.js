/**
 * Collection of GraphQL queries
 */

// ----- User queries ----- //
export const ME = /* GraphQL */ `
  query Me {
    me {
      id
      username
    }
  }
`;

export const USER = /* GraphQL */ `
  query User($id: ID!) {
    user(id: $id) {
      id
      username
    }
  }
`;

// ----- Calculator queries ----- //
export const CALCULATOR = /* GraphQL */ `
  query Calculator($id: ID!) {
    calculator(id: $id) {
      id
      name
      min_desired_grade
      created_at
      template_id
      assessments {
        id
        name
        weight
        grade
      }
      template {
        id
        name
        term
        year
        institution
      }
    }
  }
`;

export const MY_CALCULATORS = `
  query MyCalculators {
    myCalculators {
      id
      name
      min_desired_grade
      created_at
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

// ----- Template queries ----- //
export const TEMPLATE = /* GraphQL */ `
  query Template($id: ID!) {
    template(id: $id) {
      id
      name
      term
      year
      institution
      vote_count
      user_vote
      deleted
      created_at
      creator {
        id
        username
      }
      assessments {
        id
        name
        weight
      }
    }
  }
`;

export const ALL_TEMPLATES = /* GraphQL */ `
  query AllTemplates($query: String, $term: String, $year: Int, $institution: String, $page: Int, $limit: Int) {
    allTemplates(query: $query, term: $term, year: $year, institution: $institution, page: $page, limit: $limit) {
      templates {
        id
        name
        term
        year
        institution
        vote_count
        user_vote
        creator {
          id
          username
        }
      }
      total
      page
      limit
    }
  }
`;

export const MY_TEMPLATES = /* GraphQL */ `
  query MyTemplates {
    myTemplates {
      id
      name
      term
      year
      institution
      vote_count
      user_vote
      created_at
      creator {
        id
        username
      }
    }
  }
`;

export const TEMPLATE_COMMENTS = /* GraphQL */ `
  query TemplateComments($templateId: ID!) {
    templateComments(templateId: $templateId) {
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

// ----- Course queries ----- //
export const COURSE = /* GraphQL */ `
  query Course($id: ID!) {
    course(id: $id) {
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

export const MY_COURSES = /* GraphQL */ `
  query MyCourses {
    myCourses {
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
