import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAuth } from './useAuth';

export const useSecurityStore = defineStore('security', () => {
    const { fetchProfile, userProfile } = useAuth();

    // helper to check if role exists in roles array
    const hasRole = (role: string) => {
        return !!(
            userProfile.value &&
            Array.isArray(userProfile.value.roles) &&
            userProfile.value.roles.includes(role));
    };

    const isAdmin = computed(() => hasRole('AD'));
    const isUser = computed(() => hasRole('US'));
    const isDE = computed(() => hasRole('DE'));
    const isSC = computed(() => hasRole('SC'));

    const userRegionId = computed<number | null>(() => {
        return userProfile.value?.region_id ?? null;
    });
    const userSchoolId = computed<number | null>(() => {
        return userProfile.value?.school_id ?? null;
    });

    // pageKey: 'home' | 'stats' | 'planning' | 'profile' | 'my-children'
    const canAccessPage = (pageKey: string) => {
        if (isAdmin.value) return true;
        if (isDE.value) {
            return ['login', 'register', 'reset', 'home', 'stats', 'planning', 'profile'].includes(pageKey);
        }
        if (isSC.value) {
            return ['login', 'register', 'reset', 'home', 'stats', 'profile'].includes(pageKey);
        }
        if (isUser.value) {
            return ['login', 'register', 'reset', 'my-children', 'profile'].includes(pageKey);
        }
        return ['login', 'register', 'reset'].includes(pageKey);
    };

    // region access: DE can access own region, AD can access all
    const canAccessRegion = (regionId: number | string | null | undefined) => {
        if (isAdmin.value) return true;
        if (regionId == null) return false;
        if (isDE.value && userRegionId.value != null) {
            return Number(regionId) === Number(userRegionId.value);
        }
        return false;
    };

    // school access:
    // - AD: all
    // - DE: schools that belong to user's region (caller should pass school's region_id if available)
    // - SC: only own school
    // - US: usually no school-level access (false)
    const canAccessSchool = (schoolId: number | string | null | undefined, schoolRegionId?: number | string | null) => {
        if (isAdmin.value) return true;
        if (schoolId == null) return false;
        if (isSC.value && userSchoolId.value != null) {
            return Number(schoolId) === Number(userSchoolId.value);
        }
        if (isDE.value) {
            // prefer explicit schoolRegionId to decide; if not provided, deny (safer)
            if (schoolRegionId == null) return false;
            return Number(schoolRegionId) === Number(userRegionId.value);
        }
        return false;
    };

    // helper to filter an array of schools [{ id, region_id, ... }] by user's scope
    const filterSchoolsByScope = <T extends { id: number; region_id?: number }>(schools: T[]) => {
        if (isAdmin.value) return schools.slice();
        if (isSC.value && userSchoolId.value != null) {
            return schools.filter(s => s.id === Number(userSchoolId.value));
        }
        if (isDE.value && userRegionId.value != null) {
            return schools.filter(s => Number(s.region_id) === Number(userRegionId.value));
        }
        return []; // US and others: no school list access
    };

    return {
        isAdmin,
        isUser,
        isDE,
        isSC,
        hasRole,
        userRegionId,
        userSchoolId,
        canAccessPage,
        canAccessRegion,
        canAccessSchool,
        filterSchoolsByScope
    };
});
