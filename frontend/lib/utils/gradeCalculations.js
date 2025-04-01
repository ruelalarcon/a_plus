/**
 * @module gradeCalculations
 * Utility functions for calculating grades and grade-related operations
 */

/**
 * Parse a string that could be either a fraction or a float into a percentage
 * @param {string|number|null} value - The value to parse
 * @returns {number|null} The parsed value as a percentage, or null if invalid
 */
export function parseFractionOrFloat(value) {
  if (value === null || value === undefined || value === "") return null;

  // Convert to string to handle all cases uniformly
  const strValue = value.toString().trim();

  // Check for valid characters
  if (!/^-?\d+\.?\d*(?:\s*\/\s*\d+\.?\d*)?$/.test(strValue)) return null;

  // Count special characters
  const dashCount = (strValue.match(/-/g) || []).length;
  const slashCount = (strValue.match(/\//g) || []).length;

  // Validate character counts
  if (dashCount > 1 || slashCount > 1) return null;

  try {
    let result;
    if (slashCount === 1) {
      // Handle fraction
      const [numerator, denominator] = strValue
        .split("/")
        .map((part) => part.trim());
      const parsedDenominator = parseFloat(denominator);
      if (parsedDenominator === 0 || isNaN(parsedDenominator)) return null;
      const parsedNumerator = parseFloat(numerator);
      if (isNaN(parsedNumerator)) return null;
      result = (parsedNumerator / parsedDenominator) * 100;
    } else {
      // Handle regular number - assume it's already a percentage
      result = parseFloat(strValue);
      if (isNaN(result)) return null;
    }

    // Round to 2 decimal places
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

/**
 * Calculate the weighted average grade for a set of assessments
 * @param {Array<{
 *   grade: number|string|null,
 *   weight: number|string|null
 * }>} assessments - Array of assessment objects containing grades and weights
 * @returns {string} The calculated grade as a percentage with 2 decimal places, or 'N/A' if no valid assessments
 *
 * @example
 * // Returns "85.50"
 * calculateFinalGrade([
 *   { grade: "90", weight: "0.6" },
 *   { grade: "78", weight: "0.4" }
 * ]);
 *
 * // Returns "N/A"
 * calculateFinalGrade([
 *   { grade: null, weight: "0.5" },
 *   { grade: "", weight: "0.5" }
 * ]);
 */
export function calculateFinalGrade(assessments) {
  // Filter out assessments with missing or invalid grades/weights
  const gradedAssessments = assessments.filter((assessment) => {
    const parsedGrade = parseFractionOrFloat(assessment.grade);
    return (
      parsedGrade !== null &&
      assessment.weight !== null &&
      assessment.weight !== undefined &&
      assessment.weight !== ""
    );
  });

  // Return N/A if no valid assessments found
  if (gradedAssessments.length === 0) return "N/A";

  // Calculate total weight of all graded assessments
  const totalWeight = gradedAssessments.reduce(
    (sum, assessment) => sum + Number(assessment.weight),
    0
  );

  // Return N/A if total weight is 0 to avoid division by zero
  if (totalWeight === 0) return "N/A";

  // Calculate weighted sum of grades
  const weightedSum = gradedAssessments.reduce((sum, assessment) => {
    const weight = Number(assessment.weight);
    const grade = parseFractionOrFloat(assessment.grade) || 0;
    return sum + grade * weight;
  }, 0);

  // Calculate final grade and format to 2 decimal places
  return (weightedSum / totalWeight).toFixed(2);
}

/**
 * Calculate the minimum average grade needed on remaining assessments to achieve a desired final grade
 * @param {Array<{
 *   grade: number|string|null,
 *   weight: number|string|null
 * }>} assessments - Array of assessment objects containing grades and weights
 * @param {number|string} minDesiredGrade - The minimum grade the user wants to achieve
 * @returns {string} The required grade as a percentage with 2 decimal places, or 'N/A' if calculation not possible
 *
 * @example
 * // Returns "85.00"
 * calculateRequiredGrade([
 *   { grade: "70", weight: "50" },
 *   { grade: null, weight: "50" }
 * ], 80);
 */
export function calculateRequiredGrade(assessments, minDesiredGrade) {
  if (!minDesiredGrade || isNaN(Number(minDesiredGrade))) return "N/A";

  // Filter assessments into completed and remaining
  const completedAssessments = assessments.filter((assessment) => {
    const parsedGrade = parseFractionOrFloat(assessment.grade);
    return (
      parsedGrade !== null &&
      assessment.weight !== null &&
      assessment.weight !== undefined &&
      assessment.weight !== ""
    );
  });

  const remainingAssessments = assessments.filter((assessment) => {
    const parsedGrade = parseFractionOrFloat(assessment.grade);
    return (
      parsedGrade === null &&
      assessment.weight !== null &&
      assessment.weight !== undefined &&
      assessment.weight !== ""
    );
  });

  // Return N/A if no remaining assessments
  if (remainingAssessments.length === 0) return "N/A";

  // Calculate total weight of all assessments
  const totalWeight = assessments.reduce((sum, assessment) => {
    if (
      assessment.weight !== null &&
      assessment.weight !== undefined &&
      assessment.weight !== ""
    ) {
      return sum + Number(assessment.weight);
    }
    return sum;
  }, 0);

  // Calculate remaining weight
  const remainingWeight = remainingAssessments.reduce(
    (sum, assessment) => sum + Number(assessment.weight),
    0
  );

  // Calculate weighted sum of completed grades
  const completedWeightedSum = completedAssessments.reduce(
    (sum, assessment) => {
      const weight = Number(assessment.weight);
      const grade = parseFractionOrFloat(assessment.grade) || 0;
      return sum + grade * weight;
    },
    0
  );

  // Formula: (desiredGrade * totalWeight - completedWeightedSum) / remainingWeight
  const requiredGrade =
    (Number(minDesiredGrade) * totalWeight - completedWeightedSum) /
    remainingWeight;

  // Return 'N/A' if result is infinite or NaN
  if (isNaN(requiredGrade) || !isFinite(requiredGrade)) {
    return "N/A";
  }

  return requiredGrade.toFixed(2);
}
