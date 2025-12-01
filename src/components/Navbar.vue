<script setup>
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ButtonGroup } from '@/components/ui/button-group'
import Button from '@/components/ui/button/Button.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { useSecurityStore } from '@/stores/securityStore'
import { useDark, useToggle } from '@vueuse/core'
import { LogOut, Menu, Moon, Sun, User, Wallet, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const activePath = computed(() => route.path)

const isDark = useDark()
const toggleDark = useToggle(isDark)
const securityStore = useSecurityStore()

const isMenuOpen = ref(false)
// use centralized auth store
import { useAuth } from '@/stores/useAuth'
const { isAuth, logout: authLogout, userPhotoUrl, fetchProfile, userProfile } = useAuth()

onMounted(() => {
  if (isAuth.value) {
    // Always try to fetch profile/photo if missing
    if (!userProfile.value || !userPhotoUrl.value) {
        fetchProfile()
    }
  }
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// storage listener and syncing are handled inside useAuth
const logout = () => {
  authLogout()
  router.push('/login')
}
</script>

<template>
  <nav class="bg-card text-card-foreground rounded-lg border border-border mx-4 mt-4 mb-2 md:mx-8 md:mt-8 md:mb-4 px-6 py-6">
    <div class="flex items-center justify-between">
        <!-- Logo and Desktop Navigation -->
        <div class="flex items-center gap-6">
          <!-- Logo -->
          <div class="flex items-center gap-4">
            <img src="/Kezekshi_logo.svg" alt="Логотип" class="h-10 w-10" />
            <span class="font-semibold text-foreground text-lg hidden sm:block">Kezekshi</span>
          </div>

          <!-- Desktop Navigation Menu -->
          <NavigationMenu v-if="isAuth" class="hidden md:block">
            <NavigationMenuList class="flex gap-6">
              <NavigationMenuItem v-if="securityStore.canAccessPage('home')">
                <NavigationMenuLink as-child>
                  <a 
                    href="/" 
                    class="px-3 py-2 rounded-md transition-colors duration-200 font-medium"
                    :class="activePath === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                  >
                    Главная
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem v-if="securityStore.canAccessPage('stats')">
                <NavigationMenuLink as-child>
                  <a 
                    href="/stats" 
                    class="px-3 py-2 rounded-md transition-colors duration-200 font-medium"
                    :class="activePath === '/stats' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                  >
                    Статистика
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem v-if="securityStore.canAccessPage('my-children')">
                <NavigationMenuLink as-child>
                  <a 
                    href="/my-children" 
                    class="px-3 py-2 rounded-md transition-colors duration-200 font-medium"
                    :class="activePath === '/my-children' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                  >
                    Мои дети
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem v-if="securityStore.canAccessPage('admin')">
                <NavigationMenuLink as-child>
                  <a 
                    href="/admin" 
                    class="px-3 py-2 rounded-md transition-colors duration-200 font-medium"
                    :class="activePath === '/admin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                  >
                    Админ
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <!-- Right Side - Logout Button and Mobile Menu -->
        <div v-if="isAuth" class="flex items-center gap-4">
          <!-- Theme Toggle Group -->
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              :class="{ 'bg-accent text-accent-foreground': isDark }"
              @click="isDark = true"
            >
              <Moon class="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              :class="{ 'bg-accent text-accent-foreground': !isDark }"
              @click="isDark = false"
            >
              <Sun class="h-4 w-4" />
            </Button>
          </ButtonGroup>

          <!-- User Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="relative h-10 w-10 rounded-full p-0">
                <Avatar class="h-10 w-10 border border-border">
                  <AvatarImage v-if="userPhotoUrl" :src="userPhotoUrl" alt="User" class="object-cover" />
                  <AvatarFallback class="bg-muted flex items-center justify-center">
                    <User class="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Личный кабинет</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <a href="/profile" class="cursor-pointer flex items-center w-full">
                  <User class="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem as-child v-if="securityStore.canAccessPage('planning')">
                <a href="/profile?tab=planning" class="cursor-pointer flex items-center w-full">
                  <Wallet class="mr-2 h-4 w-4" />
                  <span>Планирование</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem @click="logout" class="cursor-pointer text-destructive focus:text-destructive">
                <LogOut class="mr-2 h-4 w-4" />
                <span>Выход</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Mobile Menu Toggle -->
          <button
            @click="toggleMenu"
            class="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu v-if="!isMenuOpen" class="h-6 w-6" />
            <X v-else class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div v-if="isMenuOpen && isAuth" class="md:hidden mt-4 pt-4 border-t border-border">
        <div class="flex flex-col gap-3">
          <a 
            href="/" 
            class="px-4 py-2 rounded-lg transition-colors font-medium"
            :class="activePath === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
          >
            Главная
          </a>
          <a 
            href="/stats" 
            class="px-4 py-2 rounded-lg transition-colors font-medium"
            :class="activePath === '/stats' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
          >
            Статистика
          </a>
          <a 
            href="/my-children" 
            class="px-4 py-2 rounded-lg transition-colors font-medium"
            :class="activePath === '/my-children' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
          >
            Мои дети
          </a>
        </div>
      </div>
  </nav>
</template>
