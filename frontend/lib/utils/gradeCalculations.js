/**
 * @module gradeCalculations
 * Utility functions for calculating grades and grade-related operations
 */

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
    const gradedAssessments = assessments.filter(assessment =>
        assessment.grade !== null &&
        assessment.grade !== undefined &&
        assessment.grade !== '' &&
        assessment.weight !== null &&
        assessment.weight !== undefined &&
        assessment.weight !== '');

    // Return N/A if no valid assessments found
    if (gradedAssessments.length === 0) return 'N/A';

    // Calculate total weight of all graded assessments
    // This is used as the denominator in the weighted average calculation
    const totalWeight = gradedAssessments.reduce((sum, assessment) =>
        sum + Number(assessment.weight), 0);

    // Return N/A if total weight is 0 to avoid division by zero
    if (totalWeight === 0) return 'N/A';

    // Calculate weighted sum of grades
    // For each assessment: grade * weight
    // Then sum all weighted grades
    const weightedSum = gradedAssessments.reduce((sum, assessment) => {
        const weight = Number(assessment.weight);
        const grade = Number(assessment.grade);
        return sum + (grade * weight);
    }, 0);

    // Calculate final grade: (sum of weighted grades) / (total weight)
    // Format to 2 decimal places
    return (weightedSum / totalWeight).toFixed(2);
}