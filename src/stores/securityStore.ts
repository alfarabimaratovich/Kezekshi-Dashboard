import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAuth } from './useAuth';

export const useSecurityStore = defineStore('security', () => {
    const { fetchProfile, userProfile } = useAuth();

    // normalize roles into simple uppercase strings (handles strings, objects or weird payloads)
    const normalizeRoles = (raw: any): string[] => {
        if (!raw) return [];
        let arr = raw;
        // if object that looks like array-like, try values()
        if (!Array.isArray(arr) && typeof arr === 'object') {
            arr = Object.values(arr);
        }
        if (!Array.isArray(arr)) return [String(arr).trim().toUpperCase()];
        return arr
            .map((r: any) => {
                if (typeof r === 'string') return r.trim().toUpperCase();
                if (r && typeof r === 'object') {
                    return String(r.code ?? r.role ?? r.name ?? r.id ?? '').trim().toUpperCase();
                }
                return '';
            })
            .filter(Boolean);
    };

    const normalizedRoles = computed(() => normalizeRoles(userProfile.value?.roles));

    // helper to check if role exists in roles array
    const hasRole = (role: string) => {
        const want = String(role).trim().toUpperCase();
        return normalizedRoles.value.includes(want);
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
        const key = String(pageKey ?? '').trim();
        if (!key) return false;

        // ADMIN allowed everywhere
        if (normalizedRoles.value.includes('AD')) return true;

        // base public pages
        const allowed = new Set<string>(['login', 'register', 'reset']);

        // mapping by role — will be unioned if user has several roles
        const roleMap: Record<string, string[]> = {
            DE: ['home', 'stats', 'planning', 'profile'],
            SC: ['home', 'stats', 'profile'],
            US: ['my-children', 'profile']
        };

        // union pages for all roles the user has
        for (const r of normalizedRoles.value) {
            const pages = roleMap[r];
            if (pages && pages.length) {
                pages.forEach(p => allowed.add(p));
            }
        }

        return allowed.has(key);
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
