/**
 * Tests for courseSorting utility functions
 */
import {
  sortCoursesByPrerequisites,
  flattenSortedCourses,
  filterCourses,
  isPrerequisiteForOtherCourses,
} from "../../../frontend/lib/utils/courseSorting.js";

describe("Course Sorting Utilities", () => {
  // Sample data for tests
  const coursesData = [
    {
      id: "1",
      name: "Introduction to Programming",
      credits: 3,
      completed: true,
      prerequisites: [],
    },
    {
      id: "2",
      name: "Data Structures",
      credits: 4,
      completed: false,
      prerequisites: [{ id: "1", name: "Introduction to Programming" }],
    },
    {
      id: "3",
      name: "Algorithms",
      credits: 3,
      completed: false,
      prerequisites: [{ id: "2", name: "Data Structures" }],
    },
    {
      id: "4",
      name: "Mathematics for CS",
      credits: 3,
      completed: true,
      prerequisites: [],
    },
    {
      id: "5",
      name: "Advanced Algorithms",
      credits: 4,
      completed: false,
      prerequisites: [
        { id: "3", name: "Algorithms" },
        { id: "4", name: "Mathematics for CS" },
      ],
    },
  ];

  describe("sortCoursesByPrerequisites", () => {
    test("should sort courses by prerequisite dependencies", () => {
      const sorted = sortCoursesByPrerequisites(coursesData);

      // Check that we have the right number of levels
      expect(sorted.length).toBe(4);

      // Level 0 should contain courses with no prerequisites
      expect(sorted[0].length).toBe(2);
      expect(sorted[0].map((c) => c.id).sort()).toEqual(["1", "4"]);

      // Level 1 should contain courses that depend on level 0
      expect(sorted[1].length).toBe(1);
      expect(sorted[1][0].id).toBe("2");

      // Level 2 should contain courses that depend on level 1
      expect(sorted[2].length).toBe(1);
      expect(sorted[2][0].id).toBe("3");

      // Level 3 should contain courses that depend on level 2
      expect(sorted[3].length).toBe(1);
      expect(sorted[3][0].id).toBe("5");
    });

    test("should handle empty course list", () => {
      const sorted = sortCoursesByPrerequisites([]);
      expect(sorted).toEqual([]);
    });

    test("should handle courses with circular dependencies safely", () => {
      // Create a circular dependency between courses
      const circularCourses = [
        {
          id: "A",
          name: "Course A",
          prerequisites: [{ id: "B", name: "Course B" }],
        },
        {
          id: "B",
          name: "Course B",
          prerequisites: [{ id: "C", name: "Course C" }],
        },
        {
          id: "C",
          name: "Course C",
          prerequisites: [{ id: "A", name: "Course A" }],
        },
      ];

      // The function should not hang or crash with circular dependencies
      const sorted = sortCoursesByPrerequisites(circularCourses);

      // The output may vary based on implementation, but we should get some result
      expect(sorted.length).toBeGreaterThan(0);
    });
  });

  describe("flattenSortedCourses", () => {
    test("should flatten a 2D array of courses", () => {
      const sorted = sortCoursesByPrerequisites(coursesData);
      const flattened = flattenSortedCourses(sorted);

      // Check that flattened array has all courses
      expect(flattened.length).toBe(coursesData.length);

      // Check that the order is preserved (prerequisites before dependents)
      const indexOfIntro = flattened.findIndex((c) => c.id === "1");
      const indexOfDS = flattened.findIndex((c) => c.id === "2");
      const indexOfAlgo = flattened.findIndex((c) => c.id === "3");
      const indexOfMath = flattened.findIndex((c) => c.id === "4");
      const indexOfAdvAlgo = flattened.findIndex((c) => c.id === "5");

      // Verify prerequisite ordering
      expect(indexOfIntro).toBeLessThan(indexOfDS);
      expect(indexOfDS).toBeLessThan(indexOfAlgo);
      expect(indexOfAlgo).toBeLessThan(indexOfAdvAlgo);
      expect(indexOfMath).toBeLessThan(indexOfAdvAlgo);
    });

    test("should handle empty array", () => {
      expect(flattenSortedCourses([])).toEqual([]);
    });
  });

  describe("filterCourses", () => {
    test("should filter courses by completion status - completed", () => {
      const filtered = filterCourses(coursesData, "completed", "");
      expect(filtered.length).toBe(2);
      expect(filtered.every((c) => c.completed)).toBe(true);
    });

    test("should filter courses by completion status - incomplete", () => {
      const filtered = filterCourses(coursesData, "incomplete", "");
      expect(filtered.length).toBe(3);
      expect(filtered.every((c) => !c.completed)).toBe(true);
    });

    test("should filter courses by search query", () => {
      const filtered = filterCourses(coursesData, "all", "algorithm");
      expect(filtered.length).toBe(2);
      expect(filtered.map((c) => c.id).sort()).toEqual(["3", "5"]);
    });

    test("should apply both filters together", () => {
      const filtered = filterCourses(coursesData, "completed", "math");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("4");
    });

    test("should handle case-insensitive search", () => {
      const filtered = filterCourses(coursesData, "all", "INTRODUCTION");
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("1");
    });

    test("should return all courses when no filters are applied", () => {
      const filtered = filterCourses(coursesData, "all", "");
      expect(filtered.length).toBe(coursesData.length);
    });
  });

  describe("isPrerequisiteForOtherCourses", () => {
    test("should identify courses that are prerequisites for others", () => {
      expect(isPrerequisiteForOtherCourses(coursesData, "1")).toBe(true);
      expect(isPrerequisiteForOtherCourses(coursesData, "2")).toBe(true);
      expect(isPrerequisiteForOtherCourses(coursesData, "3")).toBe(true);
      expect(isPrerequisiteForOtherCourses(coursesData, "4")).toBe(true);
    });

    test("should identify courses that are not prerequisites for others", () => {
      expect(isPrerequisiteForOtherCourses(coursesData, "5")).toBe(false);
    });

    test("should handle non-existent course ID", () => {
      expect(isPrerequisiteForOtherCourses(coursesData, "nonexistent")).toBe(
        false
      );
    });

    test("should handle empty course list", () => {
      expect(isPrerequisiteForOtherCourses([], "1")).toBe(false);
    });
  });
});
