import { differenceInDays, parseISO } from 'date-fns';

/**
 * Utility to check if content should be locked based on user's registration date
 * and the specific content's drip requirements.
 */
export interface DripRequirement {
    unlockDelayDays?: number;
    requiredMissionDay?: number;
}

export function isContentLocked(
    registrationDate: string | null | undefined,
    requirement: DripRequirement,
    currentMissionDay: number = 0
): { isLocked: boolean; daysRemaining: number } {
    if (!registrationDate) return { isLocked: false, daysRemaining: 0 };

    const regDate = parseISO(registrationDate);
    const today = new Date();
    const daysSinceReg = differenceInDays(today, regDate);

    const unlockDelay = requirement.unlockDelayDays || 0;
    const requiredMission = requirement.requiredMissionDay || 0;

    // 1. Check Time-based delay
    const isTimeLocked = daysSinceReg < unlockDelay;
    const daysRemaining = Math.max(0, unlockDelay - daysSinceReg);

    // 2. Check Mission-based requirement
    const isMissionLocked = currentMissionDay < requiredMission;

    return {
        isLocked: isTimeLocked || isMissionLocked,
        daysRemaining
    };
}
