/**
 * Calculate the weighted average grade for a set of assessments
 * @param {Array<{grade: number|string|null, weight: number|string|null}>} assessments - Array of assessment objects with grade and weight
 * @returns {string} The calculated grade as a percentage with 2 decimal places, or 'N/A' if no valid assessments
 */
export function calculateFinalGrade(assessments) {
    // Filter out assessments that don't have both grade and weight
    const gradedAssessments = assessments.filter(assessment =>
        assessment.grade !== null &&
        assessment.grade !== undefined &&
        assessment.grade !== '' &&
        assessment.weight !== null &&
        assessment.weight !== undefined &&
        assessment.weight !== '');

    if (gradedAssessments.length === 0) return 'N/A';

    // Calculate total weight of all graded assessments
    const totalWeight = gradedAssessments.reduce((sum, assessment) =>
        sum + Number(assessment.weight), 0);

    if (totalWeight === 0) return 'N/A';

    // Calculate weighted sum of grades
    const weightedSum = gradedAssessments.reduce((sum, assessment) => {
        const weight = Number(assessment.weight);
        const grade = Number(assessment.grade);
        return sum + (grade * weight);
    }, 0);

    // Return final grade as percentage with 2 decimal places
    return (weightedSum / totalWeight).toFixed(2);
}