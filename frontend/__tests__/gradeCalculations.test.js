/**
 * Tests for gradeCalculation utility functions
 */
import {
  calculateFinalGrade,
  calculateRequiredGrade,
  parseFractionOrFloat,
} from "../lib/utils/gradeCalculations.js";

describe("Grade Calculation Utilities", () => {
  describe("parseFractionOrFloat", () => {
    test("should handle regular numbers", () => {
      expect(parseFractionOrFloat("85")).toBe(85.0);
      expect(parseFractionOrFloat("85.5")).toBe(85.5);
      expect(parseFractionOrFloat("-85")).toBe(-85.0);
    });

    test("should handle fractions", () => {
      expect(parseFractionOrFloat("17/20")).toBe(85.0);
      expect(parseFractionOrFloat("34/40")).toBe(85.0);
      expect(parseFractionOrFloat("-17/20")).toBe(-85.0);
      expect(parseFractionOrFloat("1/3")).toBe(33.33);
    });

    test("should handle decimal fractions", () => {
      expect(parseFractionOrFloat("17.5/20")).toBe(87.5);
      expect(parseFractionOrFloat("5/2.5")).toBe(200.0);
    });

    test("should return null for invalid inputs", () => {
      expect(parseFractionOrFloat(null)).toBeNull();
      expect(parseFractionOrFloat(undefined)).toBeNull();
      expect(parseFractionOrFloat("")).toBeNull();
      expect(parseFractionOrFloat("abc")).toBeNull();
      expect(parseFractionOrFloat("85/")).toBeNull();
      expect(parseFractionOrFloat("/85")).toBeNull();
      expect(parseFractionOrFloat("85//20")).toBeNull();
      expect(parseFractionOrFloat("--85")).toBeNull();
      expect(parseFractionOrFloat("85/0")).toBeNull();
    });

    test("should handle whitespace", () => {
      expect(parseFractionOrFloat(" 85 ")).toBe(85.0);
      expect(parseFractionOrFloat(" 17 / 20 ")).toBe(85.0);
    });

    test("should handle number type inputs", () => {
      expect(parseFractionOrFloat(85)).toBe(85.0);
      expect(parseFractionOrFloat(85.5)).toBe(85.5);
      expect(parseFractionOrFloat(-85)).toBe(-85.0);
    });
  });

  describe("calculateFinalGrade", () => {
    test("should calculate weighted average grade correctly", () => {
      const assessments = [
        {
          grade: "90",
          weight: "0.6",
        },
        {
          grade: "78",
          weight: "0.4",
        },
      ];
      expect(calculateFinalGrade(assessments)).toBe("85.20");
    });

    test("should handle string inputs for grades and weights", () => {
      const assessments = [
        {
          grade: "75",
          weight: "50",
        },
        {
          grade: "95",
          weight: "50",
        },
      ];
      expect(calculateFinalGrade(assessments)).toBe("85.00");
    });

    test("should return N/A when no valid assessments are provided", () => {
      const assessments = [
        {
          grade: null,
          weight: "0.5",
        },
        {
          grade: "",
          weight: "0.5",
        },
      ];
      expect(calculateFinalGrade(assessments)).toBe("N/A");
    });

    test("should return N/A when total weight is zero", () => {
      const assessments = [
        {
          grade: "90",
          weight: "0",
        },
        {
          grade: "80",
          weight: "0",
        },
      ];
      expect(calculateFinalGrade(assessments)).toBe("N/A");
    });

    test("should ignore assessments with missing grades or weights", () => {
      const assessments = [
        {
          grade: "90",
          weight: "0.6",
        },
        {
          grade: null,
          weight: "0.2",
        },
        {
          grade: "85",
          weight: "0.2",
        },
      ];
      expect(calculateFinalGrade(assessments)).toBe("88.75");
    });
  });

  describe("calculateRequiredGrade", () => {
    test("should calculate required grade correctly", () => {
      const assessments = [
        {
          grade: "70",
          weight: "0.5",
        },
        {
          grade: null,
          weight: "0.5",
        },
      ];
      expect(calculateRequiredGrade(assessments, 80)).toBe("90.00");
    });

    test("should handle percentage weights", () => {
      const assessments = [
        {
          grade: "75",
          weight: "50",
        },
        {
          grade: null,
          weight: "50",
        },
      ];
      expect(calculateRequiredGrade(assessments, 85)).toBe("95.00");
    });

    test("should return N/A when no remaining assessments", () => {
      const assessments = [
        {
          grade: "70",
          weight: "0.5",
        },
        {
          grade: "80",
          weight: "0.5",
        },
      ];
      expect(calculateRequiredGrade(assessments, 85)).toBe("N/A");
    });

    test("should return N/A when minDesiredGrade is not provided", () => {
      const assessments = [
        {
          grade: "70",
          weight: "0.5",
        },
        {
          grade: null,
          weight: "0.5",
        },
      ];
      expect(calculateRequiredGrade(assessments, null)).toBe("N/A");
    });

    test("should return minimum required grade when already achieved high grade", () => {
      // In this case, the student has already achieved a grade higher than
      // the minimum desired grade with completed assessments
      const assessments = [
        {
          grade: "95",
          weight: "0.8",
        }, // Already got 95 on 80% of the course
        {
          grade: null,
          weight: "0.2",
        }, // Only 20% remaining
      ];
      // The required grade is low because they only need 20 on the remaining 20% to achieve 80 overall
      // (80 - 95*0.8)/0.2 = (80 - 76)/0.2 = 4/0.2 = 20
      expect(calculateRequiredGrade(assessments, 80)).toBe("20.00");
    });

    test("should handle multiple remaining assessments", () => {
      const assessments = [
        {
          grade: "80",
          weight: "0.4",
        },
        {
          grade: null,
          weight: "0.3",
        },
        {
          grade: null,
          weight: "0.3",
        },
      ];
      // For 85 desired grade:
      // (85 * 1 - 80 * 0.4) / 0.6 = (85 - 32) / 0.6 = 53 / 0.6 = 88.33
      // Fixed the expected output to match the actual function return value
      const result = calculateRequiredGrade(assessments, 85);
      expect(result).toBe("88.33");
    });
  });
});
