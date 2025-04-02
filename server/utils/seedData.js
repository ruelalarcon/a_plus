/**
 * Database seeding utilities for testing
 * Contains seed data and functions to populate the test database
 */

import bcrypt from "bcrypt";
import db from "../db.js";
import { createLogger } from "./logger.js";

const seedLogger = createLogger("seed-data");

// Predefined seed for deterministic random number generation
let seed = 12345;

/**
 * Simple LCG which returns a random number based on a global seed
 * @returns {number}
 */
function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

// Example institutions for templates
const institutions = [
  "University of Saskatchewan",
  "Stanford University",
  "MIT",
  "Harvard University",
  "University of Toronto",
  "University of British Columbia",
  "University of Alberta",
  "University of Calgary",
  "McGill University",
  "University of Waterloo",
];

// Example course names and their typical credits
const courseTemplates = [
  { name: "CMPT 370: Intermediate Software Engineering", credits: 3 },
  { name: "CMPT 332: Operating Systems", credits: 3 },
  { name: "CMPT 280: Data Structures and Algorithms", credits: 3 },
  { name: "CMPT 353: Data Science", credits: 3 },
  { name: "CMPT 481: Human-Computer Interaction", credits: 3 },
  { name: "MATH 110: Calculus I", credits: 3 },
  { name: "MATH 116: Calculus II", credits: 3 },
  { name: "MATH 266: Linear Algebra II", credits: 3 },
  { name: "PHYS 115: Physics I", credits: 3 },
  { name: "PHYS 117: Physics II", credits: 3 },
  { name: "CHEM 112: General Chemistry I", credits: 3 },
  { name: "CHEM 115: General Chemistry II", credits: 3 },
  { name: "BIOL 120: The Nature of Life", credits: 3 },
  { name: "BIOL 224: Animal Body Systems", credits: 3 },
  { name: "PHIL 120: Introduction to Logic and Critical Thinking", credits: 3 },
  { name: "ENG 114: Literature and Composition", credits: 3 },
];

// Example assessment templates with realistic weights and names
const assessmentTemplatesByType = {
  standard: [
    { name: "Midterm 1", weight: 20 },
    { name: "Midterm 2", weight: 20 },
    { name: "Final Exam", weight: 40 },
    { name: "Assignments", weight: 20 },
  ],
  project_heavy: [
    { name: "Midterm", weight: 20 },
    { name: "Final Exam", weight: 30 },
    { name: "Team Project", weight: 30 },
    { name: "Labs", weight: 20 },
  ],
  lab_based: [
    { name: "Lab Reports", weight: 30 },
    { name: "Midterm", weight: 25 },
    { name: "Final Exam", weight: 30 },
    { name: "Participation", weight: 15 },
  ],
  assignment_heavy: [
    { name: "Weekly Assignments", weight: 40 },
    { name: "Midterm", weight: 25 },
    { name: "Final Exam", weight: 35 },
  ],
  final_focused: [
    { name: "Quizzes", weight: 15 },
    { name: "Assignments", weight: 20 },
    { name: "Midterm", weight: 15 },
    { name: "Final Project", weight: 10 },
    { name: "Final Exam", weight: 40 },
  ],
};

// Example terms
const terms = ["Fall", "Winter", "Spring", "Summer"];

// Example years
const years = [2022, 2023, 2024];

// Example template comments
const templateComments = [
  "This template was accurate to the syllabus. Very helpful!",
  "Whatever you do, do NOT take this class with Professor John Doe, he does not teach the class well.",
  "I would recommend adding a section for participation marks which was 5% in my class.",
  "Anyone know if this is a good class? Based on the template, it seems like the final isn't worth too much.",
  "The professor changed the weights slightly this year. Go to my profile for the updated version.",
  "I'm not sure if it's just a skill issue but this class was really hard.",
  "This is exactly how my instructor weighted the assessments.",
];

/**
 * Seeds the database with test data
 * Creates users, calculators, templates, courses, and their relationships
 *
 * @returns {Object} Summary of created records
 * @throws {Error} If seeding fails
 */
