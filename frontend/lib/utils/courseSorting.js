/**
 * @module courseSorting
 * Utility functions for sorting and filtering courses
 */

/**
 * Sort courses based on prerequisites, creating a directed acyclic graph (DAG)
 * Each level contains courses that depend on courses in previous levels
 *
 * @param {Array} courses - Array of course objects with prerequisites
 * @returns {Array<Array>} - A 2D array where each sub-array represents a level in the dependency hierarchy
 */
export function sortCoursesByPrerequisites(courses) {
  const levels = [];
  const visited = new Set();
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Recursive function to determine course level based on prerequisites
  function getLevel(course) {
    if (visited.has(course.id)) return;
    visited.add(course.id);

    // Find the maximum level of all prerequisites
    let maxPrereqLevel = -1;
    for (const prereq of course.prerequisites) {
      if (!visited.has(prereq.id)) {
        getLevel(courseMap.get(prereq.id));
      }
      const prereqLevel = levels.findIndex((level) =>
        level.some((c) => c.id === prereq.id)
      );
      maxPrereqLevel = Math.max(maxPrereqLevel, prereqLevel);
    }

    // Place course in next level after its highest prerequisite
    const courseLevel = maxPrereqLevel + 1;
    if (!levels[courseLevel]) {
      levels[courseLevel] = [];
    }
    levels[courseLevel].push(course);
  }

  // Process all courses to build the level structure
  for (const course of courses) {
    if (!visited.has(course.id)) {
      getLevel(course);
    }
  }

  return levels;
}

/**
 * Flatten a 2D array of sorted courses into a 1D array
 *
 * @param {Array<Array>} sortedCourses - A 2D array of sorted courses
 * @returns {Array} - A flattened array of courses
 */
export function flattenSortedCourses(sortedCourses) {
  return sortedCourses.flat();
}

/**
 * Filter courses based on completion status and search query
 *
 * @param {Array} courses - Array of course objects
 * @param {string} activeTab - Current active tab ('all', 'completed', or 'incomplete')
 * @param {string} searchQuery - Current search query
 * @returns {Array} - Filtered courses
 */
export function filterCourses(courses, activeTab, searchQuery) {
  return courses.filter((course) => {
    // First filter by tab
    if (activeTab === "completed" && !course.completed) return false;
    if (activeTab === "incomplete" && course.completed) return false;

    // Then filter by search query
    if (searchQuery) {
      return course.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });
}

/**
 * Check if a course is a prerequisite for any other courses
 *
 * @param {Array} courses - Array of course objects
 * @param {string} courseId - ID of the course to check
 * @returns {boolean} - True if the course is a prerequisite for any other course
 */
export function isPrerequisiteForOtherCourses(courses, courseId) {
  return courses.some(
    (course) =>
      course.id !== courseId &&
      course.prerequisites.some((prereq) => prereq.id === courseId)
  );
}
