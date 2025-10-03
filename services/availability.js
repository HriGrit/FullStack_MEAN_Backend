/**
 * Checks if the doctor has available slots for the given day of the week.
 * @param {Object} doctor - Doctor object with availableSlots array.
 * @param {string|number|Date} appointmentDate - Day of the week (e.g., "Monday", 1, or Date object).
 * @returns {boolean}
 */
export async function isWithinAvailability(doctor, dayIndex) {
    if (!doctor || !Array.isArray(doctor.availableSlots) || doctor.availableSlots.length !== 7) {
        return false;
    }

    if (dayIndex === null) {
        return false;
    }

    // Check if there are available slots for that day
    return doctor.availableSlots[dayIndex] > 0;
}

export function convertDayToIndex(appointmentDate) {
    let dayIndex = null;

    if (typeof appointmentDate === 'string') {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayIndex = days.indexOf(appointmentDate.trim().toLowerCase());
    } else {
        return null;
    }

    if (dayIndex === null || dayIndex < 0 || dayIndex > 6) {
        return null;
    }

    return dayIndex;
}