export async function seedDatabase() {
  const summary = {
    users: 0,
    calculators: 0,
    templates: 0,
    template_assessments: 0,
    assessments: 0,
    courses: 0,
    prerequisites: 0,
    comments: 0,
    votes: 0,
  };

  try {
    // Create test users with different usernames
    const users = [];
    const demoUsernames = [
      "admin",
      "student1",
      "professor",
      "ta_assistant",
      "guest_user",
    ];

    // Add demo users with consistent passwords
    for (const username of demoUsernames) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const result = db
        .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
        .run(username, hashedPassword);
      users.push({ id: result.lastInsertRowid, username });
    }

    // Add some random users
    for (let i = 1; i <= 15; i++) {
      const username = `user_${i}_${Math.floor(seededRandom() * 10000)}`;
      const hashedPassword = await bcrypt.hash("password123", 10);
      const result = db
        .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
        .run(username, hashedPassword);
      users.push({ id: result.lastInsertRowid, username });
    }

    summary.users = users.length;
    seedLogger.info(`Created ${users.length} test users`);

    // Create calculator templates - more variety in types and institutions
    const templates = [];
    const templateTypes = Object.keys(assessmentTemplatesByType);

    for (const user of users) {
      // Each user creates 1-4 templates
      const numTemplates = Math.floor(seededRandom() * 4) + 1;

      for (let i = 0; i < numTemplates; i++) {
        const courseIndex = Math.floor(seededRandom() * courseTemplates.length);
        const course = courseTemplates[courseIndex];
        const institution =
          institutions[Math.floor(seededRandom() * institutions.length)];
        const term = terms[Math.floor(seededRandom() * terms.length)];
        const year = years[Math.floor(seededRandom() * years.length)];

        const result = db
          .prepare(
            "INSERT INTO calculator_templates (user_id, name, term, year, institution) VALUES (?, ?, ?, ?, ?)"
          )
          .run(user.id, `${course.name}`, term, year, institution);

        const templateId = result.lastInsertRowid;
        templates.push({
          id: templateId,
          name: course.name,
          creator_id: user.id,
        });

        // Choose a random assessment template type
        const templateType =
          templateTypes[Math.floor(seededRandom() * templateTypes.length)];
        const assessments = assessmentTemplatesByType[templateType];

        // Add assessments to template
        for (const assessment of assessments) {
          db.prepare(
            "INSERT INTO template_assessments (template_id, name, weight) VALUES (?, ?, ?)"
          ).run(templateId, assessment.name, assessment.weight);
          summary.template_assessments++;
        }
      }
    }
    summary.templates = templates.length;
    seedLogger.info(
      `Created ${templates.length} calculator templates with ${summary.template_assessments} template assessments`
    );

    // Create calculators for each user - some based on templates, some custom
    for (const user of users) {
      // 2-6 calculators per user
      const numCalculators = Math.floor(seededRandom() * 5) + 2;

      for (let i = 0; i < numCalculators; i++) {
        let calculatorName,
          templateId = null,
          assessmentsToUse;

        if (i < 2 && templates.length > 0) {
          // Use an existing template for some calculators
          const randomTemplate =
            templates[Math.floor(seededRandom() * templates.length)];
          templateId = randomTemplate.id;
          calculatorName = randomTemplate.name;

          // Fetch template assessments to copy
          const templateAssessments = db
            .prepare(
              "SELECT name, weight FROM template_assessments WHERE template_id = ?"
            )
            .all(templateId);

          assessmentsToUse = templateAssessments;
        } else {
          // Create a custom calculator
          const courseIndex = Math.floor(
            seededRandom() * courseTemplates.length
          );
          calculatorName = courseTemplates[courseIndex].name;

          // Choose a random assessment template type
          const templateType =
            templateTypes[Math.floor(seededRandom() * templateTypes.length)];
          assessmentsToUse = assessmentTemplatesByType[templateType];
        }

        // Add the calculator
        const minDesiredGrade = Math.floor(seededRandom() * 20) + 70; // 70-90
        const result = db
          .prepare(
            "INSERT INTO calculators (user_id, name, template_id, min_desired_grade) VALUES (?, ?, ?, ?)"
          )
          .run(user.id, calculatorName, templateId, minDesiredGrade);

        const calculatorId = result.lastInsertRowid;

        // Add assessments to calculator with some grades filled in
        for (const assessment of assessmentsToUse) {
          // 50% chance of having a grade, otherwise null (in progress)
          const hasGrade = seededRandom() > 0.5;
          const grade = hasGrade ? Math.floor(seededRandom() * 30) + 70 : null; // 70-100 or null

          db.prepare(
            "INSERT INTO assessments (calculator_id, name, weight, grade) VALUES (?, ?, ?, ?)"
          ).run(calculatorId, assessment.name, assessment.weight, grade);
          summary.assessments++;
        }
      }
    }
    summary.calculators = summary.assessments / 4; // approximate average of 4 assessments per calculator
    seedLogger.info(
      `Created ${summary.calculators} calculators with ${summary.assessments} assessments`
    );

    // Create courses for each user with prerequisite relationships
    const userCourses = {}; // track courses per user for setting up prerequisites

    for (const user of users) {
      userCourses[user.id] = [];

      // 5-12 courses per user
      const numCourses = Math.floor(seededRandom() * 8) + 5;

      // Shuffle the course templates and pick the first numCourses
      const shuffledCourses = [...courseTemplates]
        .sort(() => seededRandom() - 0.5)
        .slice(0, numCourses);

      for (const course of shuffledCourses) {
        // 60% chance of being completed
        const completed = seededRandom() < 0.6 ? 1 : 0;

        const result = db
          .prepare(
            "INSERT INTO courses (user_id, name, credits, completed) VALUES (?, ?, ?, ?)"
          )
          .run(user.id, course.name, course.credits, completed);

        userCourses[user.id].push({
          id: result.lastInsertRowid,
          name: course.name,
          completed,
        });
      }
    }

    // Set up prerequisites - MATH, PHYS and CMPT courses often have prerequisites
    for (const userId in userCourses) {
      const courses = userCourses[userId];

      // Group courses by subject
      const coursesBySubject = {};
      for (const course of courses) {
        const subject = course.name.split(":")[0].split(" ")[0];
        if (!coursesBySubject[subject]) coursesBySubject[subject] = [];
        coursesBySubject[subject].push(course);
      }

      // For each subject with multiple courses, create some prerequisites
      for (const subject in coursesBySubject) {
        const subjectCourses = coursesBySubject[subject];
        if (subjectCourses.length > 1) {
          // Sort by course number
          subjectCourses.sort((a, b) => {
            const numA = parseInt(a.name.split(" ")[1].split(":")[0]);
            const numB = parseInt(b.name.split(" ")[1].split(":")[0]);
            return numA - numB;
          });

          // Some lower level courses are prerequisites for higher level ones
          for (let i = 0; i < subjectCourses.length - 1; i++) {
            // 70% chance of being a prerequisite for the next level
            if (seededRandom() < 0.7) {
              try {
                db.prepare(
                  "INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES (?, ?)"
                ).run(subjectCourses[i + 1].id, subjectCourses[i].id);
                summary.prerequisites++;
              } catch (error) {
                // Ignore constraint errors - might try to insert duplicate
                if (!error.message.includes("UNIQUE constraint failed")) {
                  throw error;
                }
              }
            }
          }
        }
      }
    }

    summary.courses = Object.values(userCourses).reduce(
      (sum, courses) => sum + courses.length,
      0
    );
    seedLogger.info(
      `Created ${summary.courses} courses with ${summary.prerequisites} prerequisite relationships`
    );

    // Add template comments and votes
    let votes = 0;

    for (const template of templates) {
      // Skip creator voting on their own template
      const nonCreatorUsers = users.filter((u) => u.id !== template.creator_id);

      // Add comments (20-50% chance per user)
      for (const user of nonCreatorUsers) {
        if (seededRandom() < 0.35) {
          // 35% chance of comment
          const commentIndex = Math.floor(
            seededRandom() * templateComments.length
          );

          db.prepare(
            "INSERT INTO template_comments (template_id, user_id, content) VALUES (?, ?, ?)"
          ).run(template.id, user.id, templateComments[commentIndex]);
          summary.comments++;
        }

        // Add votes (30-80% chance per user)
        if (seededRandom() < 0.55) {
          // 55% chance of voting
          const vote = seededRandom() < 0.8 ? 1 : -1; // 80% chance of upvote

          try {
            db.prepare(
              "INSERT INTO template_votes (template_id, user_id, vote) VALUES (?, ?, ?)"
            ).run(template.id, user.id, vote);
            votes++;
          } catch (error) {
            // Ignore constraint errors - might try to insert duplicate
            if (!error.message.includes("UNIQUE constraint failed")) {
              throw error;
            }
          }

          // Update the vote_count in the template
          db.prepare(
            "UPDATE calculator_templates SET vote_count = vote_count + ? WHERE id = ?"
          ).run(vote, template.id);
        }
      }
    }

    summary.votes = votes;
    seedLogger.info(
      `Created ${summary.comments} template comments and ${summary.votes} template votes`
    );

    return summary;
  } catch (error) {
    seedLogger.error("Failed to seed database", { error });
    throw error;
  }
}
