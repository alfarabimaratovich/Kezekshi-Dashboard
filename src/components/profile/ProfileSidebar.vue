<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, CreditCard } from 'lucide-vue-next'

defineProps<{
  user: any
  userPhotoUrl: string
}>()

const getInitials = (name: string) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>

<template>
  <div class="space-y-6">
    <Card class="h-full">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <Avatar class="w-24 h-24">
            <AvatarImage :src="userPhotoUrl" alt="Avatar" class="object-cover" />
            <AvatarFallback class="text-2xl">{{ getInitials(user?.fullname) }}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle>{{ user?.fullname || 'Пользователь' }}</CardTitle>
        <CardDescription>{{ user?.roles && user.roles.length ? user.roles.join(', ') : 'Пользователь системы' }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone class="w-4 h-4" />
            <span>{{ user?.phone }}</span>
          </div>
          <div v-if="user?.iin" class="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard class="w-4 h-4" />
            <span>{{ user.iin }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
